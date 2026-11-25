import type { ProfileView } from '@shared/api/profile.ts';
import type { Friend } from '@shared/api/friends.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { friendKeys } from '@/features/friends/queries';
import { goOffline } from '@/lib/offline';

import { PersonPage } from '../../../../app/(app)/people/[publicId]';

// Another person's profile for the visual gate's `ekran/profil-baskasi`: the page (PersonPage, the
// route's body) over an own query client filled with the board's sample (docs/design/yeni-arayuz/
// project/ProfilBaskasi.dc.html: Adem, 26, a friend, two mutual friends), off the network
// (lib/offline.ts). No cover and no photo: the riso scene and the initial, as the board's.
const ID = 'gate-adem';

const PROFILE: ProfileView = {
  publicId: ID,
  displayName: 'Adem',
  bio: 'Kalk oturmaya mı geldin',
  photoUrl: null,
  coverUrl: null,
  badges: [],
  age: 26,
};

const FRIEND: Friend = {
  publicId: ID,
  displayName: 'Adem',
  photoUrl: null,
  since: '2026-01-10T12:00:00+03:00',
  threadId: 'gate-dm-adem',
  lastMessageAt: null,
  unread: false,
};

const MUTUAL = {
  count: 2,
  friends: [
    { publicId: 'gate-fevve', displayName: 'Fevve', photoUrl: null },
    { publicId: 'gate-kadir', displayName: 'Kadir', photoUrl: null },
  ],
};

export function PersonFixture() {
  const [client] = useState(() => {
    goOffline();
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    c.setQueryData(friendKeys.mutual(ID), MUTUAL);
    return c;
  });
  return (
    <QueryClientProvider client={client}>
      <PersonPage profile={PROFILE} friend={FRIEND} />
    </QueryClientProvider>
  );
}
