import type { Friend } from '@shared/api/friends.ts';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Av, RowList, Li, Round, T } from '@/aura/kit';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { PageTop } from '@/components/PageTop';
import { Text } from '@/components/Text';
import { useFriends } from '@/features/friends/queries';
import { openDm } from '@/features/friends/openDm';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';
import { firstRows, useOpenRows } from '@/lib/afterTransition';

// Arkadaşlar, under Profil (docs/SPEC_V3.md §18.3; v45: .frs): the count beside the title, the
// friends in one card. A row opens the friend's profile, its "Mesaj" the DM. Removing and blocking
// stay where they were (the DM menu, the profile). No venue, position or active table of a friend
// anywhere. A failed reload keeps the list it had, with the error and "Tekrar dene" over it.
export default function FriendsScreen() {
  const friends = useFriends();
  // Opened light: the first rows while the screen slides in, the rest after.
  const shown = useOpenRows(friends.data?.length ?? 0);
  const loading = useLoaderHold(friends.isPending);
  const retry = {
    label: tr.common.retry,
    onPress: () => void friends.refetch(),
    loading: friends.isRefetching,
  };

  return (
    <Screen refreshable>
      {/* skall tuvali (Arkadaslar): the round back, the title and "N arkadaş" under it. */}
      <PageTop
        title={tr.profile.friends}
        sub={friends.data ? tr.profile.friendsSub(friends.data.length) : undefined}
        onBack={() => router.back()}
      />

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
        <View className="mt-1 gap-3">
          {friends.isError ? (
            <Card tone="note" className="gap-3" testID="friends-error">
              <Text variant="fine" tone="text">
                {errorMessage(friends.error)}
              </Text>
              <Button variant="neutral" size="sm" icon="refresh-outline" {...retry} />
            </Card>
          ) : null}
          {friends.data.length === 0 ? (
            <EmptyState kind="empty" body={tr.friends.empty} />
          ) : (
            <RowList>
              {firstRows(friends.data, shown).map((f) => (
                <FriendRow key={f.publicId} friend={f} />
              ))}
            </RowList>
          )}
        </View>
      )}
    </Screen>
  );
}

// A friend as a row of the glass list (docs/design/aura, the lists of Profil and Mesajlar; the
// owner's call, 28 Ekim): the photo, the name and since when, and the round chat button when
// there is a conversation. The row opens the friend's profile.
function FriendRow({ friend: f }: { friend: Friend }) {
  const name = f.displayName ?? tr.profile.noName;
  const threadId = f.threadId;
  return (
    <Li
      testID={`friend-${name}`}
      accessibilityLabel={`${name}, ${tr.friends.sinceLabel(f.since)}`}
      onPress={() =>
        router.push({ pathname: '/people/[publicId]', params: { publicId: f.publicId } })
      }
    >
      <Av size="row" name={name} photoUrl={f.photoUrl} />
      <View style={{ flex: 1, gap: SPACING[0.5] }}>
        <T v="h3">{name}</T>
        <T v="fine">{tr.friends.since(f.since)}</T>
      </View>
      {threadId ? (
        <Round
          icon="chat"
          label={tr.friends.message(name)}
          onPress={() => openDm({ threadId, publicId: f.publicId, name: f.displayName })}
        />
      ) : null}
    </Li>
  );
}
