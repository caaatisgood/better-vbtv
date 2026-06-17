import { render } from 'solid-js/web';
import { createSignal, Show } from 'solid-js';
import styles from './Toast.module.css';
import { registerToast, type ToastAction } from '../../utils/toast';
import { getToastFontSize, clampFont } from '../../utils/settings';
import { TOAST_FONT_SIZE_KEY, DEFAULT_TOAST_FONT_SIZE } from '../../constants';

const VISIBLE_MS = 1300;
// Interactive prompts (e.g. "Resume?") need long enough to click.
const ACTION_VISIBLE_MS = 7000;

export function mountToast(rootId: string): void {
  let host = document.getElementById(rootId);
  if (!host) {
    host = document.createElement('div');
    host.id = rootId;
    document.body.appendChild(host);
  }

  const [msg, setMsg] = createSignal('');
  const [shown, setShown] = createSignal(false);
  const [action, setAction] = createSignal<ToastAction | null>(null);
  const [fontSize, setFontSize] = createSignal(DEFAULT_TOAST_FONT_SIZE);
  let el: HTMLDivElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  getToastFontSize().then(setFontSize);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[TOAST_FONT_SIZE_KEY]) {
      setFontSize(clampFont(changes[TOAST_FONT_SIZE_KEY].newValue, DEFAULT_TOAST_FONT_SIZE));
    }
  });

  const hide = () => setShown(false);

  const show = (message: string, opts?: { action?: ToastAction; durationMs?: number }) => {
    setMsg(message);
    setAction(opts?.action ?? null);
    setShown(true);

    // Keep the toast painted above a fullscreen player.
    const parent = (document.fullscreenElement as HTMLElement | null) ?? document.body;
    if (host && host.parentElement !== parent) parent.appendChild(host);

    // Grow from the anchored corner on every emit (no slide). Replays even when
    // the toast is already visible (e.g. holding a seek key).
    el?.animate(
      [
        { opacity: 0, transform: 'scale(0.8)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: 150, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );

    if (timer) clearTimeout(timer);
    const life = opts?.durationMs ?? (opts?.action ? ACTION_VISIBLE_MS : VISIBLE_MS);
    timer = setTimeout(hide, life);
  };

  registerToast(show);

  render(
    () => (
      <div
        ref={el}
        classList={{ [styles.toast]: true, [styles.shown]: shown(), [styles.interactive]: !!action() }}
        style={{ 'font-size': `${fontSize()}px` }}
      >
        <span>{msg()}</span>
        <Show when={action()}>
          {(a) => (
            <button
              class={styles.action}
              onClick={() => {
                hide();
                a().onClick();
              }}
            >
              {a().label}
            </button>
          )}
        </Show>
      </div>
    ),
    host,
  );
}
