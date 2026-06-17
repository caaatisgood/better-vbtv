import { log } from "../utils/logger";
import { getSeekIntervals } from "../utils/settings";
import { toast } from "../utils/toast";
import {
  DEFAULT_SEEK_SMALL,
  DEFAULT_SEEK_LARGE,
  SEEK_SMALL_KEY,
  SEEK_LARGE_KEY,
  WATCH_QUALIFY_SEC,
  POSITION_SAVE_SEC,
} from "../constants";
import { getEntry, recordView, savePosition } from "../utils/history";
import { parseJwMediaId, fetchJwMeta, formatTime } from "../utils/videoMeta";

interface PlayerShortcuts {
  seek(seconds: number): void;
  seekFrame(frames: number): void;
  adjustVolume(delta: number): void;
  adjustPlaybackRate(delta: number): void;
  togglePlay(): void;
}

interface VideoControllerOptions {
  selector: string;
}

export class VideoController implements PlayerShortcuts {
  private selector: string;
  private video: HTMLVideoElement | null = null;
  private readonly FPS: number = 30;
  private readonly MIN_PLAYBACK_RATE: number = 0.20;
  private readonly MAX_PLAYBACK_RATE: number = 5;
  private readonly VOLUMN_DELTA = 0.05;
  private readonly PLAYBACK_RATE_DELTA = 0.20;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;
  private seekSmall: number = DEFAULT_SEEK_SMALL;
  private seekLarge: number = DEFAULT_SEEK_LARGE;
  private storageListener: Parameters<typeof chrome.storage.onChanged.addListener>[0] | null = null;

  // --- Watch history / resume tracking ---
  // VBTV is a SPA: switching videos changes only the `?self-link` query, not the
  // `/player` pathname, so this controller is NOT recreated per video. We track
  // the live media id and reset state whenever it changes.
  private trackedId: string | null = null; // id we're currently recording for
  private watchQualified: boolean = false; // recorded to history yet?
  private lastSaveAt: number = 0;          // throttle clock for position writes
  private seekSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private timeupdateListener: (() => void) | null = null;
  private seekedListener: (() => void) | null = null;
  private pauseListener: (() => void) | null = null;
  private beforeUnloadListener: (() => void) | null = null;

  constructor({
    selector,
  }: VideoControllerOptions) {
    this.selector = selector
    this.getVideo()
    this.loadSeekIntervals()
    this.watchSeekIntervals()
    this.setupShortcuts()
    this.setupWatchTracking()
  }

  private async loadSeekIntervals(): Promise<void> {
    const { small, large } = await getSeekIntervals()
    this.seekSmall = small
    this.seekLarge = large
  }

  private watchSeekIntervals(): void {
    this.storageListener = (changes, area) => {
      if (area !== 'local') return
      if (changes[SEEK_SMALL_KEY] || changes[SEEK_LARGE_KEY]) {
        this.loadSeekIntervals()
      }
    }
    chrome.storage.onChanged.addListener(this.storageListener)
  }

  private getVideo() {
    this.video = document.querySelector(this.selector)
    return this.video
  }

  private setupShortcuts(): void {
    if (!this.video) {
      log("unable to setupShortcuts() because `this.video` does not exist")
      return
    }
    this.keydownListener = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        // Seek controls
        case 'arrowleft':
          this.seek(-this.seekSmall);
          toast(`⏪ -${this.seekSmall}s`);
          break;
        case 'arrowright':
          this.seek(this.seekSmall);
          toast(`⏩ +${this.seekSmall}s`);
          break;
        case 'j':
          this.seek(-this.seekLarge);
          toast(`⏪ -${this.seekLarge}s`);
          break;
        case 'l':
          this.seek(this.seekLarge);
          toast(`⏩ +${this.seekLarge}s`);
          break;
        case 'home':
          if (this.video) this.video.currentTime = 0;
          toast('⏮ Start');
          break;
        case 'end':
          if (this.video) this.video.currentTime = this.video.duration;
          toast('⏭ End');
          break;

        // Volume controls
        case 'arrowup':
          this.adjustVolume(this.VOLUMN_DELTA);
          break;
        case 'arrowdown':
          this.adjustVolume(-this.VOLUMN_DELTA);
          break;
        case 'm':
          if (this.video) {
            this.video.muted = !this.video.muted;
            toast(this.video.muted ? '🔇 Muted' : '🔊 Unmuted');
          }
          break;

        // Playback controls
        case 'k':
        case ' ':
          this.togglePlay();
          if (this.video) toast(this.video.paused ? '⏸ Paused' : '▶️ Playing');
          break;
        case '.':
          if (this.video?.paused) {
            this.seekFrame(1);
            toast('⏭ Frame +1');
          }
          break;
        case ',':
          if (this.video?.paused) {
            this.seekFrame(-1);
            toast('⏮ Frame -1');
          }
          break;
        case '>':
          this.adjustPlaybackRate(this.PLAYBACK_RATE_DELTA);
          break;
        case '<':
          this.adjustPlaybackRate(-this.PLAYBACK_RATE_DELTA);
          break;
      }
    };

    document.addEventListener('keydown', this.keydownListener);

    // Media key support
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('stop', () => {
        if (this.video) {
          this.video.pause();
          this.video.currentTime = 0;
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Watch history + resume position
  //
  // - A video is added to history once it has been played for WATCH_QUALIFY_SEC.
  // - The resume position is persisted at most once per POSITION_SAVE_SEC during
  //   continuous playback, plus POSITION_SAVE_SEC after the last scrub, and is
  //   always flushed on pause / page unload / cleanup.
  // - On load, if a saved position exists we offer a one-tap "Resume?" prompt.
  // ---------------------------------------------------------------------------
  private setupWatchTracking(): void {
    if (!this.video) {
      log("unable to setupWatchTracking() because `this.video` does not exist");
      return;
    }

    this.trackedId = parseJwMediaId(window.location.href);
    if (!this.trackedId) {
      log("setupWatchTracking: no JW media id in URL");
    } else {
      void this.maybeOfferResume(this.trackedId);
    }

    this.timeupdateListener = () => this.onTimeUpdate();
    this.seekedListener = () => this.scheduleSeekSave();
    this.pauseListener = () => this.flushPosition();
    this.beforeUnloadListener = () => this.flushPosition();

    this.video.addEventListener('timeupdate', this.timeupdateListener);
    this.video.addEventListener('seeked', this.seekedListener);
    this.video.addEventListener('pause', this.pauseListener);
    window.addEventListener('beforeunload', this.beforeUnloadListener);
  }

  private async maybeOfferResume(id: string): Promise<void> {
    const entry = await getEntry(id);
    if (!entry || entry.positionSec <= WATCH_QUALIFY_SEC) return;
    // Skip if effectively finished (within last 15s of a known duration).
    if (entry.durationSec && entry.positionSec >= entry.durationSec - 15) return;
    // Bail if the user already moved on to another video.
    if (parseJwMediaId(window.location.href) !== id) return;

    const pos = entry.positionSec;
    toast(`Resume from ${formatTime(pos)}?`, {
      action: {
        label: 'Resume',
        onClick: () => {
          if (this.video && parseJwMediaId(window.location.href) === id) {
            this.video.currentTime = pos;
            toast(`▶️ Resumed ${formatTime(pos)}`);
          }
        },
      },
    });
  }

  private onTimeUpdate(): void {
    const video = this.video;
    if (!video || video.seeking) return;

    // Detect in-player video switches (playlist advance / picking another match).
    const id = parseJwMediaId(window.location.href);
    if (id !== this.trackedId) {
      this.flushPosition();      // save the outgoing video first
      this.trackedId = id;
      this.watchQualified = false;
      this.lastSaveAt = 0;
      if (id) void this.maybeOfferResume(id);
      return;
    }
    if (!id) return;

    // Qualify: first time we cross the threshold, record to history.
    if (!this.watchQualified && video.currentTime >= WATCH_QUALIFY_SEC) {
      this.watchQualified = true;
      void this.qualifyAndRecord(id);
      return;
    }

    // Throttle position writes while playing.
    if (this.watchQualified && !video.paused) {
      const now = Date.now();
      if (now - this.lastSaveAt >= POSITION_SAVE_SEC * 1000) {
        this.flushPosition();
      }
    }
  }

  private async qualifyAndRecord(id: string): Promise<void> {
    if (!this.video) return;
    const url = window.location.href;
    const positionSec = this.video.currentTime;
    const durationSec = Number.isFinite(this.video.duration) ? this.video.duration : 0;
    this.lastSaveAt = Date.now();

    // Record immediately with a fallback title so the entry exists even if the
    // metadata fetch is slow or fails; refine with real title/poster after.
    await recordView({
      id,
      title: document.title || 'VBTV replay',
      url,
      positionSec,
      durationSec,
    });

    const meta = await fetchJwMeta(id);
    // Don't clobber a newer entry if the user already switched videos.
    if (meta && this.trackedId === id) {
      await recordView({
        id,
        title: meta.title,
        thumbnail: meta.thumbnail,
        url,
        positionSec: this.video?.currentTime ?? positionSec,
        durationSec: Number.isFinite(this.video?.duration ?? NaN)
          ? (this.video as HTMLVideoElement).duration
          : durationSec,
      });
    }
  }

  // Persist the position POSITION_SAVE_SEC after the last scrub ("progress nav").
  private scheduleSeekSave(): void {
    if (!this.watchQualified) return;
    if (this.seekSaveTimer) clearTimeout(this.seekSaveTimer);
    this.seekSaveTimer = setTimeout(() => this.flushPosition(), POSITION_SAVE_SEC * 1000);
  }

  private flushPosition(): void {
    if (this.seekSaveTimer) {
      clearTimeout(this.seekSaveTimer);
      this.seekSaveTimer = null;
    }
    if (!this.trackedId || !this.watchQualified || !this.video) return;
    this.lastSaveAt = Date.now();
    const durationSec = Number.isFinite(this.video.duration) ? this.video.duration : undefined;
    void savePosition(this.trackedId, this.video.currentTime, durationSec);
  }

  public cleanup(): void {
    log("VideoController.cleanup()")
    // Persist final position before tearing down listeners.
    this.flushPosition();

    if (this.video) {
      if (this.timeupdateListener) this.video.removeEventListener('timeupdate', this.timeupdateListener);
      if (this.seekedListener) this.video.removeEventListener('seeked', this.seekedListener);
      if (this.pauseListener) this.video.removeEventListener('pause', this.pauseListener);
    }
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
    }
    this.timeupdateListener = null;
    this.seekedListener = null;
    this.pauseListener = null;
    this.beforeUnloadListener = null;

    // Remove event listeners
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }

    // Remove storage listener
    if (this.storageListener) {
      chrome.storage.onChanged.removeListener(this.storageListener);
      this.storageListener = null;
    }

    // Clean up media session handlers
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('stop', null);
    }

    // Reset video reference
    this.video = null;
  }

  public seek(seconds: number): void {
    if (!this.video) return;
    this.video.currentTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
  }

  public seekFrame(frames: number): void {
    const frameDuration = 1 / this.FPS;
    this.seek(frameDuration * frames);
  }

  public adjustVolume(delta: number): void {
    if (!this.video) return;
    const volumn = Math.max(0, Math.min(1, this.video.volume + delta));
    this.video.volume = volumn;
    if (this.video.muted && volumn > 0) this.video.muted = false;
    toast(`🔊 ${Math.round(volumn * 100)}%`);
  }

  public adjustPlaybackRate(delta: number): void {
    if (!this.video) return;
    const rate = Math.max(
      this.MIN_PLAYBACK_RATE,
      Math.min(
        this.MAX_PLAYBACK_RATE,
        this.video.playbackRate + delta
      )
    );
    const formattedRate = parseFloat(parseFloat((rate).toString()).toPrecision(2))
    this.video.playbackRate = formattedRate
    toast(`${formattedRate}× speed`)
  }

  public togglePlay(): void {
    if (!this.video) return;
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }
}
