// Product analytics (MVP_SPEC §12, docs/SPEC_V2.md §13). Only these events, only these properties, and the user id as
// the distinct id: never a phone number, alias, message, venue or position.
import type { GameMode } from './concepts.ts';
import type { FriendRequestSource, FriendshipSource } from './friends.ts';
import type { Concept, RoomIntentLabel } from './rooms.ts';
import type { SohbetTheme } from './sohbet.ts';
import type { TabuMode } from './tabu.ts';

export type AnalyticsEventProps = {
  // Sent after the optional photo/bio step; nothing is sent for a sign-up under 18 (rule 11).
  onboarding_completed: { with_photo: boolean; with_bio: boolean };
  // The person is at the venue (docs/SPEC_V4.md §4.E): no headcount, no table.
  check_in: Record<string, never>;
  // "Masa kur" (docs/SPEC_V4.md §4.L, step 4.5). `table_opened`: into the lobby, with the intent
  // and the game tag ('none' without one). No anonymous or profiled choice: only a woman can stay
  // anonymous in the game flow, so the choice would stand in for the gender, which no event
  // carries (rule 12).
  table_created: Record<string, never>;
  table_opened: { intent: RoomIntentLabel; game_tag: Concept | 'none' };
  // How a person came to sit at a table: an accepted "Katıl" or "Bu masadayım", or an invite.
  table_joined: { via: 'request' | 'here' | 'invite' };
  // as_member is "Bu masadayım", not "Katıl".
  join_requested: { as_member: boolean };
  join_accepted: { as_member: boolean };
  join_unavailable: { as_member: boolean };
  // Oyun Seç → the owner's "Başlat", the game's start and a participant's "Oyundan çık" (§4.F):
  // the game and the counts only, never who.
  game_opened: { concept: string };
  game_started: { concept: string; players: number; observers: number };
  game_left: { concept: string };
  dm_sent: Record<string, never>;
  // Venue chat (docs/SPEC_V3.md §15): never the venue, the text or the other side.
  venue_chat_sent: { profiled: boolean };
  // Faz 2 (docs/SPEC_V3.md §22.L): the one choice of a check-in, with its first message.
  venue_chat_mode_chosen: { profiled: boolean };
  venue_chat_reported: Record<string, never>;
};

export type AnalyticsEvent = keyof AnalyticsEventProps;

const ALLOWED: { [E in AnalyticsEvent]: readonly (keyof AnalyticsEventProps[E])[] } = {
  onboarding_completed: ['with_photo', 'with_bio'],
  check_in: [],
  table_created: [],
  table_opened: ['intent', 'game_tag'],
  table_joined: ['via'],
  join_requested: ['as_member'],
  join_accepted: ['as_member'],
  join_unavailable: ['as_member'],
  game_opened: ['concept'],
  game_started: ['concept', 'players', 'observers'],
  game_left: ['concept'],
  game_completed: [
    'concept',
    'score',
    'mode',
    'tabu_mode',
    'outcome',
    'players',
    'objections',
    'rounds_lost_by_timeout',
    'bullseyes',
    'phones',
  ],
  game_abandoned: ['concept', 'turn_no', 'total_turns'],
  report_submitted: [],
  block_created: [],
  session_ended: ['duration_min'],
  explore_viewed: ['view'],
  checkin_out_of_range: [],
  spot_changed: [],
  profile_photo_set: [],
  profile_bio_set: [],
  sohbet_card_opened: ['theme'],
  friend_request_sent: ['source'],
  friend_request_accepted: [],
  friend_add_pressed: [],
  friendship_created: ['source'],
  dm_sent: [],
  venue_chat_sent: ['profiled'],
  venue_chat_mode_chosen: ['profiled'],
  venue_chat_reported: [],
};

export const ANALYTICS_EVENTS = Object.keys(ALLOWED) as AnalyticsEvent[];

// Drops anything not on the event's list, so nothing personal can slip into an event.
export function analyticsProperties<E extends AnalyticsEvent>(
  event: E,
  props: AnalyticsEventProps[E],
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const key of ALLOWED[event] as readonly string[]) {
    const value = (props as Record<string, unknown>)[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return out;
}

export function sessionDurationMinutes(startedAt: string, endedAt: number): number {
  return Math.max(0, Math.round((endedAt - Date.parse(startedAt)) / 60_000));
}

// PostHog private API, used to delete a deleted account's person and events (MVP_SPEC §13 M7).
export const POSTHOG_DEFAULT_API_HOST = 'https://eu.posthog.com';

export function posthogPersonLookupUrl(
  host: string,
  projectId: string,
  distinctId: string,
): string {
  return `${host}/api/projects/${encodeURIComponent(projectId)}/persons/?distinct_id=${encodeURIComponent(distinctId)}`;
}

export function posthogPersonDeleteUrl(host: string, projectId: string, personId: string): string {
  return `${host}/api/projects/${encodeURIComponent(projectId)}/persons/${encodeURIComponent(personId)}/?delete_events=true`;
}

export function posthogPersonIds(response: unknown): string[] {
  if (typeof response !== 'object' || response === null || !('results' in response)) return [];
  const results = (response as { results: unknown }).results;
  if (!Array.isArray(results)) return [];
  return results
    .map((p: unknown) => (typeof p === 'object' && p !== null ? (p as { id?: unknown }).id : null))
    .filter((id): id is string => typeof id === 'string');
}
