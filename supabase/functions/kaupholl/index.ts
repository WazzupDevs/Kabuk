// Kaupholl (docs/SPEC_V4.md §4.F "Adım 4.6.10", K-87). The decisions are _shared/pure/kaupholl.ts's,
// as in Signum: each call reads the game without a lock (kaupholl_read), decides here, and writes
// through kaupholl_commit, which under the table's lock checks that nothing changed since the read
// and that a guess or a bet is still inside its phase's time. A changed table means a new read and
// a new decision; after three tries the answer is "busy", a 200 the phone treats like a stale step.
// What leaves here is only ever built by respond: the result, the open state and the caller's own
// view (rule 3); the secret (the answers, everyone's guesses) never does.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import type {
  KauphollPool,
  KauphollRequest,
  KauphollStartAnswer,
} from '../_shared/pure/api/games.ts';
import type { Json } from '../_shared/pure/database.ts';
import { AppError } from '../_shared/pure/errors.ts';
import {
  decideAction,
  KAUPHOLL,
  type KauphollAnswer,
  type KauphollCandidate,
  type KauphollQuestion,
  type KauphollRequest as KauphollDecisionRequest,
  type KauphollSecret,
  type KauphollState,
  type KauphollView,
  publicState,
  respond,
  roundStats,
  selectQuestions,
  startGame,
  viewFor,
} from '../_shared/pure/kaupholl.ts';
import { withTries } from '../_shared/pure/signum.ts';

const TRIES = 3;
const Room = z.uuid();
const Step = z.number().int().min(1).max(1_000_000);
const Seq = z.number().int().min(1).max(KAUPHOLL.seqMax);
const Pos = z.number().int().min(0).max(KAUPHOLL.maxPlayers).nullable();

const Body: z.ZodType<KauphollRequest> = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('start'), roomId: Room }),
  z.strictObject({ action: z.literal('pool'), roomId: Room }),
  z.strictObject({ action: z.literal('view'), roomId: Room }),
  z.strictObject({ action: z.literal('reveal'), roomId: Room, step: Step }),
  z.strictObject({
    action: z.literal('guess'),
    roomId: Room,
    step: Step,
    seq: Seq,
    value: z.number().min(0).max(KAUPHOLL.maxValue),
    lock: z.boolean(),
  }),
  z.strictObject({
    action: z.literal('bet'),
    roomId: Room,
    step: Step,
    seq: Seq,
    coins: z.tuple([Pos, Pos]),
    lock: z.boolean(),
  }),
  z.strictObject({ action: z.literal('ready'), roomId: Room, step: Step }),
  z.strictObject({ action: z.literal('advance'), roomId: Room, step: Step }),
]);

const db = serviceClient();

// The questions' secrecy and order rest on this: never Math.random.
function cryptoRandom(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] as number) / 2 ** 32;
}

type GameRead = {
  state: KauphollState;
  secret: KauphollSecret;
  rev: number;
  sessionId: string;
  now: string;
};

type PageRead = {
  pregame: Json;
  players: string[];
  sessionId: string;
  isOwner: boolean;
  used: string[];
  pool: KauphollCandidate[];
  now: string;
};

Deno.serve(
  handle(
    async (
      req,
      raw,
    ): Promise<
      | KauphollAnswer
      | KauphollPool
      | KauphollStartAnswer
      | { room: KauphollState; view: KauphollView }
    > => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);
      switch (body.action) {
        case 'start':
          return start(user.id, body.roomId);
        case 'pool': {
          const { data, error } = await db.rpc('kaupholl_pool', {
            target_user_id: user.id,
            target_room_id: body.roomId,
          });
          if (error) throw dbError('kaupholl_pool', error);
          return { unused: (data as { unused: number }).unused };
        }
        case 'view': {
          const read = await readGame(user.id, body.roomId);
          return {
            room: publicState(read.state),
            view: viewFor({ sid: read.sessionId }, read.state, read.secret),
          };
        }
        default:
          return play(user.id, body);
      }
    },
  ),
);

async function readGame(userId: string, roomId: string): Promise<GameRead> {
  const { data, error } = await db.rpc('kaupholl_read', {
    target_user_id: userId,
    target_room_id: roomId,
  });
  if (error) throw dbError('kaupholl_read', error);
  return data as unknown as GameRead;
}

type PlayBody = Extract<
  KauphollRequest,
  { action: 'reveal' | 'guess' | 'bet' | 'ready' | 'advance' }
>;

// The request as the engine reads it: the same fields, the table aside.
function decisionRequest(body: PlayBody): KauphollDecisionRequest {
  switch (body.action) {
    case 'reveal':
    case 'ready':
    case 'advance':
      return { action: body.action, step: body.step };
    case 'guess':
      return {
        action: 'guess',
        step: body.step,
        seq: body.seq,
        value: body.value,
        lock: body.lock,
      };
    case 'bet':
      return { action: 'bet', step: body.step, seq: body.seq, coins: body.coins, lock: body.lock };
  }
}

// A guess and a bet count only inside their phase's time; an advance only once it ran out.
function clockOf(request: KauphollDecisionRequest): 'before' | 'after' | 'any' {
  if (request.action === 'guess' || request.action === 'bet') return 'before';
  return request.action === 'advance' ? 'after' : 'any';
}

async function play(userId: string, body: PlayBody): Promise<KauphollAnswer> {
  const request = decisionRequest(body);
  let read = await readGame(userId, body.roomId);
  return withTries(
    TRIES,
    async (n) => {
      if (n > 1) read = await readGame(userId, body.roomId);
      const actor = { sid: read.sessionId };
      const decision = decideAction(read.state, read.secret, actor, request, new Date(read.now));
      if (decision.kind === 'error') throw new AppError(decision.code, decision.code);
      if (decision.kind !== 'applied') {
        return respond(decision, read.state, viewFor(actor, read.state, read.secret));
      }
      const opensAnswer = decision.state.phase === 'answer' && read.state.phase !== 'answer';
      const question = decision.secret.questions[decision.state.round] as KauphollQuestion;
      const { data, error } = await db.rpc('kaupholl_commit', {
        target_user_id: userId,
        target_room_id: body.roomId,
        read_state: read.state,
        read_rev: read.rev,
        read_session_id: read.sessionId,
        clock: clockOf(request),
        new_state: decision.state,
        new_secret: decision.secret,
        round_stats: opensAnswer ? roundStats(decision.state, question.answer) : null,
      });
      if (error) throw dbError('kaupholl_commit', error);
      if (!(data as { ok: boolean }).ok) return null;
      return respond(decision, decision.state, viewFor(actor, decision.state, decision.secret));
    },
    // Changed at the same moment three times: the table as it is now, the caller's view as it is now.
    async () => {
      const fresh = await readGame(userId, body.roomId);
      return respond(
        { kind: 'busy' },
        fresh.state,
        viewFor({ sid: fresh.sessionId }, fresh.state, fresh.secret),
      );
    },
  );
}

async function readPage(userId: string, roomId: string): Promise<PageRead> {
  const { data, error } = await db.rpc('kaupholl_pregame_read', {
    target_user_id: userId,
    target_room_id: roomId,
  });
  if (error) throw dbError('kaupholl_pregame_read', error);
  return data as unknown as PageRead;
}

async function loadQuestions(ids: string[]): Promise<KauphollQuestion[]> {
  const { data, error } = await db
    .from('kaupholl_questions')
    .select('id, body, unit, decimals, answer, note, difficulty')
    .in('id', ids)
    .eq('active', true);
  if (error) throw dbError('kaupholl_questions', error);
  const byId = new Map(data.map((q) => [q.id, q]));
  return ids.flatMap((id) => {
    const q = byId.get(id);
    if (!q) return [];
    return [
      {
        id: q.id,
        text: q.body,
        unit: q.unit,
        decimals: q.decimals === 1 ? 1 : 0,
        answer: Number(q.answer),
        note: q.note,
        difficulty: q.difficulty as KauphollQuestion['difficulty'],
      },
    ];
  });
}

function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(cryptoRandom() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

// The owner starts: the five questions (selectQuestions; never one this table has had), the seats in
// a random order, the first state. No valid five: questions_exhausted, nothing changes at the table
// (§4 "İçerik yetersizliği"); the counter goes up, the level only into this log.
function start(userId: string, roomId: string): Promise<KauphollStartAnswer> {
  return withTries<KauphollStartAnswer>(
    TRIES,
    async () => {
      const read = await readPage(userId, roomId);
      if (!read.isOwner) throw new AppError('not_owner', 'not_owner');
      if (read.players.length < KAUPHOLL.minPlayers) {
        throw new AppError('not_enough_players', 'not_enough_players');
      }
      if (read.players.length > KAUPHOLL.maxPlayers) {
        throw new AppError('too_many_players', 'too_many_players');
      }
      const selection = selectQuestions(read.pool, read.used, cryptoRandom);
      if (!selection.ok) {
        const { error } = await db.rpc('kaupholl_note_exhausted');
        if (error) throw dbError('kaupholl_note_exhausted', error);
        console.log(JSON.stringify({ kaupholl: 'questions_exhausted' }));
        throw new AppError('questions_exhausted', 'questions_exhausted');
      }
      const questions = await loadQuestions(selection.ids);
      const started = startGame({
        seats: shuffled(read.players),
        questions,
        now: new Date(read.now),
      });
      // A question taken out of the deck between the read and its load: read and choose again.
      if (!started.ok) return null;
      const { data, error } = await db.rpc('kaupholl_start', {
        target_user_id: userId,
        target_room_id: roomId,
        read_pregame: read.pregame,
        new_state: started.state,
        new_secret: started.secret,
      });
      if (error) throw dbError('kaupholl_start', error);
      if (!(data as { ok: boolean }).ok) return null;
      console.log(JSON.stringify({ kaupholl: 'started', level: selection.level }));
      return { applied: true };
    },
    () => Promise.resolve({ applied: false, reason: 'busy' }),
  );
}
