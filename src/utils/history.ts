import { WATCH_HISTORY_KEY, HISTORY_MAX_ENTRIES } from '../constants';

export interface HistoryEntry {
  id: string;          // JW media id — stable per-video key
  title: string;
  thumbnail?: string;
  url: string;         // full player URL, to reopen the video
  positionSec: number; // resume point
  durationSec: number; // for the progress bar
  updatedAt: number;   // last viewed — drives recency sort
}

// Stored as a map keyed by id: re-watching updates the same entry (O(1) dedupe)
// instead of appending duplicates. The list view derives order from updatedAt.
type HistoryMap = Record<string, HistoryEntry>;

async function readMap(): Promise<HistoryMap> {
  const result = await chrome.storage.local.get([WATCH_HISTORY_KEY]);
  return (result[WATCH_HISTORY_KEY] as HistoryMap | undefined) ?? {};
}

async function writeMap(map: HistoryMap): Promise<void> {
  await chrome.storage.local.set({ [WATCH_HISTORY_KEY]: map });
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const map = await readMap();
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getEntry(id: string): Promise<HistoryEntry | undefined> {
  const map = await readMap();
  return map[id];
}

// Create on first qualify, or refresh metadata on re-watch. Always bumps recency.
// Existing values win when the new payload omits them (e.g. metadata fetch failed).
export async function recordView(entry: {
  id: string;
  title?: string;
  thumbnail?: string;
  url: string;
  positionSec: number;
  durationSec: number;
}): Promise<void> {
  const map = await readMap();
  const prev = map[entry.id];
  map[entry.id] = {
    id: entry.id,
    url: entry.url,
    title: entry.title || prev?.title || 'VBTV replay',
    thumbnail: entry.thumbnail ?? prev?.thumbnail,
    positionSec: entry.positionSec,
    durationSec: entry.durationSec || prev?.durationSec || 0,
    updatedAt: Date.now(),
  };
  await writeMap(prune(map));
}

// Lightweight position update for an already-recorded video (the throttled
// resume-time save). No-op if the video was never qualified.
export async function savePosition(
  id: string,
  positionSec: number,
  durationSec?: number,
): Promise<void> {
  const map = await readMap();
  const prev = map[id];
  if (!prev) return;
  map[id] = {
    ...prev,
    positionSec,
    durationSec: durationSec || prev.durationSec,
    updatedAt: Date.now(),
  };
  await writeMap(map);
}

export async function removeEntry(id: string): Promise<void> {
  const map = await readMap();
  if (!(id in map)) return;
  delete map[id];
  await writeMap(map);
}

export async function clearHistory(): Promise<void> {
  await writeMap({});
}

// Keep only the most-recent HISTORY_MAX_ENTRIES.
function prune(map: HistoryMap): HistoryMap {
  const entries = Object.values(map);
  if (entries.length <= HISTORY_MAX_ENTRIES) return map;
  const keep = entries
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, HISTORY_MAX_ENTRIES);
  return Object.fromEntries(keep.map((e) => [e.id, e]));
}
