// Vampir Köylü (docs/SPEC_V4.md §4.F "Adım 4.6.6", K-78): the rules the app and the server share.
// The server (supabase/migrations/20261113090000_vampir.sql) deals the roles, keeps the clock and
// settles each phase; it takes its numbers from private.vampir_config(), which vampir.test.ts keeps
// equal to VAMPIR. The app reads the table's open game state (rooms.game_state) through
// readVampirState and asks the server for what only its own phone may know (vampir/view).

export const VAMPIR = {
  roleSeconds: 30,
  nightSeconds: 30,
  morningSeconds: 6,
  daySeconds: 120,
  voteSeconds: 45,
  verdictSeconds: 6,
  minPlayers: 5,
  maxPlayers: 12,
} as const;

export const VAMPIR_ROLES = ['vampir', 'doktor', 'gozcu', 'soytari', 'koylu'] as const;
export type VampirRole = (typeof VAMPIR_ROLES)[number];

// The sides: the vampires, the villagers (the doctor and the seer with them), the jester alone.
export type VampirSide = 'v' | 'k' | 'j';

export function sideOf(role: VampirRole): VampirSide {
  if (role === 'vampir') return 'v';
  if (role === 'soytari') return 'j';
  return 'k';
}

// How many vampires `players` players have: 1 for 5–6, 2 for 7–9, 3 for 10–12.
export function vampireCount(players: number): number {
  return players <= 6 ? 1 : players <= 9 ? 2 : 3;
}

// The roles for `players` players, in no order (private.vampir_deck deals the same).
export function roleDeck(players: number): VampirRole[] {
  const deck: VampirRole[] = [
    ...Array.from({ length: vampireCount(players) }, (): VampirRole => 'vampir'),
    'doktor',
    'gozcu',
  ];
  if (players >= 6) deck.push('soytari');
  while (deck.length < players) deck.push('koylu');
  return deck;
}

export const VAMPIR_PHASES = ['role', 'night', 'morning', 'day', 'vote', 'verdict'] as const;
export type VampirPhase = (typeof VAMPIR_PHASES)[number];

export type VampirDeath = {
  sid: string;
  role: VampirRole;
  when: 'night' | 'vote';
  round: number;
};

// The table's open state of a running game.
export type VampirState = {
  gameNo: number;
  phase: VampirPhase;
  step: number;
  endsAt: string;
  round: number;
  seats: string[];
  dead: VampirDeath[];
  gone: string[];
  ready: string[];
  // How many chose tonight (never who).
  acted: number;
  // The day's votes, open (K-78): voter → the one they voted for.
  votes: Record<string, string>;
  // Last night's dead (morning), the one voted out (verdict); null: nobody.
  victim: string | null;
  out: string | null;
  // Set when the morning or the verdict ends the game.
  winner: VampirSide | null;
};

// The end screen's facts (game_state.lastGame.vampir): the roles of those still in the game.
export type VampirResult = {
  winner: VampirSide;
  roles: Record<string, VampirRole>;
  seats: string[];
  dead: VampirDeath[];
  gone: string[];
  round: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function isRole(value: unknown): value is VampirRole {
  return (VAMPIR_ROLES as readonly unknown[]).includes(value);
}

function isSide(value: unknown): value is VampirSide {
  return value === 'v' || value === 'k' || value === 'j';
}

function deaths(value: unknown): VampirDeath[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((d): VampirDeath[] =>
    isRecord(d) &&
    typeof d.sid === 'string' &&
    isRole(d.role) &&
    (d.when === 'night' || d.when === 'vote')
      ? [
          {
            sid: d.sid,
            role: d.role,
            when: d.when,
            round: typeof d.round === 'number' ? d.round : 1,
          },
        ]
      : [],
  );
}

function stringMap(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isRecord(value)) return out;
  for (const [k, v] of Object.entries(value)) if (typeof v === 'string') out[k] = v;
  return out;
}

export function readVampirState(state: unknown): VampirState | null {
  if (!isRecord(state)) return null;
  const phase = state.phase;
  if (!(VAMPIR_PHASES as readonly unknown[]).includes(phase)) return null;
  if (typeof state.endsAt !== 'string' || typeof state.step !== 'number') return null;
  return {
    gameNo: typeof state.gameNo === 'number' ? state.gameNo : 0,
    phase: phase as VampirPhase,
    step: state.step,
    endsAt: state.endsAt,
    round: typeof state.round === 'number' ? state.round : 0,
    seats: strings(state.seats),
    dead: deaths(state.dead),
    gone: strings(state.gone),
    ready: strings(state.ready),
    acted: typeof state.acted === 'number' ? state.acted : 0,
    votes: stringMap(state.votes),
    victim: typeof state.victim === 'string' ? state.victim : null,
    out: typeof state.out === 'string' ? state.out : null,
    winner: isSide(state.winner) ? state.winner : null,
  };
}

export function readVampirResult(state: unknown): VampirResult | null {
  if (!isRecord(state) || !isRecord(state.lastGame)) return null;
  const last = state.lastGame;
  if (last.concept !== 'vampir' || last.abandoned === true || !isRecord(last.vampir)) return null;
  const v = last.vampir;
  if (!isSide(v.winner)) return null;
  const roles: Record<string, VampirRole> = {};
  if (isRecord(v.roles)) for (const [k, r] of Object.entries(v.roles)) if (isRole(r)) roles[k] = r;
  return {
    winner: v.winner,
    roles,
    seats: strings(v.seats),
    dead: deaths(v.dead),
    gone: strings(v.gone),
    round: typeof v.round === 'number' ? v.round : 0,
  };
}

// The seats still in the game and alive, in seat order.
export function aliveSeats(state: Pick<VampirState, 'seats' | 'dead' | 'gone'>): string[] {
  const dead = new Set(state.dead.map((d) => d.sid));
  const gone = new Set(state.gone);
  return state.seats.filter((s) => !dead.has(s) && !gone.has(s));
}

// Whom a living player may choose tonight (private.vampir_pick checks the same): a vampire, the
// living who are not vampires (its mates are known to it); the doctor, the living but last night's
// protected one; everyone else, the living but themselves.
export function nightTargets(
  state: Pick<VampirState, 'seats' | 'dead' | 'gone'>,
  me: string,
  role: VampirRole,
  mates: readonly string[],
  lastSave: string | null,
): string[] {
  const alive = aliveSeats(state);
  if (role === 'vampir') return alive.filter((s) => s !== me && !mates.includes(s));
  if (role === 'doktor') return alive.filter((s) => s !== lastSave);
  return alive.filter((s) => s !== me);
}

// The open count of the day's vote: votes each living person got from the living.
export function voteTally(state: Pick<VampirState, 'votes' | 'seats' | 'dead' | 'gone'>) {
  const alive = new Set(aliveSeats(state));
  const tally: Record<string, number> = {};
  for (const [voter, target] of Object.entries(state.votes)) {
    if (!alive.has(voter) || !alive.has(target)) continue;
    tally[target] = (tally[target] ?? 0) + 1;
  }
  return tally;
}

// Who voted for `target`, in seat order.
export function votersFor(state: Pick<VampirState, 'votes' | 'seats'>, target: string): string[] {
  return state.seats.filter((s) => state.votes[s] === target);
}

// Did `side` win: every vampire's side when the vampires won, and so on; the jester alone.
export function wonGame(role: VampirRole, winner: VampirSide): boolean {
  return sideOf(role) === winner;
}

// What only the caller's phone may know (vampir/view, vampir/pick).
export type VampirView =
  | { role: null }
  | {
      role: VampirRole;
      mates: string[];
      pick: string | null;
      matePicks: Record<string, string>;
      seen: { sid: string; vampire: boolean; round: number }[];
      lastSave: string | null;
    };

export function readVampirView(value: unknown): VampirView {
  if (!isRecord(value) || !isRole(value.role)) return { role: null };
  const seen = Array.isArray(value.seen)
    ? value.seen.flatMap((s) =>
        isRecord(s) && typeof s.sid === 'string' && typeof s.vampire === 'boolean'
          ? [{ sid: s.sid, vampire: s.vampire, round: typeof s.round === 'number' ? s.round : 1 }]
          : [],
      )
    : [];
  return {
    role: value.role,
    mates: strings(value.mates),
    pick: typeof value.pick === 'string' ? value.pick : null,
    matePicks: stringMap(value.matePicks),
    seen,
    lastSave: typeof value.lastSave === 'string' ? value.lastSave : null,
  };
}
