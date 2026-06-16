// Tiny global toast bus. The Toast component registers its `show` implementation
// on mount; anywhere in the content script can then call `toast(message)`.
type ToastFn = (message: string) => void;

let impl: ToastFn | null = null;

export function registerToast(fn: ToastFn): void {
  impl = fn;
}

export function toast(message: string): void {
  impl?.(message);
}
