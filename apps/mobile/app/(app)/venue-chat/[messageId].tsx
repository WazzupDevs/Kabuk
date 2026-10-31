import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Menu, MenuItem } from '@/components/Menu';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { ReportModal } from '@/features/chat/ReportModal';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { FriendActions } from '@/features/friends/FriendActions';
import { friendKeys, useFriends } from '@/features/friends/queries';
import { ProfileHead, ProfileTopBar } from '@/features/profile/ProfileCard';
import { useVenueChatProfile } from '@/features/venueChat/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';

// The sender of a profiled venue chat message, opened through the message (docs/SPEC_V3.md §7.5):
// no public_id. "Arkadaşlık isteği gönder" asks first, because the request shows the other side
// this account's name, age and photo.
export default function VenueChatProfileScreen() {
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const view = useVenueChatProfile(messageId);
  // A friend: "Arkadaşsınız" and the DM, not a request (the owner's report, 29 Ekim).
  const friends = useFriends();
  const friendId = view.data?.friendPublicId;
  const friend = friendId ? friends.data?.find((f) => f.publicId === friendId) : undefined;
  const [confirming, setConfirming] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => friendsApi.requestFromVenueChat(messageId),
    onSuccess: () => {
      track('friend_request_sent', { source: 'venue_chat' });
      setConfirming(false);
      setSent(true);
    },
  });
  const queryClient = useQueryClient();
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason) => safetyApi.reportVenueChat(messageId, reason),
    onSuccess: () => {
      track('venue_chat_reported', {});
      setReporting(false);
      Alert.alert(tr.safety.reportSent);
    },
  });
  const block = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason | undefined) => safetyApi.blockVenueChat(messageId, reason),
    onSuccess: () => {
      track('block_created', {});
      // The blocked person's messages go from the chat, and a friend from the lists (audit CHAT-5).
      void queryClient.invalidateQueries({ queryKey: ['venueChat'] });
      void queryClient.invalidateQueries({ queryKey: friendKeys.all });
      setBlocking(false);
      router.back();
    },
  });

  return (
    <Screen>
      {/* Like a friend's profile (the owner's call, 27 Ekim; skall tuvali, ProfilYabanci): the
          round back and "Seçenekler" on top, the profile's head, the request under it. */}
      <ProfileTopBar
        onBack={() => router.back()}
        onMore={view.data ? () => setMenu(true) : undefined}
      />
      {view.isPending ? (
        <View className="mt-16 items-center">
          <Loader />
        </View>
      ) : !view.data ? (
        <EmptyState icon="eye-off-outline" body={tr.profile.notVisible} />
      ) : (
        <View testID="venue-chat-profile">
          <ProfileHead profile={view.data}>
            {friend ? (
              <FriendActions friend={friend} />
            ) : sent ? (
              <T v="fine" center testID="venue-chat-request-sent">
                {tr.venueChat.requestSent}
              </T>
            ) : (
              <Btn
                block
                bar={KIT.size.btnRow}
                testID="venue-chat-request"
                icon="invite"
                label={tr.venueChat.sendRequest}
                onPress={() => setConfirming(true)}
              />
            )}
          </ProfileHead>
        </View>
      )}
      {!view.isPending && !view.data ? (
        <View className="mt-auto pt-8">
          <Btn block bar={KIT.size.btnRow} label={tr.profile.back} onPress={() => router.back()} />
        </View>
      ) : null}
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
            testID="profile-report"
            onPress={() => {
              setMenu(false);
              setReporting(true);
            }}
          />
          <MenuItem
            negative
            cap="block"
            label={tr.safety.block}
            testID="profile-block"
            onPress={() => {
              setMenu(false);
              setBlocking(true);
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
      <Sheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        title={tr.venueChat.requestConfirmTitle}
        icon="person-add-outline"
      >
        <Text>{tr.venueChat.requestConfirmBody}</Text>
        {request.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(request.error)}
          </Text>
        ) : null}
        <Button
          testID="venue-chat-request-confirm"
          label={tr.venueChat.requestConfirm}
          onPress={() => request.mutate()}
          loading={request.isPending}
        />
      </Sheet>
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => report.mutate(reason)}
        onClose={() => setReporting(false)}
      />
      <ConfirmWithReport
        reasons={REPORT_REASONS}
        visible={blocking}
        title={tr.venueChat.blockConfirmTitle}
        hint={tr.venueChat.blockConfirmBody}
        confirmLabel={tr.safety.blockConfirm}
        pending={block.isPending}
        error={block.error}
        onConfirm={(reason) => block.mutate(reason)}
        onClose={() => setBlocking(false)}
      />
    </Screen>
  );
}
