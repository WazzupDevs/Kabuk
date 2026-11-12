import { containsContact } from '@shared/profanity.ts';
import {
  BIO_MAX,
  COVER_HEIGHT_PX,
  COVER_WIDTH_PX,
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
} from '@shared/profile.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, Linking, useWindowDimensions, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Glass, Li, RowList, T, useKit } from '@/aura/kit';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { measureMenuAnchor, Menu, MenuItem } from '@/components/Menu';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { useHideTabBar } from '@/components/TabBar';
import { useProfile } from '@/features/account/useProfile';
import { PhotoSheet, photoErrorMessage } from '@/features/profile/PhotoSheet';
import { chooseCover, PhotoError } from '@/features/profile/photo';
import { ProfileCover } from '@/features/profile/ProfileCover';
import { RingedFace } from '@/features/profile/ProfileFace';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useAskBeforeLeaving } from '@/lib/leaveGuard';
import { maxLengthFor } from '@/lib/textLimit';
import { type MenuAnchor, Tap } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { PROFILE_PAGE } from '@/theme/profileCover';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

// The photo, the cover, the display name and the bio (docs/arsiv/SPEC_V2.md §5.1; docs/design/
// iskelet.md → 5.8): the `sayfa` bar with the back button and Kaydet (clear, its words quiet with
// nothing to save, green and 800 with something, "Kaydedildi" once saved, its width kept), the cover
// and the photo in one preview, the fields' card with their counts, the birth date's row. Length is
// checked here; the profile function checks length and profanity again. The birth date cannot
// change (rule 11).
export default function EditProfileScreen() {
  // Editing, the tab bar is out of sight (the owner's call, 2 Kasım, 11.5, 12.2).
  useHideTabBar();
  const own = useProfile();
  if (own.isPending || !own.data) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }
  return (
    <EditForm
      publicId={own.data.public_id}
      initialName={own.data.display_name ?? ''}
      initialBio={own.data.bio ?? ''}
    />
  );
}

// The cover and the photo in one preview, as on the profile (iskelet.md → 5.8): the cover with the
// clear "Kapak" button over it, opening Değiştir and Kaldır (the kit's menu, 3.5); the photo in its
// white ring over the cover's foot with a clear camera round at its corner (the written "Fotoğrafı
// değiştir" went, the owner's call, 2 Kasım, 12.5). Both need a saved name first (the server
// refuses them otherwise).
function PreviewEditor({ publicId, hasName }: { publicId: string; hasName: boolean }) {
  const { scheme } = useKit();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const view = useProfileView(publicId);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [coverMenu, setCoverMenu] = useState(false);
  const coverRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const hasPhoto = !!view.data?.photoUrl || view.data?.photoHidden === true;
  const label = hasPhoto ? tr.profile.photoChange : tr.profile.photoAdd;
  const coverUrl = view.data?.coverUrl ?? null;
  const refresh = () => queryClient.invalidateQueries({ queryKey: profileViewKeys.all });
  const setCover = useMutation({
    meta: FEEL_ERROR,
    mutationFn: chooseCover,
    onSettled: refresh,
  });
  const removeCover = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => profileApi.coverRemove(),
    onSettled: refresh,
  });
  const busy = setCover.isPending || removeCover.isPending;
  const failed = setCover.isError ? setCover.error : removeCover.isError ? removeCover.error : null;
  const openCoverMenu = () =>
    measureMenuAnchor(coverRef.current, (at) => {
      setAnchor(at);
      setCoverMenu(true);
    });
  const camera = KIT.button[scheme].clear;
  const coverHeight = ((width - 2 * KIT.size.side) * COVER_HEIGHT_PX) / COVER_WIDTH_PX;

  return (
    <View style={{ gap: SPACING[3] }}>
      <View>
        <ProfileCover
          url={coverUrl}
          height={coverHeight}
          radius={KIT.size.glassRadiusSm}
          accessibilityLabel={tr.profile.cover}
        />
        <View
          ref={coverRef}
          collapsable={false}
          style={{ position: 'absolute', top: SPACING[3], right: SPACING[3] }}
        >
          <Btn
            sm
            variant="glassy"
            icon="photo"
            testID="cover-menu"
            label={tr.profile.cover}
            disabled={!hasName}
            loading={busy}
            onPress={openCoverMenu}
          />
        </View>
        <View style={{ alignItems: 'center', marginTop: -PROFILE_PAGE.face / 2 }}>
          <Tap
            accessibilityLabel={label}
            accessibilityState={{ disabled: !hasName }}
            disabled={!hasName}
            onPress={() => setPhotoMenu(true)}
          >
            <RingedFace
              name={view.data?.displayName ?? ''}
              photoUrl={view.data?.photoUrl ?? null}
            />
            <View
              style={[
                {
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: CAMERA,
                  height: CAMERA,
                  borderRadius: CAMERA / 2,
                  borderWidth: KIT.size.edge,
                  borderColor: camera.edge,
                  boxShadow: camera.shadow || undefined,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                gradientStyle(camera.solid),
              ]}
            >
              <CapIcon name="camera" color={colors.accent} second={camera.ink} size={ICON.md} />
            </View>
          </Tap>
        </View>
      </View>
      {!hasName ? (
        <T v="fine" center>
          {tr.profile.photoNeedsName}
        </T>
      ) : null}
      {!coverUrl && view.data && hasName ? (
        <T v="fine" center>
          {tr.profile.coverDefault}
        </T>
      ) : null}
      {view.isError ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(view.error)}
        </T>
      ) : null}
      {failed ? (
        <View style={{ gap: SPACING[2] }}>
          <T v="fine" color={KIT.danger}>
            {photoErrorMessage(failed)}
          </T>
          {failed instanceof PhotoError && failed.reason === 'permission' ? (
            <Btn
              sm
              variant="glassy"
              label={tr.checkin.openSettings}
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
        </View>
      ) : null}

      {anchor ? (
        // iskelet.md → 3.5: grown out of "Kapak", no "Vazgeç", Kaldır red at the foot apart.
        <Menu anchor={anchor} visible={coverMenu} onClose={() => setCoverMenu(false)}>
          <MenuItem
            cap="photo"
            label={tr.profile.coverChange}
            testID="cover-change"
            onPress={() => {
              setCoverMenu(false);
              if (!busy) setCover.mutate();
            }}
          />
          {coverUrl ? (
            <MenuItem
              negative
              cap="trash"
              label={tr.profile.coverRemove}
              testID="cover-remove"
              onPress={() => {
                setCoverMenu(false);
                if (!busy) removeCover.mutate();
              }}
            />
          ) : null}
        </Menu>
      ) : null}
      <PhotoSheet visible={photoMenu} onClose={() => setPhotoMenu(false)} canRemove={hasPhoto} />
    </View>
  );
}
// The camera round at the photo's corner (36, iskelet.md → 2.1: a small one in a line).
const CAMERA = KIT.size.btnSm;

function EditForm({
  publicId,
  initialName,
  initialBio,
}: {
  publicId: string;
  initialName: string;
  initialBio: string;
}) {
  const { c } = useKit();
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);

  const nameLength = [...name.trim()].length;
  const nameChanged = name.trim() !== initialName;
  const bioChanged = bio.trim() !== initialBio;
  // K-34: no phone, e-mail, username or link; the server checks the same. A bio from before the
  // 80 limit stays until it is edited.
  const nameContact = nameChanged && containsContact(name);
  const bioContact = bioChanged && containsContact(bio);
  const nameValid =
    nameLength >= DISPLAY_NAME_MIN && nameLength <= DISPLAY_NAME_MAX && !nameContact;
  // An edited bio from before the limit that is still too long says so (Kaydet does not save it).
  const bioTooLong = bioChanged && [...bio.trim()].length > BIO_MAX;
  const bioValid = !bioChanged || (!bioTooLong && !bioContact);
  const bioLimit = Math.max(BIO_MAX, [...initialBio].length);
  const bioError = bioContact
    ? tr.errors.contact_not_allowed
    : bioTooLong
      ? tr.profile.bioTooLong(BIO_MAX)
      : null;

  const save = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () =>
      profileApi.update({
        ...(nameChanged ? { displayName: name } : {}),
        ...(bioChanged ? { bio } : {}),
      }),
    onSuccess: async () => {
      if (bioChanged && bio.trim() !== '') track('profile_bio_set', {});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: profileViewKeys.all }),
      ]);
      router.back();
    },
  });

  // skall tuvali (ProfilDuzenleCikis): leaving with changes asks first, back key too.
  const [leaving, setLeaving] = useState(false);
  // Kaydet (or "Kaydet ve çık") with a name that does not pass: the name's error shows.
  const [tried, setTried] = useState(false);
  const changed = (nameChanged || bioChanged) && !save.isSuccess;
  const dirty = changed;
  const leave = useCallback(() => (dirty ? setLeaving(true) : router.back()), [dirty]);
  const askToLeave = useCallback(() => setLeaving(true), []);
  useAskBeforeLeaving(dirty, askToLeave);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!dirty) return false;
        setLeaving(true);
        return true;
      });
      return () => sub.remove();
    }, [dirty]),
  );
  // Nothing to save: Kaydet stays quiet and does nothing; a field that does not pass says so.
  const onSave = () => {
    if (!changed || save.isPending) return;
    if (!nameValid || !bioValid) {
      setTried(true);
      return;
    }
    save.mutate();
  };

  return (
    <Screen
      gap={0}
      // iskelet.md → 3.1 (`sayfa`) and 2.1: the back button and Kaydet on the bar, both clear
      // glass; the bar stays while the page scrolls (the owner's report, 2 Kasım, 12.1).
      top={
        <PageTop
          title={tr.profile.editTitle}
          onBack={leave}
          trailing={
            <Btn
              variant="glassy"
              bar={KIT.size.topBtn}
              testID="profile-save"
              label={save.isSuccess ? tr.profile.savedShort : tr.profile.save}
              tint={changed || save.isSuccess ? KIT.primary : KIT.saveIdle}
              strong={changed || save.isSuccess}
              loading={save.isPending}
              onPress={onSave}
              style={{ minWidth: KIT.saveMinWidth }}
            />
          }
        />
      }
    >
      {save.isError ? (
        <T v="fine" color={c.warn}>
          {errorMessage(save.error)}
        </T>
      ) : null}
      <View style={{ marginTop: SPACING[3] }}>
        <PreviewEditor publicId={publicId} hasName={initialName !== ''} />
      </View>
      {/* U34: the fields on one glass sm card 20 under the preview, 16 inside; a field's label,
          the field and its note 8 apart, the groups 12 more. Their counts under them; focused,
          the green ring (iskelet.md → 5.8). */}
      <Glass sm style={{ marginTop: SPACING[5], padding: SPACING[4], gap: SPACING[5] }}>
        <Input
          large
          boxed
          halo
          testID="name-input"
          label={tr.profile.nameLabel}
          hint={tr.profile.nameHint}
          counter={tr.profile.fieldCount(nameLength, DISPLAY_NAME_MAX)}
          value={name}
          onChangeText={setName}
          error={
            nameContact
              ? tr.errors.contact_not_allowed
              : tried && !nameValid
                ? tr.errors.display_name_invalid
                : null
          }
          maxLength={maxLengthFor(name, DISPLAY_NAME_MAX)}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <Input
          large
          boxed
          halo
          label={tr.profile.bioLabel}
          counter={tr.profile.bioHint([...bio].length, BIO_MAX)}
          value={bio}
          onChangeText={setBio}
          error={bioError}
          maxLength={maxLengthFor(bio, bioLimit)}
          multiline
          tall
        />
      </Glass>
      {/* The birth date as a settings row (iskelet.md → 5.8, 2.4): the lock on its square and
          "Değiştirilemez" (rule 11: it cannot change in the app). */}
      <View style={{ marginTop: SPACING[4], gap: SPACING[2] }}>
        <RowList inset={KIT.rowIcon.side + KIT.size.liGap}>
          <Li padY={KIT.size.lrPadY} minHeight={KIT.size.lrMin}>
            <View
              style={{
                width: KIT.rowIcon.side,
                height: KIT.rowIcon.side,
                borderRadius: KIT.rowIcon.radius,
                backgroundColor: KIT.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CapIcon name="lock" color={KIT.white} size={ICON.sm} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="h3">{tr.profile.birthDate}</T>
            </View>
            <T v="fine">{tr.profile.unchangeable}</T>
          </Li>
        </RowList>
        <T v="fine">{tr.profile.birthDateNote}</T>
      </View>

      {/* One pattern with Kapsülün's: "Kaydet ve çık" tries to save; a save that cannot go through
      closes the sheet and the error shows on the screen, so the page is not left. */}
      <Sheet
        visible={leaving}
        onClose={() => {
          if (!save.isPending) setLeaving(false);
        }}
        title={tr.profile.leaveTitle}
      >
        <T v="fine">{tr.profile.leaveBody}</T>
        <Btn
          block
          label={tr.profile.saveAndLeave}
          loading={save.isPending}
          onPress={() => {
            if (!nameValid || !bioValid) {
              setTried(true);
              setLeaving(false);
              return;
            }
            save.mutate(undefined, { onError: () => setLeaving(false) });
          }}
        />
        <Btn
          block
          variant="glassy"
          label={tr.profile.leaveConfirm}
          onPress={() => {
            setLeaving(false);
            router.back();
          }}
        />
      </Sheet>
    </Screen>
  );
}
