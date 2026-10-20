// Tables and their people (docs/SPEC_V4.md §4.E): create, the lobby, "Katıl" and "Bu masadayım",
// leaving and ending. The SQL functions do the locked state transitions; this handler validates,
// maps errors, and sends data-free broadcasts and pushes. Nothing sent to a requester depends on a
// decline: no broadcast, no push, no response field (rule 5). Every change of a table is announced
// on the venue channel: the lobby and the running tables are one read (venue_tables). Today's
// app's game proposals and "Masanla oyna" answer update_required; the games come back with 4.6.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { inBackground } from '../_shared/background.ts';
import { broadcast } from '../_shared/broadcast.ts';
import { reachablePhotoUrl } from '../_shared/photos.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { lobbyChanged } from '../_shared/lobby.ts';
import { sendPush } from '../_shared/push.ts';
import type {
  CreateRoomResponse,
  RequestJoinResponse,
  RequestProfileResponse,
  RerollNameResponse,
  RoomsOkResponse,
  RoomsRequest,
  SetIconResponse,
} from '../_shared/pure/api/rooms.ts';
import { ageOn, istanbulToday, parseIsoDate } from '../_shared/pure/age.ts';
import { PHOTO_BUCKET, PHOTO_URL_SECONDS } from '../_shared/pure/profile.ts';
import { joinAcceptedPush, joinRequestPush } from '../_shared/pure/push.ts';
import {
  BROADCAST,
  CONCEPTS,
  INTENTS,
  JOIN_REQUEST_TTL_SECONDS,
  MAX_JOIN_REQUESTS_PER_HOUR,
  PROPOSABLE_CONCEPTS,
  sessionChannel,
} from '../_shared/pure/rooms.ts';
import { SAHTEKAR } from '../_shared/pure/sahtekar.ts';
import { isTableIcon, TABLE_NAME_REROLLS } from '../_shared/pure/tables.ts';
import { SIDES } from '../_shared/pure/teams.ts';

// Today's app's proposal fields, parsed so that it hears update_required rather than bad_request.
const Players = z.number().int().min(1).max(SAHTEKAR.maxPerTable);

const Body: z.ZodType<RoomsRequest> = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    open: z.boolean().optional(),
    intent: z.enum(INTENTS).optional(),
    gameTag: z.enum(CONCEPTS).optional(),
    profiled: z.boolean().optional(),
    icon: z.string().refine(isTableIcon).optional(),
  }),
  z.object({ action: z.literal('create-solo') }),
  z.object({ action: z.literal('set-visibility'), roomId: z.uuid(), open: z.boolean() }),
  z.object({
    action: z.literal('set-icon'),
    roomId: z.uuid(),
    icon: z.string().refine(isTableIcon),
  }),
  z.object({ action: z.literal('reroll-name'), roomId: z.uuid() }),
  z.object({
    action: z.literal('request-join'),
    roomId: z.uuid(),
    asMember: z.boolean().optional(),
    profiled: z.boolean().optional(),
    side: z.enum(SIDES).optional(),
  }),
  z.object({ action: z.literal('respond'), requestId: z.uuid(), accept: z.boolean() }),
  z.object({
    action: z.literal('propose-game'),
    roomId: z.uuid(),
    concept: z.enum(PROPOSABLE_CONCEPTS),
    players: Players.optional(),
  }),
  z.object({
    action: z.literal('answer-game'),
    roomId: z.uuid(),
    accept: z.boolean(),
    players: Players.optional(),
  }),
  z.object({ action: z.literal('end-game'), roomId: z.uuid() }),
  z.object({ action: z.literal('end') }),
  z.object({ action: z.literal('leave'), roomId: z.uuid() }),
  z.object({ action: z.literal('request-profile'), requestId: z.uuid() }),
]);

const db = serviceClient();

// The request card's profile (docs/SPEC_V3.md §23.E): the name, the age and the photo of a
// requester who sat down profiled, for the owner who answers while the request waits.
// Everything else answers not_found alike; nothing in the answer names the account (rule 4).
async function requestProfile(userId: string, requestId: string): Promise<RequestProfileResponse> {
  const owner = await db.rpc('rooms_request_profile_owner', {
    target_user_id: userId,
    target_request_id: requestId,
  });
  if (owner.error) throw dbError('rooms_request_profile_owner', owner.error);
  if (!owner.data) throw new AppError('not_found', 'Request not found.');
  const { data, error } = await db
    .from('profiles')
    .select('display_name, birth_date, photo_path, photo_hidden_at')
    .eq('id', owner.data)
    .single();
  if (error) throw dbError('profiles', error);
  const born = data.birth_date ? parseIsoDate(data.birth_date) : null;
  let photoUrl: string | null = null;
  if (data.photo_path && !data.photo_hidden_at) {
    const signed = await db.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(data.photo_path, PHOTO_URL_SECONDS);
    if (signed.error) throw new Error(`storage sign failed (${signed.error.message})`);
    photoUrl = reachablePhotoUrl(signed.data.signedUrl);
  }
  return {
    displayName: data.display_name,
    age: born ? ageOn(born, istanbulToday(new Date())) : null,
    photoUrl,
  };
}

async function pushTokenOfSession(sessionId: string): Promise<string | null> {
  const session = await db.from('table_sessions').select('user_id').eq('id', sessionId).single();
  if (session.error) throw dbError('table_sessions', session.error);
  const profile = await db
    .from('profiles')
    .select('push_token')
    .eq('id', session.data.user_id)
    .maybeSingle();
  if (profile.error) throw dbError('profiles', profile.error);
  return profile.data?.push_token ?? null;
}

Deno.serve(
  handle(
    async (
      req,
      raw,
    ): Promise<
      | CreateRoomResponse
      | RequestJoinResponse
      | RequestProfileResponse
      | RoomsOkResponse
      | SetIconResponse
      | RerollNameResponse
    > => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);

      switch (body.action) {
        // "Masa kur" (§4.E): in the lobby unless `open: false`. The seat's identity is the
        // check-in's (gender_required and photo_required come from the database).
        case 'create': {
          const { data, error } = await db.rpc('rooms_create', {
            target_user_id: user.id,
            in_lobby: body.open ?? true,
            ...(body.intent ? { new_intent: body.intent } : {}),
            ...(body.gameTag ? { new_game_tag: body.gameTag } : {}),
            ...(body.icon ? { new_icon: body.icon } : {}),
          });
          if (error) throw dbError('rooms_create', error);
          lobbyChanged(data);
          return { roomId: data.id };
        }

        // "Masanı lobiye aç" and "Lobiden çek": only the owner.
        case 'set-visibility': {
          const { data, error } = await db.rpc('rooms_set_visibility', {
            target_user_id: user.id,
            target_room_id: body.roomId,
            in_lobby: body.open,
          });
          if (error) throw dbError('rooms_set_visibility', error);
          lobbyChanged(data);
          return { ok: true };
        }

        // docs/SPEC_V4.md §4.E (K-45, K-59): only the owner; the name stays.
        case 'set-icon': {
          const { data, error } = await db.rpc('rooms_set_icon', {
            target_user_id: user.id,
            target_room_id: body.roomId,
            new_icon: body.icon,
          });
          if (error) throw dbError('rooms_set_icon', error);
          lobbyChanged(data);
          return { icon: data.icon ?? body.icon };
        }

        // Only the owner, TABLE_NAME_REROLLS times per table; the icon stays.
        case 'reroll-name': {
          const { data, error } = await db.rpc('rooms_reroll_name', {
            target_user_id: user.id,
            target_room_id: body.roomId,
            max_rerolls: TABLE_NAME_REROLLS,
          });
          if (error) throw dbError('rooms_reroll_name', error);
          lobbyChanged(data);
          return {
            name: data.name ?? '',
            rerollsLeft: Math.max(TABLE_NAME_REROLLS - data.name_rerolls, 0),
          };
        }

        // Today's app: "Masanla oyna" and the game proposals of the side model.
        case 'create-solo':
        case 'propose-game':
        case 'answer-game':
          throw new AppError('update_required', 'This version of the app is too old. Update it.');

        // "Katıl" or "Bu masadayım" (asMember); the owner hears of it.
        case 'request-join': {
          const { data, error } = await db.rpc('rooms_request_join', {
            target_user_id: user.id,
            target_room_id: body.roomId,
            ttl_seconds: JOIN_REQUEST_TTL_SECONDS,
            max_per_hour: MAX_JOIN_REQUESTS_PER_HOUR,
            as_member: body.asMember === true,
          });
          if (error) throw dbError('rooms_request_join', error);

          const room = await db
            .from('rooms')
            .select('owner_session_id')
            .eq('id', data.room_id)
            .single();
          if (room.error) throw dbError('rooms', room.error);
          const ownerSessionId = room.data.owner_session_id;
          inBackground(broadcast(sessionChannel(ownerSessionId), BROADCAST.joinRequest));
          inBackground(
            pushTokenOfSession(ownerSessionId).then((token) =>
              sendPush(token, joinRequestPush(data.requester_alias, data.requester_phones)),
            ),
          );
          return { requestId: data.id, expiresAt: data.expires_at };
        }

        case 'respond': {
          const { data, error } = await db.rpc('rooms_respond', {
            target_user_id: user.id,
            target_request_id: body.requestId,
            accept: body.accept,
          });
          if (error) throw dbError('rooms_respond', error);

          // A decline sends nothing anywhere (rule 5): the requester learns at expires_at.
          if (data.status === 'accepted') {
            const room = await db
              .from('rooms')
              .select('id, venue_id')
              .eq('id', data.room_id)
              .single();
            if (room.error) throw dbError('rooms', room.error);
            lobbyChanged(room.data);
            inBackground(
              broadcast(sessionChannel(data.requester_session_id), BROADCAST.joinAccepted),
            );
            inBackground(
              pushTokenOfSession(data.requester_session_id).then((token) =>
                sendPush(token, joinAcceptedPush()),
              ),
            );
            // A "Katıl" from a table moved its people in the same transaction (their joined_at is
            // the accept's now(), as responded_at is) and closed it: each moved person hears of the
            // accept as the requester does.
            if (data.requester_room_id) {
              const moved = await db
                .from('room_members')
                .select('session_id')
                .eq('room_id', data.room_id)
                .eq('joined_at', data.responded_at ?? '')
                .neq('session_id', data.requester_session_id);
              if (moved.error) throw dbError('room_members', moved.error);
              for (const m of moved.data) {
                inBackground(broadcast(sessionChannel(m.session_id), BROADCAST.joinAccepted));
              }
            }
          }
          return { ok: true };
        }

        case 'end-game': {
          const { error } = await db.rpc('rooms_end_game', {
            target_user_id: user.id,
            target_room_id: body.roomId,
          });
          if (error) throw dbError('rooms_end_game', error);
          return { ok: true };
        }

        // "Masayı bitir" (§4.E): the owner only (not_owner); the table closes for everyone and its
        // pairs get their records (K-66).
        case 'end': {
          const { data, error } = await db.rpc('rooms_end', { target_user_id: user.id });
          if (error) throw dbError('rooms_end', error);
          if (data?.id) lobbyChanged(data);
          return { ok: true };
        }

        // "Masadan ayrıl" (K-13): the person leaves; an owner hands the table to the earliest
        // person there; the last person's leaving closes it.
        case 'leave': {
          const { data, error } = await db.rpc('rooms_leave', {
            target_user_id: user.id,
            target_room_id: body.roomId,
          });
          if (error) throw dbError('rooms_leave', error);
          lobbyChanged(data);
          return { ok: true };
        }

        case 'request-profile':
          return await requestProfile(user.id, body.requestId);
      }
    },
  ),
);
