import type { Friend } from '@shared/api/friends.ts';
import type { GiftState } from '@shared/api/gifts.ts';
import type { ChatProfileView, ProfileView } from '@shared/api/profile.ts';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { friendKeys } from '@/features/friends/queries';
import { giftKeys } from '@/features/gifts/queries';
import { profileViewKeys } from '@/features/profile/queries';
import { SenderProfileScreen } from '@/features/profile/SenderProfileScreen';
import { goOffline } from '@/lib/offline';

import EditProfileScreen from '../../../../app/(app)/(tabs)/profile/edit';
import ProfileScreen from '../../../../app/(app)/(tabs)/profile';
import PersonScreen from '../../../../app/(app)/people/[publicId]';
import { GATE_NOW } from './deterministic';

// The Profil family for the visual gate (`ekran/profil…`): the routes themselves, drawn whole,
// over an own query client filled with the boards' sample (docs/design/yeni-arayuz/project:
// ProfilBen, ProfilBenKaydir, DarProfilim, ProfilDuzenle, MekanProfil and its menu and dialogs,
// YukleniyorProfil); no server, nothing signed in (the own profile is read under no account:
// useProfile's key with an undefined id), off the network (lib/offline.ts). The boards'
// photographs are not in the app: every face is its letter.
const OWN_ID = 'gorsel';
const DAY = 24 * 60 * 60_000;
// A cover is there (the boards draw one): a 1 px picture stands for it, cut to fill.
const COVER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function GateClient({ seed, children }: { seed: (c: QueryClient) => void; children: ReactNode }) {
  const [client] = useState(() => {
    goOffline();
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    seed(c);
    return c;
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function friend(n: number, displayName: string, since: string): Friend {
  return {
    publicId: `p${n}`,
    displayName,
    photoUrl: null,
    since,
    threadId: `t${n}`,
    lastMessageAt: null,
    unread: false,
  };
}

const FEVVE = friend(2, 'Fevve', '2025-10-21T10:00:00+03:00');
const KADIR = friend(5, 'Kadir', '2025-10-30T10:00:00+03:00');

// ProfilBen: Fırat, 26, "dünyanın en sadık adamı"; five friends (Fevve and Kadir first); the
// anonymous terra-uc44 with the Ninja set worn, a new name in 12 days.
const OWN_VIEW: ProfileView = {
  publicId: OWN_ID,
  displayName: 'Fırat',
  age: 26,
  bio: 'dünyanın en sadık adamı',
  photoUrl: null,
  coverUrl: COVER,
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

// ProfilBen, ProfilBenKaydir (the state scrolls it), DarProfilim (the state's width 320).
export function OwnProfileFixture() {
  return (
    <GateClient seed={seedOwn}>
      <ProfileScreen />
    </GateClient>
  );
}

// ProfilDuzenle: the fields as the profile row has them, or none yet (the name field empty, the
// photo and the cover waiting for a saved name).
export function EditProfileFixture({ empty }: { empty?: boolean }) {
  return (
    <GateClient
      seed={(c) => {
        if (!empty) {
          seedOwn(c);
          return;
        }
        c.setQueryData(['profile', undefined], {
          public_id: OWN_ID,
          display_name: null,
          bio: null,
          default_participation: 'anonymous',
        });
        const none: ProfileView = {
          publicId: OWN_ID,
          displayName: null,
          bio: null,
          photoUrl: null,
          coverUrl: null,
          badges: [],
          age: null,
        };
        c.setQueryData(profileViewKeys.view(OWN_ID), none);
      }}
    >
      <EditProfileScreen />
    </GateClient>
  );
}

// YukleniyorProfil: the person route with no profile read yet (nothing to ask for).
export function ProfileLoadingFixture() {
  return (
    <GateClient seed={() => undefined}>
      <PersonScreen />
    </GateClient>
  );
}

// MekanProfil and its menu and dialogs: Ece, from a venue chat message, not a friend. The ⋮ and the
// buttons are the real ones; the states press them (states.json → uygulamaAdimlar).
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
