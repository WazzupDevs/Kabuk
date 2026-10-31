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
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

// The photo, the display name and the bio (docs/arsiv/SPEC_V2.md §5.1; docs/design/aura → Profili
// düzenle): back, the title, the photo's card, the fields' card, the birth date's note; "Kaydet"
// stays at the foot (the canvas leaves it out). Length is checked here; the profile function checks
// length and profanity again. The birth date cannot change (rule 11).
export default function EditProfileScreen() {
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
function PhotoEditor({ publicId, hasName }: { publicId: string; hasName: boolean }) {
  const { c } = useKit();
  const view = useProfileView(publicId);
  const [menu, setMenu] = useState(false);
  const hasPhoto = !!view.data?.photoUrl || view.data?.photoHidden === true;
  const label = hasPhoto ? tr.profile.photoChange : tr.profile.photoAdd;

  return (
    <View style={{ alignItems: 'center', gap: SPACING[2] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !hasName }}
        disabled={!hasName}
        onPress={() => setMenu(true)}
        style={{ alignItems: 'center', gap: PHOTO_GAP, opacity: hasName ? 1 : NO_NAME }}
      >
        <View>
          <Av
            size="big"
            name={view.data?.displayName ?? ''}
            photoUrl={view.data?.photoUrl ?? null}
          />
          {/* The canvas's camera on a white round at the face's lower right. */}
          <View
            style={{
              position: 'absolute',
              right: -CAMERA_OUT,
              bottom: CAMERA_UP,
              width: CAMERA,
              height: CAMERA,
              borderRadius: CAMERA / 2,
              backgroundColor: KIT.white,
              boxShadow: KIT.cameraShadow,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CapIcon name="photo" color={KIT.primary} second={KIT.pink} size={KIT.size.iconSm} />
          </View>
        </View>
        <T v="btn" color={c.link}>
          {label}
        </T>
      </Pressable>
      {!hasName ? (
        <T v="fine" center>
          {tr.profile.photoNeedsName}
        </T>
      ) : null}

      <PhotoSheet visible={menu} onClose={() => setMenu(false)} canRemove={hasPhoto} />
    </View>
  );
}
const PHOTO_GAP = 14;
const NO_NAME = 0.6;
const CAMERA = 36;
const CAMERA_OUT = 8;
const CAMERA_UP = 4;

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
      gap={GAP}
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
      <Round big icon="back" label={tr.common.back} onPress={leave} />
      <T v="display" style={KIT_TYPE.displayXl} accessibilityRole="header">
        {tr.profile.editTitle}
      </T>

      <Glass
        style={{
          alignItems: 'center',
          paddingVertical: KIT.size.padLg,
          paddingHorizontal: KIT.size.pad,
        }}
      >
        <PhotoEditor publicId={publicId} hasName={initialName !== ''} />
      </Glass>
      <Glass pad="pad" style={{ gap: FIELDS_GAP }}>
        <Input
          large
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

const GAP = 16;
const FIELDS_GAP = 16;
const NOTE_PAD_Y = 14;
const NOTE_PAD_X = 16;
