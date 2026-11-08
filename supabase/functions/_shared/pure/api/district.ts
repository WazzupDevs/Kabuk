// `district` and `district-chat` Edge Functions, shared with the mobile app (docs/SPEC_V4.md §4.V).
import type { Reaction } from '../reactions.ts';
import type { VenueChatMessage, VenueChatMode } from '../venueChat.ts';

export type DistrictRef = { ref: string; name: string };

// The day's question: never the right option (rule 4, §4.V).
export type GecitQuestion = { day: string; prompt: string; options: string[] };

// question: today's question waits; passed: answered right (or no question today);
// failed: answered wrong, no entry until 00:00.
export type GecitStatus = 'question' | 'passed' | 'failed';

export type DistrictSession = {
  id: string;
  roomId: string;
  // active until endsAt; then grace until graceEndsAt ("Devam?").
  phase: 'active' | 'grace';
  endsAt: string;
  graceEndsAt: string;
  // When the person came into the room: they read nothing older.
  joinedAt: string;
  identity: VenueChatMode;
  // The one change of identity per session is used.
  identitySwitchUsed: boolean;
};

export type DistrictState = {
  // The district found last; null if never found or found outside.
  district: DistrictRef | null;
  // never: no location yet; outside: the last one was in none of the districts.
  located: 'never' | 'inside' | 'outside';
  gate: GecitStatus;
  // Only while gate is 'question'.
  question: GecitQuestion | null;
  // The next 00:00 in Istanbul (the countdown, the rooms' close).
  opensAt: string;
  session: DistrictSession | null;
  // Dev project with CHECKIN_SKIP_LOCATION: the app lets the person pick the district by hand.
  pickByHand: boolean;
};

export type DistrictRequest =
  | { action: 'state' }
  // The coordinate is used once and kept nowhere (rule 6). choice: one of the candidates a previous
  // call returned for the same place. ref: the dev project's hand pick (pickByHand only).
  | { action: 'locate'; lat: number; lng: number; choice?: string }
  | { action: 'pick'; ref: string }
  | { action: 'answer'; day: string; choice: number }
  | { action: 'enter' }
  | { action: 'extend' }
  | { action: 'leave' }
  | { action: 'set-identity'; anonymous: boolean };

export type DistrictLocateResponse = {
  state: DistrictState;
  // Near a shared border: the districts to choose from (call locate again with choice).
  candidates: DistrictRef[] | null;
};
export type DistrictAnswerResponse = { correct: boolean; state: DistrictState };

export type DistrictChatRequest =
  | {
      action: 'send';
      body: string;
      identity: VenueChatMode;
      replyTo?: string;
      clientId?: string;
    }
  | { action: 'react'; messageId: string; emoji: Reaction | null }
  // The caller's room, newest first, nothing from before they came in.
  | { action: 'page'; before?: string }
  | { action: 'delete'; messageId: string }
  // The muted list is the venue chat's (venue-chat/mutes, unmute).
  | { action: 'mute'; messageId: string }
  | { action: 'report'; messageId: string; reason: string };

export type DistrictChatPageResponse = {
  messages: VenueChatMessage[];
  roomId: string | null;
};
export type DistrictChatSendResponse = { messageId: string };
