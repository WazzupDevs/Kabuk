import type { ReportReason } from '../chat.ts';
import type { InviteState } from '../notifications.ts';
import type { Reaction } from '../reactions.ts';

// `friends` and `dm` Edge Functions (docs/arsiv/SPEC_V2.md §6, §9), shared with the mobile app. No
// response before a friendship carries a public_id.
export type FriendsRequest =
  | { action: 'list' }
  | { action: 'request'; historyId: string }
  // From a profiled venue chat message (docs/SPEC_V3.md §7.5). The sender of the request shows
  // the recipient their name, age and photo; the answer is { ok: true } whatever happens, except
  // already_friends.
  | { action: 'request'; venueChatMessageId: string }
  // From a profiled district chat message (docs/SPEC_V4.md §4.V).
  | { action: 'request'; districtChatMessageId: string }
  // Requests from the venue chat waiting for the caller: the sender's name, age and photo.
  | { action: 'incoming' }
  | { action: 'respond'; requestId: string; accept: boolean }
  // The silent "Arkadaş ekle" (docs/SPEC_V3.md §23.G); the answer says whether the pair became
  // friends at this encounter (docs/SPEC_V4.md K-70). A friendship from before answers `false`, like
  // a press that matched nothing (K-75, rule 4). withdraw-add takes it back (K-67); after a match it
  // is ignored and the answer says so. The other side sees neither.
  | { action: 'add-from-room'; historyId: string }
  | { action: 'withdraw-add'; historyId: string }
  | { action: 'remove'; publicId: string; report?: ReportReason }
  // Ortak arkadaşlar, on a friend's profile only (rule 4): the friends the caller and that friend
  // share. For anyone who is not the caller's friend the answer is empty, like a friend with none.
  | { action: 'mutual'; publicId: string }
  // The bell's list (docs/SPEC_V4.md §4.G, step 4.7), newest first.
  | { action: 'notifications' };

export type Friend = {
  publicId: string;
  displayName: string | null;
  // Signed for an hour; null without a photo or when it is hidden.
  photoUrl: string | null;
  since: string;
  threadId: string | null;
  lastMessageAt: string | null;
  unread: boolean;
};

export type FriendsListResponse = { friends: Friend[] };

// Each one is the caller's own friend. `count` is all of them; `friends` the first
// MUTUAL_FRIENDS_SHOWN by name.
export type MutualFriend = {
  publicId: string;
  displayName: string | null;
  photoUrl: string | null;
};
export type FriendsMutualResponse = { count: number; friends: MutualFriend[] };

export type VenueChatIncoming = {
  requestId: string;
  venueName: string | null;
  displayName: string | null;
  age: number | null;
  // Signed for an hour; null without a photo or when it is hidden.
  photoUrl: string | null;
  createdAt: string;
};
export type FriendsIncomingResponse = { requests: VenueChatIncoming[] };
// The bell's rows (docs/SPEC_V4.md §4.G). `isNew`: after the list was last opened
// (account/notifications-seen). Photos are signed for an hour; null without one or when hidden. A
// public_id only once the two are friends (rule 4).
type NotificationBase = { createdAt: string; isNew: boolean };
// A friend request to the caller, waiting or accepted. From the venue chat: the sender's name, age
// and photo, and the venue (docs/SPEC_V3.md §7.5). From a play history ("İstek gönder"): the name
// the sender had at the table and the history row, nothing more until accepted.
export type FriendRequestNotification = NotificationBase & {
  kind: 'request';
  requestId: string;
  state: 'pending' | 'accepted';
  source: 'venue_chat' | 'encounter';
  venueName: string | null;
  historyId: string | null;
  otherAlias: string | null;
  displayName: string | null;
  age: number | null;
  photoUrl: string | null;
  publicId: string | null;
};
// The caller's request a friend accepted: tapping opens the DM.
export type AcceptedNotification = NotificationBase & {
  kind: 'accepted';
  requestId: string;
  publicId: string;
  displayName: string | null;
  photoUrl: string | null;
};
// K-70: the silent "Arkadaş ekle" matched; only in the first presser's list.
export type MatchNotification = NotificationBase & {
  kind: 'match';
  publicId: string;
  displayName: string | null;
  photoUrl: string | null;
};
// A friend's table invite: the table's name and phones, never the venue (§4.B-8).
export type InviteNotification = NotificationBase & {
  kind: 'invite';
  inviteId: string;
  state: InviteState;
  publicId: string;
  displayName: string | null;
  photoUrl: string | null;
  tableName: string | null;
  phones: number;
  expiresAt: string;
};
export type NotificationItem =
  FriendRequestNotification | AcceptedNotification | MatchNotification | InviteNotification;
export type NotificationsResponse = { notifications: NotificationItem[]; unseen: number };
export type FriendsOkResponse = { ok: true };
export type FriendsAddResponse = { ok: true; friends: boolean };

export type DmRequest =
  // replyTo: a message of the same conversation (docs/SPEC_V3.md §21.1).
  | { action: 'send'; threadId: string; body: string; replyTo?: string }
  // The caller's one reaction on a message; null takes it back (§21.2).
  | { action: 'react'; messageId: string; emoji: Reaction | null }
  | { action: 'read'; threadId: string }
  // Mesajlar (docs/SPEC_V3.md §18.2): one row per friend, newest conversation first.
  | { action: 'inbox' }
  // The app is open: the caller's messages so far count as delivered, in every thread.
  | { action: 'delivered' }
  // docs/SPEC_V4.md §4.X: the caller's own pin, archive and clear; the other member never sees
  // them. At most DM_PIN_MAX pinned (pin_limit); an archived conversation is not pinned
  // (thread_archived); archive takes the pin off; clear hides everything so far from the caller
  // and takes the pin and the archive off.
  | { action: 'pin'; threadId: string }
  | { action: 'unpin'; threadId: string }
  | { action: 'archive'; threadId: string }
  | { action: 'unarchive'; threadId: string }
  // upTo: the newest message the caller saw (null when it saw none): the mark never passes it, so
  // a message that came meanwhile, or between a call and its repeat, stays visible.
  | { action: 'clear'; threadId: string; upTo: string | null }
  // The caller's own message, within DM_EDIT_WINDOW_MS of sending (edit_expired); checked like a
  // send (message_invalid, profanity_rejected); at most DM_EDIT_RATE per window (rate_limited) and
  // DM_EDIT_MAX real edits per message (edit_limit); no push.
  | { action: 'edit'; messageId: string; body: string }
  // The caller's own message, at any time, for both members (17 Kasım, §4.X): the row stays as a
  // trace without its text ("Mesaj silindi"), its reactions go. The same twice answers the same.
  // Shares the edit's budget (rate_limited).
  | { action: 'delete'; messageId: string };

export type DmOkResponse = { ok: true };
// The message as written (adım 9.1): the app puts it into its page at once, with status 'sent'.
export type DmSendResponse = { ok: true; messageId: string; createdAt: string };
// The message as edited: the text kept (trimmed) and when it was edited (null when it never was:
// the same text as the unedited message).
export type DmEditResponse = { ok: true; body: string; editedAt: string | null };

// Of the caller's own messages only: the other member's times never reach the client.
export type DmStatus = 'sent' | 'delivered' | 'read';

export type DmInboxThread = {
  threadId: string | null;
  publicId: string;
  displayName: string | null;
  // Signed for an hour; null without a photo or when it is hidden.
  photoUrl: string | null;
  // The newest message, cut to 80 characters on the server; null without messages.
  lastBody: string | null;
  // The newest message was deleted by its sender: lastBody is empty, the row says "Mesaj silindi".
  lastDeleted: boolean;
  lastFromMe: boolean;
  lastMessageAt: string | null;
  unreadCount: number;
  // Only when the newest message is the caller's.
  lastStatus: DmStatus | null;
  // docs/SPEC_V4.md §4.X, the caller's own: the pinned come first, the last pinned on top.
  // An archived conversation stays in `threads` (an app from before §4.X shows it like any other)
  // and keeps counting its unread; a new message does not take it out of the archive.
  pinned: boolean;
  archived: boolean;
};

// archivedUnread: the unread messages of the archived conversations, together (Arşivlenenler).
export type DmInboxResponse = { threads: DmInboxThread[]; archivedUnread: number };
