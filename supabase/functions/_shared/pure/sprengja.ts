// Sprengja (docs/SPEC_V4.md §4.F "Adım 4.6.7", K-85): the bomb goes from hand to hand. The rules
// the app and the server share. The server (supabase/migrations/20261128090000_sprengja.sql) keeps
// the hidden fuse, the bomb's holder and the score; it takes its numbers from
// private.sprengja_config(), which sprengja.test.ts keeps equal to SPRENGJA. The app reads the
// table's open game state (rooms.game_state) through readSprengjaState. The moment the bomb goes off
// is never in it, nor in any answer or event (rule 3, K-85 O-4).

export const SPRENGJA = {
  minPlayers: 3,
  maxPlayers: 8,
  // Rounds: min(maxRounds, max(minRounds, n)), n the players at the start.
  minRounds: 5,
  maxRounds: 8,
  // The hidden fuse of a round: uniform between lowBaseMs + n·lowPerPlayerMs and
  // highBaseMs + n·highPerPlayerMs.
  lowBaseMs: 8000,
  lowPerPlayerMs: 1500,
  highBaseMs: 18000,
  highPerPlayerMs: 3500,
  // The hard letter groups come into the pool from this many players.
  hardFrom: 6,
  // Tur sonu: everyone ready, or this long (the frame's rule for screens between rounds).
  summarySeconds: 15,
  // How often phones ask the server whether the fuse ran out (sprengja/poll), when the server's
  // own job (pg_cron, every second) is off: the holder, the next player, everyone else.
  holderPollMs: 1000,
  nextPollMs: 3000,
  othersPollMs: 10000,
  // With the job on, only the holder asks, as a fallback.
  cronHolderPollMs: 2000,
} as const;

export const SPRENGJA_TIERS = ['kolay', 'orta', 'zor'] as const;
export type SprengjaTier = (typeof SPRENGJA_TIERS)[number];

// The rounds of a game of `players` players.
export function roundsFor(players: number): number {
  return Math.min(SPRENGJA.maxRounds, Math.max(SPRENGJA.minRounds, players));
}

// The hidden fuse's bounds for `players` players, in milliseconds.
export function fuseRange(players: number): { lowMs: number; highMs: number } {
  return {
    lowMs: SPRENGJA.lowBaseMs + players * SPRENGJA.lowPerPlayerMs,
    highMs: SPRENGJA.highBaseMs + players * SPRENGJA.highPerPlayerMs,
  };
}

// The fuse for a uniform draw `u` in [0, 1) (the server draws u from pgcrypto).
export function fuseMs(players: number, u: number): number {
  const { lowMs, highMs } = fuseRange(players);
  return Math.floor(lowMs + (highMs - lowMs) * u);
}

// The tiers a game of `players` players draws its letter groups from (K-85 O-12).
export function tiersFor(players: number): SprengjaTier[] {
  return players >= SPRENGJA.hardFrom ? ['kolay', 'orta', 'zor'] : ['kolay', 'orta'];
}

// The next player still in the game after `from` in the throwing order (clockwise); null when
// nobody else is left (private.sprengja_next gives the same). `from` may have left the game
// already: the order still places it.
export function nextActive(
  order: readonly string[],
  gone: readonly string[],
  from: string,
): string | null {
  const at = order.indexOf(from);
  if (at < 0) return null;
  for (let k = 1; k < order.length; k++) {
    const sid = order[(at + k) % order.length] as string;
    if (!gone.includes(sid)) return sid;
  }
  return null;
}

export function activePlayers(state: Pick<SprengjaState, 'order' | 'gone'>): string[] {
  return state.order.filter((s) => !state.gone.includes(s));
}

// Below this many players still in the game it stops, abandoned (K-85 O-10).
export const SPRENGJA_STOP_BELOW = 3;

export const SPRENGJA_PHASES = ['card', 'letters', 'lit', 'summary', 'halted'] as const;
export type SprengjaPhase = (typeof SPRENGJA_PHASES)[number];

export type SprengjaPoll = { holderMs: number; nextMs: number; othersMs: number };

// How often each phone polls while the fuse burns: 0 is never.
export function pollCadence(cronOn: boolean): SprengjaPoll {
  return cronOn
    ? { holderMs: SPRENGJA.cronHolderPollMs, nextMs: 0, othersMs: 0 }
    : {
        holderMs: SPRENGJA.holderPollMs,
        nextMs: SPRENGJA.nextPollMs,
        othersMs: SPRENGJA.othersPollMs,
      };
}

// The last bomb that went off: in whose hands, and whether that person had left the game (then
// nobody loses a point).
export type SprengjaBlast = { round: number; holder: string; gone: boolean };

// The table's open state of a running game.
export type SprengjaState = {
  gameNo: number;
  phase: SprengjaPhase;
  // Grows with every change; a press carries it, so a press from a state already gone does nothing.
  step: number;
  round: number;
  rounds: number;
  // The players at the start (the formula's n).
  players: number;
  // The throwing order, clockwise; who left the game stays in it, in `gone`.
  order: string[];
  gone: string[];
  // Who opens the card and lights the fuse this round.
  starter: string | null;
  // The bomb's holder while it burns; after a blast, the one it went off with.
  holder: string | null;
  // Throws this round ("Atışlar · n").
  passes: number;
  // This round's letter group (open once the card is opened) and the ones used this game.
  letters: string | null;
  used: string[];
  // Blasts per player; the score is minus this.
  hits: Record<string, number>;
  lastBlast: SprengjaBlast | null;
  ready: string[];
  // Tur sonu's and a halted game's clock; null while it is not timed (no fuse is ever here).
  endsAt: string | null;
  poll: SprengjaPoll;
};

// The end screen's facts (game_state.lastGame.sprengja). An abandoned game has no winners.
export type SprengjaResult = {
  order: string[];
  gone: string[];
  hits: Record<string, number>;
  round: number;
  rounds: number;
  winners: string[];
  abandoned: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function counts(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(value)) return out;
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0) out[k] = v;
  }
  return out;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function blast(value: unknown): SprengjaBlast | null {
  if (!isRecord(value) || typeof value.holder !== 'string') return null;
  return { round: num(value.round, 1), holder: value.holder, gone: value.gone === true };
}

function poll(value: unknown): SprengjaPoll {
  if (!isRecord(value)) return pollCadence(false);
  return {
    holderMs: num(value.holderMs),
    nextMs: num(value.nextMs),
    othersMs: num(value.othersMs),
  };
}

export function readSprengjaState(state: unknown): SprengjaState | null {
  if (!isRecord(state)) return null;
  const phase = state.phase;
  if (!(SPRENGJA_PHASES as readonly unknown[]).includes(phase)) return null;
  if (typeof state.step !== 'number') return null;
  return {
    gameNo: num(state.gameNo),
    phase: phase as SprengjaPhase,
    step: state.step,
    round: num(state.round),
    rounds: num(state.rounds),
    players: num(state.players),
    order: strings(state.order),
    gone: strings(state.gone),
    starter: text(state.starter),
    holder: text(state.holder),
    passes: num(state.passes),
    letters: text(state.letters),
    used: strings(state.used),
    hits: counts(state.hits),
    lastBlast: blast(state.lastBlast),
    ready: strings(state.ready),
    endsAt: text(state.endsAt),
    poll: poll(state.poll),
  };
}

export function readSprengjaResult(state: unknown): SprengjaResult | null {
  if (!isRecord(state) || !isRecord(state.lastGame)) return null;
  const last = state.lastGame;
  if (last.concept !== 'sprengja' || !isRecord(last.sprengja)) return null;
  const s = last.sprengja;
  return {
    order: strings(s.order),
    gone: strings(s.gone),
    hits: counts(s.hits),
    round: num(s.round),
    rounds: num(s.rounds),
    winners: strings(s.winners),
    abandoned: last.abandoned === true,
  };
}

// Who wins: the players still in the game with the fewest blasts, all of them (K-85 O-5).
export function winnersOf(state: Pick<SprengjaState, 'order' | 'gone' | 'hits'>): string[] {
  const active = activePlayers(state);
  if (active.length === 0) return [];
  const least = Math.min(...active.map((s) => state.hits[s] ?? 0));
  return active.filter((s) => (state.hits[s] ?? 0) === least);
}

// The score shown: minus one a blast.
export function scoreOf(state: Pick<SprengjaState, 'hits'>, sid: string): number {
  return -(state.hits[sid] ?? 0);
}

// Who polls how often while the fuse burns (sprengja/poll): 0 is never.
export function pollEveryMs(
  state: Pick<SprengjaState, 'phase' | 'holder' | 'order' | 'gone' | 'poll'>,
  me: string,
): number {
  if (state.phase !== 'lit' || !state.holder || state.gone.includes(me)) return 0;
  if (!state.order.includes(me)) return 0;
  if (me === state.holder) return state.poll.holderMs;
  if (me === nextActive(state.order, state.gone, state.holder)) return state.poll.nextMs;
  return state.poll.othersMs;
}

// The round's events (game_events, open to the table) in the order the server wrote them.
export type SprengjaEvent =
  | { type: 'sp_lit'; round: number; holder: string }
  | { type: 'sp_pass'; round: number; step: number; from: string; to: string; reason?: 'left' }
  | { type: 'sp_explode'; round: number; holder: string };

// The holder and the throw count a round's events give: the lit event's holder, moved by each
// pass, the blast in the hands of the last pass's receiver. The server's state must equal this
// (the invariant the integration tests check after every race).
export function replayRound(
  events: readonly SprengjaEvent[],
  round: number,
): { holder: string | null; passes: number; exploded: string | null; blasts: number } {
  let holder: string | null = null;
  let passes = 0;
  let exploded: string | null = null;
  let blasts = 0;
  for (const e of events) {
    if (e.round !== round) continue;
    if (e.type === 'sp_lit') {
      holder = e.holder;
      passes = 0;
    } else if (e.type === 'sp_pass') {
      if (holder !== null && e.from !== holder) throw new Error('a pass from someone without it');
      holder = e.to;
      if (e.reason !== 'left') passes += 1;
    } else {
      if (e.holder !== holder) throw new Error('a blast away from the holder');
      exploded = e.holder;
      blasts += 1;
    }
  }
  return { holder, passes, exploded, blasts };
}

export function readSprengjaEvent(type: unknown, payload: unknown): SprengjaEvent | null {
  if (!isRecord(payload)) return null;
  const round = num(payload.round, -1);
  if (round < 0) return null;
  if (type === 'sp_lit' && typeof payload.holder === 'string') {
    return { type, round, holder: payload.holder };
  }
  if (type === 'sp_explode' && typeof payload.holder === 'string') {
    return { type, round, holder: payload.holder };
  }
  if (type === 'sp_pass' && typeof payload.from === 'string' && typeof payload.to === 'string') {
    return {
      type,
      round,
      step: num(payload.step),
      from: payload.from,
      to: payload.to,
      ...(payload.reason === 'left' ? { reason: 'left' as const } : {}),
    };
  }
  return null;
}
