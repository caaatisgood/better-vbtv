// src/Popup.tsx
import { createSignal, onMount, For } from 'solid-js';
import { Switch } from '../Switch';
import styles from './Popup.module.css';
import { NO_SPOILER_STORAGE_KEY, DEFAULT_SEEK_SMALL, DEFAULT_SEEK_LARGE, DEFAULT_TOAST_FONT_SIZE } from '../../constants';
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
import { log } from '../../utils/logger';

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

  onMount(async () => {
    setIsEnabled(await getNoSpoiler());
    const iv = await getSeekIntervals();
    setSmall(iv.small);
    setLarge(iv.large);
    setFontSize(await getToastFontSize());

    // Reflect changes made elsewhere (e.g. the "s" hotkey on the page).
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes[NO_SPOILER_STORAGE_KEY]) {
        setIsEnabled((changes[NO_SPOILER_STORAGE_KEY].newValue as boolean | undefined) ?? true);
      }
    });
  });

  const notifyContent = async (enabled: boolean) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url?.startsWith('https://tv.volleyballworld.com/')) {
      chrome.tabs.sendMessage(tab.id, {
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

  return (
    <div class={styles.popup}>
      <h1 class={styles.title}>Better VBTV</h1>

      <div class={styles.toggleRow}>
        <p>
          Spoiler-free mode <span class={styles.hint}>press <kbd>s</kbd></span>
        </p>
        <Switch checked={isEnabled()} onChange={handleToggle} />
      </div>
      <div>
        <p class={styles.status}>
          {isEnabled()
            ? <>😌&nbsp;<span>Spoilers will be hidden across VBTV</span></>
            : <>😮&nbsp;<span>Spoilers will be shown normally</span></>
          }
        </p>
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
      <div class={styles.footer}>
        <p>created by caaatisgood</p>
        <p><a href="https://github.com/caaatisgood/better-vbtv/issues/new" target="_blank">feedback or bug reports 💬</a></p>
      </div>
    </div>
  );
};

export default Popup;
