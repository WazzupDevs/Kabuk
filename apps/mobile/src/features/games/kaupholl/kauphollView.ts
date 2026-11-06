import {
  activeSeats,
  KAUPHOLL,
  type KauphollBet,
  type KauphollChip,
  type KauphollCoins,
  type KauphollPhase,
  type KauphollSlice,
  type KauphollState,
  parseTrNumber,
} from '@shared/kaupholl.ts';

// What Kaupholl's screens draw from the table's open state (docs/SPEC_V4.md §4.F "Adım 4.6.10",
// K-87; Aura v89 and the §6 panels of docs/decisions/kaupholl.md): reading the state, the chips'
// counts, the board's rows and coins, the guess field, the scores, the end's words and the order
// the phone sends its guesses and placements in (seq). Pure, so it is tested (kauphollView.test.ts).

// ------------------------------------------------------------------ reading the table

const PHASES: readonly KauphollPhase[] = ['card', 'guess', 'board', 'answer', 'summary', 'over'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}
function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function numbers(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(value)) return out;
  for (const [k, v] of Object.entries(value)) if (typeof v === 'number') out[k] = v;
  return out;
}
const decimalsOf = (v: unknown): 0 | 1 => (v === 1 ? 1 : 0);
function pos(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null;
}

function slices(value: unknown): KauphollSlice[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(isRecord).map((s) => ({
    pos: num(s.pos),
    value: typeof s.value === 'number' ? s.value : null,
    authors: strings(s.authors),
    odds: num(s.odds),
  }));
}

function bets(value: unknown): Record<string, KauphollBet> {
  const out: Record<string, KauphollBet> = {};
  if (!isRecord(value)) return out;
  for (const [sid, b] of Object.entries(value)) {
    if (!isRecord(b)) continue;
    const c = Array.isArray(b.coins) ? b.coins : [];
    out[sid] = {
      coins: [pos(c[0]), pos(c[1])],
      locked: b.locked === true,
      seq: num(b.seq),
      step: num(b.step),
      sent: b.sent === true,
    };
  }
  return out;
}

function chips(value: unknown): Record<string, KauphollChip> {
  const out: Record<string, KauphollChip> = {};
  if (!isRecord(value)) return out;
  for (const [sid, c] of Object.entries(value)) {
    if (c === 'none' || c === 'written' || c === 'locked') out[sid] = c;
  }
  return out;
}

export type KauphollTable = KauphollState & { gameNo: number };

// rooms.game_state as the running game (or its over state), or null.
export function readKauphollState(value: unknown): KauphollTable | null {
  if (!isRecord(value)) return null;
  const phase = value.phase as KauphollPhase;
  if (!PHASES.includes(phase) || typeof value.step !== 'number') return null;
  const card = isRecord(value.card)
    ? {
        text: typeof value.card.text === 'string' ? value.card.text : '',
        unit: typeof value.card.unit === 'string' ? value.card.unit : '',
        decimals: decimalsOf(value.card.decimals),
      }
    : null;
  const answer = isRecord(value.answer)
    ? {
        value: num(value.answer.value),
        unit: typeof value.answer.unit === 'string' ? value.answer.unit : '',
        decimals: decimalsOf(value.answer.decimals),
        note: typeof value.answer.note === 'string' ? value.answer.note : '',
      }
    : null;
  return {
    gameNo: num(value.gameNo),
    phase,
    step: value.step,
    endsAt: typeof value.endsAt === 'string' ? value.endsAt : new Date(0).toISOString(),
    round: num(value.round),
    rounds: num(value.rounds, KAUPHOLL.questions),
    seats: strings(value.seats),
    gone: strings(value.gone),
    card,
    chips: chips(value.chips),
    board: slices(value.board),
    bets: bets(value.bets),
    answer,
    winner: pos(value.winner),
    noGuesses: value.noGuesses === true,
    points: numbers(value.points),
    scores: numbers(value.scores),
    ready: strings(value.ready),
    winners: Array.isArray(value.winners) ? strings(value.winners) : null,
  };
}

// The last game's end (rooms.game_state.lastGame.kaupholl), only of a finished game.
export function readKauphollResult(value: unknown): KauphollTable | null {
  if (!isRecord(value) || !isRecord(value.lastGame)) return null;
  const last = value.lastGame;
  if (last.concept !== 'kaupholl' || last.abandoned === true) return null;
  return readKauphollState(last.kaupholl);
}

// The game number of a Kaupholl game left half way (fewer than two players, the owner's "Oyunu
// bitir", the table closing): no end screen, the table tells it (KaupholYarida). Null otherwise.
export function kauphollAbandoned(value: unknown): number | null {
  if (!isRecord(value) || !isRecord(value.lastGame)) return null;
  const last = value.lastGame;
  if (last.concept !== 'kaupholl' || last.abandoned !== true) return null;
  return num(value.gameNo);
}

// ------------------------------------------------------------------ the chips

// "3/5 kişi yazdı · 1 kesinleştirdi": the players still in the game, how many wrote (locked ones
// too) and how many locked.
export function chipCounts(state: Pick<KauphollState, 'seats' | 'gone' | 'chips'>): {
  players: number;
  written: number;
  locked: number;
} {
  const active = activeSeats(state);
  const of = (s: string) => state.chips[s] ?? 'none';
  return {
    players: active.length,
    written: active.filter((s) => of(s) !== 'none').length,
    locked: active.filter((s) => of(s) === 'locked').length,
  };
}

// ------------------------------------------------------------------ the guess field

// What the field holds: the whole digits and, on a question with a decimal, a comma and at most
// one decimal ("9000", "9000,", "9000,5"). Dots are never kept: they are the thousands' marks the
// field draws (docs/decisions/senaryo-kaupholl.md E-2).
export type GuessEdit = { raw: string; tooLong: boolean };

const digits = (s: string) => s.replace(/\D/g, '');

// The field's next content after the person typed `text` (the field showed formatGuess(prev)).
// A comma, or on a question with a decimal a dot more than the field drew (the dot a keyboard puts
// where the comma goes), starts the decimal; on a whole-number question there is none (T-1). More
// than six whole digits keeps the last content and says so.
export function editGuess(prev: string, text: string, decimals: 0 | 1): GuessEdit {
  const drawnDots = (formatGuess(prev).match(/\./g) ?? []).length;
  let s = text;
  if (decimals === 1 && !s.includes(',')) {
    const dots = (s.match(/\./g) ?? []).length;
    if (dots > drawnDots) {
      const at = s.lastIndexOf('.');
      s = `${s.slice(0, at)},${s.slice(at + 1)}`;
    }
  }
  const comma = decimals === 1 ? s.indexOf(',') : -1;
  const wholeDigits = digits(comma < 0 ? s : s.slice(0, comma)).replace(/^0+(?=\d)/, '');
  const frac = comma < 0 ? null : digits(s.slice(comma + 1)).slice(0, 1);
  if (wholeDigits.length > KAUPHOLL.maxDigits) return { raw: prev, tooLong: true };
  const whole = wholeDigits === '' && frac !== null ? '0' : wholeDigits;
  return { raw: frac === null ? whole : `${whole},${frac}`, tooLong: false };
}

// The field as drawn: dots between thousands ("9.000", "99.999,9").
export function formatGuess(raw: string): string {
  const [whole = '', frac] = raw.split(',');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return frac === undefined ? grouped : `${grouped},${frac}`;
}

// The number the field holds, or null while it is not one ("", "9.000,").
export function guessValue(raw: string): number | null {
  return raw === '' ? null : parseTrNumber(formatGuess(raw));
}

// The field's content for a guess already sent ("Tahmini değiştir").
export function rawOf(value: number): string {
  const tenths = Math.round(value * 10);
  const whole = String(Math.floor(tenths / 10));
  return tenths % 10 === 0 ? whole : `${whole},${tenths % 10}`;
}

// ------------------------------------------------------------------ the board

// Who wrote a slice: one by name, two by both names, three or more as "n kişi" (§5). Screen
// readers hear every name.
export type Authors =
  | { kind: 'none' }
  | { kind: 'one'; sid: string }
  | { kind: 'two'; sids: [string, string] }
  | { kind: 'many'; sids: string[] };

export function authorsOf(slice: Pick<KauphollSlice, 'authors'>): Authors {
  const a = slice.authors;
  if (a.length === 0) return { kind: 'none' };
  if (a.length === 1) return { kind: 'one', sid: a[0] as string };
  if (a.length === 2) return { kind: 'two', sids: [a[0] as string, a[1] as string] };
  return { kind: 'many', sids: [...a] };
}

// Whose coins lie on a slice, in seat order, with how many each.
export type Stake = { sid: string; n: number };

export function stakesOn(
  pos: number,
  allBets: Record<string, Pick<KauphollBet, 'coins'>>,
  seats: readonly string[],
  mine?: { sid: string; coins: KauphollCoins },
): Stake[] {
  const out: Stake[] = [];
  for (const sid of seats) {
    const coins = mine && sid === mine.sid ? mine.coins : allBets[sid]?.coins;
    const n = coins ? coins.filter((p) => p === pos).length : 0;
    if (n > 0) out.push({ sid, n });
  }
  return out;
}

// How a slice's coins are drawn: each person's coin with their face (and "×2"), or, when they do
// not fit in the slice's room, one coin, the whole count and the faces overlapping (§5: twelve
// coins on one slice).
export type CoinsDrawn =
  { kind: 'each'; stakes: Stake[] } | { kind: 'stack'; total: number; sids: string[] };

export function coinsDrawn(stakes: Stake[], room: number, bet: number, gap: number): CoinsDrawn {
  const fit = Math.max(1, Math.floor((room + gap) / (bet + gap)));
  if (stakes.length <= fit) return { kind: 'each', stakes };
  return {
    kind: 'stack',
    total: stakes.reduce((t, s) => t + s.n, 0),
    sids: stakes.map((s) => s.sid),
  };
}

// A slice's look once the answer is open: the winner, those past the answer, the rest.
export type SliceMark = 'win' | 'over' | 'plain';

// The board's rows, with the answer's line after the winning slice once the answer is open.
export type BoardRow = { kind: 'slice'; slice: KauphollSlice; mark: SliceMark } | { kind: 'line' };

export function boardRows(
  board: readonly KauphollSlice[],
  winner: number | null,
  answered: boolean,
): BoardRow[] {
  const rows: BoardRow[] = [];
  for (const slice of board) {
    const mark: SliceMark =
      !answered || winner === null
        ? 'plain'
        : slice.pos === winner
          ? 'win'
          : slice.pos > winner
            ? 'over'
            : 'plain';
    rows.push({ kind: 'slice', slice, mark });
    if (answered && winner !== null && slice.pos === winner) rows.push({ kind: 'line' });
  }
  return rows;
}

// The board is compact (Tahta sıkı) with seven slices or above 1× text (§5).
export function compactBoard(slices: number, fontScale: number): boolean {
  return slices >= 7 || fontScale > 1;
}

// A press on a slice (§1: two coins, on one or two slices): a free coin goes on it; with none free
// one of the person's coins on it comes back; otherwise their first coin moves to it.
export function tapSlot(coins: KauphollCoins, pos: number): KauphollCoins {
  const [a, b] = coins;
  if (a === null) return [pos, b];
  if (b === null) return [a, pos];
  if (b === pos) return [a, null];
  if (a === pos) return [null, b];
  return [b, pos];
}

export const coinsLeft = (coins: KauphollCoins): number => coins.filter((p) => p === null).length;

// What a press on a slice would do while the finger is still down (KaupholJetonKoy): a coin comes
// to the slice (drawn at half, `ghost`), and when it is a free one it leaves the wallet (`leaving`).
export function pressPreview(
  coins: KauphollCoins,
  pos: number,
): { ghost: boolean; leaving: boolean } {
  const at = (c: KauphollCoins) => c.filter((p) => p === pos).length;
  const ghost = at(tapSlot(coins, pos)) > at(coins);
  return { ghost, leaving: ghost && coinsLeft(coins) > 0 };
}

// The font size that lets `text` fit a field `width` wide (KaupholTahminYaz320: "99.999,9" at 1.3×
// shrinks, it is never cut). Tabular digits are about .66 em wide, the dot and comma .34; `scale` is
// the text size the system draws at, `min` the smallest share of `size`. Whole points.
export function fieldFontSize(
  text: string,
  width: number,
  size: number,
  scale: number,
  min = 0.5,
): number {
  if (width <= 0) return size;
  const marks = (text.match(/[.,]/g) ?? []).length;
  // One more digit for the caret.
  const em = (text.length - marks + 1) * 0.66 + marks * 0.34;
  return Math.floor(Math.max(size * min, Math.min(size, width / scale / em)));
}

// ------------------------------------------------------------------ the scores

// The score table: those still in the game, most points first (seat order between equals); what
// this question brought, whether they wrote the winning guess (+3), whether they lead.
export type ScoreRow = { sid: string; gain: number; total: number; bonus: boolean; lead: boolean };

export function scoreRows(
  state: Pick<KauphollState, 'seats' | 'gone' | 'scores' | 'points' | 'board' | 'winner'>,
): ScoreRow[] {
  const active = activeSeats(state);
  const win =
    state.winner !== null && state.winner > 0
      ? state.board?.find((s) => s.pos === state.winner)
      : undefined;
  const most = Math.max(0, ...active.map((s) => state.scores[s] ?? 0));
  return active
    .map((sid, i) => ({
      i,
      sid,
      gain: state.points[sid] ?? 0,
      total: state.scores[sid] ?? 0,
      bonus: !!win && win.authors.includes(sid),
      lead: most > 0 && (state.scores[sid] ?? 0) === most,
    }))
    .sort((x, y) => y.total - x.total || x.i - y.i)
    .map(({ i: _i, ...row }) => row);
}

// The end of a question's heading: who wrote the winning guess, "Hepsinden küçük", or nobody wrote.
export type SummaryWords =
  { kind: 'none' } | { kind: 'smaller' } | { kind: 'guess'; authors: Authors; value: number };

export function summaryWords(
  state: Pick<KauphollState, 'noGuesses' | 'winner' | 'board'>,
): SummaryWords {
  if (state.noGuesses || !state.board || state.winner === null) return { kind: 'none' };
  if (state.winner === 0) return { kind: 'smaller' };
  const slice = state.board.find((s) => s.pos === state.winner);
  if (!slice || slice.value === null) return { kind: 'smaller' };
  return { kind: 'guess', authors: authorsOf(slice), value: slice.value };
}

// The end's heading: no winner (the most points 0, T-2), one, two or more sharing the win.
export type EndWords =
  | { kind: 'nobody' }
  | { kind: 'one'; sid: string; you: boolean; points: number }
  | { kind: 'two'; sids: [string, string]; you: boolean; points: number }
  | { kind: 'many'; sids: string[]; you: boolean; points: number };

export function endWords(
  result: Pick<KauphollState, 'seats' | 'winners' | 'scores'>,
  me: string,
): EndWords {
  const winners = result.seats.filter((s) => (result.winners ?? []).includes(s));
  if (winners.length === 0) return { kind: 'nobody' };
  const points = result.scores[winners[0] as string] ?? 0;
  const you = winners.includes(me);
  if (winners.length === 1) return { kind: 'one', sid: winners[0] as string, you, points };
  if (winners.length === 2) {
    return { kind: 'two', sids: [winners[0] as string, winners[1] as string], you, points };
  }
  return { kind: 'many', sids: winners, you, points };
}

// ------------------------------------------------------------------ the order of sending (seq)

// One scope's sending (a step's guess, or its placement; rule 3's exception): at most one request
// on its way; what changes meanwhile waits, the last change replacing any before it, and goes with
// the next seq once the answer is back. `seq` is the last one used (the server's after a view).
export type Lane<T> = {
  seq: number;
  busy: boolean;
  waiting: { payload: T; lock: boolean } | null;
};
export type LaneSend<T> = { seq: number; payload: T; lock: boolean };

export function laneStart<T>(seq: number): Lane<T> {
  return { seq, busy: false, waiting: null };
}

function next<T>(
  seq: number,
  payload: T,
  lock: boolean,
): { lane: Lane<T>; send: LaneSend<T> | null } {
  // Past 10.000 a step takes nothing more (never in a real game: 45 s).
  if (seq + 1 > KAUPHOLL.seqMax) return { lane: { seq, busy: false, waiting: null }, send: null };
  return {
    lane: { seq: seq + 1, busy: true, waiting: null },
    send: { seq: seq + 1, payload, lock },
  };
}

// A change: sent now when nothing is on its way, else it waits (a lock stays a lock).
export function laneSubmit<T>(
  lane: Lane<T>,
  payload: T,
  lock: boolean,
): { lane: Lane<T>; send: LaneSend<T> | null } {
  if (lane.busy) {
    return {
      lane: { ...lane, waiting: { payload, lock: lock || (lane.waiting?.lock ?? false) } },
      send: null,
    };
  }
  return next(lane.seq, payload, lock);
}

// The answer is back (or the call failed): what waits goes now, after the greater of the phone's
// and the server's seq.
export function laneSettle<T>(
  lane: Lane<T>,
  serverSeq = 0,
): { lane: Lane<T>; send: LaneSend<T> | null } {
  const seq = Math.max(lane.seq, serverSeq);
  if (!lane.waiting) return { lane: { seq, busy: false, waiting: null }, send: null };
  return next(seq, lane.waiting.payload, lane.waiting.lock);
}
