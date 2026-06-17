// Tiny global toast bus. The Toast component registers its `show` implementation
// on mount; anywhere in the content script can then call `toast(message)`.
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  // When set, the toast renders a clickable button and stays interactive until
  // dismissed or the action is taken (used for the "Resume?" prompt).
  action?: ToastAction;
  // Override the auto-hide delay (ms). Action toasts default to a longer life.
  durationMs?: number;
}

type ToastFn = (message: string, opts?: ToastOptions) => void;

let impl: ToastFn | null = null;

export function registerToast(fn: ToastFn): void {
  impl = fn;
}

export function toast(message: string, opts?: ToastOptions): void {
  impl?.(message, opts);
}
