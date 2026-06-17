import { JW_MEDIA_FEED } from '../constants';
import { log } from './logger';

// VBTV's player page URL looks like:
//   /player?self-link=<encoded jw url>&screen-id=<uuid>
// where the encoded self-link contains `/jw/media/<MEDIA_ID>`. That JW media id
// is the only stable per-video identifier — `screen-id` is the layout template,
// not the content. We key watch history on the media id.
export function parseJwMediaId(href: string): string | null {
  try {
    const selfLink = new URL(href).searchParams.get('self-link');
    if (!selfLink) return null;
    const m = decodeURIComponent(selfLink).match(/\/jw\/media\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export interface VideoMeta {
  title: string;
  thumbnail?: string;
}

// Fetch title + poster from JW's public delivery feed. CORS-open (ACAO: *), so a
// content-script fetch from the VBTV origin succeeds without host permissions.
export async function fetchJwMeta(id: string): Promise<VideoMeta | null> {
  try {
    const res = await fetch(`${JW_MEDIA_FEED}${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.playlist?.[0] ?? {};
    const title: string = data?.title || item?.title || '';
    return {
      title: title || 'VBTV replay',
      thumbnail: pickThumbnail(item) ?? item?.image ?? data?.image,
    };
  } catch (e) {
    log('fetchJwMeta failed', e);
    return null;
  }
}

// JW returns several poster sizes; pick a mid-size one to keep the popup light.
function pickThumbnail(item: any): string | undefined {
  const images = item?.images;
  if (Array.isArray(images) && images.length) {
    const sorted = [...images]
      .filter((i) => i && i.src)
      .sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
    if (sorted.length) {
      return sorted[Math.floor(sorted.length / 2)].src;
    }
  }
  return undefined;
}

// 90 -> "1:30", 3725 -> "1:02:05"
export function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

// Compact "time ago" for the history list.
export function formatAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  return `${Math.floor(day / 30)}mo ago`;
}
