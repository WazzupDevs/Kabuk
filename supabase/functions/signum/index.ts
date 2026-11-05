// Signum (docs/SPEC_V4.md §4.F "Adım 4.6.7"). The decisions are _shared/pure/signum.ts's (the
// owner's B-1): each call reads the game without a lock (signum_read), decides here, and writes
// through signum_commit, which under the table's lock checks that nothing changed since the read,
// that the caller still holds the same seat and that a player's action is still inside its phase's
// time. A changed table means a new read and a new decision; after three tries the answer is "busy"
// (B-2), a 200 the phone treats like a stale step. The team channel's broadcast is the write's own
// (realtime.send in signum_commit), so it always names the channel as written under the lock. What leaves here is only ever built by respond:
// the result, the open state and the caller's own view (rule 3); the secret never does.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { loadProfanity } from '../_shared/profanity.ts';
import type { SignumPageAnswer, SignumRequest } from '../_shared/pure/api/games.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { prepareTerms } from '../_shared/pure/profanity.ts';
import {
  answerOffer,
  approveCaptain,
  cleanPregame,
  decideAction,
  emptyPregame,
  offerCaptain,
  publicState,
  randomOffer,
  repeatOf,
  respond,
  seatsAtStart,
  type SignumActor,
  type SignumAnswer,
  type SignumPicks,
  type SignumPregame,
  type SignumRequest as SignumDecisionRequest,
  type SignumSecret,
  type SignumState,
  type SignumView,
  startGame,
  viewFor,
  volunteer,
  withTries,
} from '../_shared/pure/signum.ts';

const TRIES = 3;
const Room = z.uuid();
const Step = z.number().int().min(1).max(1_000_000);
const Team = z.enum(['a', 'b']);
const Tile = z.number().int().min(0).max(24);

const Body: z.ZodType<SignumRequest> = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('volunteer'), roomId: Room, on: z.boolean() }),
  z.strictObject({ action: z.literal('offer-captain'), roomId: Room, sessionId: z.uuid() }),
  z.strictObject({ action: z.literal('random-offer'), roomId: Room, team: Team }),
  z.strictObject({ action: z.literal('answer-offer'), roomId: Room, accept: z.boolean() }),
  z.strictObject({
    action: z.literal('approve-captain'),
    roomId: Room,
    team: Team,
    sessionId: z.uuid(),
  }),
  z.strictObject({ action: z.literal('start'), roomId: Room }),
  z.strictObject({ action: z.literal('view'), roomId: Room }),
  z.strictObject({ action: z.literal('ready'), roomId: Room, step: Step }),
  z.strictObject({
    action: z.literal('clue'),
    roomId: Room,
    step: Step,
    word: z.string().min(1).max(64),
    n: z.number().int().min(1).max(4),
    actionId: z.uuid(),
  }),
  z.strictObject({
    action: z.literal('point'),
    roomId: Room,
    step: Step,
    tile: Tile.nullable(),
    seq: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  }),
  z.strictObject({
    action: z.literal('reveal'),
    roomId: Room,
    step: Step,
    tile: Tile,
    actionId: z.uuid(),
  }),
  z.strictObject({ action: z.literal('end-turn'), roomId: Room, step: Step, actionId: z.uuid() }),
  z.strictObject({ action: z.literal('advance'), roomId: Room, step: Step }),
]);

const db = serviceClient();
const NO_TERMS = prepareTerms([]);

// The key's secrecy rests on this (pure/signum.ts → startGame): never Math.random.
function cryptoRandom(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] as number) / 2 ** 32;
}

type GameRead = {
  state: SignumState;
  secret: SignumSecret;
  rev: number;
  sessionId: string;
  isOwner: boolean;
  seat: { team: 'a' | 'b'; role: 'captain' | 'guesser' } | null;
  now: string;
};

type PageRead = {
  pregame: { concept: string; picks?: SignumPicks; signum?: SignumPregame };
  gameNo: number;
  members: string[];
  sessionId: string;
  isOwner: boolean;
  now: string;
};

Deno.serve(
  handle(
    async (
      req,
      raw,
    ): Promise<SignumAnswer | SignumPageAnswer | { room: SignumState; view: SignumView }> => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);
      switch (body.action) {
        case 'volunteer':
        case 'offer-captain':
        case 'random-offer':
        case 'answer-offer':
        case 'approve-captain':
          return page(user.id, body);
        case 'start':
          return start(user.id, body.roomId);
        case 'view': {
          const read = await readGame(user.id, body.roomId);
          return { room: publicState(read.state), view: viewFor(actorOf(read), read.secret) };
        }
        default:
          return play(user.id, body);
      }
    },
  ),
);

async function readGame(userId: string, roomId: string): Promise<GameRead> {
  const { data, error } = await db.rpc('signum_read', {
    target_user_id: userId,
    target_room_id: roomId,
  });
  if (error) throw dbError('signum_read', error);
  return data as unknown as GameRead;
}

// The seat is the database's, read for this call (game_players of the running game, at the table
// with an active check-in), never the phone's or the open state's.
function actorOf(read: GameRead): SignumActor {
  return {
    sid: read.sessionId,
    seat: read.seat ? { sid: read.sessionId, team: read.seat.team, role: read.seat.role } : null,
  };
}

type PlayBody = Extract<
  SignumRequest,
  { action: 'ready' | 'clue' | 'point' | 'reveal' | 'end-turn' | 'advance' }
>;

// The request as the engine reads it: the same fields, the table aside.
function decisionRequest(body: PlayBody): SignumDecisionRequest {
  switch (body.action) {
    case 'ready':
    case 'advance':
      return { action: body.action, step: body.step };
    case 'clue':
      return {
        action: 'clue',
        step: body.step,
        word: body.word,
        n: body.n,
        actionId: body.actionId,
      };
    case 'point':
      return { action: 'point', step: body.step, tile: body.tile, seq: body.seq };
    case 'reveal':
      return { action: 'reveal', step: body.step, tile: body.tile, actionId: body.actionId };
    case 'end-turn':
      return { action: 'end-turn', step: body.step, actionId: body.actionId };
  }
}

async function play(userId: string, body: PlayBody): Promise<SignumAnswer> {
  const terms = body.action === 'clue' ? await loadProfanity(db) : NO_TERMS;
  const request = decisionRequest(body);
  let read: GameRead;
  try {
    read = await readGame(userId, body.roomId);
  } catch (err) {
    // The game just ended: a press sent again after it (the reveal that ended it) still gets its
    // first answer (IDEMPOTENT_CALLS); anything else is no_game.
    if (err instanceof AppError && err.code === 'no_game')
      return replayAfterEnd(userId, body, request);
    throw err;
  }
  return withTries(
    TRIES,
    async (n) => {
      if (n > 1) read = await readGame(userId, body.roomId);
      const actor = actorOf(read);
      const decision = decideAction(
        read.state,
        read.secret,
        actor,
        request,
        new Date(read.now),
        terms,
      );
      if (decision.kind === 'error') throw new AppError(decision.code, decision.code);
      if (
        decision.kind === 'replayed' ||
        decision.kind === 'noop' ||
        (decision.kind === 'not_applied' && !decision.changed)
      ) {
        return respond(decision, read.state, viewFor(actor, read.secret));
      }
      // Applied, or a phase whose time ran out moving on (phase_expired): written under the lock,
      // and the team's data-free broadcast goes out with that write (signum_commit).
      const { data, error } = await db.rpc('signum_commit', {
        target_user_id: userId,
        target_room_id: body.roomId,
        read_state: read.state,
        read_rev: read.rev,
        seat_team: read.seat?.team ?? '',
        seat_role: read.seat?.role ?? '',
        player_action: decision.kind === 'applied' && request.action !== 'advance',
        new_state: decision.state,
        new_secret: decision.secret,
        notify_team: decision.kind === 'applied' ? (decision.notifyTeam ?? '') : '',
      });
      if (error) throw dbError('signum_commit', error);
      if (!(data as { ok: boolean }).ok) return null;
      return respond(decision, decision.state, viewFor(actor, decision.secret));
    },
    // Changed at the same moment three times: the table as it is now, the caller's view as it is now.
    async () => {
      const fresh = await readGame(userId, body.roomId);
      return respond({ kind: 'busy' }, fresh.state, viewFor(actorOf(fresh), fresh.secret));
    },
  );
}

async function replayAfterEnd(
  userId: string,
  body: PlayBody,
  request: SignumDecisionRequest,
): Promise<SignumAnswer> {
  if (request.action !== 'clue' && request.action !== 'reveal' && request.action !== 'end-turn') {
    throw new AppError('no_game', 'no_game');
  }
  const { data, error } = await db.rpc('signum_read_ended', {
    target_user_id: userId,
    target_room_id: body.roomId,
  });
  if (error) throw dbError('signum_read_ended', error);
  const ended = data as unknown as { state: SignumState; secret: SignumSecret; sessionId: string };
  const repeat = repeatOf(ended.secret, ended.sessionId, request);
  if (!repeat) throw new AppError('no_game', 'no_game');
  if (repeat.kind === 'error') throw new AppError(repeat.code, repeat.code);
  // Nobody plays any more: the view is a watcher's; the over state already shows the key.
  return respond(repeat, ended.state, { role: 'observer' });
}

async function readPage(userId: string, roomId: string): Promise<PageRead> {
  const { data, error } = await db.rpc('signum_pregame_read', {
    target_user_id: userId,
    target_room_id: roomId,
  });
  if (error) throw dbError('signum_pregame_read', error);
  return data as unknown as PageRead;
}

// The page's people as they stand now: picks only of who is at the table, captains only of who is
// still on that team.
function pageOf(read: PageRead): { picks: SignumPicks; signum: SignumPregame } {
  const picks: SignumPicks = {};
  for (const [sid, pick] of Object.entries(read.pregame.picks ?? {})) {
    if (read.members.includes(sid)) picks[sid] = pick;
  }
  return { picks, signum: cleanPregame(read.pregame.signum ?? emptyPregame(), picks) };
}

type PageBody = Extract<
  SignumRequest,
  { action: 'volunteer' | 'offer-captain' | 'random-offer' | 'answer-offer' | 'approve-captain' }
>;

function page(userId: string, body: PageBody): Promise<SignumPageAnswer> {
  return withTries<SignumPageAnswer>(
    TRIES,
    async () => {
      const read = await readPage(userId, body.roomId);
      const { picks, signum } = pageOf(read);
      const next =
        body.action === 'volunteer'
          ? volunteer(signum, picks, read.sessionId, body.on)
          : body.action === 'offer-captain'
            ? offerCaptain(signum, picks, read.isOwner, body.sessionId)
            : body.action === 'random-offer'
              ? randomOffer(signum, picks, read.isOwner, body.team, cryptoRandom)
              : body.action === 'answer-offer'
                ? answerOffer(signum, picks, read.sessionId, body.accept)
                : approveCaptain(signum, picks, read.isOwner, body.team, body.sessionId);
      if ('error' in next) throw new AppError(next.error, next.error);
      const { data, error } = await db.rpc('signum_pregame_commit', {
        target_user_id: userId,
        target_room_id: body.roomId,
        read_pregame: read.pregame,
        read_is_owner: read.isOwner,
        new_signum: next,
      });
      if (error) throw dbError('signum_pregame_commit', error);
      return (data as { ok: boolean }).ok ? { applied: true } : null;
    },
    busyPage,
  );
}

const busyPage = (): Promise<SignumPageAnswer> =>
  Promise.resolve({ applied: false, reason: 'busy' });

async function loadPool(): Promise<string[]> {
  const { data, error } = await db
    .from('cards')
    .select('word')
    .eq('deck', 'signum')
    .eq('is_active', true);
  if (error) throw dbError('signum_pool', error);
  return data.map((row) => row.word).filter((word): word is string => word !== null);
}

function start(userId: string, roomId: string): Promise<SignumPageAnswer> {
  return withTries<SignumPageAnswer>(
    TRIES,
    async () => {
      const read = await readPage(userId, roomId);
      if (!read.isOwner) throw new AppError('not_owner', 'not_owner');
      const { picks, signum } = pageOf(read);
      const seats = seatsAtStart(signum, picks);
      if (!seats) throw new AppError('captain_missing', 'captain_missing');
      const started = startGame(
        {
          gameNo: read.gameNo + 1,
          seats,
          pool: await loadPool(),
          now: new Date(read.now),
          channels: { a: crypto.randomUUID(), b: crypto.randomUUID() },
        },
        cryptoRandom,
      );
      if ('error' in started) throw new AppError(started.error, started.error);
      const { data, error } = await db.rpc('signum_start', {
        target_user_id: userId,
        target_room_id: roomId,
        read_pregame: read.pregame,
        new_state: started.state,
        new_secret: started.secret,
      });
      if (error) throw dbError('signum_start', error);
      return (data as { ok: boolean }).ok ? { applied: true } : null;
    },
    busyPage,
  );
}
