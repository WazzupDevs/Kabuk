// Venue chat room (docs/SPEC_V3.md §7). One fixed group chat per venue, for the accounts with an
// active table there. The numbers here are the only source: the Edge Functions pass them to SQL.
import { MAX_MESSAGE_LENGTH, prepareMessage } from './chat.ts';
import type { Quote, ReactionCount } from './messageExtras.ts';

export const VENUE_CHAT = {
  maxLength: MAX_MESSAGE_LENGTH,
  // Per account: one message per 3 seconds, and at most 20 in 10 minutes.
  minIntervalMs: 3000,
  windowSeconds: 600,
  windowMax: 20,
  // A message reported by this many different accounts is hidden from everyone but its sender.
  hideAfterReports: 3,
  // A report keeps a copy of the venue's last visible messages.
  reportSnapshotSize: 50,
  // Messages are deleted after a day (hourly job).
  keepHours: 24,
  // Friend requests from the venue chat, per account per day; over it the answer is still ok.
  dailyFriendRequests: 10,
  // One page of messages.
  pageSize: 50,
  // Reactions (docs/SPEC_V3.md §21.2): per account, at most this many requests per window.
  reactionWindowSeconds: 10,
  reactionWindowMax: 10,
} as const;

// The same trimming and length rule as the room chat.
export function prepareVenueMessage(raw: string): string | null {
  return prepareMessage(raw);
}

export type VenueChatRate = { windowStartedAt: number; count: number; lastSentAt: number };

export type RateDecision =
  { ok: true; next: VenueChatRate } | { ok: false; reason: 'too_soon' | 'rate_limited' };

// One account's sending window; the SQL function applies the same rule under a row lock.
export function venueChatRate(prev: VenueChatRate | null, now: number): RateDecision {
  if (prev && now - prev.lastSentAt < VENUE_CHAT.minIntervalMs) {
    return { ok: false, reason: 'too_soon' };
  }
  const fresh = !prev || now - prev.windowStartedAt >= VENUE_CHAT.windowSeconds * 1000;
  if (!fresh && prev.count >= VENUE_CHAT.windowMax) return { ok: false, reason: 'rate_limited' };
  return {
    ok: true,
    next: fresh
      ? { windowStartedAt: now, count: 1, lastSentAt: now }
      : { windowStartedAt: prev.windowStartedAt, count: prev.count + 1, lastSentAt: now },
  };
}

// Reports count once per account, never the sender's own.
export function shouldHide(reporters: readonly string[], senderId: string): boolean {
  return new Set(reporters.filter((r) => r !== senderId)).size >= VENUE_CHAT.hideAfterReports;
}

// One message as venue-chat/page returns it: a profiled message carries the display name, the
// photo (signed, if any) and no table alias; an anonymous one the alias, no name and no photo.
export type VenueChatMessage = {
  id: string;
  profiled: boolean;
  senderAlias: string | null;
  displayName: string | null;
  photoUrl: string | null;
  body: string;
  createdAt: string;
  fromMe: boolean;
  // §21: the answered message (by its own label rule) and the counts per emoji, never who.
  replyTo: Quote | null;
  reactions: ReactionCount[];
  // docs/SPEC_V4.md §4.D: the same key for one person's messages of one identity on one day at the
  // venue (one avatar for a run, one colour for the name); the two identities of a person get
  // different keys, and a key names no account. Absent from a server before step 4.4.
  senderKey?: string;
  // An anonymous message's capsule look as it was written (pure/capsule.ts); null for a profiled
  // one.
  senderLook?: string | null;
};

// A message from venue-chat/page as the app keeps it. A server from before §21 sends neither
// replyTo nor reactions; then the message has no quote and no reactions, instead of the app
// failing on them.
export function withVenueChatExtras(
  message: Omit<VenueChatMessage, 'replyTo' | 'reactions'> & {
    replyTo?: Quote | null;
    reactions?: ReactionCount[] | null;
  },
): VenueChatMessage {
  return {
    ...message,
    replyTo: message.replyTo ?? null,
    reactions: Array.isArray(message.reactions) ? message.reactions : [],
  };
}

// The caller's venue chat mode (docs/SPEC_V3.md §22.G): chosen once per check-in with the first
// message and fixed until the table ends; null until then. venue-chat/page returns it. The column
// is table_sessions.venue_chat_profiled; a server from before §22.G sends no mode (null).
export type VenueChatMode = 'anonymous' | 'profiled';

// The check-in's identity (docs/SPEC_V4.md §4.D): anonymous or profiled, changed at most once per
// check-in (K-3, K-48). Its venue chat side is the mode above.
export type CheckinIdentity = { mode: VenueChatMode; switchUsed: boolean };

export function checkinIdentity(session: {
  identity_mode: string;
  identity_switches: number;
}): CheckinIdentity {
  return {
    mode: session.identity_mode === 'profiled' ? 'profiled' : 'anonymous',
    switchUsed: session.identity_switches >= 1,
  };
}

export function venueChatMode(profiled: boolean | null | undefined): VenueChatMode | null {
  if (profiled === true) return 'profiled';
  if (profiled === false) return 'anonymous';
  return null;
}

// The name to show above a message.
export function senderLabel(
  message: Pick<VenueChatMessage, 'senderAlias' | 'displayName'>,
): string {
  return message.displayName ?? message.senderAlias ?? '';
}

export function venueChatChannel(venueId: string): string {
  return `venue_chat:${venueId}`;
}

export const VENUE_CHAT_BROADCAST = 'venue_chat' as const;
// A reaction moved (§21.3); no data, the reader reads the page again.
export const VENUE_CHAT_REACTION_BROADCAST = 'venue_chat_reaction' as const;

// The venue chat card's dot (docs/SPEC_V4.md K-12): it lights only while the chat has a message from
// the last 10 minutes.
export const VENUE_CHAT_ACTIVE_MINUTES = 10;
export function venueChatActive(lastMessageAt: string | null, now: number): boolean {
  if (lastMessageAt === null) return false;
  const at = Date.parse(lastMessageAt);
  return Number.isFinite(at) && now - at < VENUE_CHAT_ACTIVE_MINUTES * 60_000;
}

// The card's last message (docs/SPEC_V4.md K-12): the later of the page's newest (read once) and the
// moment a message broadcast was heard since. Either may be missing.
export function venueChatLastAt(read: string | null, heard: string | null): string | null {
  if (heard === null) return read;
  if (read === null) return heard;
  return Date.parse(heard) > Date.parse(read) ? heard : read;
}
