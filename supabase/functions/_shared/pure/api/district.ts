// `district` and `district-chat` Edge Functions, shared with the mobile app (docs/SPEC_V4.md §4.V).
import type { Reaction } from '../reactions.ts';
import type { VenueChatMessage, VenueChatMode } from '../venueChat.ts';

export type DistrictRef = { ref: string; name: string };

// The person's current question: never the right option (rule 4, §4.V). A day's questions are
// numbered (slot) and the same for everyone; a wrong answer gives the next one an hour later.
export type GecitQuestion = { day: string; slot: number; prompt: string; options: string[] };

// question: a question waits; passed: answered right (or nothing to ask); failed: answered wrong,
// the next question at retryAt.
export type GecitStatus = 'question' | 'passed' | 'failed';

export type DistrictSession = {
  id: string;
  // The session's district: the person's own or an open one (Skall Semti).
  district: DistrictRef;
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
  // While gate is 'failed': when the next question comes (never past opensAt).
  retryAt: string | null;
  // The districts anyone may enter wherever they are (Skall Semti): no location needed.
  openDistricts: DistrictRef[];
  session: DistrictSession | null;
  // Dev project with CHECKIN_SKIP_LOCATION: the app lets the person pick the district by hand.
  pickByHand: boolean;
};

export type DistrictRequest =
  | { action: 'state' }
  // The coordinate is used once and kept nowhere (rule 6). choice: one of the candidates a previous
  // call returned for the same place. ref: the dev project's hand pick (pickByHand only).
  | { action: 'locate'; lat: number; lng: number; choice?: string; mocked?: boolean }
  | { action: 'pick'; ref: string }
  // slot: the question answered (state.question.slot); an app from before the pool leaves it out.
  | { action: 'answer'; day: string; choice: number; slot?: number }
  // ref: an open district (Skall Semti) or the person's own; left out, the person's own.
  | { action: 'enter'; ref?: string }
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
  // Odadakiler: everyone in the caller's room now (rule 4's district paragraph).
  | { action: 'people' }
  | { action: 'delete'; messageId: string }
  // The muted list is the venue chat's (venue-chat/mutes, unmute).
  | { action: 'mute'; messageId: string }
  | { action: 'report'; messageId: string; reason: string };

export type DistrictChatPageResponse = {
  messages: VenueChatMessage[];
  roomId: string | null;
};
export type DistrictChatSendResponse = { messageId: string };

// Odadakiler. `count` is every row, the caller's own included. A profiled person shows what their
// messages already open to the room (name, age, photo), whether they are the caller's friend and
// whether the caller muted their profiled messages; an anonymous one is a time and nothing else
// (no nick, no look, no key: the row is tied to no account, no nick and no message). `joinedAt` is
// to the minute, and null for someone who changed identity in this session. A block filters
// nothing: the list is the same for everyone in the room. No profile id. Without an open session
// the list is empty.
export type DistrictPerson =
  | {
      profiled: true;
      displayName: string | null;
      age: number | null;
      photoUrl: string | null;
      joinedAt: string | null;
      friend: boolean;
      muted: boolean;
      // Opens this person's profile (`profile/get { districtPersonRef }`): a value of the session
      // made for this alone; not a profile id, not what messages carry.
      ref: string;
    }
  | { profiled: false; joinedAt: string | null };
export type DistrictPeopleResponse = {
  count: number;
  me: DistrictPerson | null;
  profiled: Extract<DistrictPerson, { profiled: true }>[];
  anonymous: Extract<DistrictPerson, { profiled: false }>[];
};
