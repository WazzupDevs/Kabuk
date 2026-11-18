import { LEGAL_ENTITY } from '@shared/legalEntity.ts';
import { containsContact } from '@shared/profanity.ts';
import { BIO_MAX, DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '@shared/profile.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, Linking, Text as RNText, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { measureMenuAnchor, Menu, MenuItem } from '@/components/Menu';
import { Screen } from '@/components/Screen';
import { useHideTabBar } from '@/components/TabBar';
import { useProfile } from '@/features/account/useProfile';
import { PhotoSheet, photoErrorMessage } from '@/features/profile/PhotoSheet';
import { chooseCover, PhotoError } from '@/features/profile/photo';
import { ProfileCover } from '@/features/profile/ProfileCover';
import { LockMark, ProfileField } from '@/features/profile/ProfileField';
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
import { BarBack, type MenuAnchor, Tap } from '@/motion';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { EDIT_TYPE, PROFILE_EDIT } from '@/theme/profileEdit';
import { SPACING } from '@/theme/tokens';

// The address in the legal texts unless the build names another (as Hesap's İletişim).
const CONTACT_EMAIL = process.env.EXPO_PUBLIC_CONTACT_EMAIL?.trim() || LEGAL_ENTITY.contactEmail;

// The photo, the cover, the display name and the bio (docs/arsiv/SPEC_V2.md §5.1; the yeni arayüz
// tuvali's ProfilDuzenle and ProfilDuzenleYaz): the bar with the round back button, the title and
// Kaydet (grey with nothing to save, the ink with something, "Kaydedildi" once saved, its width
// kept), the cover and the photo in one preview, each field on its own with its count, the birth
// date's still box. Length is checked here; the profile function checks length and profanity
// again. The birth date cannot change (rule 11).
export function EditProfile({ gate }: { gate?: { draftName: string } } = {}) {
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
      gate={gate}
    />
  );
}

// The cover and the photo in one preview (ProfilDuzenle): the cover 150 high and 22 round with
// "Kapağı değiştir" at its top right, opening Değiştir and Kaldır (the kit's menu, 3.5); the photo
// 104 in its ring over the cover's foot by 52, a camera round at its corner (the written "Fotoğrafı
// değiştir" went, the owner's call, 2 Kasım, 12.5). Both need a saved name first (the server
// refuses them otherwise).
function PreviewEditor({ publicId, hasName }: { publicId: string; hasName: boolean }) {
  const { scheme } = useKit();
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
  const E = PROFILE_EDIT;
  const look = E[scheme];
  const ground = AURA[scheme].ground;
  const C = E.camera;

  return (
    <View>
      <View style={{ height: E.cover }}>
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
            bar={E.coverBtn.height}
            lead={<CapIcon name="camera" color={KIT.white} soft={0.6} size={E.coverBtn.icon} />}
            testID="cover-menu"
            label={tr.profile.coverChange}
            fill={look.coverBtnFill}
            tint={KIT.white}
            look={{
              type: 'setupShuffle',
              padLeft: E.coverBtn.padLeft,
              padRight: E.coverBtn.padRight,
              gap: E.coverBtn.gap,
            }}
            disabled={!hasName}
            loading={busy}
            onPress={openCoverMenu}
          />
        </View>
      </View>
      <View style={{ alignItems: 'center', marginTop: -E.faceOver }}>
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
            ringColor={ground}
            ground={look.faceGround}
          />
          <View
            style={{
              position: 'absolute',
              right: C.right,
              bottom: C.bottom,
              width: C.side,
              height: C.side,
              borderRadius: C.side / 2,
              borderWidth: C.ring,
              borderColor: ground,
              backgroundColor: look.cameraFill,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CapIcon name="camera" color={look.cameraInk} soft={0.6} size={C.icon} />
          </View>
        </Tap>
      </View>
      {!hasName ? (
        <View style={{ marginTop: SPACING[2] }}>
          <T v="fine" center>
            {tr.profile.photoNeedsName}
          </T>
        </View>
      ) : null}
      {!coverUrl && view.data && hasName ? (
        <View style={{ marginTop: SPACING[2] }}>
          <T v="fine" center>
            {tr.profile.coverDefault}
          </T>
        </View>
      ) : null}
      {view.isError ? (
        <View style={{ marginTop: SPACING[2] }}>
          <T v="fine" color={KIT.danger}>
            {errorMessage(view.error)}
          </T>
        </View>
      ) : null}
      {failed ? (
        <View style={{ gap: SPACING[2], marginTop: SPACING[2] }}>
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
        // iskelet.md → 3.5: grown out of "Kapağı değiştir", no "Vazgeç", Kaldır red at the foot apart.
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

function EditForm({
  publicId,
  initialName,
  initialBio,
  gate,
}: {
  publicId: string;
  initialName: string;
  initialBio: string;
  // The visual gate's typed state (ProfilDuzenleYaz): the name written over the saved one and its
  // field focused, no keyboard. Never set in the app.
  gate?: { draftName: string };
}) {
  const { c } = useKit();
  const queryClient = useQueryClient();
  const [name, setName] = useState(gate?.draftName ?? initialName);
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
  // Nothing to save: Kaydet is grey and does nothing; a field that does not pass says so.
  const onSave = () => {
    if (!changed || save.isPending) return;
    if (!nameValid || !bioValid) {
      setTried(true);
      return;
    }
    save.mutate();
  };

  const E = PROFILE_EDIT;
  return (
    <Screen
      gap={0}
      side={E.side}
      barSide={E.side}
      padTop={E.coverTop}
      // ProfilDuzenle `.ptb`: the round back button, the title 19/24 and Kaydet 40 on the bar, which
      // stays while the page scrolls (the owner's report, 2 Kasım, 12.1).
      top={
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: E.barGap,
            minHeight: KIT.size.btnRow,
          }}
        >
          <BarBack onBack={leave} side={KIT.size.round} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="pageBarTitle" ink style={EDIT_TYPE.title} accessibilityRole="header">
              {tr.profile.editTitle}
            </T>
          </View>
          <Btn
            bar={KIT.size.btnBar}
            testID="profile-save"
            label={save.isSuccess ? tr.profile.savedShort : tr.profile.save}
            disabled={!changed && !save.isSuccess}
            loading={save.isPending}
            look={{ type: 'holdRow', padLeft: E.barPad, padRight: E.barPad }}
            onPress={onSave}
          />
        </View>
      }
    >
      {save.isError ? (
        <View style={{ marginBottom: SPACING[3] }}>
          <T v="fine" color={c.warn}>
            {errorMessage(save.error)}
          </T>
        </View>
      ) : null}
      <PreviewEditor publicId={publicId} hasName={initialName !== ''} />
      {/* ProfilDuzenle: each field stands alone, its label with its count over it and its note
          under it. Focused, the box's line is 2 and the text's colour. */}
      <ProfileField
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
        autoFocus={!!gate}
        showSoftInputOnFocus={!gate}
      />
      <ProfileField
        label={tr.profile.bioLabel}
        counter={tr.profile.bioHint([...bio].length, BIO_MAX)}
        value={bio}
        onChangeText={setBio}
        error={bioError}
        maxLength={maxLengthFor(bio, bioLimit)}
        multiline
      />
      {/* The birth date as a still box (rule 11: it cannot change in the app, and the phone never
          holds it: the box says so instead of showing it) and the note with the way to write to us. */}
      <ProfileField
        label={tr.profile.birthDate}
        readOnly
        readOnlyValue={tr.profile.unchangeable}
        trail={<LockMark color={c.muted} />}
        hint={
          <>
            {tr.profile.birthDateHelp}
            <RNText
              accessibilityRole="link"
              onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
              style={[KIT_TYPE.fieldLabel, { color: c.ink, textDecorationLine: 'underline' }]}
            >
              {tr.profile.birthDateHelpLink}
            </RNText>
            .
          </>
        }
      />
    </Screen>
  );
}
