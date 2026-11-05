// Kibrit (docs/SPEC_V4.md §4.F "Adım 4.6.9", K-86): the rules the app and the server share. The
// server (supabase/migrations/*_kibrit.sql) keeps the papers, their authors and the votes in tables
// closed to every client, keeps the clock and settles each phase; it takes its numbers from
// private.kibrit_config(), which kibrit.test.ts keeps equal to KIBRIT. The app reads the table's
// open game state (rooms.game_state) through readKibritState and asks the server only for its own
// paper and vote (kibrit/view).
import { containsContact, containsProfanity, type PreparedTerms } from './profanity.ts';

export const KIBRIT = {
  writeSeconds: 60,
  jarSeconds: 3,
  drawSeconds: 15,
  openSeconds: 10,
  voteSeconds: 20,
  // The result screen waits for the owner or for everyone ready; this is only the safety net.
  resultSeconds: 120,
  // Who lost their vote to a player leaving gets at least this long to choose again.
  regraceSeconds: 8,
  minPlayers: 3,
  maxPlayers: 12,
  defaultRounds: 5,
  // The game needs papers from at least this many different players.
  minAuthors: 3,
  maxLength: 80,
  // A person's writes or votes in one step.
  maxRevisions: 20,
  // From this many players every count shows; below, only who got the most.
  countsFrom: 5,
} as const;

export const KIBRIT_PHASES = ['write', 'jar', 'draw', 'open', 'vote', 'result'] as const;
export type KibritPhase = (typeof KIBRIT_PHASES)[number];

// The round limit of the pre-game chip: 1 to the players, `min(5, players)` by default.
export function roundLimit(players: number, chosen?: number | null): number {
  const most = Math.max(1, players);
  if (chosen === undefined || chosen === null) return Math.min(KIBRIT.defaultRounds, most);
  return Math.min(Math.max(1, Math.floor(chosen)), most);
}

// The rounds played: the limit or the valid papers, the smaller.
export function roundCount(limit: number, papers: number): number {
  return Math.max(0, Math.min(limit, papers));
}

export function showsCounts(players: number): boolean {
  return players >= KIBRIT.countsFrom;
}

export type QuestionCheck =
  { ok: true; value: string } | { ok: false; reason: 'length' | 'contact' | 'profanity' };

// A question as it goes on the paper: inner whitespace collapsed, 1 to 80 characters, no phone,
// e-mail, username or link (rule 7, K-86), no profanity.
export function checkKibritQuestion(raw: string, terms: PreparedTerms): QuestionCheck {
  const value = raw.trim().replace(/\s+/g, ' ');
  const length = [...value].length;
  if (length < 1 || length > KIBRIT.maxLength) return { ok: false, reason: 'length' };
  if (containsContact(value)) return { ok: false, reason: 'contact' };
  if (containsProfanity(value, terms)) return { ok: false, reason: 'profanity' };
  return { ok: true, value };
}

// One round's result as the table sees it. `counts` only from five players (every player in the
// game, 0 included); below, only `top`. `top` is empty when nobody voted.
export type KibritResult = {
  paperId: string;
  text: string;
  players: number;
  voters: number;
  top: string[];
  counts?: Record<string, number>;
};

// A finished round in the summary: its question and who got the most (`votes` from five players).
export type KibritPast = {
  paperId: string;
  text: string;
  top: string[];
  votes: number | null;
};

export type KibritState = {
  phase: KibritPhase;
  step: number;
  endsAt: string;
  seats: string[];
  gone: string[];
  limit: number;
  rounds: number;
  done: number;
  written: number;
  papers: number;
  drawer: string | null;
  paper: { id: string; text: string } | null;
  voted: number;
  result: KibritResult | null;
  ready: string[];
  past: KibritPast[];
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function readPast(v: unknown): KibritPast[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isRecord).map((p) => ({
    paperId: typeof p.paperId === 'string' ? p.paperId : '',
    text: typeof p.text === 'string' ? p.text : '',
    top: strings(p.top),
    votes: typeof p.votes === 'number' ? p.votes : null,
  }));
}

function readResult(v: unknown): KibritResult | null {
  if (!isRecord(v)) return null;
  const counts = isRecord(v.counts)
    ? Object.fromEntries(Object.entries(v.counts).map(([k, n]) => [k, num(n)]))
    : undefined;
  return {
    paperId: typeof v.paperId === 'string' ? v.paperId : '',
    text: typeof v.text === 'string' ? v.text : '',
    players: num(v.players),
    voters: num(v.voters),
    top: strings(v.top),
    ...(counts ? { counts } : {}),
  };
}

// The table's open state of a running game (rooms.game_state), or null.
export function readKibritState(state: unknown): KibritState | null {
  if (!isRecord(state)) return null;
  const phase = KIBRIT_PHASES.find((p) => p === state.phase);
  if (!phase || typeof state.endsAt !== 'string') return null;
  const paper =
    isRecord(state.paper) && typeof state.paper.id === 'string'
      ? { id: state.paper.id, text: typeof state.paper.text === 'string' ? state.paper.text : '' }
      : null;
  return {
    phase,
    step: num(state.step),
    endsAt: state.endsAt,
    seats: strings(state.seats),
    gone: strings(state.gone),
    limit: num(state.limit),
    rounds: num(state.rounds),
    done: num(state.done),
    written: num(state.written),
    papers: num(state.papers),
    drawer: typeof state.drawer === 'string' ? state.drawer : null,
    paper,
    voted: num(state.voted),
    result: readResult(state.result),
    ready: strings(state.ready),
    past: readPast(state.past),
  };
}

// Those still in the game, in seat order.
export function activeSeats(state: Pick<KibritState, 'seats' | 'gone'>): string[] {
  return state.seats.filter((s) => !state.gone.includes(s));
}

// The end screen's summary (rooms.game_state.lastGame.kibrit), or null.
export type KibritOutcome = {
  notEnough: boolean;
  rounds: number;
  players: number;
  past: KibritPast[];
};

export function readKibritResult(state: unknown): KibritOutcome | null {
  if (!isRecord(state) || !isRecord(state.lastGame)) return null;
  const last = state.lastGame;
  if (last.concept !== 'kibrit' || last.abandoned === true || !isRecord(last.kibrit)) return null;
  const k = last.kibrit;
  return {
    notEnough: k.notEnough === true,
    rounds: num(k.rounds),
    players: num(k.players),
    past: readPast(k.past),
  };
}

// What only the caller's phone may know: its own paper while writing, its own vote while voting.
export type KibritView = {
  paper: string | null;
  paperRev: number;
  vote: string | null;
  voteRev: number;
};

export function readKibritView(v: unknown): KibritView {
  const r = isRecord(v) ? v : {};
  return {
    paper: typeof r.paper === 'string' ? r.paper : null,
    paperRev: num(r.paperRev),
    vote: typeof r.vote === 'string' ? r.vote : null,
    voteRev: num(r.voteRev),
  };
}

// The server's count (private.kibrit_reveal): who got the most among the players still in the game,
// and every count from five players. A vote for someone who left does not count for anyone, but
// its voter, still in the game, is one of those who voted (the same measure as the table's count).
export function tally(
  votes: Record<string, string>,
  active: string[],
): Pick<KibritResult, 'players' | 'voters' | 'top' | 'counts'> {
  const counts: Record<string, number> = Object.fromEntries(active.map((s) => [s, 0]));
  let voters = 0;
  for (const [voter, target] of Object.entries(votes)) {
    if (!active.includes(voter)) continue;
    voters += 1;
    if (active.includes(target)) counts[target] = (counts[target] ?? 0) + 1;
  }
  const most = Math.max(0, ...Object.values(counts));
  const top = most === 0 ? [] : active.filter((s) => counts[s] === most);
  return {
    players: active.length,
    voters,
    top,
    ...(showsCounts(active.length) ? { counts } : {}),
  };
}
