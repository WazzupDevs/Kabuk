// Vampir Köylü (docs/SPEC_V4.md §4.F "Adım 4.6.6", K-78): the phone is the narrator. The server
// deals the roles (game_players), keeps tonight's choices and the seer's findings (game_secrets) and
// the open state with its clock (rooms.game_state); what only one phone may know leaves only as the
// answer to that phone's view or choice (rule 3). On the dev project and the local stack, test bots
// at the table make their moves before a view and after every other call (_shared/testBots.ts).
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import type { GameOkResponse, VampirRequest } from '../_shared/pure/api/games.ts';
import { readVampirView, type VampirView } from '../_shared/pure/vampir.ts';
import { testBotsPlayVampir } from '../_shared/testBots.ts';

const Step = z.number().int().min(1).max(10_000);

const Body: z.ZodType<VampirRequest> = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), roomId: z.uuid() }),
  z.object({ action: z.literal('view'), roomId: z.uuid() }),
  z.object({ action: z.literal('ready'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('begin'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('pick'), roomId: z.uuid(), step: Step, target: z.uuid() }),
  z.object({ action: z.literal('to-vote'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('vote'), roomId: z.uuid(), step: Step, target: z.uuid() }),
  z.object({ action: z.literal('advance'), roomId: z.uuid() }),
]);

const db = serviceClient();

Deno.serve(
  handle(async (req, raw): Promise<GameOkResponse | VampirView> => {
    const body = Body.parse(raw);
    const user = await requireUser(req, db);
    // The bots move first when the person's own view should show it (a vampire's fellow choices).
    if (body.action === 'view') await testBotsPlayVampir(db, body.roomId);
    const answer = await act(user.id, body);
    if (body.action !== 'view') await testBotsPlayVampir(db, body.roomId);
    return answer;
  }),
);

async function act(userId: string, body: VampirRequest): Promise<GameOkResponse | VampirView> {
  const target = { target_user_id: userId, target_room_id: body.roomId };

  switch (body.action) {
    case 'start': {
      const { error } = await db.rpc('vampir_start', target);
      if (error) throw dbError('vampir_start', error);
      return { ok: true };
    }

    case 'view': {
      const { data, error } = await db.rpc('vampir_view', target);
      if (error) throw dbError('vampir_view', error);
      return readVampirView(data);
    }

    case 'ready':
    case 'begin':
    case 'to-vote': {
      const fn = body.action === 'to-vote' ? 'vampir_to_vote' : (`vampir_${body.action}` as const);
      const { error } = await db.rpc(fn, { ...target, at_step: body.step });
      if (error) throw dbError(fn, error);
      return { ok: true };
    }

    case 'pick': {
      const { data, error } = await db.rpc('vampir_pick', {
        ...target,
        at_step: body.step,
        target_session_id: body.target,
      });
      if (error) throw dbError('vampir_pick', error);
      return readVampirView(data);
    }

    case 'vote': {
      const { error } = await db.rpc('vampir_vote', {
        ...target,
        at_step: body.step,
        target_session_id: body.target,
      });
      if (error) throw dbError('vampir_vote', error);
      return { ok: true };
    }

    case 'advance': {
      const { error } = await db.rpc('vampir_advance', target);
      if (error) throw dbError('vampir_advance', error);
      return { ok: true };
    }
  }
}
