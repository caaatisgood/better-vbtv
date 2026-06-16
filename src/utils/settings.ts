import {
  NO_SPOILER_STORAGE_KEY,
  SEEK_SMALL_KEY,
  SEEK_LARGE_KEY,
  DEFAULT_SEEK_SMALL,
  DEFAULT_SEEK_LARGE,
} from "../constants";

export const SEEK_MIN = 1;
export const SEEK_MAX = 600;

export async function getNoSpoiler(): Promise<boolean> {
  const result = await chrome.storage.local.get([NO_SPOILER_STORAGE_KEY]);
  // Default ON: spoiler-free is the whole point of the extension.
  return (result[NO_SPOILER_STORAGE_KEY] as boolean | undefined) ?? true;
}

export async function setNoSpoiler(value: boolean): Promise<void> {
  await chrome.storage.local.set({ [NO_SPOILER_STORAGE_KEY]: value });
}

export interface SeekIntervals {
  small: number;
  large: number;
}

export async function getSeekIntervals(): Promise<SeekIntervals> {
  const result = await chrome.storage.local.get([SEEK_SMALL_KEY, SEEK_LARGE_KEY]);
  return {
    small: clampSeek(result[SEEK_SMALL_KEY], DEFAULT_SEEK_SMALL),
    large: clampSeek(result[SEEK_LARGE_KEY], DEFAULT_SEEK_LARGE),
  };
}

export async function setSeekIntervals(small: number, large: number): Promise<void> {
  await chrome.storage.local.set({
    [SEEK_SMALL_KEY]: clampSeek(small, DEFAULT_SEEK_SMALL),
    [SEEK_LARGE_KEY]: clampSeek(large, DEFAULT_SEEK_LARGE),
  });
}

export function clampSeek(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(SEEK_MAX, Math.max(SEEK_MIN, Math.round(n)));
}
