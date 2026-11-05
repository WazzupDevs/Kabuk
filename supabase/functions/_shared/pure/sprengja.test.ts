import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  activePlayers,
  fuseMs,
  fuseRange,
  nextActive,
  pollCadence,
  pollEveryMs,
  readSprengjaEvent,
  readSprengjaResult,
  readSprengjaState,
  replayRound,
  roundsFor,
  scoreOf,
  SPRENGJA,
  type SprengjaEvent,
  type SprengjaState,
  tiersFor,
  winnersOf,
} from './sprengja.ts';

const migrations = resolve(import.meta.dirname, '../../../migrations');
const migration = readFileSync(
  resolve(migrations, readdirSync(migrations).find((f) => f.endsWith('_sprengja.sql')) ?? ''),
  'utf8',
);

describe('SPRENGJA', () => {
  it('is the server’s private.sprengja_config()', () => {
    const body = migration.slice(
      migration.indexOf('create function private.sprengja_config()'),
      migration.indexOf('create function private.sprengja_num'),
    );
    const numbers = Object.fromEntries(
      [...body.matchAll(/'(\w+)', (\d+)/g)].map((m) => [m[1], Number(m[2])]),
    );
    expect(numbers).toEqual(SPRENGJA);
  });
});

describe('roundsFor and fuseRange (K-85 O-8)', () => {
  it('follow the approved formula for 3 to 8 players', () => {
    const table = [3, 4, 5, 6, 7, 8].map((n) => ({ n, rounds: roundsFor(n), ...fuseRange(n) }));
    expect(table).toEqual([
      { n: 3, rounds: 5, lowMs: 12_500, highMs: 28_500 },
      { n: 4, rounds: 5, lowMs: 14_000, highMs: 32_000 },
      { n: 5, rounds: 5, lowMs: 15_500, highMs: 35_500 },
      { n: 6, rounds: 6, lowMs: 17_000, highMs: 39_000 },
      { n: 7, rounds: 7, lowMs: 18_500, highMs: 42_500 },
      { n: 8, rounds: 8, lowMs: 20_000, highMs: 46_000 },
    ]);
  });

  it('draws the fuse inside the bounds', () => {
    for (let n = SPRENGJA.minPlayers; n <= SPRENGJA.maxPlayers; n++) {
      const { lowMs, highMs } = fuseRange(n);
      expect(fuseMs(n, 0)).toBe(lowMs);
      expect(fuseMs(n, 0.999_999)).toBeLessThan(highMs);
      expect(fuseMs(n, 0.5)).toBe(Math.floor((lowMs + highMs) / 2));
    }
  });
});

describe('tiersFor (K-85 O-12)', () => {
  it('adds the hard groups from six players', () => {
    expect(tiersFor(3)).toEqual(['kolay', 'orta']);
    expect(tiersFor(5)).toEqual(['kolay', 'orta']);
    expect(tiersFor(6)).toEqual(['kolay', 'orta', 'zor']);
    expect(tiersFor(8)).toEqual(['kolay', 'orta', 'zor']);
  });
});

describe('nextActive', () => {
  const order = ['a', 'b', 'c', 'd'];
  it('goes clockwise and skips who left', () => {
    expect(nextActive(order, [], 'a')).toBe('b');
    expect(nextActive(order, [], 'd')).toBe('a');
    expect(nextActive(order, ['b'], 'a')).toBe('c');
    expect(nextActive(order, ['b', 'c'], 'a')).toBe('d');
  });
  it('places one who left by their old seat', () => {
    expect(nextActive(order, ['b'], 'b')).toBe('c');
    expect(nextActive(order, ['d'], 'd')).toBe('a');
  });
  it('is null when nobody else is left, and for a stranger', () => {
    expect(nextActive(order, ['b', 'c', 'd'], 'a')).toBeNull();
    expect(nextActive(order, [], 'x')).toBeNull();
  });
});

const lit: SprengjaState = {
  gameNo: 1,
  phase: 'lit',
  step: 7,
  round: 2,
  rounds: 5,
  players: 4,
  order: ['a', 'b', 'c', 'd'],
  gone: ['c'],
  starter: 'a',
  holder: 'b',
  passes: 1,
  letters: 'ka',
  used: ['ma', 'ka'],
  hits: { a: 1 },
  lastBlast: { round: 1, holder: 'a', gone: false },
  ready: [],
  endsAt: null,
  poll: pollCadence(false),
};

describe('readSprengjaState', () => {
  it('reads the open state and nothing else', () => {
    const state = readSprengjaState({ ...lit, explodesAt: 'never here' });
    expect(state).toEqual(lit);
    expect(state).not.toHaveProperty('explodesAt');
  });
  it('refuses another game’s state', () => {
    expect(readSprengjaState({ phase: 'night', step: 1 })).toBeNull();
    expect(readSprengjaState(null)).toBeNull();
    expect(readSprengjaState({ phase: 'lit' })).toBeNull();
  });
  it('drops values of the wrong kind', () => {
    const state = readSprengjaState({ ...lit, hits: { a: 1, b: -1, c: 'x' }, holder: 3 });
    expect(state?.hits).toEqual({ a: 1 });
    expect(state?.holder).toBeNull();
  });
});

describe('readSprengjaResult', () => {
  const result = {
    order: ['a', 'b', 'c'],
    gone: [],
    hits: { a: 2, b: 1 },
    round: 5,
    rounds: 5,
    winners: ['c'],
  };
  it('reads a finished game', () => {
    expect(
      readSprengjaResult({ lastGame: { concept: 'sprengja', abandoned: false, sprengja: result } }),
    ).toEqual({ ...result, abandoned: false });
  });
  it('reads an abandoned one: scores, no winners (K-85 O-10)', () => {
    expect(
      readSprengjaResult({
        lastGame: { concept: 'sprengja', abandoned: true, sprengja: { ...result, winners: [] } },
      }),
    ).toEqual({ ...result, winners: [], abandoned: true });
  });
  it('is null for another game', () => {
    expect(readSprengjaResult({ lastGame: { concept: 'vampir', vampir: {} } })).toBeNull();
  });
});

describe('winnersOf (K-85 O-5)', () => {
  it('names every player with the fewest blasts, and nobody who left', () => {
    expect(winnersOf({ order: ['a', 'b', 'c'], gone: [], hits: { a: 2, b: 1 } })).toEqual(['c']);
    expect(winnersOf({ order: ['a', 'b', 'c'], gone: [], hits: { a: 1 } })).toEqual(['b', 'c']);
    expect(winnersOf({ order: ['a', 'b', 'c'], gone: ['c'], hits: { a: 1 } })).toEqual(['b']);
    expect(winnersOf({ order: ['a', 'b'], gone: ['a', 'b'], hits: {} })).toEqual([]);
  });
  it('scores minus one a blast', () => {
    expect(scoreOf({ hits: { a: 3 } }, 'a')).toBe(-3);
    expect(scoreOf({ hits: {} }, 'b')).toBe(-0);
  });
});

describe('activePlayers', () => {
  it('keeps the order without who left', () => {
    expect(activePlayers({ order: ['a', 'b', 'c'], gone: ['b'] })).toEqual(['a', 'c']);
  });
});

describe('pollEveryMs', () => {
  it('without the server job: the holder each second, the next player, the others', () => {
    expect(pollEveryMs(lit, 'b')).toBe(1000);
    // c left: d is next after b.
    expect(pollEveryMs(lit, 'd')).toBe(3000);
    expect(pollEveryMs(lit, 'a')).toBe(10_000);
    expect(pollEveryMs(lit, 'c')).toBe(0);
    expect(pollEveryMs(lit, 'watcher')).toBe(0);
  });
  it('with the job: only the holder, as a fallback', () => {
    const on = { ...lit, poll: pollCadence(true) };
    expect(pollEveryMs(on, 'b')).toBe(2000);
    expect(pollEveryMs(on, 'd')).toBe(0);
    expect(pollEveryMs(on, 'a')).toBe(0);
  });
  it('never while no fuse burns', () => {
    expect(pollEveryMs({ ...lit, phase: 'summary' }, 'b')).toBe(0);
  });
});

describe('replayRound', () => {
  const events: SprengjaEvent[] = [
    { type: 'sp_lit', round: 1, holder: 'a' },
    { type: 'sp_pass', round: 1, step: 3, from: 'a', to: 'b' },
    { type: 'sp_pass', round: 1, step: 4, from: 'b', to: 'c' },
    { type: 'sp_pass', round: 1, step: 5, from: 'c', to: 'a', reason: 'left' },
    { type: 'sp_explode', round: 1, holder: 'a' },
    { type: 'sp_lit', round: 2, holder: 'a' },
  ];
  it('gives the holder, the throws and the blast', () => {
    expect(replayRound(events, 1)).toEqual({ holder: 'a', passes: 2, exploded: 'a', blasts: 1 });
    expect(replayRound(events, 2)).toEqual({ holder: 'a', passes: 0, exploded: null, blasts: 0 });
  });
  it('refuses a history the server could not have written', () => {
    expect(() =>
      replayRound(
        [
          { type: 'sp_lit', round: 1, holder: 'a' },
          { type: 'sp_pass', round: 1, step: 3, from: 'b', to: 'c' },
        ],
        1,
      ),
    ).toThrow();
    expect(() =>
      replayRound(
        [
          { type: 'sp_lit', round: 1, holder: 'a' },
          { type: 'sp_explode', round: 1, holder: 'b' },
        ],
        1,
      ),
    ).toThrow();
  });
  it('agrees with any sequence of throws and leavings', () => {
    // A small model of the server: random throws and leavings, the state kept as the server keeps
    // it; the events it writes must give the same holder and count.
    for (let seed = 1; seed <= 200; seed++) {
      let x = seed;
      const rand = () => {
        x = (x * 1103515245 + 12345) % 2147483648;
        return x / 2147483648;
      };
      const order = ['a', 'b', 'c', 'd', 'e', 'f'];
      const gone: string[] = [];
      let holder = 'a';
      let passes = 0;
      let step = 1;
      const log: SprengjaEvent[] = [{ type: 'sp_lit', round: 1, holder }];
      for (let k = 0; k < 30; k++) {
        if (rand() < 0.15 && activePlayers({ order, gone }).length > 3) {
          const leaving = rand() < 0.5 ? holder : (order[Math.floor(rand() * 6)] as string);
          if (gone.includes(leaving)) continue;
          gone.push(leaving);
          if (leaving === holder) {
            const to = nextActive(order, gone, holder) as string;
            step += 1;
            log.push({ type: 'sp_pass', round: 1, step, from: holder, to, reason: 'left' });
            holder = to;
          }
        } else {
          const to = nextActive(order, gone, holder) as string;
          step += 1;
          log.push({ type: 'sp_pass', round: 1, step, from: holder, to });
          holder = to;
          passes += 1;
        }
      }
      log.push({ type: 'sp_explode', round: 1, holder });
      expect(replayRound(log, 1)).toEqual({ holder, passes, exploded: holder, blasts: 1 });
    }
  });
});

describe('readSprengjaEvent', () => {
  it('reads the three kinds and nothing else', () => {
    expect(readSprengjaEvent('sp_lit', { round: 1, holder: 'a' })).toEqual({
      type: 'sp_lit',
      round: 1,
      holder: 'a',
    });
    expect(readSprengjaEvent('sp_pass', { round: 1, step: 2, from: 'a', to: 'b' })).toEqual({
      type: 'sp_pass',
      round: 1,
      step: 2,
      from: 'a',
      to: 'b',
    });
    expect(
      readSprengjaEvent('sp_pass', { round: 1, step: 2, from: 'a', to: 'b', reason: 'left' }),
    ).toMatchObject({ reason: 'left' });
    expect(readSprengjaEvent('sp_explode', { round: 1, holder: 'a' })).toMatchObject({
      type: 'sp_explode',
    });
    expect(readSprengjaEvent('correct', { round: 1 })).toBeNull();
    expect(readSprengjaEvent('sp_lit', { holder: 'a' })).toBeNull();
  });
});
