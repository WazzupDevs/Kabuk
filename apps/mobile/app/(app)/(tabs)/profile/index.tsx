import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Glass, Li, Round, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { PhotoPreview } from '@/components/PhotoPreview';
import { Screen } from '@/components/Screen';
import { useProfile } from '@/features/account/useProfile';
import { useFriends } from '@/features/friends/queries';
import { shownAccessories } from '@/features/gifts/model';
import { useGiftState } from '@/features/gifts/queries';
import { LivingLook } from '@/features/profile/LivingLook';
import { lookGround } from '@/theme/capsuleLook';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';
import { ICON, SPACING } from '@/theme/tokens';

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
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < STACK_BELOW || fontScale > STACK_SCALE;

  return (
    <Screen
      gap={0}
      // U32: "Profil" display on a row 44 high, the settings 44 round soft; it stays on top (the
      // owner's report, 2 Kasım, B2).
      top={
        <View style={ROW}>
          <T v="display" accessibilityRole="header">
            {tr.tabs.profile}
          </T>
          <Round
            glassy
            icon="settings"
            side={KIT.size.bell}
            label={tr.settings.title}
            testID="profile-settings"
            onPress={() => router.push('/settings')}
          />
        </View>
      }
    >
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
        <View>
          {/* U32: the two cards 16 under the title, 12 apart. */}
          <View style={{ flexDirection: 'row', gap: CARD_GAP, marginTop: SPACING[4] }}>
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
                size="xl"
                name={view.data.displayName ?? tr.profile.noName}
                photoUrl={view.data.photoHidden ? null : view.data.photoUrl}
              />
            </FaceCard>
            <FaceCard
              label={tr.profile.ownCapsule}
              note={tr.profile.ownCapsuleNote}
              testID="profile-capsule"
            >
              {/* The ring holds the capsule's ground; the capsule stands over it, its head and
                  accessories free above the ring (RingLook; the owner's call, 7 Kasım). */}
              <View>
                <Av size="xl" name="">
                  {view.data.capsuleLook ? (
                    <View
                      style={{
                        alignSelf: 'stretch',
                        flex: 1,
                        backgroundColor: lookGround(view.data.capsuleLook),
                      }}
                    />
                  ) : null}
                </Av>
                {view.data.capsuleLook ? (
                  <View style={{ position: 'absolute', inset: 0 }}>
                    <LivingLook
                      look={view.data.capsuleLook}
                      size={KIT.size.av.xl}
                      inset={KIT.size.avRingXl}
                      ground={false}
                      accessibilityLabel={tr.profile.ownCapsule}
                    />
                  </View>
                ) : null}
              </View>
            </FaceCard>
          </View>
          <PhotoPreview
            url={view.data.photoHidden ? null : view.data.photoUrl}
            visible={preview}
            onClose={() => setPreview(false)}
          />

          {/* U32: the name and age display 20 under the cards, the bio 2 under it in the ink. */}
          <View style={{ gap: SPACING[0.5], marginTop: SPACING[5] }}>
            <T v="display" accessibilityRole="header">
              {view.data.displayName
                ? view.data.age
                  ? tr.profile.nameWithAge(view.data.displayName, view.data.age)
                  : view.data.displayName
                : tr.profile.noName}
            </T>
            {view.data.bio ? (
              <T v="body" ink>
                {view.data.bio}
              </T>
            ) : null}
          </View>

          {/* aura v50 (ProfilDar): side by side at 390 dp; under 360 dp or with larger text one
              under the other, 58 high, so the words never shrink. */}
          <View
            style={{
              flexDirection: stacked ? 'column' : 'row',
              gap: CARD_GAP,
              marginTop: SPACING[4],
            }}
          >
            <Btn
              bar={stacked ? KIT.size.btnTall : KIT.size.btnRow}
              variant="glassy"
              label={hasName ? tr.profile.edit : tr.profile.addName}
              onPress={() => router.push('/profile/edit')}
              style={stacked ? undefined : { flex: 1 }}
              block
            />
            <Btn
              bar={stacked ? KIT.size.btnTall : KIT.size.btnRow}
              label={tr.capsule.edit}
              onPress={() => router.push('/profile/capsule')}
              style={stacked ? undefined : { flex: 1 }}
              block
            />
          </View>

          {view.data.photoHidden ? (
            <Glass pad="pad" style={{ marginTop: SPACING[4] }}>
              <T v="fine" ink>
                {tr.profile.photoHidden}
              </T>
            </Glass>
          ) : null}

          {/* U32: the nick and the friends on one glass sm card 16 under the buttons; a row 72,
              14/16 inside, the hairline 16 in from both sides. */}
          <Glass sm style={{ marginTop: SPACING[4], overflow: 'hidden' }}>
            {view.data.capsuleNick ? (
              <NickRow nick={view.data.capsuleNick} refreshAt={view.data.nickRefreshAt ?? null} />
            ) : null}
            {view.data.capsuleNick ? <Hair /> : null}
            <Li
              testID="profile-friends"
              accessibilityLabel={tr.profile.friendsCount(friendList.length)}
              onPress={() => router.push('/profile/friends')}
              padY={ROW_PAD_Y}
              padX={SPACING[4]}
            >
              <View style={{ flex: 1, gap: SPACING[0.5], minHeight: ROW_INNER }}>
                <T v="h3">{tr.profile.friends}</T>
                <T v="fine">{tr.profile.friendsPeople(friendList.length)}</T>
              </View>
              <View
                style={{ flexDirection: 'row' }}
                importantForAccessibility="no-hide-descendants"
              >
                {friendList.slice(0, STACK).map((f, i) => (
                  <View key={f.publicId} style={{ marginLeft: i === 0 ? 0 : -SPACING[2] }}>
                    <Av size="sm" name={f.displayName ?? tr.profile.noName} photoUrl={f.photoUrl} />
                  </View>
                ))}
              </View>
              <CapIcon name="chevron" color={c.muted} size={ICON.md} />
            </Li>
            <Hair />
            <AccessoriesRow />
          </Glass>
        </View>
      )}
    </Screen>
  );
}

const CARD_GAP = SPACING[3];
// U32: a row of the list 72 high, 14 above and under.
const ROW_PAD_Y = 14;
const ROW_INNER = 72 - 2 * ROW_PAD_Y;
// The two buttons go one under the other under 360 dp or above 1.15x text (aura v50, ProfilDar).
const STACK_BELOW = 360;
const STACK_SCALE = 1.15;
const STACK = 3;
const ROW = {
  height: KIT.size.bell,
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
    // U32: glass sm, 16/12 inside, the face 96, 10 over its name (h3) and note (fine).
    <Glass
      sm
      style={{
        alignItems: 'center',
        paddingVertical: SPACING[4],
        paddingHorizontal: SPACING[3],
        opacity: pressed ? PRESSED : 1,
      }}
    >
      {children}
      <View style={{ alignItems: 'center', gap: SPACING[0.5], marginTop: SPACING[2.5] }}>
        <T v="h3" center>
          {label}
        </T>
        <T v="fine" center>
          {note}
        </T>
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
  const { c } = useKit();
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
    // U32: the nick's block: a fine label, the nick h3, a fine note; "Yenile" btn sm + refresh.
    <Li padY={ROW_PAD_Y} padX={SPACING[4]}>
      <View style={{ flex: 1, gap: SPACING[0.5], minHeight: ROW_INNER }}>
        <T v="fine">{tr.profile.nickLabel}</T>
        <T v="h3" testID="nick">
          {nick}
        </T>
        {waiting ? <T v="fine">{tr.profile.nickWait(Math.ceil(waitMs / DAY_MS))}</T> : null}
        {refresh.isError ? (
          <T v="fine" color={c.warn}>
            {errorMessage(refresh.error)}
          </T>
        ) : null}
      </View>
      <Btn
        sm
        variant="glassy"
        icon="refresh"
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

// Aksesuarlarım's way in (docs/SPEC_V4.md §4.U; GaleriHediye "Profil girişi"): the gift, the name
// and how many of the catalog's accessories are owned.
function AccessoriesRow() {
  const { c } = useKit();
  const gifts = useGiftState();
  const ownedIds = gifts.data ? new Set(gifts.data.owned.map((o) => o.id)) : null;
  const owned = ownedIds?.size;
  return (
    <Li
      testID="profile-accessories"
      onPress={() => router.push('/profile/accessories')}
      padY={ROW_PAD_Y}
      padX={SPACING[4]}
    >
      <CapIcon name="gift" color={c.ink} size={ICON.lg} />
      <View style={{ flex: 1, gap: SPACING[0.5], minHeight: ROW_INNER }}>
        <T v="h3">{tr.gifts.accessories}</T>
        {owned !== undefined ? (
          <T v="fine">
            {tr.gifts.progress(owned, ownedIds ? shownAccessories(ownedIds).length : 0)}
          </T>
        ) : null}
      </View>
      <CapIcon name="chevron" color={c.muted} size={ICON.md} />
    </Li>
  );
}

function Hair() {
  const { c } = useKit();
  return (
    <View
      style={{
        height: KIT.size.hair,
        marginHorizontal: SPACING[4],
        backgroundColor: c.hair,
      }}
    />
  );
}
