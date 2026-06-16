import { render } from 'solid-js/web';
import { createSignal, Show, type JSX } from 'solid-js';
import styles from './ShortcutsOverlay.module.css';
import { getSeekIntervals } from '../../utils/settings';
import { DEFAULT_SEEK_SMALL, DEFAULT_SEEK_LARGE } from '../../constants';

export interface ShortcutsOverlayHandle {
  toggle: () => void;
  show: () => void;
  hide: () => void;
}

const Kbd = (p: { k: string }) => <kbd class={styles.kbd}>{p.k}</kbd>;

const Row = (p: { keys: JSX.Element; label: string }) => (
  <div class={styles.row}>
    <span class={styles.keys}>{p.keys}</span>
    <span class={styles.label}>{p.label}</span>
  </div>
);

export function mountShortcutsOverlay(rootId: string): ShortcutsOverlayHandle {
  let host = document.getElementById(rootId);
  if (!host) {
    host = document.createElement('div');
    host.id = rootId;
    document.body.appendChild(host);
  }

  const [visible, setVisible] = createSignal(false);
  const [small, setSmall] = createSignal(DEFAULT_SEEK_SMALL);
  const [large, setLarge] = createSignal(DEFAULT_SEEK_LARGE);

  const refresh = () =>
    getSeekIntervals().then(({ small, large }) => {
      setSmall(small);
      setLarge(large);
    });

  // When the player is fullscreen, only the fullscreen element's subtree is
  // painted — re-parent the overlay into it so it stays visible on /player.
  const ensureParent = () => {
    if (!host) return;
    const parent = (document.fullscreenElement as HTMLElement | null) ?? document.body;
    if (host.parentElement !== parent) parent.appendChild(host);
  };

  const show = () => {
    refresh();
    ensureParent();
    setVisible(true);
  };
  const hide = () => setVisible(false);
  const toggle = () => (visible() ? hide() : show());

  document.addEventListener('fullscreenchange', () => {
    if (visible()) ensureParent();
  });

  render(
    () => (
      <Show when={visible()}>
        <div class={styles.backdrop} onClick={hide}>
          <div class={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div class={styles.header}>
              <span class={styles.title}>Keyboard shortcuts</span>
              <button class={styles.close} onClick={hide} aria-label="Close">
                ×
              </button>
            </div>
            <div class={styles.grid}>
              <div class={styles.group}>
                <div class={styles.groupTitle}>General</div>
                <Row keys={<Kbd k="?" />} label="Show / hide this panel" />
                <Row keys={<Kbd k="s" />} label="Toggle spoiler-free mode" />
              </div>
              <div class={styles.group}>
                <div class={styles.groupTitle}>Seek</div>
                <Row keys={<><Kbd k="←" /><Kbd k="→" /></>} label={`Back / forward ${small()}s`} />
                <Row keys={<><Kbd k="j" /><Kbd k="l" /></>} label={`Back / forward ${large()}s`} />
                <Row keys={<><Kbd k="Home" /><Kbd k="End" /></>} label="Jump to start / end" />
                <Row keys={<><Kbd k="," /><Kbd k="." /></>} label="Frame step (when paused)" />
              </div>
              <div class={styles.group}>
                <div class={styles.groupTitle}>Playback</div>
                <Row keys={<><Kbd k="space" /><Kbd k="k" /></>} label="Play / pause" />
                <Row keys={<><Kbd k="<" /><Kbd k=">" /></>} label="Slow down / speed up" />
              </div>
              <div class={styles.group}>
                <div class={styles.groupTitle}>Volume</div>
                <Row keys={<><Kbd k="↑" /><Kbd k="↓" /></>} label="Volume up / down" />
                <Row keys={<Kbd k="m" />} label="Mute" />
              </div>
            </div>
            <div class={styles.footer}>Change seek intervals in the extension popup.</div>
          </div>
        </div>
      </Show>
    ),
    host,
  );

  return { toggle, show, hide };
}
