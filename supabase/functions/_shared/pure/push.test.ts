import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  isExpoPushToken,
  dmPush,
  friendMatchPush,
  friendRequestPush,
  joinAcceptedPush,
  invitePush,
  joinRequestPush,
  PUSH_ICONS,
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
  it('names only the asking table and its phones, or the person on its own (§4.E)', () => {
    expect(joinRequestPush('Mor Baykuş', 3).body).toBe(
      'Mor Baykuş (3 kişi) masana katılmak istiyor.',
    );
    // Up to 12 phones, counted exactly; no headcount is declared any more.
    expect(joinRequestPush('Mor Baykuş', 7).body).toContain('(7 kişi)');
    expect(joinRequestPush('kapsul-ab12', 1).body).toBe('kapsul-ab12 masana katılmak istiyor.');
    // The user never sees "oda" (docs/SPEC_V3.md §23.C): the table joins a table.
    expect(joinAcceptedPush()).toEqual({
      title: 'İsteğin kabul edildi',
      body: 'Masaya katılabilirsin.',
      kind: 'istek_kabul',
    });
  });

  it('say nothing about who wrote or asked, and nothing of the message', () => {
    // Only the screen a tap opens (docs/SPEC_V3.md §18.3), no id.
    expect(dmPush()).toEqual({
      title: 'skall',
      body: 'Yeni bir mesajın var',
      kind: 'dm',
      target: 'messages',
    });
    expect(friendRequestPush()).toEqual({
      title: 'skall',
      body: 'Yeni bir arkadaşlık isteğin var',
      kind: 'arkadas_istegi',
      target: 'notifications',
    });
    // K-70: no venue, no table, no name.
    expect(friendMatchPush()).toEqual({
      title: 'skall',
      body: 'Masada eklediğin biriyle arkadaş oldunuz',
      kind: 'arkadas_oldunuz',
      target: 'messages',
    });
  });
});

describe('push icons (Aura BildirimSimgeleri)', () => {
  const root = resolve(import.meta.dirname, '../../../..');
  const pushes = [
    joinRequestPush('Mor Baykuş', 3),
    joinAcceptedPush(),
    dmPush(),
    friendRequestPush(),
    friendMatchPush(),
    invitePush(),
  ];

  it('gives every push its own kind', () => {
    expect(pushes.map((p) => p.kind).sort()).toEqual([...PUSH_ICONS].sort());
  });

  it('has a drawing and a PNG in every density for every kind, and nothing else', () => {
    const svgs = readdirSync(resolve(root, 'scripts/icon/bildirim')).map((f) => f.slice(0, -4));
    expect(svgs.sort()).toEqual([...PUSH_ICONS].sort());
    for (const d of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
      for (const kind of PUSH_ICONS) {
        const png = `apps/mobile/assets/notification/drawable-${d}/ic_bildirim_${kind}.png`;
        expect(existsSync(resolve(root, png)), png).toBe(true);
      }
    }
  });

  it('keeps kinds to the resource names the patched builder accepts', () => {
    // patches/expo-notifications@57.0.21.patch → [a-z_]{1,32}
    for (const kind of PUSH_ICONS) expect(kind).toMatch(/^[a-z_]{1,32}$/);
  });
});
