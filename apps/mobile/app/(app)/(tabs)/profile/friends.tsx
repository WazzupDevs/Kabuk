import type { Friend } from '@shared/api/friends.ts';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Btn, Li, Round, T, useKit, Glass } from '@/aura/kit';
import { CapIcon } from '@/aura/CapIcon';
import { RisoPeekOver } from '@/aura/Peek';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { PageTop } from '@/components/PageTop';
import { useFriends } from '@/features/friends/queries';
import { openDm } from '@/features/friends/openDm';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ProfileFace } from '@/features/profile/ProfileFace';
import { KIT } from '@/theme/auraKit';
import { FRIENDS_LIST } from '@/theme/friendsList';
import { FRIENDS_PEEK } from '@/theme/kankiMotion';
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
  const { scheme } = useKit();
  const F = FRIENDS_LIST;
  const look = F[scheme];
  const retry = {
    label: tr.common.retry,
    onPress: () => void friends.refetch(),
    loading: friends.isRefetching,
  };

  return (
    <Screen
      refreshable
      side={F.side}
      barSide={F.side}
      top={
        // tuval Arkadaslar: the round back, the title 6 in and "N arkadaş" 4 under it.
        <PageTop
          title={tr.profile.friends}
          sub={friends.data ? tr.profile.friendsSub(friends.data.length) : undefined}
          look={{ titleIn: F.titleIn, subTop: F.subTop, subColor: look.sub }}
          onBack={() => router.back()}
        />
      }
    >
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
            <EmptyState kind="empty" riso="friends" body={tr.friends.empty} />
          ) : (
            // tuval Arkadaslar: a riso buddy looking over the list's right, the list 64 under
            // "N arkadaş" on one card, 26 round, 4 / 6 inside; a hairline 78 in between the rows.
            <View style={{ marginTop: F.listTop }}>
              <RisoPeekOver places={FRIENDS_PEEK} />
              <Glass
                face={look.card}
                radius={F.card.radius}
                style={{
                  overflow: 'hidden',
                  paddingVertical: F.card.padY,
                  paddingHorizontal: F.card.padX,
                }}
              >
                {firstRows(friends.data, shown).map((f, i) => (
                  <View key={f.publicId}>
                    {i > 0 ? (
                      <View
                        style={{
                          height: KIT.size.hair,
                          marginLeft: F.row.hairIn,
                          backgroundColor: look.hair,
                        }}
                      />
                    ) : null}
                    <FriendRow friend={f} />
                  </View>
                ))}
              </Glass>
            </View>
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
  const { scheme } = useKit();
  const F = FRIENDS_LIST;
  const R = F.row;
  const look = F[scheme];
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
      padX={R.padX}
      gap={R.gap}
    >
      {/* tuval Arkadaslar: the face 54 with its 2 white ring inside it. */}
      <View
        style={{
          width: R.face,
          height: R.face,
          borderRadius: R.face / 2,
          backgroundColor: look.faceRing,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ProfileFace side={R.face - 2 * R.ring} name={name} photoUrl={f.photoUrl} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: R.lineGap }}>
        <T v="placeName" ink>
          {name}
        </T>
        <T v="friendSince" color={look.since}>
          {tr.friends.since(f.since)}
        </T>
      </View>
      {threadId ? (
        // iskelet.md → 5.8: a clear glass round, 46; its bubble 20 in the green.
        <Round
          glass="clear"
          side={KIT.size.topBtn}
          label={tr.friends.message(name)}
          onPress={() => openDm({ threadId, publicId: f.publicId, name: f.displayName })}
        >
          <CapIcon name="chat" color={look.message} soft={1} size={R.icon} />
        </Round>
      ) : null}
    </Li>
  );
}
