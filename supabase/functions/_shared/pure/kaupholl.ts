// Kaupholl (docs/decisions/kaupholl.md, v3.1; SPEC_V4 §4.F "Adım 4.6.10" comes with the server
// step): the rules the app and the server share, with no database in them. "Cevabı geçmeyen en büyük
// tahmin kazanır." The server keeps two halves of a running game:
//
// - KauphollState, the open state (rooms.game_state): the phase and its clock, the card once it is
//   opened, each player's guess chip (none / written / locked, never the number), the board once
//   it is built, the coins (they are not secret, §1), the answer once it is open, the scores.
// - KauphollSecret, never sent as it is (game_secrets): the game's five questions with their
//   answers, and every player's guess with its seq. viewFor cuts from it only the caller's own.
//
// decideAction is the order the server decides an action in, under the room's lock (§2): a repeat of
// the last applied request, a closed phase (`phase_over`), a locked scope (`locked`), the seq rules.
// "Not applied" is an answer, not an error: the phone takes the server's state and shows it, without
// the failure haptic. Only `seq_conflict` and `bad_request` are errors.

export const KAUPHOLL = {
  minPlayers: 3,
  maxPlayers: 6,
  // Below this many players still in the game, it is abandoned (no winner, no game_results).
  abandonBelow: 2,
  questions: 5,
  coins: 2,
  // Who wrote the winning guess, for each of its authors still in the game.
  winnerBonus: 3,
  cardSeconds: 10,
  guessSeconds: 45,
  betSeconds: 20,
  // The answer and the end of a question: everyone ready, or at most this long.
  pauseSeconds: 10,
  seqMax: 10_000,
  // A guess: at most 6 whole digits and 1 decimal.
  maxDigits: 6,
  maxValue: 999_999.9,
  // Under this many unused questions the owner sees the few-questions warning (`pool`).
  lowPool: 10,
} as const;

// The odds of the board by its number of distinct guesses (k), "Hepsinden küçük" first, then the
// guesses from the smallest (C3, pilot; §3). k = 1 and 2 happen when guesses merge or few write.
export const C3_ODDS: Readonly<Record<number, readonly number[]>> = {
  1: [6, 6],
  2: [6, 2, 6],
  3: [6, 2, 2, 6],
  4: [6, 3, 2, 3, 6],
  5: [6, 4, 2, 2, 4, 6],
  6: [6, 5, 3, 2, 3, 5, 6],
};

export function oddsFor(k: number): readonly number[] {
  const odds = C3_ODDS[k];
  if (!odds) throw new Error(`no odds for ${k} guesses`);
  return odds;
}

// --- Turkish numbers --------------------------------------------------------------------------------

// Numbers compare in tenths, never as floats.
export const tenths = (v: number): number => Math.round(v * 10);

export function isGuessValue(v: unknown): v is number {
  return (
    typeof v === 'number' &&
    Number.isFinite(v) &&
    v >= 0 &&
    v <= KAUPHOLL.maxValue &&
    Math.abs(v * 10 - tenths(v)) < 1e-6
  );
}

// "8.760" is eight thousand seven hundred sixty; "8,7" is eight point seven. Dots group thousands
// (then every group has three digits), one comma and one decimal. Leading zeros of a plain number
// are dropped ("007" is 7) and do not count to the six digits. Whitespace around is ignored, inside
// is not a number. Anything else (two decimals "8,76", "8.76", a sign) is null.
export function parseTrNumber(raw: string): number | null {
  const m = /^([1-9]\d{0,2}(?:\.\d{3})+|\d+)(?:,(\d))?$/.exec(raw.trim());
  if (!m) return null;
  const whole = (m[1] as string).replace(/\./g, '').replace(/^0+(?=\d)/, '');
  if (whole.length > KAUPHOLL.maxDigits) return null;
  const value = (Number(whole) * 10 + (m[2] ? Number(m[2]) : 0)) / 10;
  return isGuessValue(value) ? value : null;
}

// Dots between thousands, a comma before the decimal. With `decimals` 1 the decimal always shows,
// with 0 never (rounded); left out, it shows only when it is not zero.
export function formatTrNumber(v: number, decimals?: 0 | 1): string {
  const t = decimals === 0 ? Math.round(v) * 10 : tenths(v);
  const whole = Math.floor(t / 10);
  const frac = t % 10;
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const showFrac = decimals === 1 || (decimals === undefined && frac !== 0);
  return showFrac ? `${grouped},${frac}` : grouped;
}

// --- The board --------------------------------------------------------------------------------------

// A slice of the board. Position 0 is "Hepsinden küçük" (no value, no authors); then the guesses
// from the smallest, equal numbers merged in one slice with every author (seat order).
export type KauphollSlice = { pos: number; value: number | null; authors: string[]; odds: number };

// The board from the recorded guesses, or null when nobody guessed (the board is skipped).
export function buildBoard(
  guesses: Record<string, number>,
  seats: string[],
): KauphollSlice[] | null {
  const byValue = new Map<number, string[]>();
  for (const sid of seats) {
    const value = guesses[sid];
    if (value === undefined) continue;
    const key = tenths(value);
    byValue.set(key, [...(byValue.get(key) ?? []), sid]);
  }
  if (byValue.size === 0) return null;
  const values = [...byValue.keys()].sort((a, b) => a - b);
  const odds = oddsFor(values.length);
  return [
    { pos: 0, value: null, authors: [], odds: odds[0] as number },
    ...values.map((t, i) => ({
      pos: i + 1,
      value: t / 10,
      authors: byValue.get(t) as string[],
      odds: odds[i + 1] as number,
    })),
  ];
}

// The largest guess that does not pass the answer (an equal guess wins), else "Hepsinden küçük" (0).
export function winningPos(board: KauphollSlice[], answer: number): number {
  let win = 0;
  for (const slice of board) {
    if (slice.value !== null && tenths(slice.value) <= tenths(answer)) win = slice.pos;
  }
  return win;
}

export type KauphollCoins = [number | null, number | null];

// A question's points for the players still in the game: each coin on the winning slice brings its
// odds, and each author of the winning guess still in the game +3 ("Hepsinden küçük" has none). A
// player who left has no coins and gets nothing; their slice stays.
export function scoreRound(
  board: KauphollSlice[],
  answer: number,
  coins: Record<string, KauphollCoins>,
  active: string[],
): { winner: number; points: Record<string, number> } {
  const winner = winningPos(board, answer);
  const slice = board[winner] as KauphollSlice;
  const points: Record<string, number> = Object.fromEntries(active.map((s) => [s, 0]));
  for (const sid of active) {
    const mine = coins[sid] ?? [null, null];
    for (const pos of mine) if (pos === winner) points[sid] = (points[sid] ?? 0) + slice.odds;
    if (winner !== 0 && slice.authors.includes(sid)) {
      points[sid] = (points[sid] ?? 0) + KAUPHOLL.winnerBonus;
    }
  }
  return { winner, points };
}

// Who won: the most points among those still in the game; equal points share the win. Nobody wins
// a game where nobody scored (senaryo-kaupholl T-2).
export function winnersOf(scores: Record<string, number>, active: string[]): string[] {
  if (active.length === 0) return [];
  const most = Math.max(...active.map((s) => scores[s] ?? 0));
  if (most <= 0) return [];
  return active.filter((s) => (scores[s] ?? 0) === most);
}

// --- Questions --------------------------------------------------------------------------------------

export type KauphollDifficulty = 'easy' | 'medium' | 'hard';
export type KauphollBias = 'under' | 'neutral' | 'over';

// What selection reads of a question (no text, no answer): its id, labels and how many games it
// has been in (kaupholl_question_stats.games; not personal).
export type KauphollCandidate = {
  id: string;
  difficulty: KauphollDifficulty;
  bias: KauphollBias;
  category: string;
  active: boolean;
  games: number;
};

export type KauphollQuestion = {
  id: string;
  text: string;
  unit: string;
  decimals: 0 | 1;
  answer: number;
  note: string;
  difficulty: KauphollDifficulty;
};

// The `pool` action's number: active questions not yet used at this table. Only for the warning.
export function unusedCount(pool: KauphollCandidate[], used: readonly string[]): number {
  const seen = new Set(used);
  return pool.filter((q) => q.active && !seen.has(q.id)).length;
}

export const fewQuestions = (unused: number): boolean => unused < KAUPHOLL.lowPool;

type Mix = Record<KauphollDifficulty, number>;
const TARGET: Mix = { easy: 2, medium: 2, hard: 1 };
const MAX_HARD = 3;

// The difficulty mix a level aims at. Level 0: 2 easy, 2 medium, 1 hard. From level 1 a difficulty
// short of questions takes its neighbour: easy → medium, hard → medium, medium → easy, then hard.
// Null if no mix can be made (at most 3 hard, at least one that is not hard).
export function mixFor(level: number, available: Mix): Mix | null {
  if (level === 0) {
    return available.easy >= 2 && available.medium >= 2 && available.hard >= 1
      ? { ...TARGET }
      : null;
  }
  const mix = { ...TARGET };
  const easyShort = Math.max(0, mix.easy - available.easy);
  mix.easy -= easyShort;
  mix.medium += easyShort;
  const hardShort = Math.max(0, mix.hard - available.hard);
  mix.hard -= hardShort;
  mix.medium += hardShort;
  let mediumShort = Math.max(0, mix.medium - available.medium);
  mix.medium -= mediumShort;
  const toEasy = Math.min(mediumShort, available.easy - mix.easy);
  mix.easy += toEasy;
  mediumShort -= toEasy;
  const toHard = Math.min(mediumShort, available.hard - mix.hard);
  mix.hard += toHard;
  mediumShort -= toHard;
  if (mediumShort > 0 || mix.hard > MAX_HARD || mix.easy + mix.medium < 1) return null;
  return mix;
}

// The limits of a level: questions of one category, and of each leaning direction (over / under).
export function limitsFor(level: number): { category: number; bias: number } {
  return {
    category: level >= 4 ? Number.POSITIVE_INFINITY : level >= 2 ? 3 : 2,
    bias: level >= 3 ? 2 : 1,
  };
}

export const SELECTION_LEVELS = [0, 1, 2, 3, 4] as const;

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

// Five questions that keep a level's mix and limits, the least played first (random among equals).
function pickAt(level: number, ordered: KauphollCandidate[]): KauphollCandidate[] | null {
  const available: Mix = { easy: 0, medium: 0, hard: 0 };
  for (const q of ordered) available[q.difficulty] += 1;
  const mix = mixFor(level, available);
  if (!mix) return null;
  const limits = limitsFor(level);
  const picked: KauphollCandidate[] = [];
  const need: Mix = { ...mix };
  const categories = new Map<string, number>();
  const bias = { under: 0, neutral: 0, over: 0 };
  const fits = (q: KauphollCandidate) =>
    need[q.difficulty] > 0 &&
    (categories.get(q.category) ?? 0) < limits.category &&
    (q.bias === 'neutral' || bias[q.bias] < limits.bias);
  // Depth-first in priority order. A later question of a kind that already failed at this depth has
  // fewer choices after it, so it fails too: one try per kind keeps the search small.
  const search = (from: number): boolean => {
    if (picked.length === KAUPHOLL.questions) return true;
    const failed = new Set<string>();
    for (let i = from; i < ordered.length; i += 1) {
      const q = ordered[i] as KauphollCandidate;
      const kind = `${q.difficulty}|${q.bias}|${q.category}`;
      if (failed.has(kind) || !fits(q)) continue;
      picked.push(q);
      need[q.difficulty] -= 1;
      categories.set(q.category, (categories.get(q.category) ?? 0) + 1);
      bias[q.bias] += 1;
      if (search(i + 1)) return true;
      picked.pop();
      need[q.difficulty] += 1;
      categories.set(q.category, (categories.get(q.category) ?? 0) - 1);
      bias[q.bias] -= 1;
      failed.add(kind);
    }
    return false;
  };
  return search(0) ? [...picked] : null;
}

// The order of the five: the 5th is never hard (one of the others, at random); the other four take
// positions 1–4 at random, so a hard question lands on each of them equally often.
export function orderQuestions<T extends { difficulty: KauphollDifficulty }>(
  five: readonly T[],
  rng: () => number,
): T[] {
  const easier = five.filter((q) => q.difficulty !== 'hard');
  const last = easier[Math.floor(rng() * easier.length)] as T;
  return [
    ...shuffled(
      five.filter((q) => q !== last),
      rng,
    ),
    last,
  ];
}

export type KauphollSelection =
  { ok: true; ids: string[]; level: number } | { ok: false; code: 'questions_exhausted' };

// The game's five questions (§4 "Seçim ve gevşetme sırası"): active, never used at this table,
// five different. The first level that makes a valid five is used; the level goes only to the
// server's log. No valid five on level 4 is `questions_exhausted`: the game does not start.
// `rng` is the server's cryptographic one; tests pass a seeded one.
export function selectQuestions(
  pool: KauphollCandidate[],
  used: readonly string[],
  rng: () => number,
): KauphollSelection {
  const seen = new Set(used);
  const unique = new Map<string, KauphollCandidate>();
  for (const q of pool) if (q.active && !seen.has(q.id) && !unique.has(q.id)) unique.set(q.id, q);
  const ordered = shuffled([...unique.values()], rng).sort((a, b) => a.games - b.games);
  for (const level of SELECTION_LEVELS) {
    const five = pickAt(level, ordered);
    if (five) return { ok: true, ids: orderQuestions(five, rng).map((q) => q.id), level };
  }
  return { ok: false, code: 'questions_exhausted' };
}

// --- The game ----------------------------------------------------------------------------------------

export type KauphollPhase = 'card' | 'guess' | 'board' | 'answer' | 'summary' | 'over';
export type KauphollChip = 'none' | 'written' | 'locked';

// A player's coins as the table sees them; `seq` and `step` are the scope's last applied request
// (`sent` is whether that request locked: a lock by time's end is not a request).
export type KauphollBet = {
  coins: KauphollCoins;
  locked: boolean;
  seq: number;
  step: number;
  sent: boolean;
};

export type KauphollState = {
  phase: KauphollPhase;
  step: number;
  endsAt: string;
  // The question being played, 0-based, of `rounds`.
  round: number;
  rounds: number;
  seats: string[];
  gone: string[];
  // From the card's opening: the question and its unit.
  card: { text: string; unit: string; decimals: 0 | 1 } | null;
  chips: Record<string, KauphollChip>;
  board: KauphollSlice[] | null;
  bets: Record<string, KauphollBet>;
  // From the answer phase: the answer and its note.
  answer: { value: number; unit: string; decimals: 0 | 1; note: string } | null;
  winner: number | null;
  noGuesses: boolean;
  points: Record<string, number>;
  scores: Record<string, number>;
  ready: string[];
  // When the game is over: who won (equal points share).
  winners: string[] | null;
};

export type KauphollGuess = {
  value: number;
  locked: boolean;
  seq: number;
  step: number;
  round: number;
  sent: boolean;
};

export type KauphollSecret = {
  questions: KauphollQuestion[];
  guesses: Record<string, KauphollGuess>;
};

const at = (now: Date, seconds: number): string =>
  new Date(now.getTime() + seconds * 1000).toISOString();

export const activeSeats = (state: Pick<KauphollState, 'seats' | 'gone'>): string[] =>
  state.seats.filter((s) => !state.gone.includes(s));

export function expired(state: KauphollState, now: Date): boolean {
  return now.getTime() >= Date.parse(state.endsAt);
}

export type KauphollStartError = 'bad_players' | 'bad_questions';

export function startGame(input: {
  seats: string[];
  questions: KauphollQuestion[];
  now: Date;
}):
  | { ok: true; state: KauphollState; secret: KauphollSecret }
  | { ok: false; code: KauphollStartError } {
  const seats = [...new Set(input.seats)];
  if (seats.length < KAUPHOLL.minPlayers || seats.length > KAUPHOLL.maxPlayers) {
    return { ok: false, code: 'bad_players' };
  }
  const ids = new Set(input.questions.map((q) => q.id));
  const last = input.questions[KAUPHOLL.questions - 1];
  if (
    input.questions.length !== KAUPHOLL.questions ||
    ids.size !== KAUPHOLL.questions ||
    !last ||
    last.difficulty === 'hard'
  ) {
    return { ok: false, code: 'bad_questions' };
  }
  return {
    ok: true,
    state: cardState(
      {
        phase: 'card',
        step: 0,
        endsAt: input.now.toISOString(),
        round: 0,
        rounds: KAUPHOLL.questions,
        seats,
        gone: [],
        card: null,
        chips: {},
        board: null,
        bets: {},
        answer: null,
        winner: null,
        noGuesses: false,
        points: {},
        scores: Object.fromEntries(seats.map((s) => [s, 0])),
        ready: [],
        winners: null,
      },
      0,
      input.now,
    ),
    secret: { questions: input.questions.map((q) => ({ ...q })), guesses: {} },
  };
}

function cardState(state: KauphollState, round: number, now: Date): KauphollState {
  return {
    ...state,
    phase: 'card',
    step: state.step + 1,
    endsAt: at(now, KAUPHOLL.cardSeconds),
    round,
    card: null,
    chips: {},
    board: null,
    bets: {},
    answer: null,
    winner: null,
    noGuesses: false,
    points: {},
    ready: [],
  };
}

type Halves = { state: KauphollState; secret: KauphollSecret };

const question = (state: KauphollState, secret: KauphollSecret): KauphollQuestion =>
  secret.questions[state.round] as KauphollQuestion;

function openCard({ state, secret }: Halves, now: Date): Halves {
  const q = question(state, secret);
  return {
    state: {
      ...state,
      phase: 'guess',
      step: state.step + 1,
      endsAt: at(now, KAUPHOLL.guessSeconds),
      card: { text: q.text, unit: q.unit, decimals: q.decimals },
      chips: Object.fromEntries(activeSeats(state).map((s) => [s, 'none' as const])),
    },
    secret,
  };
}

// The guesses of this question, every one of them locked (a recorded guess locks by itself when time
// runs out; it is no different from one locked by hand).
function lockGuesses(state: KauphollState, secret: KauphollSecret): KauphollSecret {
  const guesses: Record<string, KauphollGuess> = {};
  for (const [sid, g] of Object.entries(secret.guesses)) {
    guesses[sid] = g.round === state.round ? { ...g, locked: true } : g;
  }
  return { ...secret, guesses };
}

// Out of the guess phase: every recorded guess locks and the board is built in the same go. With
// no guess the board is skipped and the answer opens with "Kimse tahmin yazmadı".
function closeGuesses({ state, secret }: Halves, now: Date): Halves {
  const locked = lockGuesses(state, secret);
  const active = activeSeats(state);
  const values: Record<string, number> = {};
  for (const sid of active) {
    const g = locked.guesses[sid];
    if (g && g.round === state.round) values[sid] = g.value;
  }
  const board = buildBoard(values, state.seats);
  const chips = Object.fromEntries(
    active.map((s) => [s, values[s] === undefined ? ('none' as const) : ('locked' as const)]),
  );
  if (!board) return openAnswer({ state: { ...state, chips, board: null }, secret: locked }, now);
  return {
    state: {
      ...state,
      phase: 'board',
      step: state.step + 1,
      endsAt: at(now, KAUPHOLL.betSeconds),
      chips,
      board,
      bets: {},
    },
    secret: locked,
  };
}

function openAnswer({ state, secret }: Halves, now: Date): Halves {
  const q = question(state, secret);
  const active = activeSeats(state);
  const bets: Record<string, KauphollBet> = {};
  for (const [sid, b] of Object.entries(state.bets)) bets[sid] = { ...b, locked: true };
  let winner: number | null = null;
  let points: Record<string, number> = Object.fromEntries(active.map((s) => [s, 0]));
  if (state.board) {
    const coins = Object.fromEntries(Object.entries(bets).map(([s, b]) => [s, b.coins]));
    ({ winner, points } = scoreRound(state.board, q.answer, coins, active));
  }
  const scores = { ...state.scores };
  for (const [sid, p] of Object.entries(points)) scores[sid] = (scores[sid] ?? 0) + p;
  return {
    state: {
      ...state,
      phase: 'answer',
      step: state.step + 1,
      endsAt: at(now, KAUPHOLL.pauseSeconds),
      bets,
      answer: { value: q.answer, unit: q.unit, decimals: q.decimals, note: q.note },
      winner,
      noGuesses: state.board === null,
      points,
      scores,
      ready: [],
    },
    secret,
  };
}

function nextPhase(halves: Halves, now: Date): Halves {
  const { state, secret } = halves;
  switch (state.phase) {
    case 'card':
      return openCard(halves, now);
    case 'guess':
      return closeGuesses(halves, now);
    case 'board':
      return openAnswer(halves, now);
    case 'answer':
      return {
        state: {
          ...state,
          phase: 'summary',
          step: state.step + 1,
          endsAt: at(now, KAUPHOLL.pauseSeconds),
          ready: [],
        },
        secret,
      };
    case 'summary':
      if (state.round + 1 < state.rounds) {
        return { state: cardState(state, state.round + 1, now), secret };
      }
      return {
        state: {
          ...state,
          phase: 'over',
          step: state.step + 1,
          endsAt: now.toISOString(),
          ready: [],
          winners: winnersOf(state.scores, activeSeats(state)),
        },
        secret,
      };
    case 'over':
      return halves;
  }
}

// Whether the phase is done before its time: every player still in the game locked their guess
// (guess), their coins (board) or is ready (answer, summary).
export function phaseDone(state: KauphollState): boolean {
  const active = activeSeats(state);
  switch (state.phase) {
    case 'guess':
      return active.every((s) => state.chips[s] === 'locked');
    case 'board':
      return active.every((s) => state.bets[s]?.locked === true);
    case 'answer':
    case 'summary':
      return active.every((s) => state.ready.includes(s));
    default:
      return false;
  }
}

// --- Actions ----------------------------------------------------------------------------------------

export type KauphollRequest =
  | { action: 'reveal'; step: number }
  | { action: 'guess'; step: number; seq: number; value: number; lock: boolean }
  | { action: 'bet'; step: number; seq: number; coins: KauphollCoins; lock: boolean }
  | { action: 'ready'; step: number }
  | { action: 'advance'; step: number };

// The actions phones may send twice after a 5xx (apiRetry.ts → IDEMPOTENT_CALLS, with the server
// step, which adds `view` and `pool`): the second time changes nothing.
export const KAUPHOLL_IDEMPOTENT_ACTIONS = [
  'reveal',
  'guess',
  'bet',
  'ready',
  'advance',
] as const satisfies readonly KauphollRequest['action'][];

export type KauphollResult =
  | { action: 'reveal' }
  | { action: 'guess'; seq: number; value: number; locked: boolean }
  | { action: 'bet'; seq: number; coins: KauphollCoins; locked: boolean }
  | { action: 'ready' }
  | { action: 'advance' };

export type KauphollErrorCode = 'bad_request' | 'not_player' | 'seq_conflict';

// `phase_over`: the phase closed (time ran out or it moved on); `locked`: the scope is locked;
// `outdated`: an older seq. The phone takes the server's state (view) and shows it.
export type KauphollNotApplied = 'phase_over' | 'locked' | 'outdated';

// Who asks: the caller's check-in at the table. A seat in the game that has not left plays;
// anyone else (an observer, someone who left) does not.
export type KauphollActor = { sid: string };

// The halves in a decision are what the server writes back under the lock, never an answer as
// they are: the secret holds the answers and every guess. A phone's answer is built only from
// `result`, publicState(state) and that phone's viewFor.
export type KauphollDecision =
  | { kind: 'applied'; state: KauphollState; secret: KauphollSecret; result: KauphollResult }
  | { kind: 'replayed'; result: KauphollResult }
  | { kind: 'not_applied'; reason: KauphollNotApplied }
  | { kind: 'noop' }
  | { kind: 'error'; code: KauphollErrorCode };

const isSeq = (seq: unknown): seq is number =>
  typeof seq === 'number' && Number.isInteger(seq) && seq >= 1 && seq <= KAUPHOLL.seqMax;
const isPos = (pos: unknown): pos is number | null =>
  pos === null || (typeof pos === 'number' && Number.isInteger(pos) && pos >= 0);
const isStep = (step: unknown): step is number =>
  typeof step === 'number' && Number.isInteger(step);

export const isPlayer = (state: KauphollState, sid: string): boolean =>
  state.seats.includes(sid) && !state.gone.includes(sid);

// The same coins: a placement is a set of up to two positions, not their order.
const sameCoins = (a: KauphollCoins, b: KauphollCoins): boolean => {
  const key = (c: KauphollCoins) =>
    c
      .map((p) => (p === null ? -1 : p))
      .sort((x, y) => x - y)
      .join(',');
  return key(a) === key(b);
};

function applied(halves: Halves, result: KauphollResult, now: Date): KauphollDecision {
  // An early move happens in the same go as the action that completes the phase.
  const done = phaseDone(halves.state) ? nextPhase(halves, now) : halves;
  return { kind: 'applied', ...done, result };
}

export function decideAction(
  state: KauphollState,
  secret: KauphollSecret,
  actor: KauphollActor,
  request: KauphollRequest,
  now: Date,
): KauphollDecision {
  if (!isStep(request.step)) return { kind: 'error', code: 'bad_request' };

  // An advance is anyone's at the table, and only moves a clock that ran out, one phase at a time.
  if (request.action === 'advance') {
    if (state.phase === 'over' || request.step !== state.step || !expired(state, now)) {
      return { kind: 'noop' };
    }
    return { kind: 'applied', ...nextPhase({ state, secret }, now), result: { action: 'advance' } };
  }

  if (!isPlayer(state, actor.sid)) return { kind: 'error', code: 'not_player' };

  switch (request.action) {
    case 'reveal':
      // The first press opens the card; any later one (a stale step) changes nothing.
      if (state.phase !== 'card' || request.step !== state.step) return { kind: 'noop' };
      return {
        kind: 'applied',
        ...openCard({ state, secret }, now),
        result: { action: 'reveal' },
      };
    case 'ready': {
      const open = state.phase === 'answer' || state.phase === 'summary';
      if (!open || request.step !== state.step || state.ready.includes(actor.sid)) {
        return { kind: 'noop' };
      }
      const next = { ...state, ready: [...state.ready, actor.sid] };
      return applied({ state: next, secret }, { action: 'ready' }, now);
    }
    case 'guess':
      return guess(state, secret, actor.sid, request, now);
    case 'bet':
      return bet(state, secret, actor.sid, request, now);
  }
}

function guess(
  state: KauphollState,
  secret: KauphollSecret,
  sid: string,
  request: Extract<KauphollRequest, { action: 'guess' }>,
  now: Date,
): KauphollDecision {
  if (!isSeq(request.seq) || !isGuessValue(request.value) || typeof request.lock !== 'boolean') {
    return { kind: 'error', code: 'bad_request' };
  }
  // A whole-number question takes no decimal guess (senaryo-kaupholl T-1).
  if (question(state, secret).decimals === 0 && tenths(request.value) % 10 !== 0) {
    return { kind: 'error', code: 'bad_request' };
  }
  const last = secret.guesses[sid];
  const scoped = last && last.step === request.step ? last : undefined;
  const same =
    scoped !== undefined &&
    tenths(scoped.value) === tenths(request.value) &&
    scoped.sent === request.lock;
  // The last applied request again (its answer was lost): the same answer, whatever happened since.
  if (scoped && scoped.seq === request.seq && same) {
    return {
      kind: 'replayed',
      result: { action: 'guess', seq: scoped.seq, value: scoped.value, locked: scoped.locked },
    };
  }
  if (state.phase !== 'guess' || request.step !== state.step || expired(state, now)) {
    return { kind: 'not_applied', reason: 'phase_over' };
  }
  if (scoped?.locked) return { kind: 'not_applied', reason: 'locked' };
  if (scoped && scoped.seq === request.seq) return { kind: 'error', code: 'seq_conflict' };
  if (scoped && request.seq < scoped.seq) return { kind: 'not_applied', reason: 'outdated' };

  const record: KauphollGuess = {
    value: tenths(request.value) / 10,
    locked: request.lock,
    seq: request.seq,
    step: request.step,
    round: state.round,
    sent: request.lock,
  };
  const next: Halves = {
    state: { ...state, chips: { ...state.chips, [sid]: request.lock ? 'locked' : 'written' } },
    secret: { ...secret, guesses: { ...secret.guesses, [sid]: record } },
  };
  return applied(
    next,
    { action: 'guess', seq: record.seq, value: record.value, locked: record.locked },
    now,
  );
}

function bet(
  state: KauphollState,
  secret: KauphollSecret,
  sid: string,
  request: Extract<KauphollRequest, { action: 'bet' }>,
  now: Date,
): KauphollDecision {
  const coins = request.coins;
  if (
    !isSeq(request.seq) ||
    typeof request.lock !== 'boolean' ||
    !Array.isArray(coins) ||
    coins.length !== KAUPHOLL.coins ||
    !coins.every(isPos)
  ) {
    return { kind: 'error', code: 'bad_request' };
  }
  const last = state.bets[sid];
  const scoped = last && last.step === request.step ? last : undefined;
  const same =
    scoped !== undefined && sameCoins(scoped.coins, coins) && scoped.sent === request.lock;
  if (scoped && scoped.seq === request.seq && same) {
    return {
      kind: 'replayed',
      result: { action: 'bet', seq: scoped.seq, coins: scoped.coins, locked: scoped.locked },
    };
  }
  if (state.phase !== 'board' || request.step !== state.step || expired(state, now)) {
    return { kind: 'not_applied', reason: 'phase_over' };
  }
  const slices = state.board?.length ?? 0;
  if (coins.some((p) => p !== null && p >= slices)) return { kind: 'error', code: 'bad_request' };
  if (scoped?.locked) return { kind: 'not_applied', reason: 'locked' };
  if (scoped && scoped.seq === request.seq) return { kind: 'error', code: 'seq_conflict' };
  if (scoped && request.seq < scoped.seq) return { kind: 'not_applied', reason: 'outdated' };

  const record: KauphollBet = {
    coins: [coins[0], coins[1]],
    locked: request.lock,
    seq: request.seq,
    step: request.step,
    sent: request.lock,
  };
  return applied(
    { state: { ...state, bets: { ...state.bets, [sid]: record } }, secret },
    { action: 'bet', seq: record.seq, coins: record.coins, locked: record.locked },
    now,
  );
}

// --- Leaving ----------------------------------------------------------------------------------------

// A player leaves the game (or the table). Below two players the game is abandoned: no winner, no
// game_results, the frame's abandoned-game path (§1 "Yarım kalan oyun"). Otherwise: in the guess
// phase the leaver's guess drops; once the board is built their slice stays and their coins go
// (another author of the same slice still gets +3). If the leaver was the last one the phase waited
// for, its time ends now (the next advance moves on).
export function leaveGame(
  state: KauphollState,
  secret: KauphollSecret,
  sid: string,
  now: Date,
): { abandoned: true } | { abandoned: false; state: KauphollState; secret: KauphollSecret } {
  if (!isPlayer(state, sid) || state.phase === 'over') {
    return { abandoned: false, state, secret };
  }
  const gone = [...state.gone, sid];
  if (state.seats.length - gone.length < KAUPHOLL.abandonBelow) return { abandoned: true };
  const without = <T>(r: Record<string, T>): Record<string, T> =>
    Object.fromEntries(Object.entries(r).filter(([s]) => s !== sid));
  const chips = without(state.chips);
  const bets = state.phase === 'board' ? without(state.bets) : { ...state.bets };
  const guesses =
    state.phase === 'card' || state.phase === 'guess'
      ? without(secret.guesses)
      : { ...secret.guesses };
  let next: KauphollState = {
    ...state,
    gone,
    chips,
    bets,
    ready: state.ready.filter((s) => s !== sid),
  };
  if (phaseDone(next) && !expired(next, now)) next = { ...next, endsAt: now.toISOString() };
  return { abandoned: false, state: next, secret: { ...secret, guesses } };
}

// --- What leaves the server -------------------------------------------------------------------------

// The open state, field by field. Nothing here comes from the secret but the card once opened, the
// board (guesses become public when it is built) and the answer once its phase opens.
export function publicState(state: KauphollState): KauphollState {
  const shown = state.phase !== 'card';
  const answered = state.phase === 'answer' || state.phase === 'summary' || state.phase === 'over';
  return {
    phase: state.phase,
    step: state.step,
    endsAt: state.endsAt,
    round: state.round,
    rounds: state.rounds,
    seats: [...state.seats],
    gone: [...state.gone],
    card: shown && state.card ? { ...state.card } : null,
    chips: { ...state.chips },
    board:
      state.phase !== 'card' && state.phase !== 'guess' && state.board
        ? state.board.map((s) => ({ ...s, authors: [...s.authors] }))
        : null,
    bets: Object.fromEntries(
      Object.entries(state.bets).map(([s, b]) => [s, { ...b, coins: [b.coins[0], b.coins[1]] }]),
    ),
    answer: answered && state.answer ? { ...state.answer } : null,
    winner: answered ? state.winner : null,
    noGuesses: answered && state.noGuesses,
    points: answered ? { ...state.points } : {},
    scores: { ...state.scores },
    ready: [...state.ready],
    winners: state.phase === 'over' && state.winners ? [...state.winners] : null,
  };
}

export type KauphollView =
  | {
      role: 'player';
      guess: { value: number; seq: number; locked: boolean } | null;
      bet: { coins: KauphollCoins; seq: number; locked: boolean } | null;
    }
  | { role: 'observer' };

// What kaupholl/view answers: built from the caller's seat, never from what the caller asked for.
// Only the caller's own guess of this question, never anyone else's; an observer gets nothing.
export function viewFor(
  actor: KauphollActor,
  state: KauphollState,
  secret: KauphollSecret,
): KauphollView {
  if (!isPlayer(state, actor.sid)) return { role: 'observer' };
  const g = secret.guesses[actor.sid];
  const b = state.bets[actor.sid];
  return {
    role: 'player',
    guess: g && g.round === state.round ? { value: g.value, seq: g.seq, locked: g.locked } : null,
    bet: b ? { coins: [b.coins[0], b.coins[1]], seq: b.seq, locked: b.locked } : null,
  };
}

// --- What a phone gets back (the server step) -------------------------------------------------------

// Every play answer (reveal, guess, bet, ready, advance): `applied: false` with a reason is not an
// error; the phone shows the server's state and view, without the failure haptic. `unchanged`: a
// press from a step already gone, or an early advance; `busy`: the table changed at the same moment
// three times (the phone reads it again).
export type KauphollAnswer =
  | {
      applied: true;
      replayed?: true;
      result: KauphollResult;
      room: KauphollState;
      view: KauphollView;
    }
  | {
      applied: false;
      reason: KauphollNotApplied | 'unchanged' | 'busy';
      room: KauphollState;
      view: KauphollView;
    };

// The only way a decision becomes an answer: the result, the open state and the caller's own view.
// Never the decision's halves (the secret holds the answers and every guess).
export function respond(
  decision: Exclude<KauphollDecision, { kind: 'error' }> | { kind: 'busy' },
  state: KauphollState,
  view: KauphollView,
): KauphollAnswer {
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

// --- The question statistics (§4 "Kişisel olmayan soru istatistiği") ---------------------------------

// Where the winning slice stood, for the pilot's look at the odds (§3): 0 "Hepsinden küçük", 1 the
// lowest guess, 2 below the middle, 3 the middle, 4 above it, 5 the largest guess. One guess on
// the board is the middle; two are the two ends.
export function winBucket(board: KauphollSlice[], winner: number): number {
  const k = board.length - 1;
  if (winner === 0) return 0;
  if (k === 1) return 3;
  if (winner === 1) return 1;
  if (winner === k) return 5;
  const middle = (k + 1) / 2;
  return winner < middle ? 2 : winner > middle ? 4 : 3;
}

export type KauphollRoundStats = {
  guesses: number;
  noGuess: boolean;
  smallerWin: boolean;
  bucket: number | null;
  sumAbsLogErr: number;
};

// A question's counts, added up in kaupholl_question_stats when its answer opens: no person, no
// table, no time. The error of a guess is |ln((guess + 1) / (answer + 1))| (a 0 has a log).
export function roundStats(state: KauphollState, answer: number): KauphollRoundStats {
  if (!state.board) {
    return { guesses: 0, noGuess: true, smallerWin: false, bucket: null, sumAbsLogErr: 0 };
  }
  let guesses = 0;
  let sumAbsLogErr = 0;
  for (const slice of state.board) {
    if (slice.value === null) continue;
    guesses += slice.authors.length;
    sumAbsLogErr += slice.authors.length * Math.abs(Math.log((slice.value + 1) / (answer + 1)));
  }
  const winner = winningPos(state.board, answer);
  return {
    guesses,
    noGuess: false,
    smallerWin: winner === 0,
    bucket: winBucket(state.board, winner),
    sumAbsLogErr,
  };
}
