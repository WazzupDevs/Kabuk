import type { CheckinIdentity } from '../venueChat.ts';

// Request and response shapes of the `checkin` Edge Function, shared with the mobile app.
export type CheckInRequest = {
  action: 'check-in';
  venueId: string;
  lat: number;
  lng: number;
  // Accuracy radius reported by the device, in metres. Stored; the coordinates are not.
  accuracyM: number | null;
  // 1–4; 4 means "4+".
  headcount: number;
  locationConsentVersion: string;
  // Where the table is at a venue with spots (docs/SPEC_V3.md §4.3); required there, absent
  // elsewhere.
  spotId?: string;
  // The app can be in a team (docs/SPEC_V3.md §22.B); an old app sends nothing.
  teams?: boolean;
  // A UUID the app makes for each check-in it starts and sends again unchanged when it retries the
  // same one: while the table it opened is active, the same key returns that table (one table for a
  // check-in sent twice). Without it, or with a new key, a check-in opens a new table.
  requestId?: string;
};

// "Bu noktadayım": no new position; refused in a room or with a request out (`in_room`).
export type ChangeSpotRequest = { action: 'change-spot'; spotId: string };

// "Masa adını değiştir" (docs/SPEC_V3.md §5.6): not in a room, at most 3 times per check-in.
export type RerollAliasRequest = { action: 'reroll-alias' };

export type LeaveRequest = { action: 'leave' };

// Whether this server skips the location check (CHECKIN_SKIP_LOCATION, dev project only).
export type LocationModeRequest = { action: 'location-mode' };

// docs/SPEC_V4.md §4.D: the check-in's identity, changed once per check-in (identity_switch_used);
// profiled needs a visible profile photo (photo_required). The same identity again changes nothing.
export type SetIdentityRequest = { action: 'set-identity'; anonymous: boolean };

export type CheckinRequest =
  | CheckInRequest
  | ChangeSpotRequest
  | RerollAliasRequest
  | LeaveRequest
  | LocationModeRequest
  | SetIdentityRequest;

export type CheckInResponse = {
  sessionId: string;
  alias: string;
  expiresAt: string;
  // The identity the check-in starts with (Ayarlar → "Oyunlara katılım", K-4). Absent from a
  // server before step 4.4.
  identity?: CheckinIdentity;
};

export type SetIdentityResponse = { identity: CheckinIdentity };

export type ChangeSpotResponse = { spotId: string };

export type RerollAliasResponse = { alias: string; rerollsLeft: number };

export type LeaveResponse = { ok: true };

export type LocationModeResponse = { skipLocation: boolean };
