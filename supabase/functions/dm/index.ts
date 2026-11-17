// DMs between friends (docs/arsiv/SPEC_V2.md §6.4). The thread exists only while the friendship does.
// Broadcasts carry no data (clients reread through dm_messages_page); the push says only
// "Yeni bir mesajın var". v3 step 6 (docs/SPEC_V3.md §18.2): the Mesajlar list and the ticks; a
// status that really moves (delivered, read) is announced on dm:{thread_id} as dm_status.
// docs/SPEC_V3.md §21: a reply names a message of the same conversation; a reaction is the
// caller's one per message, announced on dm:{thread_id} as dm_reaction (no push, no unread).
// docs/SPEC_V4.md §4.X: pin, archive and clear are the caller's own (dm_thread_prefs; no broadcast,
// the other member never learns of them); an edit is announced on dm:{thread_id} as dm_edit, and
// on the other member's inbox when it is the newest message (its preview), never with a push.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { inBackground } from '../_shared/background.ts';
import { broadcast } from '../_shared/broadcast.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { notifyInbox, pushIfAllowed } from '../_shared/inbox.ts';
import { loadProfanity } from '../_shared/profanity.ts';
import { signPhotos } from '../_shared/photos.ts';
import type {
  DmEditResponse,
  DmInboxResponse,
  DmOkResponse,
  DmRequest,
  DmSendResponse,
  DmStatus,
} from '../_shared/pure/api/friends.ts';
import {
  archivedUnread,
  DM_EDIT_RATE,
  DM_EDIT_WINDOW_MS,
  DM_PIN_MAX,
  pinnedFirst,
} from '../_shared/pure/dmManage.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { DM_MIN_INTERVAL_MS, prepareDm } from '../_shared/pure/friends.ts';
import { containsProfanity } from '../_shared/pure/profanity.ts';
import { dmPush, PUSH_PREFERENCE } from '../_shared/pure/push.ts';
import { REACTION_RATE, toReaction } from '../_shared/pure/reactions.ts';
import { BROADCAST, dmChannel } from '../_shared/pure/rooms.ts';

// A reaction: one of the six faces, or an emoji of the app before them (reactions.ts); null takes
// the caller's back.
const ReactionInput = z
  .custom<string | null>((v) => v === null || toReaction(v) !== null)
  .transform((v) => (v === null ? null : toReaction(v)));

const Body: z.ZodType<DmRequest> = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('send'),
    threadId: z.uuid(),
    body: z.string().max(2000),
    replyTo: z.uuid().optional(),
  }),
  z.object({
    action: z.literal('react'),
    messageId: z.uuid(),
    emoji: ReactionInput,
  }),
  z.object({ action: z.literal('read'), threadId: z.uuid() }),
  z.object({ action: z.literal('inbox') }),
  z.object({ action: z.literal('delivered') }),
  z.object({ action: z.literal('pin'), threadId: z.uuid() }),
  z.object({ action: z.literal('unpin'), threadId: z.uuid() }),
  z.object({ action: z.literal('archive'), threadId: z.uuid() }),
  z.object({ action: z.literal('unarchive'), threadId: z.uuid() }),
  // upTo: the newest message the caller saw (null: it saw none); the mark goes no further.
  z.object({ action: z.literal('clear'), threadId: z.uuid(), upTo: z.uuid().nullable() }),
  z.object({ action: z.literal('edit'), messageId: z.uuid(), body: z.string().max(2000) }),
  z.strictObject({ action: z.literal('delete'), messageId: z.uuid() }),
]);

const db = serviceClient();

const isStatus = (value: string | null): value is DmStatus =>
  value === 'sent' || value === 'delivered' || value === 'read';

async function inbox(userId: string): Promise<DmInboxResponse> {
  const { data, error } = await db.rpc('dm_inbox', { viewer: userId });
  if (error) throw dbError('dm_inbox', error);
  const urls = await signPhotos(
    db,
    data.map((t) => t.photo_path).filter((p): p is string => !!p),
  );
  const threads = pinnedFirst(
    data.map((t) => ({
      threadId: t.thread_id,
      publicId: t.public_id,
      displayName: t.display_name,
      photoUrl: t.photo_path ? (urls.get(t.photo_path) ?? null) : null,
      lastBody: t.last_body,
      lastDeleted: t.last_deleted === true,
      lastFromMe: t.last_from_me === true,
      lastMessageAt: t.last_message_at,
      unreadCount: t.unread_count,
      lastStatus: isStatus(t.last_status) ? t.last_status : null,
      // Null when not pinned (the generated type leaves the null out).
      pinnedAt: (t.pinned_at as string | null) ?? null,
      archived: t.archived === true,
    })),
  ).map(({ pinnedAt, ...t }) => ({ ...t, pinned: pinnedAt !== null }));
  return { threads, archivedUnread: archivedUnread(threads) };
}

// The text of a send or an edit, by the same rules (rule 7).
async function checkedText(raw: string): Promise<string> {
  const text = prepareDm(raw);
  if (text === null) throw new AppError('message_invalid', 'Message must be 1–500 characters.');
  if (containsProfanity(text, await loadProfanity(db))) {
    throw new AppError('profanity_rejected', 'Message rejected.');
  }
  return text;
}

Deno.serve(
  handle(
    async (req, raw): Promise<DmOkResponse | DmSendResponse | DmEditResponse | DmInboxResponse> => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);

      switch (body.action) {
        case 'send': {
          const text = await checkedText(body.body);
          const { data, error } = await db.rpc('dm_send_message', {
            target_user_id: user.id,
            target_thread_id: body.threadId,
            new_body: text,
            min_interval_ms: DM_MIN_INTERVAL_MS,
            ...(body.replyTo ? { reply_to: body.replyTo } : {}),
          });
          if (error) throw dbError('dm_send_message', error);
          const sent = data[0];
          if (!sent) throw new Error('dm_send_message returned no row');
          inBackground(broadcast(dmChannel(body.threadId), BROADCAST.dmMessage));
          notifyInbox([sent.other_user_id], BROADCAST.dm);
          pushIfAllowed(db, sent.other_user_id, PUSH_PREFERENCE.dm, dmPush());
          return { ok: true, messageId: sent.message_id, createdAt: sent.created_at };
        }

        case 'react': {
          // B4: one reaction budget for the table chat and DMs, asked in its own call (reaction_rate).
          const limited = await db.rpc('reaction_rate_hit', {
            target_user_id: user.id,
            window_seconds: REACTION_RATE.windowSeconds,
            window_max: REACTION_RATE.windowMax,
          });
          if (limited.error) throw dbError('reaction_rate_hit', limited.error);
          const { data, error } = await db.rpc('dm_react', {
            target_user_id: user.id,
            target_message_id: body.messageId,
            // null removes it; the generated argument type leaves out null.
            new_emoji: body.emoji as string,
          });
          if (error) throw dbError('dm_react', error);
          const row = data[0];
          if (row?.changed) {
            inBackground(broadcast(dmChannel(row.thread_id), BROADCAST.dmReaction));
          }
          return { ok: true };
        }

        case 'read': {
          const { data: advanced, error } = await db.rpc('dm_mark_read', {
            target_user_id: user.id,
            target_thread_id: body.threadId,
          });
          if (error) throw dbError('dm_mark_read', error);
          if (advanced) inBackground(broadcast(dmChannel(body.threadId), BROADCAST.dmStatus));
          return { ok: true };
        }

        case 'inbox':
          return await inbox(user.id);

        case 'delivered': {
          const { data: threads, error } = await db.rpc('dm_mark_delivered', {
            target_user_id: user.id,
          });
          if (error) throw dbError('dm_mark_delivered', error);
          for (const threadId of threads) {
            inBackground(broadcast(dmChannel(threadId), BROADCAST.dmStatus));
          }
          return { ok: true };
        }

        case 'pin':
        case 'unpin':
        case 'archive':
        case 'unarchive':
        case 'clear': {
          const { error } = await db.rpc('dm_thread_pref', {
            target_user_id: user.id,
            target_thread_id: body.threadId,
            change: body.action,
            max_pins: DM_PIN_MAX,
            ...(body.action === 'clear' && body.upTo ? { up_to: body.upTo } : {}),
          });
          if (error) throw dbError('dm_thread_pref', error);
          return { ok: true };
        }

        case 'edit': {
          const text = await checkedText(body.body);
          // Every edit is a broadcast: a budget per account, asked alone (as reactions are).
          const limited = await db.rpc('dm_edit_rate_hit', {
            target_user_id: user.id,
            window_seconds: DM_EDIT_RATE.windowSeconds,
            window_max: DM_EDIT_RATE.windowMax,
          });
          if (limited.error) throw dbError('dm_edit_rate_hit', limited.error);
          const { data, error } = await db.rpc('dm_edit', {
            target_user_id: user.id,
            target_message_id: body.messageId,
            new_body: text,
            window_ms: DM_EDIT_WINDOW_MS,
          });
          if (error) throw dbError('dm_edit', error);
          const row = data[0];
          if (!row) throw new Error('dm_edit returned no row');
          if (row.changed) {
            inBackground(broadcast(dmChannel(row.thread_id), BROADCAST.dmEdit));
            if (row.is_last) notifyInbox([row.other_user_id], BROADCAST.dm);
          }
          return { ok: true, body: text, editedAt: (row.edited_at as string | null) ?? null };
        }

        // 17 Kasım (§4.X): the sender's own message, for both members. Announced like an edit
        // (dm_edit, no data): the readers read their loaded pages again and get the trace.
        case 'delete': {
          const limited = await db.rpc('dm_edit_rate_hit', {
            target_user_id: user.id,
            window_seconds: DM_EDIT_RATE.windowSeconds,
            window_max: DM_EDIT_RATE.windowMax,
          });
          if (limited.error) throw dbError('dm_edit_rate_hit', limited.error);
          const { data, error } = await db.rpc('dm_delete', {
            target_user_id: user.id,
            target_message_id: body.messageId,
          });
          if (error) throw dbError('dm_delete', error);
          const row = data[0];
          if (!row) throw new Error('dm_delete returned no row');
          if (row.changed) {
            inBackground(broadcast(dmChannel(row.thread_id), BROADCAST.dmEdit));
            if (row.is_last) notifyInbox([row.other_user_id], BROADCAST.dm);
          }
          return { ok: true };
        }
      }
    },
  ),
);
