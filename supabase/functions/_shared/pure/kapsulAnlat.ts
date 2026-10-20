// Kapsül Anlat (docs/SPEC_V4.md §4.F, adım 4.6.1): the table's person-based Tabu. Two teams, Mor
// ('a') and Pembe ('b'), and the watchers; six turns, the teams take turns and within a team the
// describer goes round in the order the game froze at its start. Roles are the server's (rule 3):
// the SQL functions of the `tabu` Edge Function apply the same rules as here, with the numbers of
// KAPSUL_ANLAT (private.kapsul_config(); the integration tests check that they agree).
//
// The card goes to the describer, the other team and the watchers; never to the describer's
// teammates (tabu/turn-cards). rooms.game_state, game_events and Realtime never carry the card being
// played: a card's word reaches the table (its card_closed event and the turn's summary) only once
// it closes.

export const KAPSUL_ANLAT = {
  totalTurns: 6,
  turnSeconds: 60,
  maxPasses: 3,
  // Cards dealt to a turn at once; a fast table closes a card every ~2 seconds.
  cardsPerTurn: 40,
  // The turn waits for its describer's "Turu başlat"; after this anyone at the table may start it.
  readySeconds: 10,
  // "3-2-1": the clock is set when the turn starts, the marks open this much later.
  countdownSeconds: 3,
  // The turn's end screen: the owner moves on ("Sonraki tura geç"); after this anyone may.
  nextSeconds: 15,
} as const;

export const KAPSUL_TEAMS = ['a', 'b'] as const;
export type KapsulTeam = (typeof KAPSUL_TEAMS)[number];

// Doğru and Pas are the describer's, Yasak! ('taboo') the other team's.
export const KAPSUL_MARKS = ['correct', 'pass', 'taboo'] as const;
export type KapsulMark = (typeof KAPSUL_MARKS)[number];

// Points for the describing team: Doğru +1, Yasak! −1, Pas 0.
export const KAPSUL_POINTS: Record<KapsulMark, number> = { correct: 1, pass: 0, taboo: -1 };

// A person's role in the current turn (§4.F): the describer, the describer's teammates (guessers),
// the other team (opponents) and the watchers: who chose to watch or chose nothing, and who sat down
// during the game. A player who left the game ('left', "Oyundan çık" or leaving the table) gets
// nothing a watcher gets.
export type KapsulRole = 'describer' | 'guesser' | 'opponent' | 'observer' | 'left';

export function describingTeam(turnNo: number): KapsulTeam {
  return turnNo % 2 === 1 ? 'a' : 'b';
}

export function otherTeam(team: KapsulTeam): KapsulTeam {
  return team === 'a' ? 'b' : 'a';
}

// The team's n-th turn is described by its n-th person in the frozen order, among those still
// playing: a team down to one person describes every turn with that person. Null: nobody left.
export function describerFor(stillPlaying: readonly string[], turnNo: number): string | null {
  if (stillPlaying.length === 0) return null;
  const nth = Math.ceil(turnNo / 2) - 1;
  return stillPlaying[nth % stillPlaying.length] ?? null;
}

export function roleOf(state: KapsulState, sessionId: string): KapsulRole {
  if (state.left.includes(sessionId)) return 'left';
  const team = KAPSUL_TEAMS.find((t) => state.teams[t].includes(sessionId));
  if (!team) return 'observer';
  if (team !== state.describingTeam) return 'opponent';
  return state.describer === sessionId ? 'describer' : 'guesser';
}

export type MarkRefusal = 'not_player' | 'not_describer' | 'not_judge';

// Who may press what (§4.F, the role table): Doğru and Pas the describer, Yasak! the other team;
// a watcher or a player who left presses nothing.
export function markRefusal(role: KapsulRole, mark: KapsulMark): MarkRefusal | null {
  if (role === 'observer' || role === 'left') return 'not_player';
  if (mark === 'taboo') return role === 'opponent' ? null : 'not_judge';
  return role === 'describer' ? null : 'not_describer';
}

// Who holds the turn's card list (tabu/turn-cards).
export function seesCards(role: KapsulRole): boolean {
  return role === 'describer' || role === 'opponent' || role === 'observer';
}

// ready: waiting for "Turu başlat" (readyEndsAt); running: the countdown until startsAt, the clock
// until endsAt; over: the turn's end screen until the owner or, after nextAt, anyone moves on.
export type KapsulTurnPhase = 'ready' | 'running' | 'over';

export type KapsulCounts = Record<KapsulMark, number>;

export type KapsulTurnSummary = {
  turnNo: number;
  team: KapsulTeam;
  describer: string | null;
  score: number;
  counts: KapsulCounts;
  // The turn's closed cards in order, with how they closed ("Tur sonu").
  cards: { word: string; result: KapsulMark }[];
};

export type KapsulState = {
  gameNo: number;
  turnNo: number;
  totalTurns: number;
  turnSeconds: number;
  maxPasses: number;
  countdownSeconds: number;
  // The players in the order frozen at the start (table session ids, rule 4) and those who left.
  teams: Record<KapsulTeam, string[]>;
  left: string[];
  scores: Record<KapsulTeam, number>;
  describingTeam: KapsulTeam;
  describer: string | null;
  turnPhase: KapsulTurnPhase;
  readyEndsAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  nextAt: string | null;
  // The card being played in the turn's list, and "Bu turun sayıları".
  cardIndex: number;
  passesUsed: number;
  counts: KapsulCounts;
  // The end screen of the turn just played; the next turn's team and describer (null after the
  // last turn: "Sonuçları gör").
  lastTurn: KapsulTurnSummary | null;
  next: { team: KapsulTeam; describer: string | null } | null;
};

// The scores after a press; the same rule as tabu_mark.
export function scoresAfter(
  scores: Record<KapsulTeam, number>,
  team: KapsulTeam,
  mark: KapsulMark,
): Record<KapsulTeam, number> {
  return { ...scores, [team]: scores[team] + KAPSUL_POINTS[mark] };
}

export function winnerOf(scores: Record<KapsulTeam, number>): KapsulTeam | null {
  if (scores.a === scores.b) return null;
  return scores.a > scores.b ? 'a' : 'b';
}

// "En çok bildiren anlatıcı" and "Yasak avcısı" (K-5): the most Doğru as describer and the most
// Yasak!, among the players at the end; a tie goes to the earlier in the frozen order. The hunter is
// not the describer already shown; nobody with none.
export type Highlight = { sessionId: string; count: number };

export function highlight(
  counts: ReadonlyMap<string, number>,
  order: readonly string[],
  not: string | null = null,
): Highlight | null {
  let best: Highlight | null = null;
  for (const sessionId of order) {
    const count = counts.get(sessionId) ?? 0;
    if (sessionId === not || count <= 0) continue;
    if (!best || count > best.count) best = { sessionId, count };
  }
  return best;
}

// The finished game as rooms.game_state.lastGame holds it between games.
export type KapsulLastGame = {
  concept: 'tabu';
  abandoned: boolean;
  scores: Record<KapsulTeam, number> | null;
  winner: KapsulTeam | null;
  teams: Record<KapsulTeam, string[]> | null;
  bestDescriber: Highlight | null;
  tabooHunter: Highlight | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const str = (v: unknown): v is string => typeof v === 'string';
const strOrNull = (v: unknown): string | null => (str(v) ? v : null);
const ids = (v: unknown): string[] | null =>
  Array.isArray(v) && v.every(str) ? (v as string[]) : null;
const isTeam = (v: unknown): v is KapsulTeam => v === 'a' || v === 'b';
const isMark = (v: unknown): v is KapsulMark => (KAPSUL_MARKS as readonly unknown[]).includes(v);

function teamsOf(v: unknown): Record<KapsulTeam, string[]> | null {
  if (!isRecord(v)) return null;
  const a = ids(v.a);
  const b = ids(v.b);
  return a && b ? { a, b } : null;
}

function scoresOf(v: unknown): Record<KapsulTeam, number> | null {
  return isRecord(v) && num(v.a) && num(v.b) ? { a: v.a, b: v.b } : null;
}

function countsOf(v: unknown): KapsulCounts {
  const c = isRecord(v) ? v : {};
  return {
    correct: num(c.correct) ? c.correct : 0,
    pass: num(c.pass) ? c.pass : 0,
    taboo: num(c.taboo) ? c.taboo : 0,
  };
}

function highlightOf(v: unknown): Highlight | null {
  return isRecord(v) && str(v.sessionId) && num(v.count)
    ? { sessionId: v.sessionId, count: v.count }
    : null;
}

function summaryOf(v: unknown): KapsulTurnSummary | null {
  if (!isRecord(v) || !num(v.turnNo) || !isTeam(v.team) || !num(v.score)) return null;
  const cards = Array.isArray(v.cards)
    ? v.cards.flatMap((c: unknown) =>
        isRecord(c) && str(c.word) && isMark(c.result) ? [{ word: c.word, result: c.result }] : [],
      )
    : [];
  return {
    turnNo: v.turnNo,
    team: v.team,
    describer: strOrNull(v.describer),
    score: v.score,
    counts: countsOf(v.counts),
    cards,
  };
}

// rooms.game_state while Kapsül Anlat runs (rooms.concept = 'tabu'), or null.
export function parseKapsulState(value: unknown): KapsulState | null {
  if (!isRecord(value) || value.phase !== 'playing') return null;
  const v = value;
  const teams = teamsOf(v.teams);
  const scores = scoresOf(v.scores);
  const phase = v.turnPhase;
  if (
    !teams ||
    !scores ||
    !num(v.gameNo) ||
    !num(v.turnNo) ||
    !num(v.totalTurns) ||
    !num(v.turnSeconds) ||
    !num(v.maxPasses) ||
    !num(v.countdownSeconds) ||
    !isTeam(v.describingTeam) ||
    !num(v.cardIndex) ||
    !num(v.passesUsed) ||
    (phase !== 'ready' && phase !== 'running' && phase !== 'over')
  ) {
    return null;
  }
  const next = isRecord(v.next) && isTeam(v.next.team) ? v.next : null;
  return {
    gameNo: v.gameNo,
    turnNo: v.turnNo,
    totalTurns: v.totalTurns,
    turnSeconds: v.turnSeconds,
    maxPasses: v.maxPasses,
    countdownSeconds: v.countdownSeconds,
    teams,
    left: ids(v.left) ?? [],
    scores,
    describingTeam: v.describingTeam,
    describer: strOrNull(v.describer),
    turnPhase: phase,
    readyEndsAt: strOrNull(v.readyEndsAt),
    startsAt: strOrNull(v.startsAt),
    endsAt: strOrNull(v.endsAt),
    nextAt: strOrNull(v.nextAt),
    cardIndex: v.cardIndex,
    passesUsed: v.passesUsed,
    counts: countsOf(v.counts),
    lastTurn: summaryOf(v.lastTurn),
    next: next ? { team: next.team as KapsulTeam, describer: strOrNull(next.describer) } : null,
  };
}

// rooms.game_state.lastGame after a Kapsül Anlat game, or null for another game's.
export function parseKapsulLastGame(state: unknown): KapsulLastGame | null {
  const last = isRecord(state) ? state.lastGame : null;
  if (!isRecord(last) || last.concept !== 'tabu') return null;
  return {
    concept: 'tabu',
    abandoned: last.abandoned === true,
    scores: scoresOf(last.scores),
    winner: isTeam(last.winner) ? last.winner : null,
    teams: teamsOf(last.teams),
    bestDescriber: highlightOf(last.bestDescriber),
    tabooHunter: highlightOf(last.tabooHunter),
  };
}
