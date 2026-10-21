import { APP_NAME } from './brand.ts';
import type { PushTarget } from './navigation.ts';

// Push notification texts are built on the server, so they live here rather than in the app's
// tr.ts (which re-exports them). They carry only what the request card shows the owner: the asking
// table's name and its phone count, or the person's name on its own (rule 4; docs/SPEC_V4.md
// §4.E).

// `target`: the screen a tap opens (docs/SPEC_V3.md §18.3); no id, no sender, no content.
export type PushMessage = { title: string; body: string; target?: PushTarget };

export function joinRequestPush(name: string, phones: number): PushMessage {
  return {
    title: 'Katılma isteği',
    body:
      phones > 1
        ? `${name} (${phones} kişi) masana katılmak istiyor.`
        : `${name} masana katılmak istiyor.`,
  };
}

export function joinAcceptedPush(): PushMessage {
  return { title: 'İsteğin kabul edildi', body: 'Masaya katılabilirsin.' };
}

// v2 (docs/SPEC_V2.md §6.4): no sender, no preview. The friend request text follows the DM one.
export function dmPush(): PushMessage {
  return { title: APP_NAME, body: 'Yeni bir mesajın var', target: 'messages' };
}

export function friendRequestPush(): PushMessage {
  return { title: APP_NAME, body: 'Yeni bir arkadaşlık isteğin var', target: 'notifications' };
}

// K-70 (docs/SPEC_V4.md §4.E): the silent "Arkadaş ekle" became mutual; to the first presser only.
// No venue, no table, no name (§18.3a).
export function friendMatchPush(): PushMessage {
  return { title: APP_NAME, body: 'Masada eklediğin biriyle arkadaş oldunuz', target: 'messages' };
}

// A friend's table invite (docs/SPEC_V4.md §4.G): no name, no table, no venue (§18.3a).
export function invitePush(): PushMessage {
  return {
    title: APP_NAME,
    body: 'Bir arkadaşın seni masasına çağırıyor',
    target: 'notifications',
  };
}

// The setting each push is read against before it goes (K-53, K-62): "Arkadaşlık istekleri" covers
// the requests and the matches (K-70), "Masa davetleri" the invites, "Birebir mesajlar" the DMs. The
// join request and its accept have no setting and always go.
export type PushPreference = 'notify_dm' | 'notify_friend_requests' | 'notify_invites';
export type PushKind = 'dm' | 'friend_request' | 'friend_match' | 'table_invite';

export const PUSH_PREFERENCE: Record<PushKind, PushPreference> = {
  dm: 'notify_dm',
  friend_request: 'notify_friend_requests',
  friend_match: 'notify_friend_requests',
  table_invite: 'notify_invites',
};

export function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}
