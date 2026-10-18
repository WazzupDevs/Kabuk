import { Ionicons } from '@expo/vector-icons';
import { mayStayAnonymous } from '@shared/gender.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProfilePhoto } from '@/components/ProfilePhoto';
import { Text } from '@/components/Text';
import { useProfile } from '@/features/account/useProfile';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { choosePhoto, PhotoError, type PhotoSource } from '@/features/profile/photo';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { finishLabel } from '@/lib/signupSteps';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

// The photo, the last sign-up step (7/7; v45 §1): optional and addable later from Profil. The
// button is "Bitir", or "Fotoğrafsız bitir" without a photo (K-29); finishing opens the app with
// one success touch (accountReady, K-30). A man and "Belirtmek istemiyorum" always join with the
// profile, so for them a note says what no photo means (§23.D); the step and its events are the
// same for everyone (§23.L). The bio is written later from Profil (v45 has none here).
export default function PhotoStep() {
  const queryClient = useQueryClient();
  const [photoSet, setPhotoSet] = useState(false);
  // The preview: the uploaded photo, or the display name's initials.
  const own = useProfile();
  const view = useProfileView(own.data?.public_id);
  const { colors } = useTheme();
  const gender = useOnboardingStore((s) => s.gender) ?? view.data?.gender ?? null;
  const photoNote = gender !== null && !mayStayAnonymous(gender) && !photoSet;

  const photo = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (source: PhotoSource) => choosePhoto(source),
    onSuccess: async (changed) => {
      if (changed) {
        setPhotoSet(true);
        track('profile_photo_set', {});
        await queryClient.invalidateQueries({ queryKey: profileViewKeys.all });
      }
    },
  });

  const finish = () => {
    track('onboarding_completed', { with_photo: photoSet, with_bio: false });
    haptic('accountReady');
    useOnboardingStore.setState({ extrasPending: false, gender: null, name: '', birthDate: null });
  };

  return (
    <SignupStep
      step="photo"
      testID="signup-photo-step"
      title={tr.signup.photoTitle}
      body={tr.signup.photoBody}
      action={{
        testID: 'signup-finish',
        label: finishLabel(photoSet, {
          finish: tr.signup.finish,
          noPhoto: tr.signup.finishNoPhoto,
        }),
        onPress: finish,
        disabled: photo.isPending,
      }}
    >
      <View className="gap-4">
        <View className="items-center gap-3">
          <ProfilePhoto url={view.data?.photoUrl ?? null} name={own.data?.display_name} />
          <View className="w-full flex-row gap-3">
            <View className="flex-1">
              <Button
                variant="neutral"
                icon="image-outline"
                label={tr.profile.photoFromLibrary}
                onPress={() => photo.mutate('library')}
                disabled={photo.isPending}
              />
            </View>
            <View className="flex-1">
              <Button
                variant="neutral"
                icon="camera-outline"
                label={tr.profile.photoFromCamera}
                onPress={() => photo.mutate('camera')}
                disabled={photo.isPending}
              />
            </View>
          </View>
        </View>
        {photo.isError ? (
          <Text variant="fine" tone="danger">
            {photo.error instanceof PhotoError
              ? photo.error.reason === 'permission'
                ? tr.profile.photoPermission
                : tr.profile.photoInvalid
              : errorMessage(photo.error)}
          </Text>
        ) : null}
        {photoNote ? (
          <Card tone="note" testID="photo-needed-note">
            <View className="flex-row items-start gap-2.5">
              <Ionicons name="information-circle-outline" size={ICON.md} color={colors.accent} />
              <Text variant="bodyStrong" className="flex-1">
                {tr.signup.photoNeededNote}
              </Text>
            </View>
          </Card>
        ) : null}
      </View>
    </SignupStep>
  );
}
