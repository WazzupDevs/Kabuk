// `venue-chat` Edge Function, shared with the mobile app (docs/SPEC_V3.md §7).
import type { Reaction } from '../reactions.ts';
import type { CheckinIdentity, VenueChatMessage, VenueChatMode } from '../venueChat.ts';

export type VenueChatRequest =
  | {
      action: 'send';
      venueId: string;
      body: string;
      // The identity the app shows (docs/SPEC_V4.md §4.D). The message goes with the check-in's
      // identity; a different one here is identity_mismatch and nothing is written.
      identity: VenueChatMode;
      // A visible message of the same venue (§21.1).
      replyTo?: string;
      // The app's own id for this message (Grup 3, P5): sent again with the same id, it is the same
      // message (the first one's messageId; nothing written, counted or broadcast). The same id with
      // another body, venue or reply is client_id_reused. Without it every send is a new message.
      clientId?: string;
    }
  // The caller's one reaction on a message, at most 10 per 10 seconds (§21.2).
  | { action: 'react'; messageId: string; emoji: Reaction | null }
  // One page, newest first (§7.2): profiled messages carry their sender's photo, signed here. Deleted
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
  // The caller's check-in identity at this venue (docs/SPEC_V4.md §4.D); null without one.
  identity: CheckinIdentity | null;
};
export type VenueChatMuteResponse = { muteId: string };
// The label is the nick or the name when muted; no account id.
export type VenueChatMute = { id: string; label: string; profiled: boolean; createdAt: string };
export type VenueChatMutesResponse = { mutes: VenueChatMute[] };
