// Sohbet cards (MVP_SPEC §5.3). The side model's cards do not run at a table of people
// (docs/SPEC_V4.md §4.E): today's app hears update_required until the cards come back in step
// 4.6.2 (sohbet/start, next-card and the rest, §4.J).
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import type { GameOkResponse, SohbetRequest } from '../_shared/pure/api/games.ts';
import { AppError } from '../_shared/pure/errors.ts';

const Body: z.ZodType<SohbetRequest> = z.object({
  action: z.literal('next-card'),
  roomId: z.uuid(),
});

const db = serviceClient();

Deno.serve(
  handle(async (req, raw): Promise<GameOkResponse> => {
    Body.parse(raw);
    await requireUser(req, db);
    throw new AppError('update_required', 'This version of the app is too old. Update it.');
  }),
);
