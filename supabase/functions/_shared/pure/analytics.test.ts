import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_EVENTS,
  analyticsProperties,
  posthogPersonDeleteUrl,
  posthogPersonIds,
  posthogPersonLookupUrl,
  sessionDurationMinutes,
} from './analytics.ts';

describe('analytics events', () => {
  it('cover exactly the events of MVP_SPEC §12, SPEC_V2 §13, SPEC_V3 §15 and SPEC_V4 §4.L so far', () => {
    expect([...ANALYTICS_EVENTS].sort()).toEqual(
      [
        'onboarding_completed',
        'check_in',
        'table_created',
        'table_opened',
        'table_joined',
        'join_requested',
        'join_accepted',
        'join_unavailable',
        'game_opened',
        'game_started',
        'game_left',
        'game_abandoned',
        'game_completed',
        'report_submitted',
        'block_created',
        'session_ended',
        'explore_viewed',
        'checkin_out_of_range',
        'spot_changed',
        'profile_photo_set',
        'profile_bio_set',
        'sohbet_card_opened',
        'friend_request_sent',
        'friend_request_accepted',
        'friend_add_pressed',
        'friendship_created',
        'dm_sent',
        'venue_chat_sent',
        'venue_chat_reported',
      ].sort(),
    );
  });

  it('keep only the allowed properties of each event', () => {
    expect(
      analyticsProperties('table_opened', {
        intent: 'chat',
        profiled: false,
        phone: '+905551234567',
      } as never),
    ).toEqual({ intent: 'chat' });
    // Booleans are kept (onboarding_completed, join_requested); objects never are.
    expect(
      analyticsProperties('onboarding_completed', {
        with_photo: true,
        with_bio: false,
        birthDate: { year: 2000 },
      } as never),
    ).toEqual({ with_photo: true, with_bio: false });
    expect(analyticsProperties('join_requested', { as_member: true })).toEqual({
      as_member: true,
    });
    // The game tag of "Lobiye aç", never the table.
    expect(
      analyticsProperties('table_opened', {
        intent: 'none',
        profiled: false,
        game_tag: 'tabu',
        alias: 'Sakin Martı',
      } as never),
    ).toEqual({ intent: 'none', game_tag: 'tabu' });
    // A check-in carries nothing (docs/SPEC_V4.md §4.E: no headcount).
    expect(
      analyticsProperties('check_in', { headcount: 2, venueId: 'v', lat: 41 } as never),
    ).toEqual({});
    expect(
      analyticsProperties('table_joined', {
        via: 'here',
        roomId: 'r',
        alias: 'Neşeli Panda',
      } as never),
    ).toEqual({ via: 'here' });
    // The game and the counts, never who.
    expect(
      analyticsProperties('game_started', {
        concept: 'sahtekar',
        players: 5,
        observers: 2,
        imposter: 'x',
      } as never),
    ).toEqual({ concept: 'sahtekar', players: 5, observers: 2 });
    expect(analyticsProperties('profile_bio_set', { bio: 'merhaba' } as never)).toEqual({});
    expect(
      analyticsProperties('sohbet_card_opened', {
        theme: 'derin',
        prompt: 'En son ne zaman ağladın?',
        cardId: 'c1',
      } as never),
    ).toEqual({ theme: 'derin' });
    expect(
      analyticsProperties('friendship_created', { source: 'request', publicId: 'x' } as never),
    ).toEqual({ source: 'request' });
    expect(analyticsProperties('dm_sent', { body: 'selam' } as never)).toEqual({});
    expect(
      analyticsProperties('game_completed', { concept: 'tabu', score: 4, mode: 'voice' }),
    ).toEqual({ concept: 'tabu', score: 4, mode: 'voice' });
  });

  it('never carry the gender or a stand-in for it from the game flow (§23.L, rule 12)', () => {
    // Only a woman can stay anonymous in the game flow: the room's anonymous or profiled choice
    // would stand in for the gender (step 23.2).
    expect(
      analyticsProperties('table_opened', {
        intent: 'game',
        profiled: true,
        game_tag: 'none',
      } as never),
    ).toEqual({ intent: 'game', game_tag: 'none' });
    for (const event of ANALYTICS_EVENTS) {
      expect(analyticsProperties(event, { gender: 'female' } as never)).toEqual({});
    }
    expect(ANALYTICS_EVENTS).not.toContain('participation_chosen');
  });

  it('measures a table session in whole minutes', () => {
    expect(sessionDurationMinutes('2026-09-30T10:00:00Z', Date.parse('2026-09-30T10:42:40Z'))).toBe(
      43,
    );
    expect(sessionDurationMinutes('2026-09-30T10:00:00Z', Date.parse('2026-09-30T09:00:00Z'))).toBe(
      0,
    );
  });
});

describe('PostHog person deletion', () => {
  it('builds the lookup and delete requests', () => {
    expect(posthogPersonLookupUrl('https://eu.posthog.com', '123', 'user id')).toBe(
      'https://eu.posthog.com/api/projects/123/persons/?distinct_id=user%20id',
    );
    expect(posthogPersonDeleteUrl('https://eu.posthog.com', '123', 'p-1')).toBe(
      'https://eu.posthog.com/api/projects/123/persons/p-1/?delete_events=true',
    );
  });

  it('reads person ids defensively', () => {
    expect(posthogPersonIds({ results: [{ id: 'a' }, { id: 2 }, null, { id: 'b' }] })).toEqual([
      'a',
      'b',
    ]);
    expect(posthogPersonIds({})).toEqual([]);
    expect(posthogPersonIds(null)).toEqual([]);
  });
});
