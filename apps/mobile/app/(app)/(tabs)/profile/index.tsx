import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Glass, GlassList, Li, Round, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { LookAvatar } from '@/components/LookAvatar';
import { Screen } from '@/components/Screen';
import { useProfile } from '@/features/account/useProfile';
import { useFriends } from '@/features/friends/queries';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { KIT, KIT_TYPE } from '@/theme/auraKit';

// The own profile (docs/SPEC_V2.md §5; docs/design/aura → Profil): "Profil" and the settings at the
// top; the two faces side by side, the photo the table sees and the capsule while anonymous; the
// name and age, the bio; "Profili düzenle" and "Kapsülünü süsle"; the nick and the friends in a
// glass list. The capsule and the nick show on the own profile only (rule 4). No badges (the owner's
// call, 27 Ekim); the nick is renewed in Ayarlar.
export default function ProfileScreen() {
  const { c } = useKit();
  const own = useProfile();
  const publicId = own.data?.public_id;
  const view = useProfileView(publicId);
  const friends = useFriends();
  const loading = useLoaderHold(view.isPending);

  const hasName = !!own.data?.display_name;
  const friendList = friends.data ?? [];

  return (
    <Screen gap={GAP}>
      <View style={ROW}>
        <T v="eyebrow" accessibilityRole="header">
          {tr.tabs.profile}
        </T>
        <Round
          icon="settings"
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
            <FaceCard
              label={tr.profile.ownPhoto}
              note={tr.profile.ownPhotoNote}
              onPress={() => router.push('/profile/edit')}
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
              onPress={() => router.push('/profile/capsule')}
              testID="profile-capsule"
            >
              <Av size="big" name="">
                {view.data.capsuleLook ? (
                  <LookAvatar look={view.data.capsuleLook} size={KIT.size.av.big} />
                ) : null}
              </Av>
            </FaceCard>
          </View>

          <View style={{ gap: KIT.size.tagGap, paddingHorizontal: KIT.size.secPadX }}>
            <T v="display" style={KIT_TYPE.displaySm} accessibilityRole="header">
              {view.data.displayName
                ? view.data.age
                  ? tr.profile.nameWithAge(view.data.displayName, view.data.age)
                  : view.data.displayName
                : tr.profile.noName}
            </T>
            {view.data.bio ? <T v="body">{view.data.bio}</T> : null}
          </View>

          <View style={{ flexDirection: 'row', gap: BTN_GAP }}>
            <Btn
              sm
              variant="glassy"
              label={hasName ? tr.profile.edit : tr.profile.addName}
              onPress={() => router.push('/profile/edit')}
              style={{ flex: 1 }}
              block
            />
            <Btn
              sm
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
            >
              <View style={{ flex: 1 }}>
                <T v="h3">{tr.profile.friends}</T>
                <T v="fine">{tr.profile.friendsPeople(friendList.length)}</T>
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

// One of the two faces: a glass card 196 high, the face in the middle, its name and note under it.
function FaceCard({
  label,
  note,
  onPress,
  testID,
  children,
}: {
  label: string;
  note: string;
  onPress: () => void;
  testID?: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${note}`}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? PRESSED : 1 })}
    >
      <Glass
        style={{
          height: KIT.size.faceCard,
          alignItems: 'center',
          justifyContent: 'center',
          gap: BTN_GAP,
        }}
      >
        {children}
        <View style={{ alignItems: 'center' }}>
          <T v="fine" strong>
            {label}
          </T>
          <T v="fine">{note}</T>
        </View>
      </Glass>
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
    <Li>
      <View style={{ flex: 1 }}>
        <T v="fine">{tr.profile.nickLabel}</T>
        <T v="h3" testID="nick">
          {nick}
        </T>
        {waiting ? <T v="fine">{tr.profile.nickWait(Math.ceil(waitMs / DAY_MS))}</T> : null}
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
