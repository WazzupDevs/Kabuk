import { router } from 'expo-router';
import { View } from 'react-native';

import { Btn, Li, T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { openDm } from '@/features/friends/openDm';
import { useFriends, useMutualFriends } from '@/features/friends/queries';
import { ProfileFace } from '@/features/profile/ProfileFace';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { BarBack } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { FLAT } from '@/theme/flatLists';

// OrtakArkadaslar (103): the friends the viewer and this friend have in common, opened from the
// friend's profile (rule 4: only a friend's profile asks for them). The back button with the
// title over "Adem ile 2 ortak arkadaşınız var", the friends as flat rows: the face, the name over
// since when, "Mesaj gönder" the DM. A row opens that friend's profile.
export function MutualFriends({ publicId, name }: { publicId: string; name?: string }) {
  const mutual = useMutualFriends(publicId, true);
  const friends = useFriends();
  const profile = useProfileView(name ? undefined : publicId);
  const loading = useLoaderHold(mutual.isPending);
  const B = FLAT.bar;
  const who = name ?? profile.data?.displayName ?? tr.profile.noName;
  const retry = {
    label: tr.common.retry,
    onPress: () => void mutual.refetch(),
    loading: mutual.isRefetching,
  };
  const rows = mutual.data?.friends ?? [];

  return (
    <Screen
      refreshable
      side={FLAT.page.side}
      barSide={FLAT.page.side}
      barTop={B.top}
      padTop={B.fieldTop}
      gap={FLAT.page.gap}
      top={
        // `.tb2`: the round back button and the title over the line, 56 high.
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: B.gap, minHeight: B.row }}>
          <BarBack side={KIT.size.round} />
          <View style={{ flex: 1 }}>
            <T v="pageBarTitle" accessibilityRole="header">
              {tr.profile.mutualListTitle}
            </T>
            {mutual.data && mutual.data.count > 0 ? (
              <T v="fine">{tr.profile.mutualListSub(who, mutual.data.count)}</T>
            ) : null}
          </View>
        </View>
      }
    >
      {mutual.isPending || loading ? (
        <View className="flex-1">
          <EmptyState kind="loading" body={tr.common.loading} />
        </View>
      ) : !mutual.data ? (
        <EmptyState
          kind="error"
          body={errorMessage(mutual.error)}
          error={mutual.error}
          action={retry}
        />
      ) : rows.length === 0 ? (
        <EmptyState kind="empty" compact title={tr.profile.mutualListEmpty} body="" />
      ) : (
        <View testID="mutual-list">
          {rows.map((m) => {
            const friend = friends.data?.find((f) => f.publicId === m.publicId);
            const label = m.displayName ?? tr.profile.noName;
            const threadId = friend?.threadId ?? null;
            const R = FLAT.row;
            return (
              <Li
                key={m.publicId}
                testID={`mutual-${m.publicId}`}
                accessibilityLabel={tr.profile.mutualOpen(label)}
                onPress={() =>
                  router.push({ pathname: '/people/[publicId]', params: { publicId: m.publicId } })
                }
                padY={R.padY}
                padX={0}
                gap={R.gap}
                minHeight={R.minHeight}
              >
                <ProfileFace side={KIT.size.av.row} name={label} photoUrl={m.photoUrl} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T v="h3">{label}</T>
                  {friend ? <T v="fine">{tr.friends.since(friend.since)}</T> : null}
                </View>
                {threadId ? (
                  <Btn
                    sm
                    variant="glassy"
                    label={tr.friends.messageSend}
                    accessibilityLabel={tr.friends.message(label)}
                    onPress={() => openDm({ threadId, publicId: m.publicId, name: m.displayName })}
                  />
                ) : null}
              </Li>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
