// The bell's list (docs/SPEC_V4.md §4.G, step 4.7): no table of notifications; friends/notifications
// reads them from my_notifications (friend requests, accepted requests, the matches of the silent
// "Arkadaş ekle" and table invites) and marks what came after the list was last opened. Nothing in
// a row names an account, and a public_id only once the two are friends (rule 4); an invite never
// carries the venue.

// What the list keeps (SQL: my_notifications): an accepted request and a match 7 days, an invite a
// day; a waiting request until it is answered.
export const NOTIFICATION_DAYS = { accepted: 7, match: 7, invite: 1 } as const;

export const NOTIFICATION_KINDS = ['request', 'accepted', 'match', 'invite'] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

// An invite as the invitee sees it: open (Reddet, Katıl), expired (faded), joined or declined.
export type InviteState = 'open' | 'expired' | 'joined' | 'declined';

export function inviteState(status: string, expiresAt: string, now: number): InviteState {
  if (status === 'accepted') return 'joined';
  if (status === 'declined') return 'declined';
  if (status === 'expired' || Date.parse(expiresAt) <= now) return 'expired';
  return 'open';
}

// The mark account/notifications-seen writes: the newest row the list showed, never later than now
// (a clock ahead on the phone must not hide what comes next). The server keeps the later of this
// and the mark it had, so the same call twice, or an older one arriving late, moves nothing back
// (WazzupDevs/Kabuk#195).
export function seenMark(shownAt: string, now: number): string {
  return new Date(Math.min(Date.parse(shownAt), now)).toISOString();
}

// New since the list was last opened (account/notifications-seen); everything is new before the
// first opening.
export function isUnseen(createdAt: string, seenAt: string | null): boolean {
  return seenAt === null || Date.parse(createdAt) > Date.parse(seenAt);
}
