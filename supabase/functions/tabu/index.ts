// Kapsül Anlat (docs/SPEC_V4.md §4.F, adım 4.6.1): the table's person-based Tabu. The owner starts
// it from the pre-game page; Mor and Pembe take turns and the describer goes round within the team.
// Each turn opens ready: its describer starts it ("Turu başlat"), anyone at the table once the
// ready time is up. The describer presses Doğru and Pas, the other team Yasak!; every press names
// its turn and card, the server checks it and the first press on a card wins. The card list goes to
// the describer, the other team and the watchers (turn-cards), never to the describer's teammates.
// The table's phones see every change as a change of its row (rooms.game_state, no card in it).
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import type {
  GameOkResponse,
  TabuRequest,
  TabuTurnCardsResponse,
} from '../_shared/pure/api/games.ts';
import { KAPSUL_MARKS } from '../_shared/pure/kapsulAnlat.ts';

const Body: z.ZodType<TabuRequest> = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), roomId: z.uuid() }),
  z.object({ action: z.literal('begin-turn'), roomId: z.uuid() }),
  z.object({ action: z.literal('turn-cards'), roomId: z.uuid() }),
  z.object({
    action: z.literal('mark'),
    roomId: z.uuid(),
    turnNo: z.number().int().min(1).max(100),
    cardIndex: z.number().int().min(0).max(1000),
    result: z.enum(KAPSUL_MARKS),
  }),
  z.object({ action: z.literal('end-turn'), roomId: z.uuid() }),
  z.object({ action: z.literal('advance'), roomId: z.uuid() }),
]);

const db = serviceClient();

Deno.serve(
  handle(async (req, raw): Promise<TabuTurnCardsResponse | GameOkResponse> => {
    const body = Body.parse(raw);
    const user = await requireUser(req, db);
    const target = { target_user_id: user.id, target_room_id: body.roomId };

    switch (body.action) {
      // The owner, from the pre-game page: Mor and Pembe of at least two each (not_enough_players).
      case 'start': {
        const { error } = await db.rpc('tabu_start', target);
        if (error) throw dbError('tabu_start', error);
        return { ok: true };
      }

      case 'begin-turn': {
        const { error } = await db.rpc('tabu_begin_turn', target);
        if (error) throw dbError('tabu_begin_turn', error);
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
          turn_number: body.turnNo,
          index: body.cardIndex,
          result: body.result,
        });
        if (error) throw dbError('tabu_mark', error);
        return { ok: true };
      }

      // Anyone at the table once the clock has run out; the server checks the time.
      case 'end-turn': {
        const { error } = await db.rpc('tabu_end_turn', target);
        if (error) throw dbError('tabu_end_turn', error);
        return { ok: true };
      }

      // The turn's end screen: the owner at once, anyone after nextAt; after the last turn the
      // game ends with its results.
      case 'advance': {
        const { error } = await db.rpc('tabu_advance', target);
        if (error) throw dbError('tabu_advance', error);
        return { ok: true };
      }
    }
  }),
);
