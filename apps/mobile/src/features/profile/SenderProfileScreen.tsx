import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import type { ChatProfileView } from '@shared/api/profile.ts';
import { useMutation, type UseQueryResult } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { T, useKit } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { EmptyState } from '@/components/EmptyState';
import { MenuItem } from '@/components/Menu';
import { Screen } from '@/components/Screen';
import { ReportModal } from '@/features/chat/ReportModal';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { useFriends } from '@/features/friends/queries';
import { FriendActions, RequestAction } from '@/features/profile/OtherActions';
import { OtherProfile, OtherProfileLoading } from '@/features/profile/OtherProfile';
import { ProfileFace } from '@/features/profile/ProfileFace';
import { ProfileTopBar } from '@/features/profile/ProfileCard';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { confirm } from '@/lib/overlayStore';
import { KIT_TYPE } from '@/theme/auraKit';
import { REQUEST_SHOWN } from '@/theme/person';
import { SPACING } from '@/theme/tokens';

// The sender of a profiled message or post, opened through it (venue chat, district chat, venue
// feed: docs/SPEC_V4.md §4.V, §4.Y), no public_id. The three routes differ only in the source's
// calls; the screen is this one, drawn as the boards MekanProfil, MekanProfilIstek,
// MekanProfilMenu, SikayetEt and EngelleOnay draw it (the cover page of another person's profile).
// "Arkadaşlık isteği gönder" asks first, because the request shows the other side this account's
// name, age and photo.
export type SenderProfileProps = {
  view: UseQueryResult<ChatProfileView>;
  // Without it there is no request (Odadakiler's row: a request goes through a message).
  sendRequest?: () => Promise<unknown>;
  onRequested?: () => void;
  // Without it (and no mute, no block) there is no "Seçenekler".
  report?: { send: (reason: ReportReason) => Promise<unknown>; onSent?: () => void };
  // Where the source offers it (the venue chat); the feed and the district chat have no block.
  block?: { send: (reason: ReportReason | undefined) => Promise<unknown>; onDone: () => void };
  // "Sessize al": the messages or posts go from the reader's view, so the screen closes.
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

// MekanProfilIstek `.pvl`: what the request shows, as small chips under the sentence.
function ShownChips() {
  const { c } = useKit();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: REQUEST_SHOWN.gap,
        marginTop: REQUEST_SHOWN.up,
        marginBottom: REQUEST_SHOWN.bottom,
      }}
    >
      {tr.venueChat.requestShown.map((label) => (
        <View
          key={label}
          style={{
            height: REQUEST_SHOWN.height,
            paddingHorizontal: REQUEST_SHOWN.padX,
            borderRadius: REQUEST_SHOWN.height / 2,
            backgroundColor: c.infoRow,
            justifyContent: 'center',
          }}
        >
          <T v="tag" ink style={KIT_TYPE.tag}>
            {label}
          </T>
        </View>
      ))}
    </View>
  );
}

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
  const [sent, setSent] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const name = view.data?.displayName ?? null;

  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => (sendRequest ? sendRequest() : Promise.resolve()),
    onSuccess: () => {
      onRequested?.();
      setSent(true);
    },
  });
  // MekanProfilIstek: the person's face, "Ece'ye istek gönderilsin mi?", what it shows, the action
  // and "Vazgeç". A thrown error leaves the dialog open; the Banner under the button keeps the
  // message.
  const ask = () =>
    confirm({
      title: name ? tr.venueChat.requestConfirmNamed(name) : tr.venueChat.requestConfirmTitle,
      note: tr.venueChat.requestShows,
      face: view.data ? (
        <ProfileFace side={REQUEST_SHOWN.face} name={name ?? ''} photoUrl={view.data.photoUrl} />
      ) : undefined,
      tone: 'plain',
      confirmLabel: tr.venueChat.requestConfirm,
      confirmIcon: 'invite',
      cancelLabel: tr.common.cancel,
      children: <ShownChips />,
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

  // YukleniyorProfil (87) while it loads; "not visible" with its back button once it is not there.
  if (view.isPending) return <OtherProfileLoading />;
  if (!view.data) {
    return (
      <Screen top={<ProfileTopBar onBack={() => router.back()} />}>
        <EmptyState icon="eye-off-outline" body={tr.profile.notVisible} />
      </Screen>
    );
  }

  const hasMenu = !!(report || mute || block);
  return (
    <View style={{ flex: 1 }} testID={ids.screen}>
      <OtherProfile
        profile={view.data}
        actions={
          friend ? (
            <FriendActions friend={friend} />
          ) : sent || !sendRequest ? undefined : (
            <RequestAction testID={ids.request} onPress={ask} />
          )
        }
        extras={
          !friend && sent ? (
            <View style={{ marginTop: SPACING[3] }}>
              <T v="fine" center testID={ids.sent}>
                {tr.venueChat.requestSent}
              </T>
            </View>
          ) : !friend && request.isError ? (
            <View style={{ alignSelf: 'stretch', marginTop: SPACING[3] }}>
              <Banner tone="danger" body={errorMessage(request.error)} />
            </View>
          ) : undefined
        }
        // MekanProfilMenu (59): "Sessize al" with what it does, "Şikayet et", "Engelle" red.
        menu={
          hasMenu
            ? (close) => (
                <>
                  {mute ? (
                    <MenuItem
                      cap="mute"
                      label={tr.venueFeed.mute}
                      note={tr.venueChat.muteNote}
                      testID="profile-mute"
                      onPress={() => {
                        close();
                        if (!muteMutation.isPending) muteMutation.mutate();
                      }}
                    />
                  ) : null}
                  {report ? (
                    <MenuItem
                      cap="report"
                      label={tr.safety.report}
                      testID={ids.report}
                      onPress={() => {
                        close();
                        setReporting(true);
                      }}
                    />
                  ) : null}
                  {block ? (
                    <MenuItem
                      negative
                      iconSoft={0.5}
                      cap="block"
                      label={tr.safety.block}
                      testID={ids.block}
                      onPress={() => {
                        close();
                        setBlocking(true);
                      }}
                    />
                  ) : null}
                </>
              )
            : undefined
        }
      />
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting}
        name={name ?? undefined}
        pending={reportMutation.isPending}
        error={reportMutation.error}
        onReport={(reason) => reportMutation.mutate(reason)}
        onClose={() => setReporting(false)}
      />
      {block ? (
        <ConfirmWithReport
          reasons={REPORT_REASONS}
          visible={blocking}
          title={name ? tr.safety.blockNamedTitle(name) : tr.venueChat.blockConfirmTitle}
          hint={tr.venueChat.blockConfirmBody}
          confirmLabel={tr.safety.blockConfirm}
          confirmIcon="block"
          pending={blockMutation.isPending}
          error={blockMutation.error}
          onConfirm={(reason) => blockMutation.mutate(reason)}
          onClose={() => setBlocking(false)}
        />
      ) : null}
    </View>
  );
}
