import { publicState, startGame, type SignumSeat, type SignumState } from '@shared/signum.ts';
import { describe, expect, it } from 'vitest';

import {
  closedByKind,
  endedByClock,
  lastSignum,
  newlyOpened,
  nextSeq,
  pointersByTile,
  readSignumPage,
  readSignumState,
  seatOf,
  signumMode,
  tilesLeftOf,
  timerStage,
  uuidV4,
} from './signumGame';

function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2 ** 31;
    return x / 2 ** 31;
  };
}

const seats: SignumSeat[] = [
  { sid: 's1', team: 'a', role: 'captain' },
  { sid: 's2', team: 'a', role: 'guesser' },
  { sid: 's3', team: 'b', role: 'captain' },
  { sid: 's4', team: 'b', role: 'guesser' },
];
function game(): { state: SignumState; key: SignumState['board'][number]['open'][] } {
  const words = Array.from({ length: 300 }, (_, i) => {
    const a = 'abcdefghijklmnopqrstuvwxyz';
    return `${a[i % 26]}${a[Math.floor(i / 26) % 26]}${a[(i * 7) % 26]}${a[(i * 11) % 26]}x`;
  });
  const started = startGame(
    {
      gameNo: 3,
      seats,
      pool: words,
      now: new Date('2026-11-05T10:00:00Z'),
      channels: { a: 'ca', b: 'cb' },
    },
    seeded(7),
  );
  if ('error' in started) throw new Error(started.error);
  return { state: publicState(started.state), key: started.secret.key };
}

describe('signumGame', () => {
  it('reads the open state as written, and nothing else as a game', () => {
    const { state } = game();
    expect(readSignumState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(readSignumState({ phase: 'turn' })).toBeNull();
    expect(readSignumState(null)).toBeNull();
    expect(readSignumState({ ...state, board: state.board.slice(1) })).toBeNull();
  });

  it('tells the page, the game and its end apart', () => {
    const { state } = game();
    expect(signumMode({ concept: 'signum', game_state: state })).toBe('play');
    expect(
      signumMode({ concept: null, game_state: { pregame: { concept: 'signum', picks: {} } } }),
    ).toBe('pregame');
    const over = {
      ...state,
      phase: 'over' as const,
      winner: 'a' as const,
      reason: 'cards' as const,
    };
    const ended = { gameNo: 3, lastGame: { concept: 'signum', abandoned: false, signum: over } };
    expect(signumMode({ concept: null, game_state: ended })).toBe('end');
    expect(lastSignum(ended)?.winner).toBe('a');
    // The owner's "Oyunu bitir": no over state is kept, the table comes back.
    expect(
      signumMode({
        concept: null,
        game_state: { lastGame: { concept: 'signum', abandoned: true } },
      }),
    ).toBeNull();
    expect(signumMode({ concept: 'tabu', game_state: { phase: 'turn' } })).toBeNull();
  });

  it('counts each team’s tiles left from the open tiles', () => {
    const { state } = game();
    const starter = state.starter;
    const other = starter === 'a' ? 'b' : 'a';
    expect(tilesLeftOf(state, starter)).toBe(9);
    expect(tilesLeftOf(state, other)).toBe(8);
    const opened = {
      ...state,
      board: state.board.map((t, i) => (i === 0 ? { ...t, open: starter } : t)),
    };
    expect(tilesLeftOf(opened, starter)).toBe(8);
  });

  it('gives the captain’s legend from the key, closed tiles only', () => {
    const { state, key } = game();
    const kinds = key.filter((k): k is 'a' | 'b' | 'n' | 'x' => k !== null);
    const counts = closedByKind(state, kinds);
    expect(counts.a + counts.b).toBe(17);
    expect(counts.n).toBe(7);
    expect(counts.x).toBe(1);
    const first = kinds[0] ?? 'n';
    const opened = {
      ...state,
      board: state.board.map((t, i) => (i === 0 ? { ...t, open: first } : t)),
    };
    expect(closedByKind(opened, kinds)[first]).toBe(counts[first] - 1);
  });

  it('reads the page through cleanPregame', () => {
    const page = readSignumPage({
      pregame: {
        concept: 'signum',
        picks: { s1: 'a', s2: 'b' },
        signum: {
          candidates: { a: ['s1', 's2'], b: [] },
          offers: { a: null, b: 's2' },
          captains: { a: 's2', b: null },
        },
      },
    });
    expect(page.page.candidates.a).toEqual(['s1']);
    expect(page.page.offers.b).toBe('s2');
    expect(page.page.captains.a).toBeNull();
    expect(readSignumPage({ pregame: { concept: 'signum', picks: {} } }).page.captains).toEqual({
      a: null,
      b: null,
    });
  });

  it('groups the marks by tile', () => {
    const map = pointersByTile({ s4: 3, s2: 3, s5: 7 });
    expect(map.get(3)).toEqual(['s2', 's4']);
    expect(map.get(7)).toEqual(['s5']);
  });

  it('finds the one tile that opened', () => {
    const { state } = game();
    const after = state.board.map((t, i) => (i === 4 ? { ...t, open: 'n' as const } : t));
    expect(newlyOpened(state.board, after)).toBe(4);
    expect(newlyOpened(state.board, state.board)).toBeNull();
    expect(newlyOpened(null, after)).toBeNull();
  });

  it('keeps the capsule full on the role cards and low in the last 10 seconds', () => {
    expect(timerStage('role', 3)).toBe('full');
    expect(timerStage('clue', 11)).toBe('half');
    expect(timerStage('guess', 10)).toBe('low');
  });

  it('never sends an older mark', () => {
    expect(nextSeq(0, 0)).toBe(1);
    expect(nextSeq(2, 5)).toBe(6);
    expect(nextSeq(7, 5)).toBe(8);
  });

  it('makes v4 UUIDs the server accepts', () => {
    const id = uuidV4(seeded(3));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuidV4(seeded(3))).toBe(id);
    expect(uuidV4(seeded(4))).not.toBe(id);
  });

  it('tells a clock that ran out from a press', () => {
    const at = '2026-11-05T10:00:00Z';
    expect(endedByClock(at, Date.parse(at))).toBe(true);
    expect(endedByClock(at, Date.parse(at) - 1)).toBe(false);
    expect(endedByClock(null, 0)).toBe(false);
  });

  it('finds a seat by session', () => {
    const { state } = game();
    expect(seatOf(state, 's3')?.role).toBe('captain');
    expect(seatOf(state, 'nobody')).toBeNull();
  });
});
