import { describe, it, expect } from 'vitest';

import { parseJwMediaId, formatTime } from './videoMeta';

// The JW media id is the only stable per-video key, and every watch-history
// entry hangs off it. If this drifts, history silently stops matching rather
// than failing loudly — so the edge cases matter more than usual.
describe('parseJwMediaId', () => {
  const player = (selfLink: string) =>
    `https://tv.volleyballworld.com/player?self-link=${encodeURIComponent(selfLink)}&screen-id=abc`;

  it('pulls the id out of the encoded self-link', () => {
    expect(parseJwMediaId(player('https://x.test/jw/media/AbC123'))).toBe('AbC123');
  });

  it('accepts the underscores and hyphens JW ids can contain', () => {
    expect(parseJwMediaId(player('https://x.test/jw/media/a_B-9z'))).toBe('a_B-9z');
  });

  it('stops at the first character outside the id charset', () => {
    expect(parseJwMediaId(player('https://x.test/jw/media/AbC123/extra'))).toBe('AbC123');
    expect(parseJwMediaId(player('https://x.test/jw/media/AbC123?x=1'))).toBe('AbC123');
  });

  it('ignores screen-id, which is the layout template rather than the content', () => {
    const href = 'https://tv.volleyballworld.com/player?screen-id=not-a-media-id';
    expect(parseJwMediaId(href)).toBeNull();
  });

  it('returns null when self-link carries no jw media path', () => {
    expect(parseJwMediaId(player('https://x.test/something/else'))).toBeNull();
  });

  it('returns null rather than throwing on a malformed href', () => {
    expect(parseJwMediaId('not a url')).toBeNull();
    expect(parseJwMediaId('')).toBeNull();
  });
});

describe('formatTime', () => {
  it('formats under an hour as m:ss', () => {
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(59)).toBe('0:59');
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats an hour or more as h:mm:ss with zero padding', () => {
    expect(formatTime(3725)).toBe('1:02:05');
    expect(formatTime(3600)).toBe('1:00:00');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(90.9)).toBe('1:30');
  });

  it('clamps junk input to zero instead of rendering NaN', () => {
    expect(formatTime(-10)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
  });
});
