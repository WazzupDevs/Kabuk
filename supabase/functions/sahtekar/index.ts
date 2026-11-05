// Krot (Sahtekar) at a table of people (docs/SPEC_V4.md §4.F "Adım 4.6.3", K-71). The server deals
// the roles (game_players) and the word (game_secrets), keeps the clue order, the secret ballots and
// the open state with its clock (rooms.game_state). The word leaves only as the answer to a player's
// or a watcher's view, never to an impostor (rule 3). The caught impostors' written guess is compared
// here with pure/trText.ts (rule 7) and is never kept or sent on (§4.F).
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import type { GameOkResponse, SahtekarRequest } from '../_shared/pure/api/games.ts';
import {
  guessMatches,
  readSahtekarView,
  SAHTEKAR_GAME,
  type SahtekarView,
} from '../_shared/pure/sahtekarGame.ts';

const Step = z.number().int().min(1).max(10_000);

const Body: z.ZodType<SahtekarRequest> = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), roomId: z.uuid() }),
  z.object({ action: z.literal('view'), roomId: z.uuid() }),
  z.object({ action: z.literal('ready'), roomId: z.uuid(), step: Step }),
  z.object({ action: z.literal('said'), roomId: z.uuid(), step: Step }),
  z.object({
    action: z.literal('vote'),
    roomId: z.uuid(),
    step: Step,
    targets: z.array(z.uuid()).min(1).max(SAHTEKAR_GAME.maxPlayers),
  }),
  z.object({
    action: z.literal('guess'),
    roomId: z.uuid(),
    step: Step,
    text: z.string().trim().min(1).max(60),
  }),
  z.object({ action: z.literal('advance'), roomId: z.uuid() }),
]);

const db = serviceClient();

Deno.serve(
  handle(async (req, raw): Promise<GameOkResponse | SahtekarView> => {
    const body = Body.parse(raw);
    const user = await requireUser(req, db);
    const target = { target_user_id: user.id, target_room_id: body.roomId };

    switch (body.action) {
      case 'start': {
        const { error } = await db.rpc('sahtekar_start', target);
        if (error) throw dbError('sahtekar_start', error);
        return { ok: true };
      }

      case 'view': {
        const { data, error } = await db.rpc('sahtekar_view', target);
        if (error) throw dbError('sahtekar_view', error);
        return readSahtekarView(data);
      }

      case 'ready':
      case 'said': {
        const fn = `sahtekar_${body.action}` as const;
        const { error } = await db.rpc(fn, { ...target, at_step: body.step });
        if (error) throw dbError(fn, error);
        return { ok: true };
      }

      case 'vote': {
        const { error } = await db.rpc('sahtekar_vote', {
          ...target,
          at_step: body.step,
          target_session_ids: body.targets,
        });
        if (error) throw dbError('sahtekar_vote', error);
        return { ok: true };
      }

      case 'guess': {
        // The word comes only to this function, for the comparison; null: another step.
        const { data: word, error } = await db.rpc('sahtekar_guess_word', {
          ...target,
          at_step: body.step,
        });
        if (error) throw dbError('sahtekar_guess_word', error);
        if (!word) return { ok: true };
        const { error: guessError } = await db.rpc('sahtekar_guess', {
          ...target,
          at_step: body.step,
          guessed_right: guessMatches(body.text, word),
        });
        if (guessError) throw dbError('sahtekar_guess', guessError);
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
