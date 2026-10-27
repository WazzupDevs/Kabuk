import { containsContact } from '@shared/profanity.ts';
import { BIO_MAX, DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '@shared/profile.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { CanvasBar } from '@/components/CanvasIcon';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { ProfilePhoto } from '@/components/ProfilePhoto';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { useProfile } from '@/features/account/useProfile';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { Sheet } from '@/components/Sheet';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { maxLengthFor } from '@/lib/textLimit';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';
import { AppIcon } from '@/components/AppIcon';

// The photo, the display name and the bio (docs/SPEC_V2.md §5.1; canvas: Aşama 5 · Geri bildirim →
// Profili düzenle). Length is checked here; the profile function checks length and profanity
// again. The birth date cannot change (rule 11).
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
  const { colors, shape } = useTheme();
  const view = useProfileView(publicId);
  const [menu, setMenu] = useState(false);
  const hasPhoto = !!view.data?.photoUrl || view.data?.photoHidden === true;
  const label = hasPhoto ? tr.profile.photoChange : tr.profile.photoAdd;

  return (
    <View className="items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !hasName }}
        disabled={!hasName}
        onPress={() => setMenu(true)}
        className="items-center gap-2"
        style={{ opacity: hasName ? 1 : 0.6 }}
      >
        <View>
          <ProfilePhoto url={view.data?.photoUrl ?? null} name={view.data?.displayName} />
          <View
            className="absolute items-center justify-center"
            style={{
              right: -SPACING[1],
              bottom: -SPACING[1],
              width: SPACING[10],
              height: SPACING[10],
              borderRadius: shape.radius.pill,
              backgroundColor: colors.surface,
              borderWidth: SPACING[1],
              borderColor: colors.canvas,
              boxShadow: shape.shadow.card,
            }}
          >
            {/* skall tuvali (ProfilDuzenle): the canvas's two-tone photo icon. */}
            <CanvasBar name="photo" size={ICON.md} />
          </View>
        </View>
        <View style={{ minHeight: SPACING[11], justifyContent: 'center' }}>
          <Text variant="label" tone="accent">
            {label}
          </Text>
        </View>
      </Pressable>
      {!hasName ? (
        <Text variant="fine" align="center">
          {tr.profile.photoNeedsName}
        </Text>
      ) : null}

      <PhotoSheet visible={menu} onClose={() => setMenu(false)} canRemove={hasPhoto} />
    </View>
  );
}

function EditForm({
  publicId,
  initialName,
  initialBio,
}: {
  publicId: string;
  initialName: string;
  initialBio: string;
}) {
  const { colors } = useTheme();
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
    <Screen>
      <ScreenHeader title={tr.profile.editTitle} onBack={leave} />

      <View className="mt-4 gap-3">
        {/* skall tuvali (ProfilDuzenle): the photo and the fields in cards. */}
        <Card>
          <PhotoEditor publicId={publicId} hasName={initialName !== ''} />
        </Card>
        <Card>
          <View className="gap-4">
            <Input
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
        </Card>
        <Card tone="note">
          <View className="flex-row items-start gap-2">
            <AppIcon name="calendar-outline" size={ICON.md} color={colors.text} />
            <Text variant="fine" tone="text" className="flex-1">
              {tr.profile.birthDateNote}
            </Text>
          </View>
        </Card>
      </View>

      {save.isError ? (
        <Text variant="fine" tone="danger" className="mt-4">
          {errorMessage(save.error)}
        </Text>
      ) : null}
      <View className="mt-auto gap-3 pt-8">
        <Button
          size="lg"
          label={tr.profile.save}
          onPress={() => save.mutate()}
          disabled={!nameValid || !bioValid || (!nameChanged && !bioChanged)}
          loading={save.isPending}
        />
      </View>
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
