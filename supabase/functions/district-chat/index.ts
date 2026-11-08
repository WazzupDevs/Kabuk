// The district room's chat (docs/SPEC_V4.md §4.V): as the venue chat (venue-chat/index.ts) for the
// person's own open district session. Length and profanity are checked here (rule 7); the session,
// the rate limit and the write in district_chat_send_once. Others learn of a change from a
// data-free broadcast on district_chat:{room_id} (rule 9) and read the page again: nothing older
// than their own coming in, no head count, no profile id (rule 4). The muted list is the venue
// chat's (venue-chat/mutes and unmute); a friend request (friends/request { districtChatMessageId })
// and a profile (profile/get { districtChatMessageId }) go through those functions.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { inBackground } from '../_shared/background.ts';
import { broadcast } from '../_shared/broadcast.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { signPhotos } from '../_shared/photos.ts';
import { loadProfanity } from '../_shared/profanity.ts';
import type {
  DistrictChatPageResponse,
  DistrictChatRequest,
  DistrictChatSendResponse,
} from '../_shared/pure/api/district.ts';
import type { VenueChatMuteResponse } from '../_shared/pure/api/venueChat.ts';
import {
  DISTRICT_CHAT_BROADCAST,
  DISTRICT_CHAT_REACTION_BROADCAST,
  districtChatChannel,
} from '../_shared/pure/district.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { parseQuote, parseReactionCounts } from '../_shared/pure/messageExtras.ts';
import { containsProfanity } from '../_shared/pure/profanity.ts';
import { toReaction } from '../_shared/pure/reactions.ts';
import { REPORT_REASONS } from '../_shared/pure/chat.ts';
import { prepareVenueMessage, VENUE_CHAT } from '../_shared/pure/venueChat.ts';

const ReactionInput = z
  .custom<string | null>((v) => v === null || toReaction(v) !== null)
  .transform((v) => (v === null ? null : toReaction(v)));

const Body: z.ZodType<DistrictChatRequest> = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('send'),
    body: z.string().max(1000),
    identity: z.enum(['anonymous', 'profiled']),
    replyTo: z.uuid().optional(),
    clientId: z.uuid().optional(),
  }),
  z.object({ action: z.literal('react'), messageId: z.uuid(), emoji: ReactionInput }),
  z.object({ action: z.literal('page'), before: z.iso.datetime({ offset: true }).optional() }),
  z.object({ action: z.literal('delete'), messageId: z.uuid() }),
  z.object({ action: z.literal('mute'), messageId: z.uuid() }),
  z.object({ action: z.literal('report'), messageId: z.uuid(), reason: z.enum(REPORT_REASONS) }),
]);

const db = serviceClient();

function announce(roomId: string, event: string): void {
  inBackground(broadcast(districtChatChannel(roomId), event));
}

async function page(userId: string, before?: string): Promise<DistrictChatPageResponse> {
  const [session, rows] = await Promise.all([
    db.rpc('district_open_session_room', { target_user_id: userId }),
    db.rpc('district_chat_page_for', {
      target_user_id: userId,
      ...(before ? { before } : {}),
      page_size: VENUE_CHAT.pageSize,
    }),
  ]);
  if (session.error) throw dbError('district_open_session_room', session.error);
  if (rows.error) throw dbError('district_chat_page_for', rows.error);
  const urls = await signPhotos(db, [
    ...new Set(rows.data.map((m) => m.photo_path).filter((p): p is string => !!p)),
  ]);
  return {
    roomId: session.data ?? null,
    messages: rows.data.map((m) => ({
      id: m.id,
      profiled: m.profiled,
      senderAlias: m.sender_alias,
      displayName: m.display_name,
      photoUrl: m.photo_path ? (urls.get(m.photo_path) ?? null) : null,
      body: m.body,
      createdAt: m.created_at,
      fromMe: m.from_me,
      replyTo: parseQuote(m.reply_to),
      reactions: parseReactionCounts(m.reactions),
      senderKey: m.sender_key,
      senderLook: m.sender_look,
    })),
  };
}

Deno.serve(
  handle(
    async (
      req,
      raw,
    ): Promise<
      DistrictChatPageResponse | DistrictChatSendResponse | VenueChatMuteResponse | { ok: true }
    > => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);
      if (body.action === 'page') return page(user.id, body.before);

      if (body.action === 'delete') {
        const { data, error } = await db.rpc('district_chat_delete', {
          target_user_id: user.id,
          target_message_id: body.messageId,
        });
        if (error) throw dbError('district_chat_delete', error);
        announce(data, DISTRICT_CHAT_BROADCAST);
        return { ok: true };
      }

      // Nothing goes to the muted person (rule 5).
      if (body.action === 'mute') {
        const { data, error } = await db.rpc('district_chat_mute', {
          target_user_id: user.id,
          target_message_id: body.messageId,
        });
        if (error) throw dbError('district_chat_mute', error);
        return { muteId: data };
      }

      if (body.action === 'report') {
        const { data, error } = await db.rpc('safety_report_district_chat', {
          target_user_id: user.id,
          target_message_id: body.messageId,
          new_reason: body.reason,
          snapshot_size: VENUE_CHAT.reportSnapshotSize,
          hide_after: VENUE_CHAT.hideAfterReports,
        });
        if (error) throw dbError('safety_report_district_chat', error);
        if (data) announce(data, DISTRICT_CHAT_BROADCAST);
        return { ok: true };
      }

      if (body.action === 'react') {
        const { data, error } = await db.rpc('district_chat_react', {
          target_user_id: user.id,
          target_message_id: body.messageId,
          new_emoji: body.emoji as string,
          window_seconds: VENUE_CHAT.reactionWindowSeconds,
          window_max: VENUE_CHAT.reactionWindowMax,
        });
        if (error) throw dbError('district_chat_react', error);
        const row = data[0];
        if (row?.changed) announce(row.room_id, DISTRICT_CHAT_REACTION_BROADCAST);
        return { ok: true };
      }

      const text = prepareVenueMessage(body.body);
      if (text === null) {
        throw new AppError('message_invalid', 'Message must be 1 to 200 characters.');
      }
      if (containsProfanity(text, await loadProfanity(db))) {
        throw new AppError('profanity_rejected', 'Message contains inappropriate language.');
      }
      const { data, error } = await db.rpc('district_chat_send_once', {
        target_user_id: user.id,
        new_body: text,
        expected_identity: body.identity,
        min_interval_ms: VENUE_CHAT.minIntervalMs,
        window_seconds: VENUE_CHAT.windowSeconds,
        window_max: VENUE_CHAT.windowMax,
        ...(body.replyTo ? { reply_to: body.replyTo } : {}),
        ...(body.clientId ? { new_client_id: body.clientId } : {}),
      });
      if (error) throw dbError('district_chat_send_once', error);
      const [sent] = data;
      if (!sent) throw new AppError('internal', 'district_chat_send_once returned no row.');
      if (!sent.replayed) announce(sent.room_id, DISTRICT_CHAT_BROADCAST);
      return { messageId: sent.message_id };
    },
  ),
);
