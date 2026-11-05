import { readPregame } from '@shared/gameFrame.ts';
import {
  cleanPregame,
  emptyPregame,
  SIGNUM,
  type SignumKind,
  type SignumPicks,
  type SignumPregame,
  type SignumSeat,
  type SignumState,
  type SignumTeam,
} from '@shared/signum.ts';

// What the phone reads of Signum (docs/SPEC_V4.md §4.F "Adım 4.6.7"): the open state in
// rooms.game_state while a game runs, its over state in game_state.lastGame.signum once it ended,
// and the pre-game page's candidates, offers and captains (game_state.pregame.signum). Nothing here
// knows a closed tile's kind: only a captain's own view does (signum/view, rule 3).

const PHASES = ['role', 'clue', 'guess', 'over'] as const;
const TEAMS = ['a', 'b'] as const;
const KINDS = ['a', 'b', 'n', 'x'] as const;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isTeam = (v: unknown): v is SignumTeam => (TEAMS as readonly unknown[]).includes(v);
const isKind = (v: unknown): v is SignumKind => (KINDS as readonly unknown[]).includes(v);

// The open state as the server wrote it, or null when `state` is not a Signum game's.
export function readSignumState(state: unknown): SignumState | null {
  if (!isObject(state)) return null;
  const s = state;
  if (!(PHASES as readonly unknown[]).includes(s.phase)) return null;
  if (typeof s.step !== 'number' || typeof s.gameNo !== 'number') return null;
  if (!isTeam(s.starter) || !isTeam(s.turn)) return null;
  if (!Array.isArray(s.board) || s.board.length !== SIGNUM.tiles) return null;
  if (!Array.isArray(s.seats) || !Array.isArray(s.ready)) return null;
  const board = s.board.map((t: unknown) => {
    const tile = isObject(t) ? t : {};
    return {
      word: typeof tile.word === 'string' ? tile.word : '',
      open: isKind(tile.open) ? tile.open : null,
    };
  });
  const seats: SignumSeat[] = s.seats.flatMap((x: unknown) =>
    isObject(x) &&
    typeof x.sid === 'string' &&
    isTeam(x.team) &&
    (x.role === 'captain' || x.role === 'guesser')
      ? [{ sid: x.sid, team: x.team, role: x.role }]
      : [],
  );
  const clue =
    isObject(s.clue) && typeof s.clue.word === 'string' && typeof s.clue.n === 'number'
      ? { word: s.clue.word, n: s.clue.n }
      : null;
  const key =
    Array.isArray(s.key) && s.key.length === SIGNUM.tiles && s.key.every(isKind)
      ? (s.key as SignumKind[])
      : null;
  return {
    gameNo: s.gameNo,
    phase: s.phase as SignumState['phase'],
    step: s.step,
    endsAt: typeof s.endsAt === 'string' ? s.endsAt : null,
    starter: s.starter,
    turn: s.turn,
    seats,
    ready: s.ready.filter((r: unknown): r is string => typeof r === 'string'),
    board,
    clue,
    guessesLeft: typeof s.guessesLeft === 'number' ? s.guessesLeft : null,
    winner: isTeam(s.winner) ? s.winner : null,
    reason:
      s.reason === 'cards' ||
      s.reason === 'black' ||
      s.reason === 'captain_left' ||
      s.reason === 'team_empty'
        ? s.reason
        : null,
    key,
  };
}

// The last game's over state (game_state.lastGame.signum), when the last game was Signum's and
// ended by itself: a team won, or a captain or a team's last guesser left (A-5). The owner's
// "Oyunu bitir" leaves none, and the table comes back.
export function lastSignum(state: unknown): SignumState | null {
  if (!isObject(state) || !isObject(state.lastGame)) return null;
  const last = state.lastGame;
  if (last.concept !== 'signum') return null;
  const over = readSignumState(last.signum);
  return over && over.phase === 'over' ? over : null;
}

export type SignumMode = 'pregame' | 'play' | 'end' | null;

export function signumMode(room: { concept: string | null; game_state: unknown }): SignumMode {
  if (room.concept === 'signum' && readSignumState(room.game_state)) return 'play';
  if (readPregame(room.game_state)?.concept === 'signum') return 'pregame';
  if (lastSignum(room.game_state)) return 'end';
  return null;
}

// The pre-game page's people as they stand now (pure/signum.ts → cleanPregame, as the server reads
// it before every decision): a candidacy, an offer or a captaincy of someone no longer on that team
// is not shown.
export function readSignumPage(state: unknown): { picks: SignumPicks; page: SignumPregame } {
  const picks: SignumPicks = readPregame(state)?.picks ?? {};
  const raw =
    isObject(state) && isObject(state.pregame) && isObject(state.pregame.signum)
      ? state.pregame.signum
      : null;
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const one = (v: unknown): string | null => (typeof v === 'string' ? v : null);
  const page = raw
    ? {
        candidates: {
          a: list(isObject(raw.candidates) ? raw.candidates.a : null),
          b: list(isObject(raw.candidates) ? raw.candidates.b : null),
        },
        offers: {
          a: one(isObject(raw.offers) ? raw.offers.a : null),
          b: one(isObject(raw.offers) ? raw.offers.b : null),
        },
        captains: {
          a: one(isObject(raw.captains) ? raw.captains.a : null),
          b: one(isObject(raw.captains) ? raw.captains.b : null),
        },
      }
    : emptyPregame();
  return { picks, page: cleanPregame(page, picks) };
}

export function seatOf(state: SignumState, sid: string): SignumSeat | null {
  return state.seats.find((s) => s.sid === sid) ?? null;
}

export function captainOf(state: SignumState, team: SignumTeam): string | null {
  return state.seats.find((s) => s.team === team && s.role === 'captain')?.sid ?? null;
}

export function guessersOf(state: SignumState, team: SignumTeam): string[] {
  return state.seats.filter((s) => s.team === team && s.role === 'guesser').map((s) => s.sid);
}

// A team's tiles: the starter's 9, the other's 8; opened so far; still closed ("Kalan kart").
export function teamTotal(state: SignumState, team: SignumTeam): number {
  return team === state.starter ? SIGNUM.starterTiles : SIGNUM.otherTiles;
}
export function openedOf(state: SignumState, team: SignumTeam): number {
  return state.board.filter((t) => t.open === team).length;
}
export function tilesLeftOf(state: SignumState, team: SignumTeam): number {
  return teamTotal(state, team) - openedOf(state, team);
}

// The captain's legend (`.leg`): how many of each kind are still closed, from the captain's key.
export function closedByKind(
  state: SignumState,
  key: readonly SignumKind[],
): Record<SignumKind, number> {
  const out: Record<SignumKind, number> = { a: 0, b: 0, n: 0, x: 0 };
  key.forEach((kind, i) => {
    if (state.board[i]?.open === null) out[kind] += 1;
  });
  return out;
}

// The team's marks (sid → tile) as tile → who points at it, in a stable order.
export function pointersByTile(marks: Readonly<Record<string, number>>): Map<number, string[]> {
  const out = new Map<number, string[]>();
  for (const sid of Object.keys(marks).sort()) {
    const tile = marks[sid];
    if (tile === undefined) continue;
    out.set(tile, [...(out.get(tile) ?? []), sid]);
  }
  return out;
}

// The time capsule's stage (Kinshi's three): full while the role cards are out, low in the last 10
// seconds, half otherwise.
export const SIGNUM_LOW_SECONDS = 10;
export function timerStage(phase: SignumState['phase'], left: number): 'full' | 'half' | 'low' {
  if (phase === 'role') return 'full';
  return left <= SIGNUM_LOW_SECONDS ? 'low' : 'half';
}

// The tile that opened between two states of the same game, if exactly one did.
export function newlyOpened(
  before: readonly { open: SignumKind | null }[] | null,
  after: readonly { open: SignumKind | null }[],
): number | null {
  if (!before || before.length !== after.length) return null;
  const opened = after.flatMap((t, i) => (t.open !== null && before[i]?.open === null ? [i] : []));
  return opened.length === 1 ? (opened[0] ?? null) : null;
}

// The next mark's seq: one over both this phone's last and the server's (signum/view → mySeq), so a
// press never repeats an older one (pure/signum.ts: an older seq is `outdated`).
export function nextSeq(local: number, server: number): number {
  return Math.max(local, server) + 1;
}

// A press's actionId (a UUID, as the server's zod reads it). It only has to be unique for the
// person's own presses in this game: Math.random is enough, nothing secret rests on it.
export function uuidV4(rng: () => number = Math.random): string {
  const hex: string[] = [];
  for (let i = 0; i < 32; i++) hex.push(Math.floor(rng() * 16).toString(16));
  hex[12] = '4';
  hex[16] = ((parseInt(hex[16] ?? '0', 16) & 0x3) | 0x8).toString(16);
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

// Whether a phase's step ended by its clock (felt once: hapticMoments → timeUp) rather than by a
// press: the step moved on at or after the time it was given.
export function endedByClock(endsAt: string | null, now: number): boolean {
  return endsAt !== null && now >= Date.parse(endsAt);
}
