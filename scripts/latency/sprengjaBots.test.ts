import { describe, expect, it } from 'vitest';

import {
  pollCadence,
  readSprengjaState,
  type SprengjaState,
} from '../../supabase/functions/_shared/pure/sprengja.ts';
import { botMove, pollEvery } from './sprengjaBots.ts';

const lit = (over: Partial<SprengjaState> = {}): SprengjaState => {
  const st = readSprengjaState({ phase: 'lit', step: 4, round: 2, order: ['a', 'b', 'c', 'd'] });
  if (!st) throw new Error('no state');
  return { ...st, holder: 'a', poll: pollCadence(false), ...over };
};
const opts = { holdUntilMs: 5000, lastPollMs: 0 };

describe('pollEvery', () => {
  it('follows game_state.poll: holder, next player, everyone else', () => {
    const st = lit();
    expect(['a', 'b', 'c'].map((me) => pollEvery(st, me))).toEqual([1000, 3000, 10000]);
  });

  it('skips a player gone when finding the next one, and never polls asleep or off the fuse', () => {
    expect(pollEvery(lit({ gone: ['b'] }), 'c')).toBe(3000);
    expect(pollEvery(lit(), 'a', true)).toBe(0);
    expect(pollEvery(lit({ phase: 'summary' }), 'a')).toBe(0);
  });

  it('with the job on only the holder polls', () => {
    const st = lit({ poll: pollCadence(true) });
    expect(['a', 'b', 'c'].map((me) => pollEvery(st, me))).toEqual([2000, 0, 0]);
  });
});

describe('botMove', () => {
  it('the starter opens the card and lights the fuse; nobody else moves', () => {
    expect(botMove(lit({ phase: 'card', starter: 'b' }), 'b', 0, opts)).toEqual({
      action: 'reveal',
      round: 2,
    });
    expect(botMove(lit({ phase: 'letters', starter: 'b' }), 'b', 0, opts)).toEqual({
      action: 'light',
      round: 2,
    });
    expect(botMove(lit({ phase: 'card', starter: 'b' }), 'a', 0, opts)).toBeNull();
  });

  it('the holder throws once the word is said, polling meanwhile; asleep it does nothing', () => {
    expect(botMove(lit(), 'a', 6000, opts)).toEqual({ action: 'pass', round: 2, step: 4 });
    expect(botMove(lit(), 'a', 1500, opts)).toEqual({ action: 'poll', round: 2 });
    expect(botMove(lit(), 'a', 1500, { ...opts, lastPollMs: 1000 })).toBeNull();
    expect(botMove(lit(), 'a', 6000, { ...opts, asleep: true })).toBeNull();
  });

  it('Tur sonu: ready once, then advance when the time is up', () => {
    const summary = lit({ phase: 'summary', endsAt: new Date(10_000).toISOString() });
    expect(botMove(summary, 'a', 0, opts)).toEqual({ action: 'ready', step: 4 });
    expect(botMove({ ...summary, ready: ['a'] }, 'a', 5000, opts)).toBeNull();
    expect(botMove({ ...summary, ready: ['a'] }, 'a', 10_000, opts)).toEqual({ action: 'advance' });
  });

  it('a player gone or not in the game makes no move', () => {
    expect(botMove(lit({ gone: ['a'] }), 'a', 6000, opts)).toBeNull();
    expect(botMove(lit(), 'z', 6000, opts)).toBeNull();
  });
});
