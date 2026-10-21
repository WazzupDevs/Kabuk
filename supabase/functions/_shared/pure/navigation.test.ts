import { describe, expect, it } from 'vitest';

import { hasActiveTable, pushRoute, ROUTES, type TabKey, tabOpenedBy } from './navigation.ts';

const now = Date.parse('2026-09-26T12:00:00Z');

describe('tabOpenedBy', () => {
  it('opens the venue screen while the table is active', () => {
    expect(tabOpenedBy('venue', { expires_at: '2026-09-26T13:00:00Z' }, now)).toBe('venue');
  });

  it('opens Keşfet without a table or once it expired', () => {
    expect(tabOpenedBy('venue', null, now)).toBe('explore');
    expect(tabOpenedBy('venue', undefined, now)).toBe('explore');
    expect(tabOpenedBy('venue', { expires_at: '2026-09-26T12:00:00Z' }, now)).toBe('explore');
    expect(hasActiveTable({ expires_at: '2026-09-26T11:59:59Z' }, now)).toBe(false);
  });

  it('opens every other tab itself, with a table or without', () => {
    const others: TabKey[] = ['explore', 'activities', 'messages', 'profile'];
    for (const tab of others) {
      expect(tabOpenedBy(tab, null, now)).toBe(tab);
      expect(tabOpenedBy(tab, { expires_at: '2026-09-26T13:00:00Z' }, now)).toBe(tab);
    }
  });
});

describe('pushRoute', () => {
  it('opens Mesajlar for a DM and Bildirimler for a friend request', () => {
    expect(pushRoute({ target: 'messages' })).toBe(ROUTES.messages);
    expect(pushRoute({ target: 'notifications' })).toBe(ROUTES.notifications);
  });

  it('maps the old /friends paths to the new places', () => {
    expect(pushRoute({ url: '/friends/requests' })).toBe(ROUTES.notifications);
    expect(pushRoute({ url: '/friends' })).toBe(ROUTES.messages);
    expect(pushRoute({ url: '/friends/3f1c9e2a-0000-4000-8000-000000000000' })).toBe(
      ROUTES.messages,
    );
  });

  it('opens nothing for an unknown, empty or malformed payload', () => {
    for (const data of [null, undefined, 'messages', 42, {}, { target: 'room' }, { url: '/x' }]) {
      expect(pushRoute(data)).toBeNull();
    }
  });
});
