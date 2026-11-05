// Kapsül Anlat at a table of people (docs/SPEC_V4.md §4.F "Adım 4.6.1"): the rules the app and the
// server share. The server (supabase/migrations/20261126090000_kapsul_anlat.sql) freezes the teams,
// keeps the clock, deals the cards and counts the presses; it takes its numbers from
// private.tabu_config(), which tabuGame.test.ts keeps equal to TABU_GAME. The app reads the table's
// open game state (rooms.game_state) through readTabuState and asks the server for the card list
// only on the phones that may see it (tabu/turn-cards: the describer, the other team, watchers).

export const TABU_GAME = {
  turnSeconds: 60,
  totalTurns: 6,
  maxPasses: 3,
  // Tur öncesi: the describer presses "Turu başlat"; when this runs out the turn starts anyway.
  readySeconds: 10,
  // The 3-2-1 between "Turu başlat" and the turn's clock: presses count from startsAt.
  countdownSeconds: 3,
  // Tur sonu, after every turn: the owner presses "Sonraki tura geç"; when this runs out any phone
  // moves on (the owner's decision, 5 November: 30 s as the canvas shows).
  summarySeconds: 30,
  // Cards dealt to a turn at once; a fast table closes one every ~2 seconds.
  cardsPerTurn: 40,
  minPlayers: 4,
  maxPlayers: 12,
} as const;

export const TABU_TEAMS = ['a', 'b'] as const;
// 'a' Mor, 'b' Pembe.
export type TabuTeam = (typeof TABU_TEAMS)[number];

export const TABU_MARKS = ['correct', 'pass', 'taboo'] as const;
// Doğru, Pas, Yasak!
export type TabuMark = (typeof TABU_MARKS)[number];
// Points for the describing team: Doğru +1, Yasak! −1, Pas 0.
export const TABU_POINTS: Record<TabuMark, number> = { correct: 1, pass: 0, taboo: -1 };

export const TABU_PHASES = ['ready', 'turn', 'summary'] as const;
// ready: Tur öncesi; turn: 3-2-1 until startsAt, then the clock until endsAt; summary: Tur sonu.
export type TabuPhase = (typeof TABU_PHASES)[number];

export type TabuCounts = Record<TabuMark, number>;
export type TabuWord = { word: string; result: TabuMark };

// A played turn, for Tur sonu (and the last one on the end screen).
export type TabuTurnSummary = {
  turnNo: number;
  team: TabuTeam;
  describer: string | null;
  score: number;
  counts: TabuCounts;
  words: TabuWord[];
};

// The table's open state of a running game. Session ids are table session ids (rule 4).
export type TabuState = {
  gameNo: number;
  phase: TabuPhase;
  step: number;
  endsAt: string;
  // The turn's 3-2-1 ends here (phase 'turn' only).
  startsAt: string | null;
  turnNo: number;
  totalTurns: number;
  maxPasses: number;
  // Every player in seat order, and the teams in their seat order.
  seats: string[];
  teams: Record<TabuTeam, string[]>;
  // Players who left the game; they stay in seats and teams.
  gone: string[];
  // The turn's describer; null when the team has nobody left.
  describer: string | null;
  scores: Record<TabuTeam, number>;
  cardIndex: number;
  passesUsed: number;
  // The running turn's presses and its closed cards (a card's word opens only once it is closed).
  counts: TabuCounts;
  words: TabuWord[];
  // The turn just played (phase 'summary'; after the last turn too, then the game ends).
  lastTurn: TabuTurnSummary | null;
};

// The end screen's facts (game_state.lastGame.tabu).
export type TabuResult = {
  scores: Record<TabuTeam, number>;
  // null: a draw.
  winner: TabuTeam | null;
  seats: string[];
  teams: Record<TabuTeam, string[]>;
  gone: string[];
  lastTurn: TabuTurnSummary | null;
  // "En çok bildiren anlatıcı" (most Doğru as describer) and "Yasak avcısı" (most Yasak! pressed,
  // K-5); null when nobody has one.
  topDescriber: { sid: string; count: number } | null;
  tabooHunter: { sid: string; count: number } | null;
};

// The team that describes turn `turnNo`: Mor, Pembe, Mor…
export function teamOfTurn(turnNo: number): TabuTeam {
  return turnNo % 2 === 1 ? 'a' : 'b';
}

// The team's players still in the game, in seat order.
export function teamMembers(teams: Record<TabuTeam, string[]>, gone: string[], team: TabuTeam) {
  return teams[team].filter((sid) => !gone.includes(sid));
}

// Turn `turnNo`'s describer: on its team's k-th turn, the team's k-th player still in the game,
// round again when the team is shorter (a team of one describes every turn); null when nobody is left
// (private.tabu_describer).
export function describerOf(
  teams: Record<TabuTeam, string[]>,
  gone: string[],
  turnNo: number,
): string | null {
  const members = teamMembers(teams, gone, teamOfTurn(turnNo));
  if (members.length === 0) return null;
  const k = Math.floor((turnNo + 1) / 2);
  return members[(k - 1) % members.length] ?? null;
}

// The winner by score; null on a draw.
export function winnerOf(scores: Record<TabuTeam, number>): TabuTeam | null {
  if (scores.a === scores.b) return null;
  return scores.a > scores.b ? 'a' : 'b';
}

// What a phone may press in the running turn: the describer Doğru and Pas, the other team Yasak!,
// nobody else anything (a guesser, a watcher, someone who left).
export function mayPress(
  state: Pick<TabuState, 'teams' | 'gone' | 'describer' | 'turnNo'>,
  me: string,
  mark: TabuMark,
): boolean {
  if (state.gone.includes(me)) return false;
  if (mark === 'taboo')
    return state.teams[teamOfTurn(state.turnNo) === 'a' ? 'b' : 'a'].includes(me);
  return state.describer === me;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isTeam(value: unknown): value is TabuTeam {
  return value === 'a' || value === 'b';
}

function isMark(value: unknown): value is TabuMark {
  return (TABU_MARKS as readonly unknown[]).includes(value);
}

function teamsOf(value: unknown): Record<TabuTeam, string[]> {
  const t = isRecord(value) ? value : {};
  return { a: strings(t.a), b: strings(t.b) };
}

function scoresOf(value: unknown): Record<TabuTeam, number> {
  const s = isRecord(value) ? value : {};
  return { a: num(s.a), b: num(s.b) };
}

function countsOf(value: unknown): TabuCounts {
  const c = isRecord(value) ? value : {};
  return { correct: num(c.correct), pass: num(c.pass), taboo: num(c.taboo) };
}

function wordsOf(value: unknown): TabuWord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((w): TabuWord[] =>
    isRecord(w) && typeof w.word === 'string' && isMark(w.result)
      ? [{ word: w.word, result: w.result }]
      : [],
  );
}

function summaryOf(value: unknown): TabuTurnSummary | null {
  if (!isRecord(value) || typeof value.turnNo !== 'number' || !isTeam(value.team)) return null;
  return {
    turnNo: value.turnNo,
    team: value.team,
    describer: typeof value.describer === 'string' ? value.describer : null,
    score: num(value.score),
    counts: countsOf(value.counts),
    words: wordsOf(value.words),
  };
}

function awardOf(value: unknown): { sid: string; count: number } | null {
  return isRecord(value) && typeof value.sid === 'string' && typeof value.count === 'number'
    ? { sid: value.sid, count: value.count }
    : null;
}

export function readTabuState(state: unknown): TabuState | null {
  if (!isRecord(state)) return null;
  const phase = state.phase;
  if (!(TABU_PHASES as readonly unknown[]).includes(phase)) return null;
  if (typeof state.endsAt !== 'string' || typeof state.step !== 'number') return null;
  return {
    gameNo: num(state.gameNo),
    phase: phase as TabuPhase,
    step: state.step,
    endsAt: state.endsAt,
    startsAt: typeof state.startsAt === 'string' ? state.startsAt : null,
    turnNo: num(state.turnNo, 1),
    totalTurns: num(state.totalTurns, TABU_GAME.totalTurns),
    maxPasses: num(state.maxPasses, TABU_GAME.maxPasses),
    seats: strings(state.seats),
    teams: teamsOf(state.teams),
    gone: strings(state.gone),
    describer: typeof state.describer === 'string' ? state.describer : null,
    scores: scoresOf(state.scores),
    cardIndex: num(state.cardIndex),
    passesUsed: num(state.passesUsed),
    counts: countsOf(state.counts),
    words: wordsOf(state.words),
    lastTurn: summaryOf(state.lastTurn),
  };
}

export function readTabuResult(lastGame: unknown): TabuResult | null {
  if (!isRecord(lastGame) || !isRecord(lastGame.tabu)) return null;
  const r = lastGame.tabu;
  return {
    scores: scoresOf(r.scores),
    winner: isTeam(r.winner) ? r.winner : null,
    seats: strings(r.seats),
    teams: teamsOf(r.teams),
    gone: strings(r.gone),
    lastTurn: summaryOf(r.lastTurn),
    topDescriber: awardOf(r.topDescriber),
    tabooHunter: awardOf(r.tabooHunter),
  };
}
