import type { Friend } from '@shared/api/friends.ts';
import { normalize } from '@shared/trText.ts';
import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { View } from 'react-native';

import { GlassSearch } from '@/aura/GlassSearch';
import { Btn, Glass, Li, T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { EmptyCard } from '@/features/explore/EmptyCard';
import { useFriends } from '@/features/friends/queries';
import { openDm } from '@/features/friends/openDm';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ProfileFace } from '@/features/profile/ProfileFace';
import { BarBack, StickyField } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { FLAT } from '@/theme/flatLists';
import { SPACING } from '@/theme/tokens';
import { firstRows, useOpenRows } from '@/lib/afterTransition';

// Arkadaşlar, under Profil (docs/SPEC_V3.md §18.3; yeni arayüz tuvali: Arkadaslar,
// ArkadaslarKaydir, ArkadaslarBos): the back button with the title and "N arkadaş" on the top row,
// the search field under it (it narrows the friends by name on the phone; it pins under the top
// as the list scrolls), the friends as flat rows, a row opening the friend's profile and its
// "Mesaj gönder" the DM. Removing and blocking stay where they were (the DM menu, the profile). No
// venue, position or active table of a friend anywhere. A failed reload keeps the list it had,
// with the error and "Tekrar dene" over it.
export default function FriendsScreen() {
  const friends = useFriends();
  // Opened light: the first rows while the screen slides in, the rest after.
  const shown = useOpenRows(friends.data?.length ?? 0);
  const loading = useLoaderHold(friends.isPending);
  const [query, setQuery] = useState('');
  // The field shows each letter at once; the rows follow it a moment later.
  const asked = useDeferredValue(query);
  const B = FLAT.bar;
  const retry = {
    label: tr.common.retry,
    onPress: () => void friends.refetch(),
    loading: friends.isRefetching,
  };
  const list = friends.data ? byName(friends.data, asked) : [];
  const hasFriends = !!friends.data && friends.data.length > 0;

  return (
    <Screen
      refreshable
      side={FLAT.page.side}
      barSide={FLAT.page.side}
      barTop={B.top}
      padTop={B.fieldTop}
      gap={FLAT.page.gap}
      top={
        // `.tb2`: the round back button and the title over "N arkadaş", 56 high.
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: B.gap, minHeight: B.row }}>
          <BarBack side={KIT.size.round} />
          <View style={{ flex: 1 }}>
            <T v="pageBarTitle" accessibilityRole="header">
              {tr.profile.friends}
            </T>
            {friends.data && friends.data.length > 0 ? (
              <T v="fine">{tr.profile.friendsSub(friends.data.length)}</T>
            ) : null}
          </View>
        </View>
      }
    >
      {hasFriends ? (
        <StickyField band side={FLAT.page.side}>
          <GlassSearch
            testID="friends-search"
            value={query}
            onChangeText={setQuery}
            placeholder={tr.friends.search}
            height={KIT.size.field}
          />
        </StickyField>
      ) : null}
      {friends.isPending || loading ? (
        <View className="mt-12">
          <EmptyState kind="loading" body={tr.common.loading} />
        </View>
      ) : !friends.data ? (
        <EmptyState
          icon="cloud-offline-outline"
          body={errorMessage(friends.error)}
          action={retry}
        />
      ) : (
        <View style={{ gap: SPACING[3] }}>
          {friends.isError ? (
            <Glass sm pad="pad" style={{ gap: SPACING[3] }} testID="friends-error">
              <T v="fine" ink>
                {errorMessage(friends.error)}
              </T>
              <Btn sm variant="glassy" icon="refresh" {...retry} />
            </Glass>
          ) : null}
          {friends.data.length === 0 ? (
            // ArkadaslarBos: the riso, its title and its sentence in the middle.
            <EmptyState
              kind="empty"
              riso="friends"
              compact
              title={tr.friends.emptyTitle}
              body={tr.friends.emptyHint}
            />
          ) : list.length === 0 ? (
            <EmptyCard
              testID="friends-no-match"
              title={tr.friends.noMatch}
              body={tr.friends.noMatchHint}
            />
          ) : (
            <View testID="friends-list">
              {firstRows(list, shown).map((f) => (
                <FriendRow key={f.publicId} friend={f} />
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

// The friends whose name holds what is searched (@shared/trText.ts → normalize: Turkish
// lowercase, ç ğ ı ö ş ü folded; CLAUDE.md rule 7).
function byName(friends: readonly Friend[], query: string): readonly Friend[] {
  const q = normalize(query).replace(/\s+/g, ' ').trim();
  if (q === '') return friends;
  return friends.filter((f) =>
    normalize(f.displayName ?? tr.profile.noName)
      .replace(/\s+/g, ' ')
      .includes(q),
  );
}

// A friend as a flat row (`.rw`): the face 48, the name over since when, "Mesaj gönder" at the
// right when there is a conversation. The row opens the friend's profile.
function FriendRow({ friend: f }: { friend: Friend }) {
  const R = FLAT.row;
  const name = f.displayName ?? tr.profile.noName;
  const threadId = f.threadId;
  return (
    <Li
      testID={`friend-${name}`}
      accessibilityLabel={`${name}, ${tr.friends.sinceLabel(f.since)}`}
      onPress={() =>
        router.push({ pathname: '/people/[publicId]', params: { publicId: f.publicId } })
      }
      padY={R.padY}
      padX={0}
      gap={R.gap}
      minHeight={R.minHeight}
    >
      <ProfileFace side={KIT.size.av.row} name={name} photoUrl={f.photoUrl} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="h3">{name}</T>
        <T v="fine">{tr.friends.since(f.since)}</T>
      </View>
      {threadId ? (
        <Btn
          sm
          variant="glassy"
          label={tr.friends.messageSend}
          accessibilityLabel={tr.friends.message(name)}
          onPress={() => openDm({ threadId, publicId: f.publicId, name: f.displayName })}
        />
      ) : null}
    </Li>
  );
}
