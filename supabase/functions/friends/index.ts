// Friends (docs/SPEC_V2.md §6.2–§6.5, docs/SPEC_V3.md §7.5). Requests and "Arkadaş ekle" start
// from the caller's own history row (historyId) or a profiled venue chat message
// (venueChatMessageId), never from a profile id; they answer { ok: true } whatever happens on
// the other side (swallowed, blocked, declined earlier), except `already_friends`. A decline
// sends nothing anywhere. Removal is silent for the other side.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { notifyInbox, pushIfAllowed, requireDisplayName } from '../_shared/inbox.ts';
import { signPhotos } from '../_shared/photos.ts';
import type {
  Friend,
  FriendsIncomingResponse,
  FriendsListResponse,
  FriendsAddResponse,
  FriendsOkResponse,
  FriendsRequest,
  NotificationItem,
  NotificationsResponse,
} from '../_shared/pure/api/friends.ts';
import { ageOn, istanbulToday, parseIsoDate } from '../_shared/pure/age.ts';
import { REPORT_REASONS } from '../_shared/pure/chat.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { matchPushRecipient } from '../_shared/pure/friends.ts';
import { inviteState, isUnseen } from '../_shared/pure/notifications.ts';
import { friendMatchPush, friendRequestPush, PUSH_PREFERENCE } from '../_shared/pure/push.ts';
import { BROADCAST } from '../_shared/pure/rooms.ts';
import { VENUE_CHAT } from '../_shared/pure/venueChat.ts';

const Body: z.ZodType<FriendsRequest> = z.union([
  z.object({ action: z.literal('list') }),
  z.strictObject({ action: z.literal('request'), historyId: z.uuid() }),
  z.strictObject({ action: z.literal('request'), venueChatMessageId: z.uuid() }),
  z.object({ action: z.literal('incoming') }),
  z.object({ action: z.literal('respond'), requestId: z.uuid(), accept: z.boolean() }),
  z.object({ action: z.literal('add-from-room'), historyId: z.uuid() }),
  z.object({ action: z.literal('withdraw-add'), historyId: z.uuid() }),
  z.object({
    action: z.literal('remove'),
    publicId: z.uuid(),
    report: z.enum(REPORT_REASONS).optional(),
  }),
  z.object({ action: z.literal('notifications') }),
]);

const db = serviceClient();

type Outcome = { outcome: string; other_user_id: string | null };

// A new friendship tells both inboxes; nothing else is broadcast from here but a new request.
function announce(userId: string, result: Outcome | undefined): void {
  if (!result?.other_user_id) return;
  if (result.outcome === 'friendship_created') {
    notifyInbox([userId, result.other_user_id], BROADCAST.friendshipChanged);
  } else if (result.outcome === 'request_created') {
    notifyInbox([result.other_user_id], BROADCAST.friendRequest);
    pushIfAllowed(db, result.other_user_id, PUSH_PREFERENCE.friend_request, friendRequestPush());
  }
}

// Requests from the venue chat: name, age and photo of the sender (S6); no public_id, no alias.
async function incoming(userId: string): Promise<FriendsIncomingResponse> {
  const { data, error } = await db.rpc('friends_incoming_venue_chat', { target_user_id: userId });
  if (error) throw dbError('friends_incoming_venue_chat', error);
  const urls = await signPhotos(
    db,
    data.map((r) => r.photo_path).filter((p): p is string => !!p),
  );
  const today = istanbulToday(new Date());
  return {
    requests: data.map((r) => {
      const born = r.birth_date ? parseIsoDate(r.birth_date) : null;
      return {
        requestId: r.request_id,
        venueName: r.venue_name,
        displayName: r.display_name,
        age: born ? ageOn(born, today) : null,
        photoUrl: r.photo_path ? (urls.get(r.photo_path) ?? null) : null,
        createdAt: r.created_at,
      };
    }),
  };
}

// The bell's list (docs/SPEC_V4.md §4.G): my_notifications's rows with their photos signed and the
// age instead of the birth date; new after the list was last opened.
async function notifications(userId: string): Promise<NotificationsResponse> {
  const [rows, seen] = await Promise.all([
    db.rpc('my_notifications', { target_user_id: userId }),
    db.from('profiles').select('notifications_seen_at').eq('id', userId).maybeSingle(),
  ]);
  if (rows.error) throw dbError('my_notifications', rows.error);
  if (seen.error) throw dbError('profiles', seen.error);
  const seenAt = seen.data?.notifications_seen_at ?? null;
  const urls = await signPhotos(
    db,
    rows.data.map((r) => r.photo_path).filter((p): p is string => !!p),
  );
  const today = istanbulToday(new Date());
  const now = Date.now();
  const items = rows.data.flatMap((r): NotificationItem[] => {
    const base = { createdAt: r.created_at, isNew: isUnseen(r.created_at, seenAt) };
    const photoUrl = r.photo_path ? (urls.get(r.photo_path) ?? null) : null;
    const born = r.birth_date ? parseIsoDate(r.birth_date) : null;
    switch (r.kind) {
      case 'request':
        if (!r.item_id) return [];
        return [
          {
            ...base,
            kind: 'request',
            requestId: r.item_id,
            state: r.status === 'accepted' ? 'accepted' : 'pending',
            source: r.source === 'venue_chat' ? 'venue_chat' : 'encounter',
            venueName: r.venue_name,
            historyId: r.history_id,
            otherAlias: r.other_alias,
            displayName: r.display_name,
            age: born ? ageOn(born, today) : null,
            photoUrl,
            publicId: r.public_id,
          },
        ];
      case 'accepted':
        if (!r.item_id || !r.public_id) return [];
        return [
          {
            ...base,
            kind: 'accepted',
            requestId: r.item_id,
            publicId: r.public_id,
            displayName: r.display_name,
            photoUrl,
          },
        ];
      case 'match':
        if (!r.public_id) return [];
        return [
          { ...base, kind: 'match', publicId: r.public_id, displayName: r.display_name, photoUrl },
        ];
      case 'invite':
        if (!r.item_id || !r.public_id || !r.expires_at) return [];
        return [
          {
            ...base,
            kind: 'invite',
            inviteId: r.item_id,
            state: inviteState(r.status ?? 'pending', r.expires_at, now),
            publicId: r.public_id,
            displayName: r.display_name,
            photoUrl,
            tableName: r.room_name,
            phones: r.phones ?? 0,
            expiresAt: r.expires_at,
          },
        ];
      default:
        return [];
    }
  });
  return { notifications: items, unseen: items.filter((i) => i.isNew).length };
}

async function list(userId: string): Promise<FriendsListResponse> {
  const { data, error } = await db.rpc('friends_of', { viewer: userId });
  if (error) throw dbError('friends_of', error);
  const urls = await signPhotos(
    db,
    data.map((f) => f.photo_path).filter((p): p is string => !!p),
  );
  const friends: Friend[] = data.map((f) => ({
    publicId: f.public_id,
    displayName: f.display_name,
    photoUrl: f.photo_path ? (urls.get(f.photo_path) ?? null) : null,
    since: f.since,
    threadId: f.thread_id,
    lastMessageAt: f.last_message_at,
    unread: f.unread,
  }));
  return { friends };
}

Deno.serve(
  handle(
    async (
      req,
      raw,
    ): Promise<
      | FriendsListResponse
      | FriendsIncomingResponse
      | FriendsOkResponse
      | FriendsAddResponse
      | NotificationsResponse
    > => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);

      switch (body.action) {
        case 'list':
          return await list(user.id);

        case 'notifications':
          return await notifications(user.id);

        case 'incoming':
          return await incoming(user.id);

        case 'request': {
          await requireDisplayName(db, user.id);
          const { data, error } =
            'venueChatMessageId' in body
              ? await db.rpc('friends_request_venue_chat', {
                  target_user_id: user.id,
                  target_message_id: body.venueChatMessageId,
                  daily_max: VENUE_CHAT.dailyFriendRequests,
                })
              : await db.rpc('friends_request', {
                  target_user_id: user.id,
                  target_history_id: body.historyId,
                });
          if (error) throw dbError('friends_request', error);
          const result = data[0];
          if (result?.outcome === 'already_friends') {
            throw new AppError('already_friends', 'Already friends.');
          }
          announce(user.id, result);
          return { ok: true };
        }

        case 'respond': {
          if (body.accept) await requireDisplayName(db, user.id);
          const { data, error } = await db.rpc('friends_respond', {
            target_user_id: user.id,
            target_request_id: body.requestId,
            accept: body.accept,
          });
          if (error) throw dbError('friends_respond', error);
          announce(user.id, data[0]);
          return { ok: true };
        }

        case 'add-from-room': {
          await requireDisplayName(db, user.id);
          const { data, error } = await db.rpc('friends_add_from_room', {
            target_user_id: user.id,
            target_history_id: body.historyId,
          });
          if (error) throw dbError('friends_add_from_room', error);
          const result = data[0];
          announce(user.id, result);
          // K-70: the match is told to the first presser; the second sees it in this answer. A
          // friendship from before comes back as 'ok' (rule 4): an anonymous friend stays unnamed.
          const recipient = matchPushRecipient(result?.outcome, result?.other_user_id);
          if (recipient) {
            pushIfAllowed(db, recipient, PUSH_PREFERENCE.friend_match, friendMatchPush());
          }
          return {
            ok: true,
            friends:
              result?.outcome === 'friendship_created' || result?.outcome === 'already_matched',
          };
        }

        // K-67: nothing goes to the other side, whatever the outcome.
        case 'withdraw-add': {
          const { data, error } = await db.rpc('friends_withdraw_add', {
            target_user_id: user.id,
            target_history_id: body.historyId,
          });
          if (error) throw dbError('friends_withdraw_add', error);
          return { ok: true, friends: data === 'already_matched' };
        }

        case 'remove': {
          const { error } = await db.rpc('friends_remove', {
            target_user_id: user.id,
            target_public_id: body.publicId,
            report_reason: body.report,
          });
          if (error) throw dbError('friends_remove', error);
          return { ok: true };
        }
      }
    },
  ),
);
