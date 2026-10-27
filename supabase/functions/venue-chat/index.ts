// Venue chat room (docs/SPEC_V3.md §7): one group chat per venue for the accounts with a live table
// there. Length and profanity are checked here; the table, the rate limit and the write in
// venue_chat_send. Others learn of a new message from a data-free broadcast on
// venue_chat:{venue_id} and read it with `page`, which signs the photos of profiled messages
// (§7.2; venue_chat_page_for). No push. §21: a reply names a visible message of the same venue; a
// reaction is the account's one per message (10 per 10 seconds), announced as venue_chat_reaction;
// the page says how many per emoji, never who. §22.G: the mode (anonymous or profiled) is chosen
// once per check-in with the first message (venue_chat_send keeps it; a profiled choice needs a
// visible profile photo) and the page tells the caller which one it is. docs/SPEC_V4.md §4.D (step
// 4.4): the check-in has one identity and one change (checkin/set-identity); an anonymous message
// goes with the account's nick and capsule look, the page groups a person's messages by senderKey,
// a sender deletes their own message, and a reader mutes one identity of another.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { inBackground } from '../_shared/background.ts';
import { broadcast } from '../_shared/broadcast.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { signPhotos } from '../_shared/photos.ts';
import { loadProfanity } from '../_shared/profanity.ts';
import type { ReactResponse } from '../_shared/pure/api/chat.ts';
import type {
  VenueChatMuteResponse,
  VenueChatMutesResponse,
  VenueChatPageResponse,
  VenueChatRequest,
  VenueChatResponse,
} from '../_shared/pure/api/venueChat.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { parseQuote, parseReactionCounts } from '../_shared/pure/messageExtras.ts';
import { containsProfanity } from '../_shared/pure/profanity.ts';
import { toReaction } from '../_shared/pure/reactions.ts';
import {
  checkinIdentity,
  prepareVenueMessage,
  VENUE_CHAT,
  VENUE_CHAT_BROADCAST,
  VENUE_CHAT_REACTION_BROADCAST,
  venueChatChannel,
  venueChatMode,
} from '../_shared/pure/venueChat.ts';

// A reaction: one of the six faces, or an emoji of the app before them (reactions.ts); null takes
// the caller's back.
const ReactionInput = z
  .custom<string | null>((v) => v === null || toReaction(v) !== null)
  .transform((v) => (v === null ? null : toReaction(v)));

const Body: z.ZodType<VenueChatRequest> = z.discriminatedUnion('action', [
  // A message says which identity it goes with: today's app with `profiled`, the new app with
  // `identity`; exactly one of them, so nothing goes out with an identity nobody chose.
  z
    .object({
      action: z.literal('send'),
      venueId: z.uuid(),
      body: z.string().max(1000),
      profiled: z.boolean().optional(),
      identity: z.enum(['anonymous', 'profiled']).optional(),
      replyTo: z.uuid().optional(),
    })
    .refine((m) => (m.profiled === undefined) !== (m.identity === undefined)),
  z.object({
    action: z.literal('react'),
    messageId: z.uuid(),
    emoji: ReactionInput,
  }),
  z.object({
    action: z.literal('page'),
    venueId: z.uuid(),
    before: z.iso.datetime({ offset: true }).optional(),
  }),
  z.object({ action: z.literal('delete'), messageId: z.uuid() }),
  z.object({ action: z.literal('mute'), messageId: z.uuid() }),
  z.object({ action: z.literal('unmute'), muteId: z.uuid() }),
  z.object({ action: z.literal('mutes') }),
]);

const db = serviceClient();

// Empty without a live table at the venue. Only profiled messages have a path (never an anonymous
// one, never a hidden photo); each distinct path is signed once. The mode is the caller's own
// choice at this venue's live table (null before the first message or without a table).
async function page(
  userId: string,
  venueId: string,
  before?: string,
): Promise<VenueChatPageResponse> {
  const table = await db
    .from('table_sessions')
    .select('venue_chat_profiled, identity_mode, identity_switches')
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (table.error) throw dbError('table_sessions', table.error);
  const { data, error } = await db.rpc('venue_chat_page_for', {
    target_user_id: userId,
    target_venue_id: venueId,
    ...(before ? { before } : {}),
    page_size: VENUE_CHAT.pageSize,
  });
  if (error) throw dbError('venue_chat_page_for', error);
  const urls = await signPhotos(db, [
    ...new Set(data.map((m) => m.photo_path).filter((p): p is string => !!p)),
  ]);
  return {
    messages: data.map((m) => ({
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
    mode: venueChatMode(table.data?.venue_chat_profiled),
    identity: table.data ? checkinIdentity(table.data) : null,
  };
}

Deno.serve(
  handle(
    async (
      req,
      raw,
    ): Promise<
      | VenueChatResponse
      | VenueChatPageResponse
      | ReactResponse
      | VenueChatMuteResponse
      | VenueChatMutesResponse
      | { ok: true }
    > => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);
      if (body.action === 'page') return page(user.id, body.venueId, body.before);
      if (body.action === 'delete') {
        const { data, error } = await db.rpc('venue_chat_delete', {
          target_user_id: user.id,
          target_message_id: body.messageId,
        });
        if (error) throw dbError('venue_chat_delete', error);
        // Data-free, like a new message: the others read the page again.
        inBackground(broadcast(venueChatChannel(data), VENUE_CHAT_BROADCAST));
        return { ok: true };
      }
      // Nothing goes to the muted person, no broadcast either (rule 5).
      if (body.action === 'mute') {
        const { data, error } = await db.rpc('venue_chat_mute', {
          target_user_id: user.id,
          target_message_id: body.messageId,
        });
        if (error) throw dbError('venue_chat_mute', error);
        return { muteId: data };
      }
      if (body.action === 'unmute') {
        const { error } = await db.rpc('venue_chat_unmute', {
          target_user_id: user.id,
          target_mute_id: body.muteId,
        });
        if (error) throw dbError('venue_chat_unmute', error);
        return { ok: true };
      }
      if (body.action === 'mutes') {
        const { data, error } = await db.rpc('venue_chat_mutes_of', { target_user_id: user.id });
        if (error) throw dbError('venue_chat_mutes_of', error);
        return {
          mutes: data.map((m) => ({
            id: m.id,
            label: m.label,
            profiled: m.profiled,
            createdAt: m.created_at,
          })),
        };
      }
      if (body.action === 'react') {
        const { data, error } = await db.rpc('venue_chat_react', {
          target_user_id: user.id,
          target_message_id: body.messageId,
          // null removes it; the generated argument type leaves out null.
          new_emoji: body.emoji as string,
          window_seconds: VENUE_CHAT.reactionWindowSeconds,
          window_max: VENUE_CHAT.reactionWindowMax,
        });
        if (error) throw dbError('venue_chat_react', error);
        const row = data[0];
        if (row?.changed) {
          inBackground(broadcast(venueChatChannel(row.venue_id), VENUE_CHAT_REACTION_BROADCAST));
        }
        return { ok: true };
      }

      const text = prepareVenueMessage(body.body);
      if (text === null) {
        throw new AppError('message_invalid', 'Message must be 1 to 200 characters.');
      }
      // Rejected, not masked (rule 7).
      if (containsProfanity(text, await loadProfanity(db))) {
        throw new AppError('profanity_rejected', 'Message contains inappropriate language.');
      }

      const { data, error } = await db.rpc('venue_chat_send', {
        target_user_id: user.id,
        target_venue_id: body.venueId,
        new_body: text,
        ...(body.profiled !== undefined ? { profiled: body.profiled } : {}),
        ...(body.identity ? { expected_identity: body.identity } : {}),
        min_interval_ms: VENUE_CHAT.minIntervalMs,
        window_seconds: VENUE_CHAT.windowSeconds,
        window_max: VENUE_CHAT.windowMax,
        ...(body.replyTo ? { reply_to: body.replyTo } : {}),
      });
      if (error) throw dbError('venue_chat_send', error);
      inBackground(broadcast(venueChatChannel(body.venueId), VENUE_CHAT_BROADCAST));
      return { messageId: data.id };
    },
  ),
);
