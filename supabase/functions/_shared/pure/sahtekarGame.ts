// Krot (Sahtekar) at a table of people (docs/SPEC_V4.md §4.F "Adım 4.6.3", K-71): the rules the app
// and the server share. The server (supabase/migrations/20261129090000_sahtekar_v4.sql) deals the
// roles and the word, keeps the clock, the clue order and the secret votes; it takes its numbers
// from private.sahtekar_config(), which sahtekarGame.test.ts keeps equal to SAHTEKAR_GAME. The app
// reads the table's open state (rooms.game_state) through readSahtekarState and asks for its own role
// with sahtekar/view (rule 3).

import { wordForm } from './trText.ts';

export const SAHTEKAR_GAME = {
  // The role card: everyone presses Hazırım; when this runs out the clues start anyway (§4.F).
  roleSeconds: 30,
  // Each speaker's turn in the clue rounds (K-71).
  clueSeconds: 30,
  clueRounds: 2,
  voteSeconds: 90,
  // Sonuç: the votes and who was caught; then Son şans or the end.
  resultSeconds: 15,
  // Son şans: the caught impostors' one written guess.
  guessSeconds: 15,
  // From this many players there are two impostors, who do not know each other (K-71).
  twoImpostorsFrom: 7,
  minPlayers: 3,
  maxPlayers: 12,
} as const;

export const SAHTEKAR_PHASES = ['role', 'clue', 'vote', 'result', 'guess'] as const;
// role: Rolünü gör + Hazırım; clue: İpucu turu 1/2, one speaker at a time; vote: Oylama; result:
// Sonuç; guess: Son şans.
export type SahtekarGamePhase = (typeof SAHTEKAR_PHASES)[number];

// The table's open state of a running game. Session ids are table session ids (rule 4). Before
// Sonuç it names no impostor, holds no word and no vote's target (rule 3).
export type SahtekarGameState = {
  gameNo: number;
  phase: SahtekarGamePhase;
  step: number;
  endsAt: string;
  // Every player in seat order (the clue order of one round), and who left the game.
  seats: string[];
  gone: string[];
  // How many impostors there are (1, or 2 from 7 players); everyone votes for this many.
  impostors: number;
  // The word's category: every role knows it.
  category: string;
  // role: who pressed Hazırım.
  ready: string[];
  // clue: the round (1-based), the speaker and who speaks next (null: the last of the rounds).
  round: number;
  speaker: string | null;
  next: string | null;
  // vote: who voted (never for whom).
  voted: string[];
  // From Sonuç: the votes each player got, the accused, who of them were impostors, the impostors
  // who escaped.
  tally: Record<string, number>;
  accused: string[];
  caught: string[];
  escaped: string[];
};

export type SahtekarEnd = 'table' | 'impostors' | 'impostor_left';

// The end screen's facts (game_state.lastGame.sahtekar).
export type SahtekarGameResult = {
  // table: every impostor caught and the guess missed; impostors: one escaped or the guess hit;
  // impostor_left: an impostor left the game, nobody scores (§4.F).
  winner: SahtekarEnd;
  word: string;
  category: string;
  seats: string[];
  gone: string[];
  // The impostors still in the game at the end; who left keeps their role hidden.
  impostorSeats: string[];
  tally: Record<string, number>;
  accused: string[];
  caught: string[];
  // Whether the caught impostors guessed the word (null: nobody was caught, or no guess came). The
  // guess itself is never kept (§4.F).
  guessedRight: boolean | null;
  // The players who voted for an impostor ("Doğru oy verenler").
  rightVoters: string[];
};

// What a phone may know of its own role (sahtekar/view). A watcher sees the word and the impostors;
// an impostor only the category; whoever left the game nothing.
export type SahtekarView =
  | { role: 'player'; category: string; word: string }
  | { role: 'impostor'; category: string }
  | { role: 'watcher'; category: string; word: string; impostorSeats: string[] }
  | { role: null };

// How many impostors for `players` players.
export function impostorCount(players: number): number {
  return players >= SAHTEKAR_GAME.twoImpostorsFrom ? 2 : 1;
}

// The accused (private.sahtekar_accused): the most voted, as many as there are impostors. Players
// with the same count go in together while they fit; a count shared across the last place leaves
// that place empty (§4.F: "sınırda oy eşitliği varsa o koltuk boş kalır"). Nobody with no vote.
export function accusedOf(tally: Readonly<Record<string, number>>, seats: number): string[] {
  const groups = new Map<number, string[]>();
  for (const [sid, n] of Object.entries(tally)) {
    if (n <= 0) continue;
    groups.set(n, [...(groups.get(n) ?? []), sid]);
  }
  const accused: string[] = [];
  for (const n of [...groups.keys()].sort((a, b) => b - a)) {
    const group = groups.get(n) ?? [];
    if (accused.length + group.length > seats) break;
    accused.push(...group);
  }
  return accused;
}

// The votes each player got from the ballots ({voter: [targets]}).
export function tallyOf(
  votes: Readonly<Record<string, readonly string[]>>,
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const targets of Object.values(votes))
    for (const t of targets) tally[t] = (tally[t] ?? 0) + 1;
  return tally;
}

// May `me` vote for `targets` (private.sahtekar_vote checks the same)? Exactly as many distinct
// players still in the game as there are impostors, never oneself.
export function mayVote(
  state: Pick<SahtekarGameState, 'seats' | 'gone' | 'impostors'>,
  me: string,
  targets: readonly string[],
): boolean {
  const open = state.seats.filter((s) => !state.gone.includes(s));
  return (
    open.includes(me) &&
    targets.length === state.impostors &&
    new Set(targets).size === targets.length &&
    targets.every((t) => t !== me && open.includes(t))
  );
}

// The table wins only when every impostor is caught and the guess misses (§4.F).
export function winnerOf(
  impostors: number,
  caught: number,
  guessedRight: boolean | null,
): 'table' | 'impostors' {
  return caught >= impostors && guessedRight !== true ? 'table' : 'impostors';
}

// The written last chance (§4.F): case, spaces and punctuation do not count (trText, rule 7).
export function guessMatches(guess: string, word: string): boolean {
  const g = wordForm(guess);
  return g !== '' && g === wordForm(word);
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

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function counts(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((e): e is [string, number] => typeof e[1] === 'number'),
  );
}

export function readSahtekarState(state: unknown): SahtekarGameState | null {
  if (!isRecord(state)) return null;
  const phase = state.phase;
  if (!(SAHTEKAR_PHASES as readonly unknown[]).includes(phase)) return null;
  if (typeof state.endsAt !== 'string' || typeof state.step !== 'number') return null;
  return {
    gameNo: num(state.gameNo),
    phase: phase as SahtekarGamePhase,
    step: state.step,
    endsAt: state.endsAt,
    seats: strings(state.seats),
    gone: strings(state.gone),
    impostors: num(state.impostors, 1),
    category: str(state.category) ?? '',
    ready: strings(state.ready),
    round: num(state.round, 1),
    speaker: str(state.speaker),
    next: str(state.next),
    voted: strings(state.voted),
    tally: counts(state.tally),
    accused: strings(state.accused),
    caught: strings(state.caught),
    escaped: strings(state.escaped),
  };
}

const ENDS: readonly SahtekarEnd[] = ['table', 'impostors', 'impostor_left'];

export function readSahtekarResult(state: unknown): SahtekarGameResult | null {
  if (!isRecord(state) || !isRecord(state.lastGame)) return null;
  const last = state.lastGame;
  if (last.concept !== 'sahtekar' || last.abandoned === true || !isRecord(last.sahtekar)) {
    return null;
  }
  const r = last.sahtekar;
  if (!(ENDS as readonly unknown[]).includes(r.winner)) return null;
  return {
    winner: r.winner as SahtekarEnd,
    word: str(r.word) ?? '',
    category: str(r.category) ?? '',
    seats: strings(r.seats),
    gone: strings(r.gone),
    impostorSeats: strings(r.impostorSeats),
    tally: counts(r.tally),
    accused: strings(r.accused),
    caught: strings(r.caught),
    guessedRight: typeof r.guessedRight === 'boolean' ? r.guessedRight : null,
    rightVoters: strings(r.rightVoters),
  };
}

export function readSahtekarView(value: unknown): SahtekarView {
  if (!isRecord(value)) return { role: null };
  const category = str(value.category) ?? '';
  const word = str(value.word);
  if (value.role === 'impostor') return { role: 'impostor', category };
  if (value.role === 'player' && word !== null) return { role: 'player', category, word };
  if (value.role === 'watcher' && word !== null) {
    return { role: 'watcher', category, word, impostorSeats: strings(value.impostorSeats) };
  }
  return { role: null };
}
