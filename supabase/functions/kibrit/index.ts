// Kibrit (docs/SPEC_V4.md §4.F "Adım 4.6.9", K-86): nameless questions in a jar, one drawn each
// round, a secret vote on whom it fits best. The server keeps the papers with their authors and the
// votes (kibrit_papers, kibrit_votes, closed to every client) and the open state with its clock
// (rooms.game_state); a phone gets back only its own paper and vote (rule 3). A paper's words are
// checked here, the same check the app makes (rule 7).
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { loadProfanity } from '../_shared/profanity.ts';
import type { GameOkResponse, KibritRequest } from '../_shared/pure/api/games.ts';
import { AppError } from '../_shared/pure/errors.ts';
import {
  checkKibritQuestion,
  KIBRIT,
  readKibritView,
  type KibritView,
} from '../_shared/pure/kibrit.ts';

const Step = z.number().int().min(1).max(10_000);
const Rev = z.number().int().min(1).max(1_000_000);

const Body: z.ZodType<KibritRequest> = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    roomId: z.uuid(),
    rounds: z.number().int().min(1).max(KIBRIT.maxPlayers).optional(),
  }),
  z.object({ action: z.literal('view'), roomId: z.uuid() }),
  z.object({
    action: z.literal('write'),
    roomId: z.uuid(),
    step: Step,
    rev: Rev,
    text: z.string().max(400),
  }),
  z.object({ action: z.literal('draw'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('to-vote'), roomId: z.uuid(), step: Step }),
  z.object({
    action: z.literal('vote'),
    roomId: z.uuid(),
    step: Step,
    rev: Rev,
    target: z.uuid(),
  }),
  z.object({ action: z.literal('skip'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('ready'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('next'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('advance'), roomId: z.uuid() }),
]);

const db = serviceClient();

Deno.serve(
  handle(async (req, raw): Promise<GameOkResponse | KibritView> => {
    const body = Body.parse(raw);
    const user = await requireUser(req, db);
    return act(user.id, body);
  }),
);

async function act(userId: string, body: KibritRequest): Promise<GameOkResponse | KibritView> {
  const target = { target_user_id: userId, target_room_id: body.roomId };

  switch (body.action) {
    case 'start': {
      const { error } = await db.rpc('kibrit_start', {
        ...target,
        ...(body.rounds ? { round_limit: body.rounds } : {}),
      });
      if (error) throw dbError('kibrit_start', error);
      return { ok: true };
    }

    case 'view': {
      const { data, error } = await db.rpc('kibrit_view', target);
      if (error) throw dbError('kibrit_view', error);
      return readKibritView(data);
    }

    case 'write': {
      const check = checkKibritQuestion(body.text, await loadProfanity(db));
      if (!check.ok) {
        if (check.reason === 'contact') {
          throw new AppError('contact_not_allowed', 'Question contains contact details.');
        }
        if (check.reason === 'profanity') {
          throw new AppError('profanity_rejected', 'Question contains inappropriate language.');
        }
        throw new AppError('message_invalid', 'Question must be 1 to 80 characters.');
      }
      const { data, error } = await db.rpc('kibrit_write', {
        ...target,
        at_step: body.step,
        at_rev: body.rev,
        new_body: check.value,
      });
      if (error) throw dbError('kibrit_write', error);
      return readKibritView(data);
    }

    case 'vote': {
      const { data, error } = await db.rpc('kibrit_vote', {
        ...target,
        at_step: body.step,
        at_rev: body.rev,
        target_session_id: body.target,
      });
      if (error) throw dbError('kibrit_vote', error);
      return readKibritView(data);
    }

    case 'draw':
    case 'to-vote':
    case 'skip':
    case 'ready':
    case 'next': {
      const fn = body.action === 'to-vote' ? 'kibrit_to_vote' : (`kibrit_${body.action}` as const);
      const { error } = await db.rpc(fn, { ...target, at_step: body.step });
      if (error) throw dbError(fn, error);
      return { ok: true };
    }

    case 'advance': {
      const { error } = await db.rpc('kibrit_advance', target);
      if (error) throw dbError('kibrit_advance', error);
      return { ok: true };
    }
  }
}
