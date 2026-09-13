import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { resetChromeStorage } from '../../tests/chromeStub';
import { HISTORY_MAX_ENTRIES } from '../constants';
import {
  getHistory,
  getEntry,
  recordView,
  savePosition,
  removeEntry,
  clearHistory,
} from './history';

const base = { url: 'https://tv.volleyballworld.com/player?self-link=x', positionSec: 0, durationSec: 0 };

beforeEach(() => {
  resetChromeStorage();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('recordView', () => {
  it('stores an entry keyed by media id', async () => {
    await recordView({ ...base, id: 'm1', title: 'Match', durationSec: 120, positionSec: 30 });

    const entry = await getEntry('m1');
    expect(entry).toMatchObject({ id: 'm1', title: 'Match', durationSec: 120, positionSec: 30 });
  });

  it('updates in place rather than appending a duplicate', async () => {
    await recordView({ ...base, id: 'm1', title: 'Match', positionSec: 10 });
    await recordView({ ...base, id: 'm1', title: 'Match', positionSec: 90 });

    const all = await getHistory();
    expect(all).toHaveLength(1);
    expect(all[0].positionSec).toBe(90);
  });

  // The documented merge rule: a re-watch whose metadata fetch failed must not
  // blank out a title or thumbnail that was captured on an earlier view.
  it('keeps existing metadata when the new payload omits it', async () => {
    await recordView({ ...base, id: 'm1', title: 'Poland vs Brazil', thumbnail: 'a.jpg', durationSec: 300 });
    await recordView({ ...base, id: 'm1', positionSec: 45 });

    const entry = await getEntry('m1');
    expect(entry?.title).toBe('Poland vs Brazil');
    expect(entry?.thumbnail).toBe('a.jpg');
    expect(entry?.durationSec).toBe(300);
  });

  it('falls back to a placeholder title when there is nothing to carry over', async () => {
    await recordView({ ...base, id: 'm1' });
    expect((await getEntry('m1'))?.title).toBe('VBTV replay');
  });

  it('prunes to the most recent entries once the cap is passed', async () => {
    const overflow = 5;
    for (let i = 0; i < HISTORY_MAX_ENTRIES + overflow; i++) {
      vi.setSystemTime(new Date(1_000_000 + i * 1000));
      await recordView({ ...base, id: `m${i}`, title: `Match ${i}` });
    }

    const all = await getHistory();
    expect(all).toHaveLength(HISTORY_MAX_ENTRIES);
    // Newest survives, oldest is dropped.
    expect(all[0].id).toBe(`m${HISTORY_MAX_ENTRIES + overflow - 1}`);
    expect(await getEntry('m0')).toBeUndefined();
    expect(await getEntry(`m${overflow}`)).toBeDefined();
  });
});

describe('getHistory', () => {
  it('orders most recently watched first', async () => {
    vi.setSystemTime(new Date(1000));
    await recordView({ ...base, id: 'old', title: 'Old' });
    vi.setSystemTime(new Date(5000));
    await recordView({ ...base, id: 'new', title: 'New' });

    expect((await getHistory()).map((e) => e.id)).toEqual(['new', 'old']);
  });

  it('is empty before anything is recorded', async () => {
    expect(await getHistory()).toEqual([]);
  });
});

describe('savePosition', () => {
  it('updates the resume point of a recorded video', async () => {
    await recordView({ ...base, id: 'm1', title: 'Match', durationSec: 300 });
    await savePosition('m1', 120);

    const entry = await getEntry('m1');
    expect(entry?.positionSec).toBe(120);
    expect(entry?.durationSec).toBe(300);
  });

  // The throttled position save can fire for a video that never qualified for
  // history; it must not resurrect one as a bare entry.
  it('is a no-op for a video that was never recorded', async () => {
    await savePosition('ghost', 42);

    expect(await getEntry('ghost')).toBeUndefined();
    expect(await getHistory()).toEqual([]);
  });
});

describe('removeEntry and clearHistory', () => {
  it('removes a single entry and leaves the rest', async () => {
    await recordView({ ...base, id: 'm1' });
    await recordView({ ...base, id: 'm2' });
    await removeEntry('m1');

    expect((await getHistory()).map((e) => e.id)).toEqual(['m2']);
  });

  it('tolerates removing an id that is not there', async () => {
    await recordView({ ...base, id: 'm1' });
    await removeEntry('nope');

    expect(await getHistory()).toHaveLength(1);
  });

  it('clears everything', async () => {
    await recordView({ ...base, id: 'm1' });
    await clearHistory();

    expect(await getHistory()).toEqual([]);
  });
});
