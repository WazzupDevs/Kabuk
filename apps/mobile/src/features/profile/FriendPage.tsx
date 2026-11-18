import type { ProfileView } from '@shared/api/profile.ts';
import type { Friend } from '@shared/api/friends.ts';
import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { MenuItem } from '@/components/Menu';
import { ReportModal } from '@/features/chat/ReportModal';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { refreshFriends, useMutualFriends } from '@/features/friends/queries';
import { MutualCard } from '@/features/profile/MutualCard';
import { FriendActions } from '@/features/profile/OtherActions';
import { OtherProfile } from '@/features/profile/OtherProfile';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

// ProfilBaskasi (03): the cover, the photo, the name and the bio; for a friend "Mesaj" and
// "Arkadaşsınız" side by side and the mutual friends in one card (it opens their list, 103). Its ⋮
// menu: "Şikayet et", and for a friend "Arkadaşlıktan çıkar" and "Engelle" (red, at the foot).
export function FriendPage({
  profile,
  friend,
  fromDm,
}: {
  profile: ProfileView;
  friend: Friend | null;
  fromDm: boolean;
}) {
  const publicId = profile.publicId;
  const queryClient = useQueryClient();
  const [reporting, setReporting] = useState(false);
  const [ending, setEnding] = useState<'remove' | 'block' | null>(null);
  // Only on a friend's profile (rule 4); nothing while it loads, fails or is empty.
  const mutual = useMutualFriends(publicId, !!friend).data;

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
      void refreshFriends(queryClient, 'friendship');
      // The DM behind this profile is gone with the friendship: back to Mesajlar, not to it.
      if (fromDm) router.dismissTo('/messages');
      else router.back();
    },
  });
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason) => safetyApi.reportProfile(publicId, reason),
    onSuccess: () => {
      track('report_submitted', {});
      setReporting(false);
      Alert.alert(tr.safety.reportSent);
    },
  });
  const name = profile.displayName ?? tr.profile.noName;

  return (
    <>
      <OtherProfile
        profile={profile}
        actions={friend ? <FriendActions friend={friend} /> : undefined}
        extras={
          friend && mutual && mutual.count > 0 ? (
            <MutualCard
              mutual={mutual}
              onPress={() =>
                router.push({
                  pathname: '/people/mutual',
                  params: { publicId, name },
                })
              }
            />
          ) : undefined
        }
        // The DM's menu (iskelet.md → 3.5, 5.5): no "Vazgeç", Engelle red at the foot apart.
        menu={(close) => (
          <>
            <MenuItem
              cap="report"
              label={tr.chat.report}
              testID="profile-report"
              onPress={() => {
                close();
                setReporting(true);
              }}
            />
            {friend ? (
              <MenuItem
                cap="personRemove"
                label={tr.friends.removeFriend}
                testID="profile-remove"
                onPress={() => {
                  close();
                  setEnding('remove');
                }}
              />
            ) : null}
            {friend ? (
              <MenuItem
                negative
                cap="block"
                label={tr.friends.block}
                testID="profile-block"
                onPress={() => {
                  close();
                  setEnding('block');
                }}
              />
            ) : null}
          </>
        )}
      />
      <ConfirmWithReport
        reasons={REPORT_REASONS}
        visible={ending !== null}
        title={ending === 'block' ? tr.safety.blockNamedTitle(name) : tr.friends.removeFriend}
        hint={ending === 'block' ? tr.friends.blockHint : tr.friends.removeHint}
        confirmLabel={ending === 'block' ? tr.friends.blockConfirm : tr.friends.removeConfirm}
        confirmIcon={ending === 'block' ? 'block' : undefined}
        pending={end.isPending}
        error={end.error}
        onConfirm={(reason) => ending && end.mutate({ kind: ending, reason })}
        onClose={() => setEnding(null)}
      />
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting}
        name={profile.displayName ?? undefined}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => report.mutate(reason)}
        onClose={() => setReporting(false)}
      />
    </>
  );
}
