import { router, useLocalSearchParams } from 'expo-router';

import { Btn } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useFriends } from '@/features/friends/queries';
import { FriendPage } from '@/features/profile/FriendPage';
import { OtherProfileLoading } from '@/features/profile/OtherProfile';
import { ProfileTopBar } from '@/features/profile/ProfileCard';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ApiError } from '@/lib/api';
import { KIT } from '@/theme/auraKit';

// Another account's profile: only while the viewer may see it (a friend, or the other table of
// the current room). Anything else, including a room that just ended, reads as "not visible"
// (`not_found`, the same for a removed friend and a block: rule 5); a failed load (no connection)
// says so and offers "Tekrar dene". No capsule and no nick here, a friend's included (rule 4).
export default function PersonScreen() {
  // `from: 'dm'`: opened from the DM with this person (CHAT-6).
  const { publicId, from } = useLocalSearchParams<{ publicId: string; from?: string }>();
  const view = useProfileView(publicId);
  const friends = useFriends();
  const friend = friends.data?.find((f) => f.publicId === publicId) ?? null;
  // A failed refresh keeps what was read (audit PRO-2).
  const failed =
    view.isError &&
    !view.data &&
    !(view.error instanceof ApiError && view.error.code === 'not_found');

  if (view.data) {
    return <FriendPage profile={view.data} friend={friend} fromDm={from === 'dm'} />;
  }
  // YukleniyorProfil (87): the paper, the back button and the loader.
  if (view.isPending) return <OtherProfileLoading />;
  return (
    <Screen
      refreshable
      top={<ProfileTopBar onBack={() => router.back()} />}
      footer={
        !failed ? (
          <Btn block bar={KIT.size.btnRow} label={tr.profile.back} onPress={() => router.back()} />
        ) : undefined
      }
    >
      {failed ? (
        <EmptyState
          kind="error"
          body={errorMessage(view.error)}
          error={view.error}
          action={{
            label: tr.common.retry,
            onPress: () => void view.refetch(),
            loading: view.isRefetching,
          }}
        />
      ) : (
        <EmptyState icon="eye-off-outline" body={tr.profile.notVisible} />
      )}
    </Screen>
  );
}
