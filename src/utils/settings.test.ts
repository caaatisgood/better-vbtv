import { describe, it, expect } from 'vitest';

import { clampSeek, clampFont, SEEK_MIN, SEEK_MAX, TOAST_FONT_MIN, TOAST_FONT_MAX } from './settings';

// These guard values that reach the UI straight from storage, so they have to
// survive whatever is in there — including values written by an older build.
describe('clampSeek', () => {
  it('passes through a value already in range', () => {
    expect(clampSeek(30, 5)).toBe(30);
  });

  it('clamps to the bounds', () => {
    expect(clampSeek(SEEK_MAX + 1000, 5)).toBe(SEEK_MAX);
    // Rounds below the floor, then the floor applies.
    expect(clampSeek(0.4, 5)).toBe(SEEK_MIN);
  });

  it('rounds to whole seconds', () => {
    expect(clampSeek(12.6, 5)).toBe(13);
  });

  it('coerces numeric strings, since storage is untyped', () => {
    expect(clampSeek('15', 5)).toBe(15);
  });

  it('falls back on anything non-positive or non-numeric', () => {
    expect(clampSeek(0, 5)).toBe(5);
    expect(clampSeek(-3, 5)).toBe(5);
    expect(clampSeek('abc', 5)).toBe(5);
    expect(clampSeek(undefined, 5)).toBe(5);
    expect(clampSeek(null, 5)).toBe(5);
    expect(clampSeek(Infinity, 5)).toBe(5);
  });
});

describe('clampFont', () => {
  it('passes through a value already in range', () => {
    expect(clampFont(14, 12)).toBe(14);
  });

  it('clamps to the bounds rather than falling back', () => {
    expect(clampFont(1, 12)).toBe(TOAST_FONT_MIN);
    expect(clampFont(999, 12)).toBe(TOAST_FONT_MAX);
  });

  it('falls back on anything non-positive or non-numeric', () => {
    expect(clampFont(0, 12)).toBe(12);
    expect(clampFont(-1, 12)).toBe(12);
    expect(clampFont('nope', 12)).toBe(12);
    expect(clampFont(undefined, 12)).toBe(12);
  });
});
