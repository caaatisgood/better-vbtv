import { render } from 'solid-js/web';
import { createSignal, Show } from 'solid-js';
import styles from './Toast.module.css';
import { registerToast, type ToastAction } from '../../utils/toast';
import { getToastFontSize, clampFont } from '../../utils/settings';
import { TOAST_FONT_SIZE_KEY, DEFAULT_TOAST_FONT_SIZE } from '../../constants';
import ext from '../../utils/browser';

const VISIBLE_MS = 1300;

export function mountToast(rootId: string): void {
  let host = document.getElementById(rootId);
  if (!host) {
    host = document.createElement('div');
    host.id = rootId;
    document.body.appendChild(host);
  }

  // Transient slot — fast indicators (seek/volume/etc). Auto-hides, replaced on
  // every emit. Renders below the sticky slot.
  const [msg, setMsg] = createSignal('');
  const [shown, setShown] = createSignal(false);
  // Sticky slot — a persistent prompt (e.g. "Resume?") that stays until the user
  // dismisses it and is never clobbered by transient indicators.
  const [stickyMsg, setStickyMsg] = createSignal('');
  const [stickyShown, setStickyShown] = createSignal(false);
  const [stickyAction, setStickyAction] = createSignal<ToastAction | null>(null);
  const [fontSize, setFontSize] = createSignal(DEFAULT_TOAST_FONT_SIZE);
  let el: HTMLDivElement | undefined;     // transient toast element (for anim)
  let stickyEl: HTMLDivElement | undefined; // sticky toast element (for anim)
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Pending close handler for the current sticky toast (null when none open).
  let onDismissCb: (() => void) | null = null;

  getToastFontSize().then(setFontSize);
  ext.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[TOAST_FONT_SIZE_KEY]) {
      setFontSize(clampFont(changes[TOAST_FONT_SIZE_KEY].newValue, DEFAULT_TOAST_FONT_SIZE));
    }
  });

  // Keep the toast host painted above a fullscreen player.
  const reparentForFullscreen = () => {
    const parent = (document.fullscreenElement as HTMLElement | null) ?? document.body;
    if (host && host.parentElement !== parent) parent.appendChild(host);
  };

  const grow = (target: HTMLElement | undefined) => {
    target?.animate(
      [
        { opacity: 0, transform: 'scale(0.8)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: 150, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );
  };

  const hideSticky = () => setStickyShown(false);

  // Close the sticky toast and fire its onDismiss exactly once.
  const dismissSticky = () => {
    hideSticky();
    const cb = onDismissCb;
    onDismissCb = null;
    cb?.();
  };

  const showSticky = (
    message: string,
    opts?: { action?: ToastAction; onDismiss?: () => void },
  ) => {
    // Replacing a still-open sticky toast counts as dismissing it.
    if (onDismissCb) dismissSticky();
    setStickyMsg(message);
    setStickyAction(opts?.action ?? null);
    onDismissCb = opts?.onDismiss ?? null;
    setStickyShown(true);
    reparentForFullscreen();
    grow(stickyEl);
  };

  const showTransient = (message: string, durationMs?: number) => {
    setMsg(message);
    setShown(true);
    reparentForFullscreen();
    // Grow from the anchored corner on every emit (no slide). Replays even when
    // the toast is already visible (e.g. holding a seek key).
    grow(el);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setShown(false), durationMs ?? VISIBLE_MS);
  };

  const show = (
    message: string,
    opts?: { action?: ToastAction; durationMs?: number; dismissible?: boolean; onDismiss?: () => void },
  ) => {
    if (opts?.dismissible) {
      showSticky(message, { action: opts.action, onDismiss: opts.onDismiss });
    } else {
      showTransient(message, opts?.durationMs);
    }
  };

  registerToast(show);

  render(
    () => (
      <div class={styles.stack} style={{ 'font-size': `${fontSize()}px` }}>
        <Show when={stickyShown()}>
          <div ref={stickyEl} classList={{ [styles.toast]: true, [styles.shown]: true, [styles.interactive]: true }}>
            <span>{stickyMsg()}</span>
            <Show when={stickyAction()}>
              {(a) => (
                <button
                  class={styles.action}
                  onClick={() => {
                    // Acting on the toast is not a dismiss — drop the close handler.
                    onDismissCb = null;
                    hideSticky();
                    a().onClick();
                  }}
                >
                  {a().label}
                </button>
              )}
            </Show>
            <button class={styles.close} aria-label="Dismiss" onClick={dismissSticky}>
              ✕
            </button>
          </div>
        </Show>
        <div ref={el} classList={{ [styles.toast]: true, [styles.shown]: shown() }}>
          <span>{msg()}</span>
        </div>
      </div>
    ),
    host,
  );
}
