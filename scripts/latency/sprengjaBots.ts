// The bot table's decisions (sprengja.ts): what a phone does with the table's open Sprengja state,
// the way the app does it (docs/SPEC_V4.md §4.F "Adım 4.6.8"). Pure, tested in sprengjaBots.test.ts.
import { nextActive, type SprengjaState } from '../../supabase/functions/_shared/pure/sprengja.ts';

// How often `me` asks the server whether the fuse ran out (sprengja/poll) while it burns, from
// game_state.poll: the holder, the next player, everyone else; 0 is never. A phone in the
// background (`asleep`) does not ask at all.
export function pollEvery(state: SprengjaState, me: string, asleep = false): number {
  if (state.phase !== 'lit' || asleep || state.gone.includes(me)) return 0;
  if (state.holder === me) return state.poll.holderMs;
  const next = state.holder ? nextActive(state.order, state.gone, state.holder) : null;
  return next === me ? state.poll.nextMs : state.poll.othersMs;
}

export type BotMove =
  | { action: 'reveal' | 'light' | 'poll'; round: number }
  | { action: 'pass' | 'take-over'; round: number; step: number }
  | { action: 'ready'; step: number }
  | { action: 'advance' };

// The move `me` makes now (`nowMs` the server's clock), or null. `holdUntilMs`: the holder keeps
// the bomb until then (the word being said); `lastPollMs`: when `me` last polled.
export function botMove(
  state: SprengjaState,
  me: string,
  nowMs: number,
  opts: { holdUntilMs: number; lastPollMs: number; asleep?: boolean },
): BotMove | null {
  if (state.gone.includes(me) || !state.order.includes(me)) return null;
  switch (state.phase) {
    case 'card':
      return state.starter === me ? { action: 'reveal', round: state.round } : null;
    case 'letters':
      return state.starter === me ? { action: 'light', round: state.round } : null;
    case 'lit': {
      if (opts.asleep) return null;
      if (state.holder === me && nowMs >= opts.holdUntilMs) {
        return { action: 'pass', round: state.round, step: state.step };
      }
      const every = pollEvery(state, me);
      return every > 0 && nowMs - opts.lastPollMs >= every
        ? { action: 'poll', round: state.round }
        : null;
    }
    case 'summary': {
      if (!state.ready.includes(me)) return { action: 'ready', step: state.step };
      const ends = state.endsAt ? Date.parse(state.endsAt) : Number.NaN;
      return Number.isFinite(ends) && nowMs >= ends ? { action: 'advance' } : null;
    }
    case 'halted':
      return { action: 'advance' };
  }
}
