import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import type { ChatProfileView } from '@shared/api/profile.ts';
import { useMutation, type UseQueryResult } from '@tanstack/react-query';
import { router } from 'expo-router';
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
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { FriendActions } from '@/features/friends/FriendActions';
import { useFriends } from '@/features/friends/queries';
import { ProfileHead, ProfileTopBar } from '@/features/profile/ProfileCard';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { confirm } from '@/lib/overlayStore';

// The sender of a profiled message or post, opened through it (venue chat, district chat, venue
// feed: docs/SPEC_V4.md §4.V, §4.Y), no public_id. The three routes differ only in the source's
// calls; the screen is this one. "İstek gönder" asks first, because the request shows the other
// side this account's name, age and photo.
export type SenderProfileProps = {
  view: UseQueryResult<ChatProfileView>;
  // Without it there is no request (Odadakiler's row: a request goes through a message).
  sendRequest?: () => Promise<unknown>;
  onRequested?: () => void;
  // Without it (and no mute, no block) there is no "Seçenekler".
  report?: { send: (reason: ReportReason) => Promise<unknown>; onSent?: () => void };
  // Where the source offers it (the venue chat); the feed and the district chat have no block.
  block?: { send: (reason: ReportReason | undefined) => Promise<unknown>; onDone: () => void };
  // The feed's "Sessize al": the post goes from the reader's view, so the screen closes.
  mute?: { send: () => Promise<unknown>; onDone: () => void };
  ids: {
    screen: string;
    request?: string;
    confirm?: string;
    sent?: string;
    report?: string;
    block?: string;
  };
};

export function SenderProfileScreen({
  view,
  sendRequest,
  onRequested,
  report,
  block,
  mute,
  ids,
}: SenderProfileProps) {
  // A friend: "Arkadaşsınız" and the DM, not a request (the owner's report, 29 Ekim).
  const friends = useFriends();
  const friendId = view.data?.friendPublicId;
  const friend = friendId ? friends.data?.find((f) => f.publicId === friendId) : undefined;
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => (sendRequest ? sendRequest() : Promise.resolve()),
    onSuccess: () => {
      onRequested?.();
      setSent(true);
    },
  });
  // A thrown error leaves the dialog open; the Banner under the button keeps the message.
  const ask = () =>
    confirm({
      title: tr.venueChat.requestConfirmTitle,
      note: tr.venueChat.requestConfirmBody,
      icon: 'invite',
      tone: 'plain',
      confirmLabel: tr.venueChat.requestConfirm,
      cancelLabel: tr.common.cancel,
      testID: ids.confirm,
      onConfirm: async () => {
        await request.mutateAsync();
      },
    });
  const reportMutation = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason) => (report ? report.send(reason) : Promise.resolve()),
    onSuccess: () => {
      report?.onSent?.();
      setReporting(false);
      Alert.alert(tr.safety.reportSent);
    },
  });
  const blockMutation = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason | undefined) =>
      block ? block.send(reason) : Promise.resolve(),
    onSuccess: () => {
      block?.onDone();
      setBlocking(false);
    },
  });
  const muteMutation = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => (mute ? mute.send() : Promise.resolve()),
    onSuccess: () => mute?.onDone(),
  });

  return (
    <Screen
      footer={<Btn block variant="glassy" label={tr.profile.back} onPress={() => router.back()} />}
      top={
        // Like a friend's profile: the round back and "Seçenekler" on top, the profile's head,
        // the request under it.
        <ProfileTopBar
          onBack={() => router.back()}
          onMore={view.data && (report || mute || block) ? () => setMenu(true) : undefined}
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
        <View testID={ids.screen}>
          <ProfileHead profile={view.data}>
            {friend ? (
              <FriendActions friend={friend} />
            ) : sent ? (
              <T v="fine" center testID={ids.sent}>
                {tr.venueChat.requestSent}
              </T>
            ) : !sendRequest ? null : (
              <>
                {request.isError ? (
                  <Banner tone="danger" body={errorMessage(request.error)} />
                ) : null}
                <Btn
                  block
                  testID={ids.request}
                  icon="invite"
                  label={tr.venueChat.sendRequest}
                  onPress={ask}
                />
              </>
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
          {mute ? (
            <MenuItem
              cap="mute"
              label={tr.venueFeed.mute}
              onPress={() => {
                setMenu(false);
                if (!muteMutation.isPending) muteMutation.mutate();
              }}
            />
          ) : null}
          {report ? (
            <MenuItem
              negative
              cap="report"
              label={tr.chat.report}
              testID={ids.report}
              onPress={() => {
                setMenu(false);
                setReporting(true);
              }}
            />
          ) : null}
          {block ? (
            <MenuItem
              negative
              cap="block"
              label={tr.safety.block}
              testID={ids.block}
              onPress={() => {
                setMenu(false);
                setBlocking(true);
              }}
            />
          ) : null}
        </Menu>
        <Btn block variant="glassy" label={tr.common.cancel} onPress={() => setMenu(false)} />
      </Sheet>
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting}
        pending={reportMutation.isPending}
        error={reportMutation.error}
        onReport={(reason) => reportMutation.mutate(reason)}
        onClose={() => setReporting(false)}
      />
      {block ? (
        <ConfirmWithReport
          reasons={REPORT_REASONS}
          visible={blocking}
          title={
            view.data?.displayName
              ? tr.safety.blockNamedTitle(view.data.displayName)
              : tr.venueChat.blockConfirmTitle
          }
          hint={tr.venueChat.blockConfirmBody}
          confirmLabel={tr.safety.blockConfirm}
          confirmIcon="block"
          pending={blockMutation.isPending}
          error={blockMutation.error}
          onConfirm={(reason) => blockMutation.mutate(reason)}
          onClose={() => setBlocking(false)}
        />
      ) : null}
    </Screen>
  );
}
