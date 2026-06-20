// src/Popup.tsx
import { createSignal, createEffect, onMount, onCleanup, For, Show } from 'solid-js';
import { Switch } from '../Switch';
import styles from './Popup.module.css';
import {
  NO_SPOILER_STORAGE_KEY,
  DEFAULT_SEEK_SMALL,
  DEFAULT_SEEK_LARGE,
  DEFAULT_TOAST_FONT_SIZE,
  WATCH_HISTORY_KEY,
} from '../../constants';
import {
  getNoSpoiler,
  setNoSpoiler,
  getSeekIntervals,
  setSeekIntervals,
  clampSeek,
  SEEK_MIN,
  SEEK_MAX,
  getToastFontSize,
  setToastFontSize,
  clampFont,
  TOAST_FONT_MIN,
  TOAST_FONT_MAX,
} from '../../utils/settings';
import { getHistory, removeEntry, clearHistory, type HistoryEntry } from '../../utils/history';
import { formatTime, formatAgo } from '../../utils/videoMeta';
import { log } from '../../utils/logger';
import ext from '../../utils/browser';

// Reference the packaged manifest icon directly instead of `import`ing it, so
// the bundler doesn't emit a second hashed copy of the 128px PNG into assets/.
const logoUrl = ext.runtime.getURL('icons/icon-128.png');

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: '?', label: 'Show / hide shortcuts panel' },
  { keys: 's', label: 'Toggle spoiler-free mode' },
  { keys: '← →', label: 'Seek (small interval)' },
  { keys: 'j l', label: 'Seek (large interval)' },
  { keys: 'space k', label: 'Play / pause' },
  { keys: '< >', label: 'Slow down / speed up' },
  { keys: '↑ ↓ m', label: 'Volume / mute' },
  { keys: ', .', label: 'Frame step (paused)' },
  { keys: 'Home End', label: 'Jump to start / end' },
];

const Popup = () => {
  const [isEnabled, setIsEnabled] = createSignal(true);
  const [small, setSmall] = createSignal(DEFAULT_SEEK_SMALL);
  const [large, setLarge] = createSignal(DEFAULT_SEEK_LARGE);
  const [fontSize, setFontSize] = createSignal(DEFAULT_TOAST_FONT_SIZE);
  const [history, setHistory] = createSignal<HistoryEntry[]>([]);

  // Scroll affordance: fade hints show only when more rows exist that direction.
  const [canScrollUp, setCanScrollUp] = createSignal(false);
  const [canScrollDown, setCanScrollDown] = createSignal(false);
  let scrollEl: HTMLDivElement | undefined;

  const updateScrollHints = () => {
    const el = scrollEl;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 1);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };

  // Recompute after the list re-renders (entries added/removed).
  createEffect(() => {
    history();
    requestAnimationFrame(updateScrollHints);
  });

  onMount(async () => {
    setIsEnabled(await getNoSpoiler());
    const iv = await getSeekIntervals();
    setSmall(iv.small);
    setLarge(iv.large);
    setFontSize(await getToastFontSize());
    setHistory(await getHistory());

    // Reflect changes made elsewhere (e.g. the "s" hotkey on the page).
    ext.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes[NO_SPOILER_STORAGE_KEY]) {
        setIsEnabled((changes[NO_SPOILER_STORAGE_KEY].newValue as boolean | undefined) ?? true);
      }
      // Live-refresh the list as videos are watched on the page.
      if (changes[WATCH_HISTORY_KEY]) {
        void getHistory().then(setHistory);
      }
    });

    // "s" toggles spoiler mode from inside the popup too (mirrors the page hotkey).
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        handleToggle(!isEnabled());
      }
    };
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });

  const notifyContent = async (enabled: boolean) => {
    const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url?.startsWith('https://tv.volleyballworld.com/')) {
      ext.tabs.sendMessage(tab.id, {
        type: 'NO_SPOILER_TOGGLE_STATE_CHANGED',
        enabled,
      });
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setIsEnabled(enabled);
    await setNoSpoiler(enabled);
    await notifyContent(enabled);
    log('handleToggle noSpoiler', enabled);
  };

  const commit = async (nextSmall: number, nextLarge: number) => {
    const s = clampSeek(nextSmall, DEFAULT_SEEK_SMALL);
    const l = clampSeek(nextLarge, DEFAULT_SEEK_LARGE);
    setSmall(s);
    setLarge(l);
    await setSeekIntervals(s, l);
  };

  const commitFont = async (next: number) => {
    const size = clampFont(next, DEFAULT_TOAST_FONT_SIZE);
    setFontSize(size);
    await setToastFontSize(size);
  };

  const openVideo = (entry: HistoryEntry) => {
    ext.tabs.create({ url: entry.url });
    window.close();
  };

  const handleRemove = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory((h) => h.filter((x) => x.id !== id)); // optimistic
    await removeEntry(id);
  };

  const handleClearAll = async () => {
    setHistory([]);
    await clearHistory();
  };

  const progressPct = (entry: HistoryEntry) =>
    entry.durationSec > 0
      ? Math.min(100, Math.round((entry.positionSec / entry.durationSec) * 100))
      : 0;

  return (
    <div class={styles.popup}>
      <h1 class={styles.title}>
        <img class={styles.logo} src={logoUrl} alt="" width="28" height="28" />
        Better VBTV
      </h1>

      <div class={styles.toggleRow}>
        <p>
          <span class={styles.toggleLabel}>Spoiler-free mode</span> <span class={styles.hint}>press <kbd>s</kbd></span>
        </p>
        <Switch checked={isEnabled()} onChange={handleToggle} />
      </div>
      <div>
        <p class={styles.status}>
          {isEnabled()
            ? <>🙈&nbsp;<span>Spoilers will be hidden across VBTV</span></>
            : <>👀&nbsp;<span>Spoilers will be shown normally</span></>
          }
        </p>
      </div>

      <hr class={styles.divider} />

      <div class={styles.section}>
        <div class={styles.historyHeader}>
          <p class={styles.sectionTitle}>Watch history</p>
          <Show when={history().length > 0}>
            <button class={styles.clearAll} onClick={handleClearAll}>Clear all</button>
          </Show>
        </div>
        <Show
          when={history().length > 0}
          fallback={<p class={styles.empty}>Replays you watch show up here.</p>}
        >
          <div
            class={styles.historyWrap}
            classList={{ [styles.showTop]: canScrollUp(), [styles.showBottom]: canScrollDown() }}
          >
          <div class={styles.history} ref={scrollEl} onScroll={updateScrollHints}>
            <For each={history()}>
              {(entry) => (
                <div class={styles.historyRow} onClick={() => openVideo(entry)} title={entry.title}>
                  <div class={styles.thumb}>
                    <Show when={entry.thumbnail} fallback={<span class={styles.thumbFallback}>🏐</span>}>
                      <img src={entry.thumbnail} alt="" loading="lazy" />
                    </Show>
                    <Show when={progressPct(entry) > 0}>
                      <span class={styles.progress} style={{ width: `${progressPct(entry)}%` }} />
                    </Show>
                  </div>
                  <div class={styles.historyMeta}>
                    <span class={styles.historyTitle}>{entry.title}</span>
                    <span class={styles.historySub}>
                      {formatTime(entry.positionSec)} · {formatAgo(entry.updatedAt)}
                    </span>
                  </div>
                  <button
                    class={styles.remove}
                    title="Remove"
                    onClick={(e) => handleRemove(e, entry.id)}
                  >
                    ×
                  </button>
                </div>
              )}
            </For>
          </div>
          </div>
        </Show>
      </div>

      <hr class={styles.divider} />

      <div class={styles.section}>
        <p class={styles.sectionTitle}>
          Keyboard shortcuts <span class={styles.hint}>press <kbd>?</kbd> on VBTV</span>
        </p>
        <div class={styles.shortcuts}>
          <For each={SHORTCUTS}>
            {(s) => (
              <div class={styles.shortcutRow}>
                <kbd>{s.keys}</kbd>
                <span>{s.label}</span>
              </div>
            )}
          </For>
        </div>
      </div>

      <hr class={styles.divider} />

      <div class={styles.section}>
        <p class={styles.sectionTitle}>Seek intervals (seconds)</p>
        <div class={styles.field}>
          <label><kbd>←</kbd> <kbd>→</kbd></label>
          <input
            type="number"
            min={SEEK_MIN}
            max={SEEK_MAX}
            value={small()}
            onChange={(e) => commit(Number(e.currentTarget.value), large())}
          />
        </div>
        <div class={styles.field}>
          <label><kbd>j</kbd> <kbd>l</kbd></label>
          <input
            type="number"
            min={SEEK_MIN}
            max={SEEK_MAX}
            value={large()}
            onChange={(e) => commit(small(), Number(e.currentTarget.value))}
          />
        </div>
      </div>

      <hr class={styles.divider} />

      <div class={styles.section}>
        <p class={styles.sectionTitle}>Toast feedback</p>
        <div class={styles.field}>
          <label>Font size (px)</label>
          <input
            type="number"
            min={TOAST_FONT_MIN}
            max={TOAST_FONT_MAX}
            value={fontSize()}
            onChange={(e) => commitFont(Number(e.currentTarget.value))}
          />
        </div>
        <div class={styles.field}>
          <span class={styles.hint}>Preview</span>
          <span class={styles.toastPreview} style={{ 'font-size': `${fontSize()}px` }}>⏩ +{small()}s</span>
        </div>
      </div>

      <hr class={styles.divider} />
      <div class={styles.footer}>
        <p><a href="https://github.com/caaatisgood/better-vbtv/issues/new" target="_blank">feedback or bug reports 👾</a></p>
        <p>“building this extension takes longer than a minus-tempo quick. <a href="https://buymeacoffee.com/caaatisgood" target="_blank">buy caaatisgood a coffee ☕</a> to keep the rallies going.”</p>
      </div>
    </div>
  );
};

export default Popup;
