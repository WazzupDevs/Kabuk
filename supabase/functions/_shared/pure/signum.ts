// Signum (docs: the owner's decisions of 5 Kasım 2026; SPEC_V4 §4.F "Adım 4.6.7" comes with the
// server step): the rules the app and the server share, with no database in them. The server
// keeps two halves of a running game:
//
// - SignumState, the open state (rooms.game_state): words, opened tiles, whose turn, the clue, the
//   clock. Never the kind of a closed tile (publicState keeps it so).
// - SignumSecret, never sent as it is (game_secrets): the key, each guesser's mark and the record
//   of applied actions. viewFor cuts from it only what one role may see.
//
// decideAction is the order the server decides an action in, under the room's lock: role, a
// repeat of an earlier request, a phase whose time ran out, a stale step, whose turn, the action's
// own checks. "Not applied" (stale step, phase ran out, an older mark) is an answer, not an error:
// the phone refreshes and says so, without the failure haptic.

import { containsProfanity, type PreparedTerms } from './profanity.ts';
import { alikeWords, plainText, startsEither } from './trText.ts';

export const SIGNUM = {
  tiles: 25,
  starterTiles: 9,
  otherTiles: 8,
  neutralTiles: 7,
  blackTiles: 1,
  roleSeconds: 30,
  clueSeconds: 90,
  guessSeconds: 60,
  minClueNumber: 1,
  maxClueNumber: 4,
  minClueLength: 2,
  maxClueLength: 24,
  minWordLength: 3,
  // Fewer active words than this and a game does not start (content_unavailable).
  minPool: 200,
  // A tile's word must fit this many px at 12 px, 800 (320 dp, with a 2 px margin); the word list
  // is measured against it, the server does not measure.
  tileTextPx: 37,
  minPlayers: 4,
  maxPlayers: 12,
  minTeamSize: 2,
} as const;

export type SignumTeam = 'a' | 'b';
// A tile's kind: a team's, neutral, or the black card.
export type SignumKind = SignumTeam | 'n' | 'x';
export type SignumRole = 'captain' | 'guesser';
export type SignumPhase = 'role' | 'clue' | 'guess' | 'over';
export type SignumEndReason = 'cards' | 'black' | 'captain_left' | 'team_empty';

export const otherTeam = (team: SignumTeam): SignumTeam => (team === 'a' ? 'b' : 'a');

export type SignumSeat = { sid: string; team: SignumTeam; role: SignumRole };

export type SignumTile = { word: string; open: SignumKind | null };

// The open state. Who is captain is open (roles of this kind live in game_state, §4.F).
export type SignumState = {
  gameNo: number;
  phase: SignumPhase;
  step: number;
  endsAt: string | null;
  starter: SignumTeam;
  turn: SignumTeam;
  seats: SignumSeat[];
  ready: string[];
  board: SignumTile[];
  clue: { word: string; n: number } | null;
  guessesLeft: number | null;
  winner: SignumTeam | null;
  reason: SignumEndReason | null;
  // The whole key, only once the game is over.
  key: SignumKind[] | null;
};

// A guesser's mark. `tile` goes when the tile opens or the turn ends; `seq` and `sent` stay for the
// whole game, so an old mark can never come back over a newer one.
export type SignumMark = { tile: number | null; seq: number; sent: number | null };

export type SignumActionName = 'clue' | 'reveal' | 'end-turn';

export type SignumActionRecord = {
  by: string;
  action: SignumActionName;
  params: string;
  result: SignumResult;
};

export type SignumSecret = {
  key: SignumKind[];
  marks: Record<SignumTeam, Record<string, SignumMark>>;
  // Every applied clue, reveal and end-turn of the game, by actionKey(sid, actionId): kept to the
  // end. Keyed by the person too, so one person's ids say nothing of anyone else's.
  actions: Record<string, SignumActionRecord>;
  // Each team's Realtime channel id (game_team:{id}): only that team's view carries it; it changes
  // whenever someone of the team leaves the game, so an open subscription of theirs hears nothing
  // more (B-3).
  channels: Record<SignumTeam, string>;
  // The write version the server compares under the lock (signum_commit); the server sets it.
  rev?: number;
};

export type SignumOutcome = 'own' | 'neutral' | 'opponent' | 'black';

export type SignumResult =
  | { action: 'clue'; word: string; n: number }
  | { action: 'reveal'; tile: number; kind: SignumKind; outcome: SignumOutcome }
  | { action: 'end-turn' }
  | { action: 'point'; tile: number | null; seq: number }
  | { action: 'ready' }
  | { action: 'advance' };

export type SignumErrorCode =
  | 'bad_request'
  | 'not_player'
  | 'not_captain'
  | 'not_guesser'
  | 'not_your_turn'
  | 'bad_clue'
  | 'clue_on_board'
  | 'tile_open'
  | 'not_pointed'
  | 'action_id_conflict'
  | 'seq_conflict';

// `busy`: the server's three tries all met a change made at the same moment (B-2); the phone
// refreshes like after a stale step.
export type SignumNotApplied = 'stale_step' | 'phase_expired' | 'outdated' | 'busy';

export type SignumRequest =
  | { action: 'ready'; step: number }
  | { action: 'advance'; step: number }
  | { action: 'clue'; step: number; word: string; n: number; actionId: string }
  | { action: 'point'; step: number; tile: number | null; seq: number }
  | { action: 'reveal'; step: number; tile: number; actionId: string }
  | { action: 'end-turn'; step: number; actionId: string };

// The actions phones may send twice after a 5xx (apiRetry.ts → IDEMPOTENT_CALLS, with the server
// step): the second time changes nothing.
export const SIGNUM_IDEMPOTENT_ACTIONS = [
  'ready',
  'advance',
  'clue',
  'point',
  'reveal',
  'end-turn',
] as const satisfies readonly SignumRequest['action'][];

// Who asks: the seat the server read for the caller, or null for someone at the table who does
// not play (an observer).
export type SignumActor = { sid: string; seat: SignumSeat | null };

// The halves in a decision are what the server writes back under the lock. Never an answer as they
// are: `secret` holds the key, every mark and every action. A phone's answer is built only from
// `result`, publicState(state) and that phone's viewFor.
export type SignumDecision =
  // Applied: the new halves to write, the answer, and the team whose channel hears that its marks
  // changed (data-free).
  | {
      kind: 'applied';
      state: SignumState;
      secret: SignumSecret;
      result: SignumResult;
      notifyTeam: SignumTeam | null;
    }
  // The same request again: its first answer; nothing to write.
  | { kind: 'replayed'; result: SignumResult }
  // Not applied. The halves may still be new: a phase whose time ran out moves on in the same go.
  | {
      kind: 'not_applied';
      reason: SignumNotApplied;
      state: SignumState;
      secret: SignumSecret;
      changed: boolean;
    }
  // Nothing to do (a ready sent twice, an advance too early or for a past step).
  | { kind: 'noop' }
  | { kind: 'error'; code: SignumErrorCode };

// --- Words and the board -------------------------------------------------------------------------

const LETTERS = /^\p{L}+$/u;

// A word that can sit on a tile: letters only, one word, long enough.
export function isBoardWord(word: string): boolean {
  const w = plainText(word).trim();
  return LETTERS.test(w) && [...w].length >= SIGNUM.minWordLength;
}

// Two words too alike for one board: the same first four letters, or one inside the other
// (trText.ts → alikeWords; rule 7).
export const tooAlike = alikeWords;

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

// 25 words no two of which are too alike, from `pool` in a random order; null if the pool cannot
// give them (the count alone does not say: A-15).
export function pickWords(pool: readonly string[], rng: () => number): string[] | null {
  const picked: string[] = [];
  for (const word of shuffled(pool, rng)) {
    if (!isBoardWord(word)) continue;
    if (picked.some((p) => tooAlike(p, word))) continue;
    picked.push(plainText(word).trim());
    if (picked.length === SIGNUM.tiles) return picked;
  }
  return null;
}

export function dealKey(starter: SignumTeam, rng: () => number): SignumKind[] {
  const kinds: SignumKind[] = [
    ...Array.from({ length: SIGNUM.starterTiles }, () => starter),
    ...Array.from({ length: SIGNUM.otherTiles }, () => otherTeam(starter)),
    ...Array.from({ length: SIGNUM.neutralTiles }, (): SignumKind => 'n'),
    ...Array.from({ length: SIGNUM.blackTiles }, (): SignumKind => 'x'),
  ];
  return shuffled(kinds, rng);
}

// --- Starting -------------------------------------------------------------------------------------

export type SignumStartError =
  | 'bad_request'
  | 'content_unavailable'
  | 'not_enough_players'
  | 'too_many_players'
  | 'captain_missing';

// The game's first halves from the frozen seats and the active word pool. The key's secrecy rests
// on `rng`: the server passes a cryptographic one (crypto.getRandomValues), never Math.random;
// tests pass a seeded one.
export function startGame(
  input: {
    gameNo: number;
    seats: SignumSeat[];
    pool: readonly string[];
    now: Date;
    channels: Record<SignumTeam, string>;
  },
  rng: () => number,
): { state: SignumState; secret: SignumSecret } | { error: SignumStartError } {
  const { seats } = input;
  const sids = new Set(seats.map((s) => s.sid));
  const valid = seats.every(
    (s) =>
      s.sid !== '' &&
      (s.team === 'a' || s.team === 'b') &&
      (s.role === 'captain' || s.role === 'guesser'),
  );
  if (sids.size !== seats.length || !valid) return { error: 'bad_request' };
  if (seats.length < SIGNUM.minPlayers) return { error: 'not_enough_players' };
  if (seats.length > SIGNUM.maxPlayers) return { error: 'too_many_players' };
  for (const team of ['a', 'b'] as const) {
    const mine = seats.filter((s) => s.team === team);
    if (mine.length < SIGNUM.minTeamSize) return { error: 'not_enough_players' };
    if (mine.filter((s) => s.role === 'captain').length !== 1) return { error: 'captain_missing' };
  }
  if (input.pool.length < SIGNUM.minPool) return { error: 'content_unavailable' };
  const words = pickWords(input.pool, rng);
  if (!words) return { error: 'content_unavailable' };
  const starter: SignumTeam = rng() < 0.5 ? 'a' : 'b';
  const key = dealKey(starter, rng);
  const marks: SignumSecret['marks'] = { a: {}, b: {} };
  return {
    state: {
      gameNo: input.gameNo,
      phase: 'role',
      step: 1,
      endsAt: at(input.now, SIGNUM.roleSeconds),
      starter,
      turn: starter,
      seats: seats.map((s) => ({ ...s })),
      ready: [],
      board: words.map((word) => ({ word, open: null })),
      clue: null,
      guessesLeft: null,
      winner: null,
      reason: null,
      key: null,
    },
    secret: { key, marks, actions: {}, channels: { ...input.channels } },
  };
}

function at(now: Date, seconds: number): string {
  return new Date(now.getTime() + seconds * 1000).toISOString();
}

// --- Clues ----------------------------------------------------------------------------------------

// A clue: one word of letters, not profane, not a board word (equal, or one the start of the
// other, in the folded form: A-4), and a number from 1 to 4.
export function validateClue(
  word: string,
  n: number,
  boardWords: readonly string[],
  terms: PreparedTerms,
): 'ok' | 'bad_request' | 'bad_clue' | 'clue_on_board' {
  if (!Number.isInteger(n) || n < SIGNUM.minClueNumber || n > SIGNUM.maxClueNumber) {
    return 'bad_request';
  }
  const w = plainText(word).trim();
  const length = [...w].length;
  if (!LETTERS.test(w) || length < SIGNUM.minClueLength || length > SIGNUM.maxClueLength) {
    return 'bad_clue';
  }
  if (containsProfanity(w, terms)) return 'bad_clue';
  // trText.ts → startsEither (rule 7): "Sınavlar" for "Sınav", "kar" for "Kâr".
  return boardWords.some((b) => startsEither(w, b)) ? 'clue_on_board' : 'ok';
}

// --- Phases ---------------------------------------------------------------------------------------

export function tilesLeft(
  state: SignumState,
  key: readonly SignumKind[],
  team: SignumTeam,
): number {
  return key.filter((kind, i) => kind === team && state.board[i]?.open === null).length;
}

function players(state: SignumState): SignumSeat[] {
  return state.seats;
}

function clearMarks(secret: SignumSecret, only?: number): SignumSecret {
  const marks: SignumSecret['marks'] = { a: {}, b: {} };
  for (const team of ['a', 'b'] as const) {
    for (const [sid, mark] of Object.entries(secret.marks[team])) {
      marks[team][sid] = only === undefined || mark.tile === only ? { ...mark, tile: null } : mark;
    }
  }
  return { ...secret, marks };
}

// The turn passes to the other team's clue (an end-turn, a wrong tile, a clock that ran out).
function passTurn(state: SignumState, secret: SignumSecret, now: Date) {
  return {
    state: {
      ...state,
      phase: 'clue' as const,
      step: state.step + 1,
      endsAt: at(now, SIGNUM.clueSeconds),
      turn: otherTeam(state.turn),
      clue: null,
      guessesLeft: null,
    },
    secret: clearMarks(secret),
  };
}

function finish(
  state: SignumState,
  secret: SignumSecret,
  winner: SignumTeam | null,
  reason: SignumEndReason,
) {
  return {
    state: {
      ...state,
      phase: 'over' as const,
      step: state.step + 1,
      endsAt: null,
      clue: null,
      guessesLeft: null,
      winner,
      reason,
      // A-7: the key opens to the table once the game is over.
      key: [...secret.key],
    },
    secret: clearMarks(secret),
  };
}

export function expired(state: SignumState, now: Date): boolean {
  return state.endsAt !== null && now.getTime() >= Date.parse(state.endsAt);
}

// What a phase whose time ran out turns into: the role cards into the starter's clue; a clue
// nobody gave into the other team's clue; a guess into the other team's clue.
export function timeUp(state: SignumState, secret: SignumSecret, now: Date) {
  if (state.phase === 'role') return beginClues(state, secret, now);
  if (state.phase === 'clue' || state.phase === 'guess') return passTurn(state, secret, now);
  return { state, secret };
}

function beginClues(state: SignumState, secret: SignumSecret, now: Date) {
  return {
    state: {
      ...state,
      phase: 'clue' as const,
      step: state.step + 1,
      endsAt: at(now, SIGNUM.clueSeconds),
      turn: state.starter,
      ready: [],
    },
    secret,
  };
}

// --- Actions --------------------------------------------------------------------------------------

// JSON, so no sid and actionId can make another pair's key.
export const actionKey = (sid: string, actionId: string): string => JSON.stringify([sid, actionId]);

function paramsOf(request: SignumRequest): string {
  switch (request.action) {
    case 'clue':
      return JSON.stringify([request.step, plainText(request.word).trim(), request.n]);
    case 'reveal':
      return JSON.stringify([request.step, request.tile]);
    case 'end-turn':
      return JSON.stringify([request.step]);
    default:
      return '';
  }
}

const isTile = (tile: number) => Number.isInteger(tile) && tile >= 0 && tile < SIGNUM.tiles;

export function decideAction(
  state: SignumState,
  secret: SignumSecret,
  actor: SignumActor,
  request: SignumRequest,
  now: Date,
  terms: PreparedTerms,
): SignumDecision {
  // An advance is anyone's at the table, and it only ever moves a clock that ran out.
  if (request.action === 'advance') {
    if (state.phase === 'over' || request.step !== state.step || !expired(state, now)) {
      return { kind: 'noop' };
    }
    const next = timeUp(state, secret, now);
    return { kind: 'applied', ...next, result: { action: 'advance' }, notifyTeam: null };
  }

  const seat = actor.seat;
  if (!seat) return { kind: 'error', code: 'not_player' };
  if (request.action === 'clue' && seat.role !== 'captain') {
    return { kind: 'error', code: 'not_captain' };
  }
  if (
    (request.action === 'point' || request.action === 'reveal' || request.action === 'end-turn') &&
    seat.role !== 'guesser'
  ) {
    return { kind: 'error', code: 'not_guesser' };
  }

  // A repeat of an earlier request is answered first, whatever happened since.
  if (request.action === 'clue' || request.action === 'reveal' || request.action === 'end-turn') {
    const done = secret.actions[actionKey(actor.sid, request.actionId)];
    if (done) {
      const same = done.action === request.action && done.params === paramsOf(request);
      return same
        ? { kind: 'replayed', result: done.result }
        : { kind: 'error', code: 'action_id_conflict' };
    }
  }
  if (request.action === 'point') {
    if (request.tile !== null && !isTile(request.tile))
      return { kind: 'error', code: 'bad_request' };
    if (!Number.isSafeInteger(request.seq) || request.seq < 1) {
      return { kind: 'error', code: 'bad_request' };
    }
    const mark = secret.marks[seat.team][actor.sid];
    // The same seq again is the same press: its first answer (`sent`), even if that tile has
    // opened since; the phone takes the marks from its view.
    if (mark && request.seq === mark.seq) {
      return mark.sent === request.tile
        ? { kind: 'replayed', result: { action: 'point', tile: request.tile, seq: request.seq } }
        : { kind: 'error', code: 'seq_conflict' };
    }
    if (mark && request.seq < mark.seq) {
      return { kind: 'not_applied', reason: 'outdated', state, secret, changed: false };
    }
  }

  if (state.phase === 'over') {
    return request.action === 'ready'
      ? { kind: 'noop' }
      : { kind: 'not_applied', reason: 'stale_step', state, secret, changed: false };
  }
  if (expired(state, now)) {
    const next = timeUp(state, secret, now);
    return { kind: 'not_applied', reason: 'phase_expired', ...next, changed: true };
  }
  if (request.step !== state.step) {
    return request.action === 'ready'
      ? { kind: 'noop' }
      : { kind: 'not_applied', reason: 'stale_step', state, secret, changed: false };
  }

  switch (request.action) {
    case 'ready':
      return ready(state, secret, actor.sid, now);
    case 'clue':
      return clue(state, secret, actor.sid, seat, request, now, terms);
    case 'point':
      return point(state, secret, actor.sid, seat, request);
    case 'reveal':
      return reveal(state, secret, actor.sid, seat, request, now);
    case 'end-turn':
      return endTurn(state, secret, actor.sid, seat, request, now);
  }
}

function ready(state: SignumState, secret: SignumSecret, sid: string, now: Date): SignumDecision {
  if (state.phase !== 'role' || state.ready.includes(sid)) return { kind: 'noop' };
  const next = { ...state, ready: [...state.ready, sid] };
  const all = players(next).every((s) => next.ready.includes(s.sid));
  const done = all ? beginClues(next, secret, now) : { state: next, secret };
  return { kind: 'applied', ...done, result: { action: 'ready' }, notifyTeam: null };
}

function record(
  secret: SignumSecret,
  actionId: string,
  sid: string,
  request: SignumRequest & { action: SignumActionName },
  result: SignumResult,
): SignumSecret {
  return {
    ...secret,
    actions: {
      ...secret.actions,
      [actionKey(sid, actionId)]: {
        by: sid,
        action: request.action,
        params: paramsOf(request),
        result,
      },
    },
  };
}

function clue(
  state: SignumState,
  secret: SignumSecret,
  sid: string,
  seat: SignumSeat,
  request: Extract<SignumRequest, { action: 'clue' }>,
  now: Date,
  terms: PreparedTerms,
): SignumDecision {
  if (state.phase !== 'clue' || state.turn !== seat.team) {
    return { kind: 'error', code: 'not_your_turn' };
  }
  const check = validateClue(
    request.word,
    request.n,
    state.board.map((t) => t.word),
    terms,
  );
  if (check !== 'ok') return { kind: 'error', code: check };
  const word = plainText(request.word).trim();
  const result: SignumResult = { action: 'clue', word, n: request.n };
  return {
    kind: 'applied',
    state: {
      ...state,
      phase: 'guess',
      step: state.step + 1,
      endsAt: at(now, SIGNUM.guessSeconds),
      clue: { word, n: request.n },
      guessesLeft: request.n + 1,
    },
    secret: record(secret, request.actionId, sid, request, result),
    result,
    notifyTeam: null,
  };
}

function point(
  state: SignumState,
  secret: SignumSecret,
  sid: string,
  seat: SignumSeat,
  request: Extract<SignumRequest, { action: 'point' }>,
): SignumDecision {
  if (state.phase !== 'guess' || state.turn !== seat.team) {
    return { kind: 'error', code: 'not_your_turn' };
  }
  if (request.tile !== null && state.board[request.tile]?.open !== null) {
    return { kind: 'error', code: 'tile_open' };
  }
  const marks = {
    ...secret.marks,
    [seat.team]: {
      ...secret.marks[seat.team],
      [sid]: { tile: request.tile, seq: request.seq, sent: request.tile },
    },
  };
  return {
    kind: 'applied',
    // The open state does not change: a mark is not news to the other team.
    state,
    secret: { ...secret, marks },
    result: { action: 'point', tile: request.tile, seq: request.seq },
    notifyTeam: seat.team,
  };
}

function reveal(
  state: SignumState,
  secret: SignumSecret,
  sid: string,
  seat: SignumSeat,
  request: Extract<SignumRequest, { action: 'reveal' }>,
  now: Date,
): SignumDecision {
  if (state.phase !== 'guess' || state.turn !== seat.team) {
    return { kind: 'error', code: 'not_your_turn' };
  }
  if (!isTile(request.tile)) return { kind: 'error', code: 'bad_request' };
  if (state.board[request.tile]?.open !== null) return { kind: 'error', code: 'tile_open' };
  // The second tap is checked here too: only a guesser whose mark is on the tile opens it.
  if (secret.marks[seat.team][sid]?.tile !== request.tile) {
    return { kind: 'error', code: 'not_pointed' };
  }
  const kind = secret.key[request.tile] as SignumKind;
  const outcome: SignumOutcome =
    kind === 'x' ? 'black' : kind === 'n' ? 'neutral' : kind === seat.team ? 'own' : 'opponent';
  const result: SignumResult = { action: 'reveal', tile: request.tile, kind, outcome };
  const opened: SignumState = {
    ...state,
    board: state.board.map((t, i) => (i === request.tile ? { ...t, open: kind } : t)),
  };
  const kept = record(clearMarks(secret, request.tile), request.actionId, sid, request, result);

  let next: { state: SignumState; secret: SignumSecret };
  if (kind === 'x') {
    next = finish(opened, kept, otherTeam(seat.team), 'black');
  } else if ((kind === 'a' || kind === 'b') && tilesLeft(opened, kept.key, kind) === 0) {
    // A team whose last tile opens wins, whoever opened it.
    next = finish(opened, kept, kind, 'cards');
  } else if (kind === seat.team && (state.guessesLeft ?? 0) > 1) {
    next = {
      state: { ...opened, step: state.step + 1, guessesLeft: (state.guessesLeft ?? 0) - 1 },
      secret: kept,
    };
  } else {
    next = passTurn(opened, kept, now);
  }
  return { kind: 'applied', ...next, result, notifyTeam: seat.team };
}

function endTurn(
  state: SignumState,
  secret: SignumSecret,
  sid: string,
  seat: SignumSeat,
  request: Extract<SignumRequest, { action: 'end-turn' }>,
  now: Date,
): SignumDecision {
  if (state.phase !== 'guess' || state.turn !== seat.team) {
    return { kind: 'error', code: 'not_your_turn' };
  }
  const result: SignumResult = { action: 'end-turn' };
  const next = passTurn(state, record(secret, request.actionId, sid, request, result), now);
  return { kind: 'applied', ...next, result, notifyTeam: seat.team };
}

// --- Leaving --------------------------------------------------------------------------------------

// How the person left: "Oyundan çık" (the game only) or the table (any of the frame's roads). Why
// is not known here, and nothing depends on it (A-5: no penalty).
export type SignumLeaveVia = 'game' | 'table';

export type SignumLeaveEvent = {
  type: 'captain_left' | 'team_empty';
  team: SignumTeam;
  via: SignumLeaveVia;
};

// Someone leaves the game for good (any of the frame's ways). A captain's leaving, or a team left
// without a guesser, ends the game with no result (A-5); the event is the record of it. Their
// team's channel gets `newChannel`: an open subscription of theirs hears nothing more (B-3). The
// server's trigger (private.signum_on_players_left) does the same; signum.test checks the two agree.
export function leaveGame(
  state: SignumState,
  secret: SignumSecret,
  sid: string,
  via: SignumLeaveVia,
  now: Date,
  newChannel: string,
): { state: SignumState; secret: SignumSecret; event: SignumLeaveEvent | null } {
  const seat = state.seats.find((s) => s.sid === sid);
  if (!seat || state.phase === 'over') return { state, secret, event: null };
  const seats = state.seats.filter((s) => s.sid !== sid);
  const marks = {
    ...secret.marks,
    [seat.team]: Object.fromEntries(
      Object.entries(secret.marks[seat.team]).map(([k, m]) => [
        k,
        k === sid ? { ...m, tile: null } : m,
      ]),
    ),
  };
  const left: SignumState = { ...state, seats, ready: state.ready.filter((r) => r !== sid) };
  const kept: SignumSecret = {
    ...secret,
    marks,
    channels: { ...secret.channels, [seat.team]: newChannel },
  };
  if (seat.role === 'captain') {
    return {
      ...finish(left, kept, null, 'captain_left'),
      event: { type: 'captain_left', team: seat.team, via },
    };
  }
  if (!seats.some((s) => s.team === seat.team && s.role === 'guesser')) {
    return {
      ...finish(left, kept, null, 'team_empty'),
      event: { type: 'team_empty', team: seat.team, via },
    };
  }
  if (left.phase === 'role' && left.seats.every((s) => left.ready.includes(s.sid))) {
    return { ...beginClues(left, kept, now), event: null };
  }
  return { state: left, secret: kept, event: null };
}

// --- What leaves the server -----------------------------------------------------------------------

// The open state, field by field: nothing here comes from the secret but the opened tiles and, once
// the game is over, the key. A closed tile carries only its word.
export function publicState(state: SignumState): SignumState {
  const over = state.phase === 'over';
  return {
    gameNo: state.gameNo,
    phase: state.phase,
    step: state.step,
    endsAt: state.endsAt,
    starter: state.starter,
    turn: state.turn,
    seats: state.seats.map((s) => ({ sid: s.sid, team: s.team, role: s.role })),
    ready: [...state.ready],
    board: state.board.map((t) => ({ word: t.word, open: t.open })),
    clue: state.clue ? { word: state.clue.word, n: state.clue.n } : null,
    guessesLeft: state.guessesLeft,
    winner: state.winner,
    reason: state.reason,
    key: over && state.key ? [...state.key] : null,
  };
}

export type SignumView =
  | {
      role: 'captain';
      team: SignumTeam;
      channel: string;
      key: SignumKind[];
      marks: Record<string, number>;
    }
  | {
      role: 'guesser';
      team: SignumTeam;
      channel: string;
      marks: Record<string, number>;
      mySeq: number;
    }
  | { role: 'observer' };

// A team's marks as the team sees them: whose mark is on which tile, never the seq.
function teamMarks(secret: SignumSecret, team: SignumTeam): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [sid, mark] of Object.entries(secret.marks[team])) {
    if (mark.tile !== null) out[sid] = mark.tile;
  }
  return out;
}

// What signum/view answers: built from the caller's seat, never from what the caller asked for.
// Only a captain's answer has a `key` field at all (A-3: a captain sees their own team's marks).
export function viewFor(actor: SignumActor, secret: SignumSecret): SignumView {
  const seat = actor.seat;
  if (!seat) return { role: 'observer' };
  if (seat.role === 'captain') {
    return {
      role: 'captain',
      team: seat.team,
      channel: secret.channels[seat.team],
      key: [...secret.key],
      marks: teamMarks(secret, seat.team),
    };
  }
  return {
    role: 'guesser',
    team: seat.team,
    channel: secret.channels[seat.team],
    marks: teamMarks(secret, seat.team),
    mySeq: secret.marks[seat.team][actor.sid]?.seq ?? 0,
  };
}

// --- Choosing captains (the pre-game page) --------------------------------------------------------

// rooms.game_state.pregame.signum. Open to the table (A-14): an offer, and that it went, are seen;
// why it went is never said. Accepting an offer makes a candidate; only the owner makes a captain.
export type SignumPregame = {
  candidates: Record<SignumTeam, string[]>;
  offers: Record<SignumTeam, string | null>;
  captains: Record<SignumTeam, string | null>;
};

export type SignumPregameError =
  'not_owner' | 'not_in_team' | 'no_offer' | 'not_candidate' | 'no_candidate';

export const emptyPregame = (): SignumPregame => ({
  candidates: { a: [], b: [] },
  offers: { a: null, b: null },
  captains: { a: null, b: null },
});

// Each person's pick on the page (rooms.game_state.pregame.picks).
export type SignumPicks = Record<string, 'a' | 'b' | 'obs'>;

const teamOf = (picks: SignumPicks, sid: string): SignumTeam | null => {
  const pick = picks[sid];
  return pick === 'a' || pick === 'b' ? pick : null;
};

export function volunteer(
  p: SignumPregame,
  picks: SignumPicks,
  sid: string,
  on: boolean,
): SignumPregame | { error: SignumPregameError } {
  const team = teamOf(picks, sid);
  if (!team) return { error: 'not_in_team' };
  const rest = p.candidates[team].filter((c) => c !== sid);
  return {
    ...p,
    candidates: { ...p.candidates, [team]: on ? [...rest, sid] : rest },
    captains: { ...p.captains, [team]: !on && p.captains[team] === sid ? null : p.captains[team] },
  };
}

export function offerCaptain(
  p: SignumPregame,
  picks: SignumPicks,
  isOwner: boolean,
  sid: string,
): SignumPregame | { error: SignumPregameError } {
  if (!isOwner) return { error: 'not_owner' };
  const team = teamOf(picks, sid);
  if (!team) return { error: 'not_in_team' };
  return { ...p, offers: { ...p.offers, [team]: sid } };
}

// "Rastgele seç": an offer to someone of the team chosen at random; they may still say no.
export function randomOffer(
  p: SignumPregame,
  picks: SignumPicks,
  isOwner: boolean,
  team: SignumTeam,
  rng: () => number,
): SignumPregame | { error: SignumPregameError } {
  if (!isOwner) return { error: 'not_owner' };
  const members = Object.keys(picks)
    .filter((sid) => picks[sid] === team)
    .sort();
  if (members.length === 0) return { error: 'no_candidate' };
  const sid = members[Math.floor(rng() * members.length)] as string;
  return { ...p, offers: { ...p.offers, [team]: sid } };
}

export function answerOffer(
  p: SignumPregame,
  picks: SignumPicks,
  sid: string,
  accept: boolean,
): SignumPregame | { error: SignumPregameError } {
  const team = teamOf(picks, sid);
  if (!team || p.offers[team] !== sid) return { error: 'no_offer' };
  const offers = { ...p.offers, [team]: null };
  if (!accept) return { ...p, offers };
  const rest = p.candidates[team].filter((c) => c !== sid);
  return { ...p, offers, candidates: { ...p.candidates, [team]: [...rest, sid] } };
}

export function approveCaptain(
  p: SignumPregame,
  picks: SignumPicks,
  isOwner: boolean,
  team: SignumTeam,
  sid: string,
): SignumPregame | { error: SignumPregameError } {
  if (!isOwner) return { error: 'not_owner' };
  if (teamOf(picks, sid) !== team || !p.candidates[team].includes(sid)) {
    return { error: 'not_candidate' };
  }
  return { ...p, captains: { ...p.captains, [team]: sid } };
}

// Someone changed team, became an observer or left the table: their candidacy, offer and
// captaincy go wherever they were.
export function dropFromPregame(p: SignumPregame, sid: string): SignumPregame {
  const drop = (list: string[]) => list.filter((c) => c !== sid);
  const clear = (v: string | null) => (v === sid ? null : v);
  return {
    candidates: { a: drop(p.candidates.a), b: drop(p.candidates.b) },
    offers: { a: clear(p.offers.a), b: clear(p.offers.b) },
    captains: { a: clear(p.captains.a), b: clear(p.captains.b) },
  };
}

// The frozen seats at start: each team's approved captain, everyone else on a team a guesser;
// null while a team has no captain (captain_missing) or the captain is no longer on it.
export function seatsAtStart(p: SignumPregame, picks: SignumPicks): SignumSeat[] | null {
  const seats: SignumSeat[] = [];
  for (const team of ['a', 'b'] as const) {
    const captain = p.captains[team];
    if (!captain || teamOf(picks, captain) !== team) return null;
  }
  for (const sid of Object.keys(picks).sort()) {
    const team = teamOf(picks, sid);
    if (!team) continue;
    seats.push({ sid, team, role: p.captains[team] === sid ? 'captain' : 'guesser' });
  }
  return seats;
}

// "Yeniden oyna": the last captains come back as candidates; the owner approves again.
export function pregameAgain(lastCaptains: Record<SignumTeam, string | null>): SignumPregame {
  const p = emptyPregame();
  for (const team of ['a', 'b'] as const) {
    const sid = lastCaptains[team];
    if (sid) p.candidates[team].push(sid);
  }
  return p;
}

// The people of the pre-game page as they stand now: a candidacy, an offer or a captaincy goes
// with a person no longer on that team (who moved, chose to watch or left the table). The server
// reads the page through this before every decision, so a stale entry never makes a captain.
export function cleanPregame(p: SignumPregame, picks: SignumPicks): SignumPregame {
  const on = (team: SignumTeam) => (sid: string | null) => sid !== null && picks[sid] === team;
  const keep = (team: SignumTeam, sid: string | null) => (on(team)(sid) ? sid : null);
  return {
    candidates: { a: p.candidates.a.filter(on('a')), b: p.candidates.b.filter(on('b')) },
    offers: { a: keep('a', p.offers.a), b: keep('b', p.offers.b) },
    captains: { a: keep('a', p.captains.a), b: keep('b', p.captains.b) },
  };
}

// --- The answer a phone gets ----------------------------------------------------------------------

export type SignumAnswer =
  | { applied: true; replayed?: true; result: SignumResult; room: SignumState; view: SignumView }
  | {
      applied: false;
      reason: SignumNotApplied | 'unchanged';
      room: SignumState;
      view: SignumView;
    };

// The only way a decision becomes an answer: the result, the open state and the caller's own view.
// Never the decision's halves (the secret holds the key, every mark and every action).
export function respond(
  decision: Exclude<SignumDecision, { kind: 'error' }> | { kind: 'busy' },
  state: SignumState,
  view: SignumView,
): SignumAnswer {
  const room = publicState(state);
  switch (decision.kind) {
    case 'applied':
      return { applied: true, result: decision.result, room, view };
    case 'replayed':
      return { applied: true, replayed: true, result: decision.result, room, view };
    case 'not_applied':
      return { applied: false, reason: decision.reason, room, view };
    case 'noop':
      return { applied: false, reason: 'unchanged', room, view };
    case 'busy':
      return { applied: false, reason: 'busy', room, view };
  }
}
