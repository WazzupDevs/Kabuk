import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Glass, GlassList, Li, Round, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { PhotoPreview } from '@/components/PhotoPreview';
import { Screen } from '@/components/Screen';
import { useProfile } from '@/features/account/useProfile';
import { useFriends } from '@/features/friends/queries';
import { LivingLook } from '@/features/profile/LivingLook';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { KIT, KIT_TYPE } from '@/theme/auraKit';

// The own profile (docs/arsiv/SPEC_V2.md §5; docs/design/aura → Profil): "Profil" and the settings at the
// top; the two faces side by side, the photo the table sees and the capsule while anonymous; the
// name and age, the bio; "Profili düzenle" and "Kapsülünü süsle"; the nick and the friends in a
// glass list. The capsule and the nick show on the own profile only (rule 4). No badges (the owner's
// call, 27 Ekim; the canvas's 31 has none either); the nick is renewed here, once in 30 days.
export default function ProfileScreen() {
  const { c } = useKit();
  const own = useProfile();
  const publicId = own.data?.public_id;
  const view = useProfileView(publicId);
  const friends = useFriends();
  const loading = useLoaderHold(view.isPending);

  const hasName = !!own.data?.display_name;
  const friendList = friends.data ?? [];
  const [preview, setPreview] = useState(false);

  return (
    <Screen gap={GAP}>
      <View style={ROW}>
        {/* The tab's title as large as the others' ("Mesajlar"; the owner's call, 28 Ekim). */}
        <T v="display" style={KIT_TYPE.displayXl} accessibilityRole="header">
          {tr.tabs.profile}
        </T>
        <Round
          icon="settings"
          side={KIT.size.bell}
          label={tr.settings.title}
          testID="profile-settings"
          onPress={() => router.push('/settings')}
        />
      </View>

      {view.isPending || loading ? (
        <View className="mt-16">
          <EmptyState kind="loading" body={tr.common.loading} />
        </View>
      ) : !view.data ? (
        <EmptyState
          icon="cloud-offline-outline"
          body={errorMessage(view.error)}
          action={{
            label: tr.common.retry,
            onPress: () => void view.refetch(),
            loading: view.isRefetching,
          }}
        />
      ) : (
        <View style={{ gap: GAP }}>
          <View style={{ flexDirection: 'row', gap: KIT.size.rowGap }}>
            {/* The photo opens large; the capsule lives (blinks, looks at the photo, rolls its
                eyes, answers a tap). Editing is the two buttons under the name (the owner's call,
                28 Ekim). */}
            <FaceCard
              label={tr.profile.ownPhoto}
              note={tr.profile.ownPhotoNote}
              onPress={
                view.data.photoUrl && !view.data.photoHidden ? () => setPreview(true) : undefined
              }
              testID="profile-photo"
            >
              <Av
                size="big"
                name={view.data.displayName ?? tr.profile.noName}
                photoUrl={view.data.photoHidden ? null : view.data.photoUrl}
              />
            </FaceCard>
            <FaceCard
              label={tr.profile.ownCapsule}
              note={tr.profile.ownCapsuleNote}
              testID="profile-capsule"
            >
              <Av size="big" name="">
                {view.data.capsuleLook ? (
                  <LivingLook
                    look={view.data.capsuleLook}
                    size={KIT.size.av.big}
                    accessibilityLabel={tr.profile.ownCapsule}
                  />
                ) : null}
              </Av>
            </FaceCard>
          </View>
          <PhotoPreview
            url={view.data.photoHidden ? null : view.data.photoUrl}
            visible={preview}
            onClose={() => setPreview(false)}
          />

          <View style={{ gap: KIT.size.tagGap, paddingHorizontal: KIT.size.secPadX }}>
            <T v="display" style={KIT_TYPE.displaySm} accessibilityRole="header">
              {view.data.displayName
                ? view.data.age
                  ? tr.profile.nameWithAge(view.data.displayName, view.data.age)
                  : view.data.displayName
                : tr.profile.noName}
            </T>
            {view.data.bio ? <T v="bodyLg">{view.data.bio}</T> : null}
          </View>

          <View style={{ flexDirection: 'row', gap: BTN_GAP }}>
            <Btn
              bar={KIT.size.btnRow}
              variant="glassy"
              label={hasName ? tr.profile.edit : tr.profile.addName}
              onPress={() => router.push('/profile/edit')}
              style={{ flex: 1 }}
              block
            />
            <Btn
              bar={KIT.size.btnRow}
              label={tr.capsule.edit}
              onPress={() => router.push('/profile/capsule')}
              style={{ flex: 1 }}
              block
            />
          </View>

          {view.data.photoHidden ? (
            <Glass pad="pad">
              <T v="fine" ink>
                {tr.profile.photoHidden}
              </T>
            </Glass>
          ) : null}

          <GlassList>
            {view.data.capsuleNick ? (
              <NickRow nick={view.data.capsuleNick} refreshAt={view.data.nickRefreshAt ?? null} />
            ) : null}
            <Li
              testID="profile-friends"
              accessibilityLabel={tr.profile.friendsCount(friendList.length)}
              onPress={() => router.push('/profile/friends')}
              padY={KIT.size.profilePadY}
              padX={KIT.size.profilePadX}
            >
              <View style={{ flex: 1 }}>
                <T v="sec">{tr.profile.friends}</T>
                <T v="fineLg">{tr.profile.friendsPeople(friendList.length)}</T>
              </View>
              <View
                style={{ flexDirection: 'row' }}
                importantForAccessibility="no-hide-descendants"
              >
                {friendList.slice(0, STACK).map((f, i) => (
                  <View
                    key={f.publicId}
                    style={{ marginLeft: i === 0 ? 0 : -KIT.size.stackOverlap }}
                  >
                    <Av size="sm" name={f.displayName ?? tr.profile.noName} photoUrl={f.photoUrl} />
                  </View>
                ))}
              </View>
              <CapIcon name="forward" color={c.muted} size={KIT.size.iconSm} />
            </Li>
          </GlassList>
        </View>
      )}
    </Screen>
  );
}

const GAP = 14;
const BTN_GAP = 10;
const STACK = 3;
const ROW = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
};

// One of the two faces: a glass card 210 high, the face in the middle, its name and note under it.
function FaceCard({
  label,
  note,
  onPress,
  testID,
  children,
}: {
  label: string;
  note: string;
  // Without it the card is still and its face takes the taps (the living capsule).
  onPress?: () => void;
  testID?: string;
  children: ReactNode;
}) {
  const card = (pressed: boolean) => (
    <Glass
      style={{
        height: KIT.size.faceCard,
        alignItems: 'center',
        justifyContent: 'center',
        gap: BTN_GAP,
        opacity: pressed ? PRESSED : 1,
      }}
    >
      {children}
      <View style={{ alignItems: 'center' }}>
        <T v="body" strong>
          {label}
        </T>
        <T v="body">{note}</T>
      </View>
    </Glass>
  );
  if (!onPress)
    return (
      <View testID={testID} style={{ flex: 1 }}>
        {card(false)}
      </View>
    );
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${note}`}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      {({ pressed }) => card(pressed)}
    </Pressable>
  );
}
const PRESSED = 0.8;

// The nick and "Yenile" (docs/design/aura → Profil): a new nick once in 30 days (K-9); while it
// waits the button is off and the days left are under the nick.
function NickRow({ nick, refreshAt }: { nick: string; refreshAt: string | null }) {
  const queryClient = useQueryClient();
  const now = useNow(60_000);
  const waitMs = refreshAt ? Date.parse(refreshAt) - now : 0;
  const waiting = waitMs > 0;
  const refresh = useMutation({
    meta: FEEL_ERROR,
    mutationFn: profileApi.refreshNick,
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileViewKeys.all }),
  });
  return (
    <Li padY={KIT.size.profilePadY} padX={KIT.size.profilePadX}>
      <View style={{ flex: 1, gap: NICK_GAP }}>
        <T v="fineLg">{tr.profile.nickLabel}</T>
        <T v="sec" testID="nick">
          {nick}
        </T>
        {waiting ? <T v="fineLg">{tr.profile.nickWait(Math.ceil(waitMs / DAY_MS))}</T> : null}
        {refresh.isError ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(refresh.error)}
          </T>
        ) : null}
      </View>
      <Btn
        sm
        variant="glassy"
        testID="nick-refresh"
        label={tr.profile.nickRenew}
        disabled={waiting}
        loading={refresh.isPending}
        onPress={() => refresh.mutate()}
      />
    </Li>
  );
}
const DAY_MS = 24 * 60 * 60 * 1000;
const NICK_GAP = 1;
