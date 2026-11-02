import { containsContact } from '@shared/profanity.ts';
import { BIO_MAX, DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '@shared/profile.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Glass, Round, T, useKit } from '@/aura/kit';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useHideTabBar } from '@/components/TabBar';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { useProfile } from '@/features/account/useProfile';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { Sheet } from '@/components/Sheet';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useAskBeforeLeaving } from '@/lib/leaveGuard';
import { track } from '@/lib/analytics';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { maxLengthFor } from '@/lib/textLimit';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

// The photo, the display name and the bio (docs/arsiv/SPEC_V2.md §5.1; docs/design/aura → Profili
// düzenle): back, the title, the photo's card, the fields' card, the birth date's note; "Kaydet"
// stays at the foot (the canvas leaves it out). Length is checked here; the profile function checks
// length and profanity again. The birth date cannot change (rule 11).
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

// A photo needs a saved name first (the server refuses it otherwise).
// U34 (ProfilDuzenle `.ph`): no card; the face 88 in the middle with the camera badge (36, the
// surface, at its lower right, -4/-2; the camera 20, its lens the accent). The written "Fotoğrafı
// değiştir" went: the badge does the same (the owner's call, 2 Kasım, 12.5).
function PhotoEditor({ publicId, hasName }: { publicId: string; hasName: boolean }) {
  const { c, scheme } = useKit();
  const { colors } = useTheme();
  const view = useProfileView(publicId);
  const [menu, setMenu] = useState(false);
  const hasPhoto = !!view.data?.photoUrl || view.data?.photoHidden === true;
  const label = hasPhoto ? tr.profile.photoChange : tr.profile.photoAdd;

  return (
    <View style={{ gap: SPACING[2], alignItems: 'center' }}>
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: !hasName }}
          disabled={!hasName}
          onPress={() => setMenu(true)}
        >
          <Av
            size="edit"
            name={view.data?.displayName ?? ''}
            photoUrl={view.data?.photoUrl ?? null}
          />
          <View
            style={{
              position: 'absolute',
              right: -CAMERA_OUT,
              bottom: -CAMERA_DOWN,
              width: CAMERA,
              height: CAMERA,
              borderRadius: CAMERA / 2,
              backgroundColor: scheme === 'dark' ? c.glassInSheet : KIT.white,
              boxShadow: scheme === 'dark' ? undefined : KIT.cameraShadow,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CapIcon name="camera" color={colors.accent} second={c.ink} size={ICON.md} />
          </View>
        </Pressable>
      </View>
      {!hasName ? (
        <T v="fine" center>
          {tr.profile.photoNeedsName}
        </T>
      ) : null}

      <PhotoSheet visible={menu} onClose={() => setMenu(false)} canRemove={hasPhoto} />
    </View>
  );
}
const CAMERA = 36;
const CAMERA_OUT = 4;
const CAMERA_DOWN = 2;

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
  // An edited bio from before the limit that is still too long says so (Kaydet stays off).
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
  const dirty = (nameChanged || bioChanged) && !save.isSuccess;
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

  return (
    <Screen
      gap={0}
      // U34: back 44 round soft on the bar; it stays while the page scrolls (the owner's report,
      // 2 Kasım, 12.1).
      top={
        <View style={{ height: KIT.size.btnRow, justifyContent: 'center' }}>
          <Round glassy icon="back" label={tr.common.back} onPress={leave} />
        </View>
      }
      footer={
        // aura v50 (ProfilDuzenle): Kaydet stays at the foot, the save error right above it.
        <>
          {save.isError ? (
            <T v="fine" color={c.warn}>
              {errorMessage(save.error)}
            </T>
          ) : null}
          <Btn
            block
            label={tr.profile.save}
            onPress={() => save.mutate()}
            disabled={!nameValid || !bioValid || (!nameChanged && !bioChanged)}
            loading={save.isPending}
          />
        </>
      }
    >
      <T v="display" accessibilityRole="header">
        {tr.profile.editTitle}
      </T>

      <View style={{ marginTop: SPACING[5] }}>
        <PhotoEditor publicId={publicId} hasName={initialName !== ''} />
      </View>
      {/* U34: the fields on one glass sm card 20 under the photo, 16 inside; a field's label,
          the field and its note 8 apart, the groups 12 more. */}
      <Glass sm style={{ marginTop: SPACING[5], padding: SPACING[4], gap: SPACING[5] }}>
        <Input
          large
          boxed
          testID="name-input"
          label={tr.profile.nameLabel}
          hint={tr.profile.nameHint}
          value={name}
          onChangeText={setName}
          error={nameContact ? tr.errors.contact_not_allowed : null}
          maxLength={maxLengthFor(name, DISPLAY_NAME_MAX)}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <Input
          large
          boxed
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
      <Glass
        sm
        style={{
          marginTop: SPACING[4],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: KIT.size.rowGap,
          paddingVertical: NOTE_PAD_Y,
          paddingHorizontal: NOTE_PAD_X,
        }}
      >
        <CapIcon name="calendar" color={c.ink} size={KIT.size.icon} />
        <T v="fineLg" ink style={{ flex: 1 }}>
          {tr.profile.birthDateNote}
        </T>
      </Glass>

      <Sheet visible={leaving} onClose={() => setLeaving(false)} title={tr.profile.leaveTitle}>
        <Text variant="fine">{tr.profile.leaveBody}</Text>
        <Button
          size="lg"
          variant="danger"
          label={tr.profile.leaveConfirm}
          onPress={() => {
            setLeaving(false);
            router.back();
          }}
        />
        <Button
          size="lg"
          variant="neutral"
          label={tr.profile.leaveBack}
          onPress={() => setLeaving(false)}
        />
      </Sheet>
    </Screen>
  );
}

const NOTE_PAD_Y = 14;
const NOTE_PAD_X = 16;
