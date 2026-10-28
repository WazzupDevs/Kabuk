import type { Friend } from '@shared/api/friends.ts';
import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { IconButton, MoreDots } from '@/components/IconButton';
import { Loader } from '@/components/Loader';
import { Menu, MenuItem } from '@/components/Menu';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { ReportModal } from '@/features/chat/ReportModal';
import { openDm } from '@/features/friends/openDm';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { friendKeys, useFriends } from '@/features/friends/queries';
import { ProfileHead } from '@/features/profile/ProfileCard';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, friendsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';
import { AppIcon } from '@/components/AppIcon';

// Another account's profile: only while the viewer may see it (a friend, or the other table of
// the current room). Anything else, including a room that just ended, reads as "not visible"
// (`not_found`, the same for a removed friend and a block: rule 5); a failed load (no connection)
// says so and offers "Tekrar dene".
// v45 (.prof, other): a round back button and "Seçenekler" on top, the same head as the own
// profile; reporting is in "Seçenekler". No badges (the owner's call, 27 Ekim).
export default function PersonScreen() {
  // `from: 'dm'`: opened from the DM with this person (CHAT-6).
  const { publicId, from } = useLocalSearchParams<{ publicId: string; from?: string }>();
  const view = useProfileView(publicId);
  const friends = useFriends();
  const friend = friends.data?.find((f) => f.publicId === publicId) ?? null;
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [ending, setEnding] = useState<'remove' | 'block' | null>(null);
  const queryClient = useQueryClient();
  const end = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ kind, reason }: { kind: 'remove' | 'block'; reason?: ReportReason }) =>
      kind === 'remove'
        ? friendsApi.remove(publicId, reason)
        : safetyApi.blockFriend(publicId, reason),
    onSuccess: (_data, { kind, reason }) => {
      if (kind === 'block') track('block_created', {});
      if (reason) track('report_submitted', {});
      setEnding(null);
      void queryClient.invalidateQueries({ queryKey: friendKeys.all });
      // The DM behind this profile is gone with the friendship: back to Mesajlar, not to it.
      if (from === 'dm') router.dismissTo('/messages');
      else router.back();
    },
  });
  const failed =
    view.isError && !(view.error instanceof ApiError && view.error.code === 'not_found');
  const hidden = !view.isPending && !view.data && !failed;

  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason) => safetyApi.reportProfile(publicId, reason),
    onSuccess: () => {
      track('report_submitted', {});
      setReporting(false);
      Alert.alert(tr.safety.reportSent);
    },
  });

  return (
    <Screen refreshable>
      <View className="mb-2 flex-row items-center justify-between">
        <IconButton
          round
          icon="chevron-back"
          label={tr.common.back}
          onPress={() => router.back()}
          testID="profile-back"
        />
        {view.data ? (
          <IconButton
            round
            icon="ellipsis-vertical"
            glyph={<MoreDots />}
            label={tr.profile.more}
            onPress={() => setMenu(true)}
            testID="profile-more"
          />
        ) : null}
      </View>
      {view.isPending ? (
        <View className="mt-16 items-center">
          <Loader />
        </View>
      ) : failed ? (
        <EmptyState
          icon="cloud-offline-outline"
          body={errorMessage(view.error)}
          action={{
            label: tr.common.retry,
            onPress: () => void view.refetch(),
            loading: view.isRefetching,
          }}
        />
      ) : !view.data ? (
        <EmptyState icon="eye-off-outline" body={tr.profile.notVisible} />
      ) : (
        <ProfileHead profile={view.data}>
          {friend ? <FriendActions friend={friend} /> : null}
        </ProfileHead>
      )}
      {hidden ? (
        <View className="mt-auto pt-8">
          <Button label={tr.profile.back} onPress={() => router.back()} />
        </View>
      ) : null}
      {/* skall tuvali (ProfilBaskasiSecenekler, ProfilYabanciSecenekler). */}
      <Sheet
        visible={menu}
        onClose={() => setMenu(false)}
        title={view.data?.displayName ?? tr.profile.moreTitle}
      >
        <Menu>
          {friend ? (
            <MenuItem
              icon="person-remove-outline"
              label={tr.friends.removeFriend}
              testID="profile-remove"
              onPress={() => {
                setMenu(false);
                setEnding('remove');
              }}
            />
          ) : null}
          {friend ? (
            <MenuItem
              negative
              icon="ban-outline"
              label={tr.friends.block}
              testID="profile-block"
              onPress={() => {
                setMenu(false);
                setEnding('block');
              }}
            />
          ) : null}
          <MenuItem
            negative
            icon="alert"
            label={tr.chat.report}
            testID="profile-report"
            onPress={() => {
              setMenu(false);
              setReporting(true);
            }}
          />
        </Menu>
        <Button
          size="lg"
          variant="neutral"
          label={tr.common.cancel}
          onPress={() => setMenu(false)}
        />
      </Sheet>
      <ConfirmWithReport
        reasons={REPORT_REASONS}
        visible={ending !== null}
        title={ending === 'block' ? tr.friends.block : tr.friends.removeFriend}
        hint={ending === 'block' ? tr.friends.blockHint : tr.friends.removeHint}
        confirmLabel={ending === 'block' ? tr.friends.blockConfirm : tr.friends.removeConfirm}
        pending={end.isPending}
        error={end.error}
        onConfirm={(reason) => ending && end.mutate({ kind: ending, reason })}
        onClose={() => setEnding(null)}
      />
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => report.mutate(reason)}
        onClose={() => setReporting(false)}
      />
    </Screen>
  );
}

// A friend's profile (skall tuvali, ProfilBaskasi): "Arkadaşsınız" beside "Mesaj".
function FriendActions({ friend }: { friend: Friend }) {
  const { colors, shape } = useTheme();
  const threadId = friend.threadId;
  return (
    <View className="flex-row" style={{ gap: SPACING[2] }}>
      <View
        className="flex-1 flex-row items-center justify-center"
        style={{
          gap: SPACING[1.5],
          minHeight: TOUCH.min,
          borderRadius: shape.radius.pill,
          backgroundColor: colors.surface2,
        }}
      >
        <AppIcon name="checkmark" size={ICON.sm} color={colors.onSuccessSoft} />
        <Text variant="label" color={colors.onSuccessSoft}>
          {tr.profile.friendsStatus}
        </Text>
      </View>
      {threadId ? (
        <View className="flex-1">
          <Button
            icon="chevron-forward"
            label={tr.friends.messageShort}
            onPress={() =>
              openDm({ threadId, publicId: friend.publicId, name: friend.displayName })
            }
          />
        </View>
      ) : null}
    </View>
  );
}
