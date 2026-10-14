// `venue-chat` Edge Function, shared with the mobile app (docs/SPEC_V3.md §7).
import type { Reaction } from '../reactions.ts';
import type { VenueChatMessage, VenueChatMode } from '../venueChat.ts';

export type VenueChatRequest =
  | {
      action: 'send';
      venueId: string;
      body: string;
      // With the display name instead of the table alias (§7.3). Chosen with the first message of
      // a check-in and fixed after it (§22.G): the other mode is venue_chat_mode_locked, a profiled
      // first choice without a visible profile photo photo_required.
      profiled: boolean;
      // A visible message of the same venue (§21.1).
      replyTo?: string;
    }
  // The caller's one reaction on a message, at most 10 per 10 seconds (§21.2).
  | { action: 'react'; messageId: string; emoji: Reaction | null }
  // One page, newest first (§7.2): profiled messages carry their sender's photo, signed here; mode
  // is the caller's choice for this check-in (§22.G), null before the first message.
  | { action: 'page'; venueId: string; before?: string };
export type VenueChatResponse = { messageId: string };
export type VenueChatPageResponse = { messages: VenueChatMessage[]; mode: VenueChatMode | null };
