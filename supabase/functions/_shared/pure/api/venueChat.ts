// `venue-chat` Edge Function, shared with the mobile app (docs/SPEC_V3.md §7).
import type { Reaction } from '../reactions.ts';
import type { CheckinIdentity, VenueChatMessage, VenueChatMode } from '../venueChat.ts';

export type VenueChatRequest =
  | {
      action: 'send';
      venueId: string;
      body: string;
      // The app before docs/SPEC_V4.md step 4.4 (§22.G): its first message of a check-in picks the
      // mode, as the check-in's one change; the other mode afterwards is venue_chat_mode_locked, a
      // profiled pick without a visible profile photo photo_required.
      profiled?: boolean;
      // From step 4.4 (§4.D): the identity the app shows. The message goes with the check-in's
      // identity; a different one here is identity_mismatch and nothing is written.
      identity?: VenueChatMode;
      // A visible message of the same venue (§21.1).
      replyTo?: string;
    }
  // The caller's one reaction on a message, at most 10 per 10 seconds (§21.2).
  | { action: 'react'; messageId: string; emoji: Reaction | null }
  // One page, newest first (§7.2): profiled messages carry their sender's photo, signed here; mode
  // is the caller's choice for this check-in (§22.G), null before the first message. Deleted
  // messages and the identities the caller muted are left out (docs/SPEC_V4.md §4.D).
  | { action: 'page'; venueId: string; before?: string }
  // The sender's own message, gone for everyone (§4.D); another's or a gone one is not_found.
  | { action: 'delete'; messageId: string }
  // The identity a visible message was written with: its anonymous or its profiled messages,
  // never both. The muted person never learns of it (rule 5).
  | { action: 'mute'; messageId: string }
  | { action: 'unmute'; muteId: string }
  | { action: 'mutes' };
export type VenueChatResponse = { messageId: string };
export type VenueChatPageResponse = {
  messages: VenueChatMessage[];
  mode: VenueChatMode | null;
  // The caller's check-in identity at this venue (docs/SPEC_V4.md §4.D); null without one. Absent
  // from a server before step 4.4.
  identity?: CheckinIdentity | null;
};
export type VenueChatMuteResponse = { muteId: string };
// The label is the nick or the name when muted; no account id.
export type VenueChatMute = { id: string; label: string; profiled: boolean; createdAt: string };
export type VenueChatMutesResponse = { mutes: VenueChatMute[] };
