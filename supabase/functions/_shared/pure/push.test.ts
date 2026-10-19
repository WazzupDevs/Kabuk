import { describe, expect, it } from 'vitest';

import {
  isExpoPushToken,
  dmPush,
  friendMatchPush,
  friendRequestPush,
  joinAcceptedPush,
  joinRequestPush,
} from './push.ts';

describe('isExpoPushToken', () => {
  it('accepts Expo push tokens only', () => {
    expect(isExpoPushToken('ExponentPushToken[abc123]')).toBe(true);
    expect(isExpoPushToken('ExpoPushToken[abc123]')).toBe(true);
    expect(isExpoPushToken('abc')).toBe(false);
    expect(isExpoPushToken('ExponentPushToken[]')).toBe(false);
  });
});

describe('push texts', () => {
  it('names only the table alias, headcount and concept', () => {
    expect(joinRequestPush('Mor Baykuş', 3).body).toBe(
      'Mor Baykuş (3 kişi) masana katılmak istiyor.',
    );
    expect(joinRequestPush('Mor Baykuş', 4).body).toContain('(4+ kişi)');
    // The user never sees "oda" (docs/SPEC_V3.md §23.C): the table joins a table.
    expect(joinAcceptedPush()).toEqual({
      title: 'İsteğin kabul edildi',
      body: 'Masaya katılabilirsin.',
    });
  });

  it('say nothing about who wrote or asked, and nothing of the message', () => {
    // Only the screen a tap opens (docs/SPEC_V3.md §18.3), no id.
    expect(dmPush()).toEqual({ title: 'skall', body: 'Yeni bir mesajın var', target: 'messages' });
    expect(friendRequestPush()).toEqual({
      title: 'skall',
      body: 'Yeni bir arkadaşlık isteğin var',
      target: 'notifications',
    });
    // K-70: no venue, no table, no name.
    expect(friendMatchPush()).toEqual({
      title: 'skall',
      body: 'Masada eklediğin biriyle arkadaş oldunuz',
      target: 'messages',
    });
  });
});
