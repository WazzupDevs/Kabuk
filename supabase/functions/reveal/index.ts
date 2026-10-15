// "Tanışalım mı?" (MVP_SPEC §4.6, docs/SPEC_V3.md §22.F). Each phone answers for itself; answers
// are private. Two phones on opposite sides that both say "Evet" match at once, and only those two
// hear it: a data-free `reveal_match` on their session: channels, then each reads its own matches
// with `matches` (the room's color, the pair's emoji, the other phone's alias and, if it joined
// profiled, its profile). Everything else shows only at reveal_ends_at (rule 5, per pair). With one
// phone a side both see the same result in rooms.reveal_result / reveal_token, as before.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { inBackground } from '../_shared/background.ts';
import { broadcast } from '../_shared/broadcast.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { signPhotos } from '../_shared/photos.ts';
import { ageOn, istanbulToday, parseIsoDate } from '../_shared/pure/age.ts';
import type {
  RevealMatchesResponse,
  RevealRequest,
  RevealResponse,
} from '../_shared/pure/api/reveal.ts';
import { BROADCAST, sessionChannel, venueChannel } from '../_shared/pure/rooms.ts';

const Body: z.ZodType<RevealRequest> = z.discriminatedUnion('action', [
  z.object({ action: z.literal('decide'), roomId: z.uuid(), wantsMeet: z.boolean() }),
  z.object({ action: z.literal('finalize'), roomId: z.uuid() }),
  z.object({ action: z.literal('matches'), roomId: z.uuid() }),
]);

const db = serviceClient();

Deno.serve(
  handle(async (req, raw): Promise<RevealResponse | RevealMatchesResponse> => {
    const body = Body.parse(raw);
    const user = await requireUser(req, db);

    switch (body.action) {
      // The answer returns the phones of the pairs it completed (none, or the caller and each new
      // partner); each hears of its match on its own session: channel.
      case 'decide': {
        const { data, error } = await db.rpc('reveal_decide', {
          target_user_id: user.id,
          target_room_id: body.roomId,
          wants: body.wantsMeet,
        });
        if (error) throw dbError('reveal_decide', error);
        for (const row of data) {
          inBackground(broadcast(sessionChannel(row.matched_session_id), BROADCAST.revealMatch));
        }
        return { ok: true };
      }

      // The call that closes the window announces the lobby change: rooms held out of the lobby
      // during the window (MVP_SPEC §4.6) are listed from now on.
      case 'finalize': {
        const { data: venueId, error } = await db.rpc('reveal_finalize', {
          target_user_id: user.id,
          target_room_id: body.roomId,
        });
        if (error) throw dbError('reveal_finalize', error);
        if (venueId) inBackground(broadcast(venueChannel(venueId), BROADCAST.lobbyChanged));
        return { ok: true };
      }

      // The caller's own matches; from reveal_ends_at on, also the other side's phones it did not
      // match. A matched profile's photo is signed and its birth date becomes an age here.
      case 'matches': {
        const { data, error } = await db.rpc('reveal_matches', {
          target_user_id: user.id,
          target_room_id: body.roomId,
        });
        if (error) throw dbError('reveal_matches', error);
        const urls = await signPhotos(
          db,
          data.map((row) => row.photo_path).filter((path): path is string => !!path),
        );
        const today = istanbulToday(new Date());
        const ended = data.some((row) => row.ended);
        const response: RevealMatchesResponse = {
          color: data.find((row) => row.color)?.color ?? null,
          matches: data
            .filter((row) => row.matched && row.emoji)
            .map((row) => {
              const born = row.birth_date ? parseIsoDate(row.birth_date) : null;
              return {
                sessionId: row.session_id,
                alias: row.alias,
                emoji: row.emoji as string,
                profile:
                  row.profiled && row.display_name
                    ? {
                        displayName: row.display_name,
                        age: born ? ageOn(born, today) : null,
                        photoUrl: row.photo_path ? (urls.get(row.photo_path) ?? null) : null,
                      }
                    : null,
              };
            }),
          unmatched: null,
        };
        if (ended) {
          response.unmatched = data
            .filter((row) => !row.matched)
            .map((row) => ({ sessionId: row.session_id, alias: row.alias }));
        }
        return response;
      }
    }
  }),
);
