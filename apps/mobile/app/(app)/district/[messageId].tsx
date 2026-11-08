import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Menu, MenuItem } from '@/components/Menu';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { ReportModal } from '@/features/chat/ReportModal';
import { useDistrictChatProfile } from '@/features/district/queries';
import { FriendActions } from '@/features/friends/FriendActions';
import { useFriends } from '@/features/friends/queries';
import { ProfileHead, ProfileTopBar } from '@/features/profile/ProfileCard';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { districtChatApi, friendsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';

// The sender of a profiled district chat message, opened through the message (docs/SPEC_V4.md
// §4.V, as the venue chat's profile): only to the room's people now, no public_id. The request
// asks first: it shows the other side this account's name, age and photo.
export default function DistrictChatProfileScreen() {
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const view = useDistrictChatProfile(messageId);
  const friends = useFriends();
  const friendId = view.data?.friendPublicId;
  const friend = friendId ? friends.data?.find((f) => f.publicId === friendId) : undefined;
  const [confirming, setConfirming] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [reporting, setReporting] = useState(false);

  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => friendsApi.requestFromDistrictChat(messageId),
    onSuccess: () => {
      setConfirming(false);
      setSent(true);
    },
  });
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason) => districtChatApi.report(messageId, reason),
    onSuccess: () => {
      setReporting(false);
      Alert.alert(tr.safety.reportSent);
    },
  });

  return (
    <Screen
      footer={<Btn block variant="glassy" label={tr.profile.back} onPress={() => router.back()} />}
      top={
        <ProfileTopBar
          onBack={() => router.back()}
          onMore={view.data ? () => setMenu(true) : undefined}
        />
      }
    >
      {view.isPending ? (
        <View className="mt-16 items-center">
          <Loader />
        </View>
      ) : !view.data ? (
        <EmptyState icon="eye-off-outline" body={tr.profile.notVisible} />
      ) : (
        <View testID="district-chat-profile">
          <ProfileHead profile={view.data}>
            {friend ? (
              <FriendActions friend={friend} />
            ) : sent ? (
              <T v="fine" center>
                {tr.venueChat.requestSent}
              </T>
            ) : (
              <Btn
                block
                bar={KIT.size.btnRow}
                testID="district-chat-profile-request"
                icon="invite"
                label={tr.venueChat.sendRequest}
                onPress={() => setConfirming(true)}
              />
            )}
          </ProfileHead>
        </View>
      )}
      <Sheet
        visible={menu}
        onClose={() => setMenu(false)}
        title={view.data?.displayName ?? tr.profile.moreTitle}
      >
        <Menu>
          <MenuItem
            negative
            cap="report"
            label={tr.chat.report}
            onPress={() => {
              setMenu(false);
              setReporting(true);
            }}
          />
        </Menu>
        <Btn block variant="glassy" label={tr.common.cancel} onPress={() => setMenu(false)} />
      </Sheet>
      <Sheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        title={tr.venueChat.requestConfirmTitle}
      >
        <T ink>{tr.venueChat.requestConfirmBody}</T>
        {request.isError ? <Banner tone="danger" body={errorMessage(request.error)} /> : null}
        <View className="gap-2.5">
          <Btn
            block
            label={tr.venueChat.requestConfirm}
            onPress={() => request.mutate()}
            loading={request.isPending}
          />
          <Btn
            block
            variant="glassy"
            label={tr.common.cancel}
            onPress={() => setConfirming(false)}
          />
        </View>
      </Sheet>
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
