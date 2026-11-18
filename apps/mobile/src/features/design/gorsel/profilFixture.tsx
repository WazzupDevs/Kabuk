import type { Friend } from '@shared/api/friends.ts';
import type { ChatProfileView, ProfileView } from '@shared/api/profile.ts';
import type { GiftState } from '@shared/api/gifts.ts';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { friendKeys } from '@/features/friends/queries';
import { giftKeys } from '@/features/gifts/queries';
import { EditProfile } from '@/features/profile/EditProfile';
import { FriendPage } from '@/features/profile/FriendPage';
import { MutualFriends } from '@/features/profile/MutualFriends';
import { OtherProfileLoading } from '@/features/profile/OtherProfile';
import { OwnProfile } from '@/features/profile/OwnProfile';
import { profileViewKeys } from '@/features/profile/queries';
import { SenderProfileScreen } from '@/features/profile/SenderProfileScreen';

import { GATE_NOW } from './deterministic';

// The Profil family for the visual gate (`ekran/profil…`): the screens themselves (their own
// components, not their parts), drawn whole over an own query client filled with the boards' sample
// (docs/design/yeni-arayuz/project: ProfilBaskasi, ProfilBen, ProfilBenKaydir, ProfilDuzenle,
// ProfilDuzenleYaz, MekanProfil and its menu and dialogs, YukleniyorProfil, OrtakArkadaslar,
// DarProfilim); no server, nothing signed in, no-op actions. The boards' photographs are not in
// the app: every face is its letter.
const OWN_ID = 'gorsel';
const DAY = 24 * 60 * 60_000;

function GateClient({ seed, children }: { seed: (c: QueryClient) => void; children: ReactNode }) {
  const [client] = useState(() => {
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    seed(c);
    return c;
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function friend(n: number, displayName: string, since: string, threadId = `t${n}`): Friend {
  return {
    publicId: `p${n}`,
    displayName,
    photoUrl: null,
    since,
    threadId,
    lastMessageAt: null,
    unread: false,
  };
}

// ProfilBaskasi (03): Adem, a friend; the two they share are Fevve and Kadir (OrtakArkadaslar's
// rows: "21 Ekim'den beri", "30 Ekim'den beri").
const FEVVE = friend(2, 'Fevve', '2025-10-21T10:00:00+03:00');
const KADIR = friend(5, 'Kadir', '2025-10-30T10:00:00+03:00');
const ADEM = friend(1, 'Adem', '2025-10-12T10:00:00+03:00');

const ADEM_VIEW: ProfileView = {
  publicId: ADEM.publicId,
  displayName: 'Adem',
  age: 26,
  bio: 'Kalk oturmaya mı geldin',
  photoUrl: null,
  coverUrl: null,
  badges: [],
};

const MUTUAL = {
  count: 2,
  friends: [FEVVE, KADIR].map((f) => ({
    publicId: f.publicId,
    displayName: f.displayName,
    photoUrl: null,
  })),
};

function seedFriend(c: QueryClient) {
  c.setQueryData(friendKeys.list, [ADEM, FEVVE, KADIR]);
  c.setQueryData(friendKeys.mutual(ADEM.publicId), MUTUAL);
  c.setQueryData(profileViewKeys.view(ADEM.publicId), ADEM_VIEW);
}

// 03: Adem's profile, friend: "Mesaj", "Arkadaşsınız", the mutual card.
export function FriendProfileFixture() {
  return (
    <GateClient seed={seedFriend}>
      <FriendPage profile={ADEM_VIEW} friend={ADEM} fromDm={false} />
    </GateClient>
  );
}

// 103: Ortak arkadaşlar.
export function MutualFixture() {
  return (
    <GateClient seed={seedFriend}>
      <MutualFriends publicId={ADEM.publicId} name="Adem" />
    </GateClient>
  );
}

// 87: the profile loading.
export function ProfileLoadingFixture() {
  return (
    <GateClient seed={() => undefined}>
      <OtherProfileLoading />
    </GateClient>
  );
}

// 57–61: Ece, from a venue chat message, not a friend: the request, the menu with "Sessize al",
// "Şikayet et" and "Engelle", the dialogs. The ⋮ and the buttons are the real ones; the states
// press them (states.json → uygulamaAdimlar).
const ECE_VIEW: ChatProfileView = {
  displayName: 'Ece',
  age: 24,
  bio: 'Kahvesiz oyun oynamam',
  photoUrl: null,
  coverUrl: null,
  badges: [],
};
const noop = async () => undefined;

function SenderScreen() {
  const view = useQuery({ queryKey: ['gate', 'sender'], queryFn: async () => ECE_VIEW });
  return (
    <SenderProfileScreen
      view={view}
      sendRequest={noop}
      report={{ send: noop }}
      block={{ send: noop, onDone: () => undefined }}
      mute={{ send: noop, onDone: () => undefined }}
      ids={{
        screen: 'venue-chat-profile',
        request: 'venue-chat-request',
        confirm: 'venue-chat-request-confirm',
        sent: 'venue-chat-request-sent',
        report: 'profile-report',
        block: 'profile-block',
      }}
    />
  );
}

export function SenderProfileFixture() {
  return (
    <GateClient
      seed={(c) => {
        c.setQueryData(['gate', 'sender'], ECE_VIEW);
        c.setQueryData(friendKeys.list, []);
      }}
    >
      <SenderScreen />
    </GateClient>
  );
}

// ProfilBen: Fırat, 26, "dünyanın en sadık adamı"; five friends (Fevve and Kadir first); the
// anonymous terra-uc44 with the Ninja set worn, a new name in 12 days.
const OWN_VIEW: ProfileView = {
  publicId: OWN_ID,
  displayName: 'Fırat',
  age: 26,
  bio: 'dünyanın en sadık adamı',
  photoUrl: null,
  coverUrl: null,
  badges: [],
  capsuleNick: 'terra-uc44',
  capsuleLook: 'c:krem e:klasik x:shurikentokasi x:simsekgozler x:gecepelerini',
  nickRefreshAt: new Date(GATE_NOW + 12 * DAY).toISOString(),
};
const OWN_FRIENDS = [
  FEVVE,
  KADIR,
  friend(6, 'Mert', '2025-11-02T10:00:00+03:00'),
  friend(7, 'Ece', '2025-11-09T10:00:00+03:00'),
  friend(8, 'Barış', '2025-11-20T10:00:00+03:00'),
];
const NINJA: GiftState = {
  packs: [],
  logins: 0,
  loginsPerPack: 7,
  allOwned: false,
  owned: [
    { id: 'shurikentokasi', tier: 'efsanevi', pack: 'bronz' },
    { id: 'simsekgozler', tier: 'efsanevi', pack: 'bronz' },
    { id: 'gecepelerini', tier: 'efsanevi', pack: 'bronz' },
  ],
  worn: ['shurikentokasi', 'simsekgozler', 'gecepelerini'],
  equipped: 'shurikentokasi',
};

function seedOwn(c: QueryClient) {
  c.setQueryData(['profile', undefined], {
    public_id: OWN_ID,
    display_name: 'Fırat',
    bio: 'dünyanın en sadık adamı',
    default_participation: 'anonymous',
  });
  c.setQueryData(profileViewKeys.view(OWN_ID), OWN_VIEW);
  c.setQueryData(friendKeys.list, OWN_FRIENDS);
  c.setQueryData(giftKeys.state, NINJA);
}

// 03b, 03c (`scrolled`: the page 320 down) and 90 (the state's width 320).
export function OwnProfileFixture({ scrolled }: { scrolled?: boolean }) {
  return (
    <GateClient seed={seedOwn}>
      <OwnProfile gateScroll={scrolled ? 320 : undefined} />
    </GateClient>
  );
}

// 03d, 03e (`typed`: "Fırat Can" written over "Fırat", its field focused, no keyboard).
export function EditProfileFixture({ typed }: { typed?: boolean }) {
  return (
    <GateClient seed={seedOwn}>
      <EditProfile gate={typed ? { draftName: 'Fırat Can' } : undefined} />
    </GateClient>
  );
}
