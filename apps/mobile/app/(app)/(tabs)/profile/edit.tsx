import { LEGAL_ENTITY } from '@shared/legalEntity.ts';
import { containsContact } from '@shared/profanity.ts';
import { BIO_MAX, DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '@shared/profile.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, Linking, Text as RNText, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { Field } from '@/components/Field';
import { MenuItem, openMenu } from '@/components/Menu';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
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
import { confirm } from '@/lib/overlayStore';
import { maxLengthFor } from '@/lib/textLimit';
import { Tap } from '@/motion';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { PROFILE_EDIT } from '@/theme/profileEdit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { EmptyState } from '@/components/EmptyState';

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
        <View className="flex-1">
          <EmptyState kind="loading" body={tr.common.loading} />
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
  const queryClient = useQueryClient();
  const view = useProfileView(publicId);
  const [photoMenu, setPhotoMenu] = useState(false);
  const coverRef = useRef<View>(null);
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
  // iskelet.md → 3.5: grown out of "Kapak", no "Vazgeç", Kaldır red at the foot apart; in the
  // app's layer, not this screen's state (CLAUDE.md → Çizim bütçesi).
  const openCoverMenu = () =>
    openMenu(
      coverRef.current,
      <>
        <MenuItem
          cap="photo"
          label={tr.profile.coverChange}
          testID="cover-change"
          onPress={() => {
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
              if (!busy) removeCover.mutate();
            }}
          />
        ) : null}
      </>,
    );
  const { colors } = useTheme();
  const E = PROFILE_EDIT;
  const look = E[scheme];
  const round = KIT.size.round;

  // tuval ProfilDuzenle `.ecov`, `.eav`: the cover 150 high, "Kapağı değiştir" on its dark glass at
  // its top right; the photo 104 in its ring of the page's ground, half over the cover's foot,
  // centred, the camera round at its corner.
  return (
    <View style={{ gap: SPACING[3] }}>
      <View style={{ height: E.cover + E.face / 2 }}>
        <ProfileCover
          url={coverUrl}
          height={E.cover}
          radius={E.coverRadius}
          accessibilityLabel={tr.profile.cover}
        />
        <View
          ref={coverRef}
          collapsable={false}
          style={{ position: 'absolute', top: E.coverBtn.inset, right: E.coverBtn.inset }}
        >
          <Btn
            sm
            icon="camera"
            testID="cover-menu"
            label={tr.profile.coverChange}
            fill={look.coverBtnFill}
            tint={look.coverBtnInk}
            look={{
              type: 'coverBtn',
              padLeft: E.coverBtn.padLeft,
              padRight: E.coverBtn.padRight,
              gap: E.coverBtn.gap,
              icon: E.coverBtn.icon,
            }}
            disabled={!hasName}
            loading={busy}
            onPress={openCoverMenu}
          />
        </View>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: E.cover - E.face / 2,
            alignItems: 'center',
          }}
        >
          <Tap
            accessibilityLabel={label}
            accessibilityState={{ disabled: !hasName }}
            disabled={!hasName}
            onPress={() => setPhotoMenu(true)}
          >
            <RingedFace
              name={view.data?.displayName ?? ''}
              photoUrl={view.data?.photoUrl ?? null}
              side={E.face}
              ring={E.faceRing}
              ringColor={colors.canvas}
            />
            <View
              style={{
                position: 'absolute',
                right: E.camera.right,
                bottom: E.camera.bottom,
                width: round,
                height: round,
                borderRadius: round / 2,
                borderWidth: E.camera.ring,
                borderColor: colors.canvas,
                backgroundColor: look.cameraFill,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CapIcon
                name="camera"
                color={look.cameraInk}
                soft={E.camera.soft}
                size={E.camera.icon}
              />
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

      <PhotoSheet visible={photoMenu} onClose={() => setPhotoMenu(false)} canRemove={hasPhoto} />
    </View>
  );
}

// The contact address, as on Hesap (settings-account.tsx); a blank that keeps a line's height.
const contactEmail = process.env.EXPO_PUBLIC_CONTACT_EMAIL?.trim() || LEGAL_ENTITY.contactEmail;
const NBSP = '\u00A0';

function EditForm({
  publicId,
  initialName,
  initialBio,
}: {
  publicId: string;
  initialName: string;
  initialBio: string;
}) {
  const { c, scheme } = useKit();
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
  // Kaydet (or "Kaydet ve çık") with a name that does not pass: the name's error shows.
  const [tried, setTried] = useState(false);
  const changed = (nameChanged || bioChanged) && !save.isSuccess;
  const dirty = changed;
  // "Kaydet ve çık" tries to save; a save that cannot go through keeps the dialog open with its
  // error, so the page is not left. A name or a biography that does not pass closes it and says so
  // on its field. "Kaydetmeden çık" is the dialog's third way, under the action (SusleCikis).
  const askToLeave = useCallback(() => {
    confirm({
      title: tr.profile.leaveTitle,
      note: tr.profile.leaveBody,
      tone: 'plain',
      confirmLabel: tr.profile.saveAndLeave,
      cancelLabel: tr.common.cancel,
      testID: 'profile-edit-leave-save',
      onConfirm: async () => {
        if (!nameValid || !bioValid) {
          setTried(true);
          return;
        }
        await save.mutateAsync();
      },
      other: {
        label: tr.profile.leaveConfirm,
        tone: 'danger',
        testID: 'profile-edit-leave-discard',
        onPress: () => router.back(),
      },
    });
  }, [nameValid, bioValid, save]);
  const leave = () => (dirty ? askToLeave() : router.back());
  useAskBeforeLeaving(dirty, askToLeave);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!dirty) return false;
        askToLeave();
        return true;
      });
      return () => sub.remove();
    }, [dirty, askToLeave]),
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

  const E = PROFILE_EDIT;
  const look = E[scheme];
  const birthDate = useProfileView(publicId).data?.birthDate ?? null;
  const birthText = birthDate ? tr.profile.birthDateLong(birthDate) : null;
  return (
    <Screen
      gap={0}
      side={E.side}
      barSide={E.side}
      padTop={E.coverTop}
      // tuval ProfilDuzenle `.ptb`: the back button, the title beside it and Kaydet on one 48 row;
      // Kaydet solid, flat and quiet with nothing to save (ProfilDuzenleYaz: dark with something).
      top={
        <PageTop
          title={tr.profile.editTitle}
          onBack={leave}
          inline={{ row: E.bar.row, back: KIT.size.round, gap: E.bar.gap }}
          trailing={
            <Btn
              bar
              testID="profile-save"
              label={save.isSuccess ? tr.profile.savedShort : tr.profile.save}
              disabled={!changed && !save.isPending && !save.isSuccess}
              loading={save.isPending}
              onPress={onSave}
              style={{ minWidth: KIT.saveMinWidth }}
            />
          }
        />
      }
    >
      {save.isError ? (
        <T v="fine" color={c.warn} style={{ marginBottom: SPACING[3] }}>
          {errorMessage(save.error)}
        </T>
      ) : null}
      <PreviewEditor publicId={publicId} hasName={initialName !== ''} />
      {/* tuval ProfilDuzenle `.fl`, `.fi`, `.fh`: the fields on the page's ground, each its label
          with its count over it and its note under it, 20 apart. */}
      <View style={{ marginTop: E.fieldTop }}>
        <Field
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
      </View>
      <View style={{ marginTop: E.fieldTop }}>
        <Field
          label={tr.profile.bioLabel}
          counter={tr.profile.bioHint([...bio].length, BIO_MAX)}
          value={bio}
          onChangeText={setBio}
          error={bioError}
          maxLength={maxLengthFor(bio, bioLimit)}
          multiline
          tall
        />
      </View>
      {/* `.fi.ro`: the birth date locked, on no fill, the lock at its right (rule 11: it cannot
          change in the app); under it the note and the contact link. */}
      <View style={{ marginTop: E.fieldTop, gap: SPACING[2] }}>
        <T v="sectionHead" color={c.muted} style={{ paddingHorizontal: E.field.labelIn }}>
          {tr.profile.birthDate}
        </T>
        <View
          accessible
          accessibilityLabel={
            birthText ? `${tr.profile.birthDate}, ${birthText}` : tr.profile.birthDate
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING[2.5],
            minHeight: KIT.size.field,
            borderRadius: E.field.radius,
            borderWidth: E.field.edge,
            borderColor: look.fieldEdge,
            paddingHorizontal: E.field.padX,
          }}
        >
          <T v="boxField" color={c.muted} style={{ flex: 1 }}>
            {birthText ?? NBSP}
          </T>
          <CapIcon name="lock" color={c.muted} soft={1} size={E.lock} />
        </View>
        <T v="boxNote" color={look.note} style={{ paddingHorizontal: E.field.labelIn }}>
          {tr.profile.birthDateNote}
          <RNText
            accessibilityRole="link"
            style={[
              KIT_TYPE.boxNote,
              KIT_TYPE.strong,
              { color: c.ink, textDecorationLine: 'underline' },
            ]}
            onPress={() => void Linking.openURL(`mailto:${contactEmail}`)}
          >
            {tr.profile.birthDateContact}
          </RNText>
          {tr.profile.birthDateEnd}
        </T>
      </View>
    </Screen>
  );
}
