// Kapsül Anlat at a table of people (docs/SPEC_V4.md §4.F "Adım 4.6.1", K-5). The server freezes
// the teams (game_players), deals each turn's cards (tabu_turns, closed to clients) and keeps the
// open state with its clock (rooms.game_state). The card list leaves only as the answer to
// turn-cards, to the describer, the other team and the watchers (rule 3). Every press names the
// phase's step and its card index; the server checks both, so a second press on the same card is
// ignored and the first of two phones wins.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import type {
  GameOkResponse,
  TabuRequest,
  TabuTurnCardsResponse,
} from '../_shared/pure/api/games.ts';
import { TABU_MARKS } from '../_shared/pure/tabuGame.ts';

const Step = z.number().int().min(1).max(10_000);

const Body: z.ZodType<TabuRequest> = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), roomId: z.uuid() }),
  z.object({ action: z.literal('begin-turn'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('turn-cards'), roomId: z.uuid() }),
  z.object({
    action: z.literal('mark'),
    roomId: z.uuid(),
    step: Step,
    cardIndex: z.number().int().min(0).max(1000),
    result: z.enum(TABU_MARKS),
  }),
  z.object({ action: z.literal('next'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('advance'), roomId: z.uuid() }),
]);

const db = serviceClient();

Deno.serve(
  handle(async (req, raw): Promise<TabuTurnCardsResponse | GameOkResponse> => {
    const body = Body.parse(raw);
    const user = await requireUser(req, db);
    const target = { target_user_id: user.id, target_room_id: body.roomId };

    switch (body.action) {
      case 'start': {
        const { error } = await db.rpc('tabu_start', target);
        if (error) throw dbError('tabu_start', error);
        return { ok: true };
      }

      case 'begin-turn':
      case 'next': {
        const fn = body.action === 'next' ? 'tabu_next' : 'tabu_begin_turn';
        const { error } = await db.rpc(fn, { ...target, at_step: body.step });
        if (error) throw dbError(fn, error);
        return { ok: true };
      }

      case 'turn-cards': {
        const { data, error } = await db.rpc('tabu_turn_cards', target);
        if (error) throw dbError('tabu_turn_cards', error);
        return {
          turnNo: data[0]?.turn_no ?? 0,
          cards: data.map((c) => ({ word: c.word, forbidden: c.forbidden })),
        };
      }

      case 'mark': {
        const { error } = await db.rpc('tabu_mark', {
          ...target,
          at_step: body.step,
          index: body.cardIndex,
          result: body.result,
        });
        if (error) throw dbError('tabu_mark', error);
        return { ok: true };
      }

      case 'advance': {
        const { error } = await db.rpc('tabu_advance', target);
        if (error) throw dbError('tabu_advance', error);
        return { ok: true };
      }
    }
  }),
);
