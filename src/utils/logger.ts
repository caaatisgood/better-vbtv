export const log = (...args: any[]) => {
  if (!__DEBUG__) {
    return;
  }
  console.log("[[[better-vbtv]]]", ...args)
}
