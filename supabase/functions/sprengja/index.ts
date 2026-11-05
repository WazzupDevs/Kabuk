// Sprengja (docs/SPEC_V4.md §4.F "Adım 4.6.7", K-85): the bomb goes from hand to hand. The server
// keeps the hidden fuse (game_secrets), the holder and the score (rooms.game_state); this function
// only checks the call and passes it on. It never sees the fuse: the database draws it and keeps
// it, and no answer here carries it (rule 3, K-85 O-4).
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import type { GameOkResponse, SprengjaRequest } from '../_shared/pure/api/games.ts';
import { AppError } from '../_shared/pure/errors.ts';

const Counter = z.number().int().min(1).max(10_000);

const Body: z.ZodType<SprengjaRequest> = z.discriminatedUnion('action', [
  z.object({ action: z.literal('shuffle'), roomId: z.uuid() }),
  z.object({ action: z.literal('start'), roomId: z.uuid() }),
  z.object({ action: z.literal('reveal'), roomId: z.uuid(), round: Counter }),
  z.object({ action: z.literal('light'), roomId: z.uuid(), round: Counter }),
  z.object({ action: z.literal('pass'), roomId: z.uuid(), round: Counter, step: Counter }),
  z.object({ action: z.literal('poll'), roomId: z.uuid(), round: Counter }),
  z.object({ action: z.literal('ready'), roomId: z.uuid(), step: Counter }),
  z.object({ action: z.literal('advance'), roomId: z.uuid() }),
]);

const db = serviceClient();

const OK: GameOkResponse = { ok: true };

Deno.serve(
  handle(async (req, raw): Promise<GameOkResponse> => {
    const body = Body.parse(raw);
    const user = await requireUser(req, db);
    return await act(user.id, body);
  }),
);

async function act(userId: string, body: SprengjaRequest): Promise<GameOkResponse> {
  const target = { target_user_id: userId, target_room_id: body.roomId };

  switch (body.action) {
    case 'shuffle':
    case 'start':
    case 'advance': {
      const fn = `sprengja_${body.action}` as const;
      const { error } = await db.rpc(fn, target);
      if (error) throw dbError(fn, error);
      return OK;
    }

    case 'reveal':
    case 'light': {
      const fn = `sprengja_${body.action}` as const;
      const { error } = await db.rpc(fn, { ...target, at_round: body.round });
      if (error) throw dbError(fn, error);
      return OK;
    }

    case 'pass': {
      const { data, error } = await db.rpc('sprengja_pass', {
        ...target,
        at_round: body.round,
        at_step: body.step,
      });
      if (error) throw dbError('sprengja_pass', error);
      // The blast a late throw caused is already written: the answer only says the round is over.
      if (data === 'over') throw new AppError('turn_over', 'The bomb has gone off.');
      return OK;
    }

    case 'poll': {
      const { error } = await db.rpc('sprengja_poll', { ...target, at_round: body.round });
      if (error) throw dbError('sprengja_poll', error);
      return OK;
    }

    case 'ready': {
      const { error } = await db.rpc('sprengja_ready', { ...target, at_step: body.step });
      if (error) throw dbError('sprengja_ready', error);
      return OK;
    }
  }
}
