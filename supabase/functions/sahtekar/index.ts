// Sahtekar (docs/SPEC_V3.md §20.2). One table: the deck, then the phone runs the game. Two tables:
// started by rooms/answer-game, server-authoritative. The secrets (the impostor's seat, the word,
// the votes, the options) stay in game_secrets; they leave only as the answer to the asking side's
// leader: the seats' actions come from the leader's phone only (docs/SPEC_V3.md §22.E; members:
// not_your_seat).
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { AppError } from '../_shared/pure/errors.ts';
import type {
  GameOkResponse,
  SahtekarOptionsResponse,
  SahtekarRequest,
  SahtekarStartResponse,
  SahtekarViewResponse,
} from '../_shared/pure/api/games.ts';

const Seat = z.string().regex(/^[AB][1-4]$/);

const Body: z.ZodType<SahtekarRequest> = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), roomId: z.uuid() }),
  z.object({ action: z.literal('view'), roomId: z.uuid(), seat: Seat }),
  z.object({ action: z.literal('said'), roomId: z.uuid(), step: z.number().int().min(0).max(100) }),
  z.object({ action: z.literal('vote'), roomId: z.uuid(), voter: Seat, target: Seat }),
  z.object({ action: z.literal('options'), roomId: z.uuid() }),
  z.object({ action: z.literal('guess'), roomId: z.uuid(), option: z.string().min(1).max(80) }),
  z.object({ action: z.literal('advance'), roomId: z.uuid() }),
]);

const db = serviceClient();

type Response =
  SahtekarStartResponse | SahtekarViewResponse | SahtekarOptionsResponse | GameOkResponse;

Deno.serve(
  handle(async (req, raw): Promise<Response> => {
    const body = Body.parse(raw);
    const user = await requireUser(req, db);
    const target = { target_user_id: user.id, target_room_id: body.roomId };

    switch (body.action) {
      // The side model's games do not run at a table of people (docs/SPEC_V4.md §4.E); today's app
      // hears update_required until the game comes back in step 4.6.
      case 'start':
        throw new AppError('update_required', 'This version of the app is too old. Update it.');

      case 'view': {
        const { data, error } = await db.rpc('sahtekar_view', { ...target, seat: body.seat });
        if (error) throw dbError('sahtekar_view', error);
        return data as SahtekarViewResponse;
      }

      case 'said': {
        const { error } = await db.rpc('sahtekar_said', { ...target, step: body.step });
        if (error) throw dbError('sahtekar_said', error);
        return { ok: true };
      }

      case 'vote': {
        const { error } = await db.rpc('sahtekar_vote', {
          ...target,
          voter: body.voter,
          target: body.target,
        });
        if (error) throw dbError('sahtekar_vote', error);
        return { ok: true };
      }

      case 'options': {
        const { data, error } = await db.rpc('sahtekar_options', target);
        if (error) throw dbError('sahtekar_options', error);
        return { options: data as string[] };
      }

      case 'guess': {
        const { error } = await db.rpc('sahtekar_guess', { ...target, option: body.option });
        if (error) throw dbError('sahtekar_guess', error);
        return { ok: true };
      }

      case 'advance': {
        const { error } = await db.rpc('sahtekar_advance', target);
        if (error) throw dbError('sahtekar_advance', error);
        return { ok: true };
      }
    }
  }),
);
