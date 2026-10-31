import type { CheckinIdentity } from '../venueChat.ts';

// Request and response shapes of the `checkin` Edge Function, shared with the mobile app.
export type CheckInRequest = {
  action: 'check-in';
  venueId: string;
  lat: number;
  lng: number;
  // Accuracy radius reported by the device, in metres. Stored; the coordinates are not.
  accuracyM: number | null;
  // The phone reports the position as coming from a mock location app (Android); refused outside
  // the local stack unless the location check is skipped (pure/devProject.ts). Older apps leave it out.
  mocked?: boolean;
  locationConsentVersion: string;
  // Where the person is at a venue with spots (docs/SPEC_V3.md §4.3); required there, absent
  // elsewhere.
  spotId?: string;
  // A UUID the app makes for each check-in it starts and sends again unchanged when it retries the
  // same one: while the table it opened is active, the same key returns that table (one table for a
  // check-in sent twice). Without it, or with a new key, a check-in opens a new table.
  requestId?: string;
};

// "Bu noktadayım": no new position; refused in a room or with a request out (`in_room`).
export type ChangeSpotRequest = { action: 'change-spot'; spotId: string };

// Today's app ("Masa adını değiştir"): update_required. A table's name is rooms/reroll-name's.
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
  // Empty from step 4.5 on (no table, no alias); today's app shows it until 4.5b.
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
