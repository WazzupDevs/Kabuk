import { Ionicons } from '@expo/vector-icons';
import { mayStayAnonymous } from '@shared/gender.ts';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProfilePhoto, PROFILE_PHOTO_SIZES } from '@/components/ProfilePhoto';
import { Text } from '@/components/Text';
import { useProfile } from '@/features/account/useProfile';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { useFriend } from '@/features/onboarding/useFriend';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { useProfileView } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/haptics';
import { finishLabel } from '@/lib/signupSteps';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

// The photo, the last sign-up step (7/7; v45 §1): optional and addable later from Profil. An empty
// dashed circle and "Fotoğraf ekle", which opens the library or camera sheet (v45: .sup-ph). The
// button is "Bitir", or "Fotoğrafsız bitir" without a photo (K-29); finishing opens the app with
// one success touch (accountReady, K-30). A man and "Belirtmek istemiyorum" always join with the
// profile, so for them a note says what no photo means (§23.D); the step and its events are the
// same for everyone (§23.L). The bio is written later from Profil (v45 has none here).
export default function PhotoStep() {
  const [photoSet, setPhotoSet] = useState(false);
  const [sheet, setSheet] = useState(false);
  const own = useProfile();
  const view = useProfileView(own.data?.public_id);
  const { colors, shape } = useTheme();
  const gender = useOnboardingStore((s) => s.gender) ?? view.data?.gender ?? null;
  const photoNote = gender !== null && !mayStayAnonymous(gender) && !photoSet;
  const friend = useFriend();
  const photoUrl = view.data?.photoUrl ?? null;
  const side = PROFILE_PHOTO_SIZES.large;

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
      friend={friend}
      action={{
        testID: 'signup-finish',
        label: finishLabel(photoSet, {
          finish: tr.signup.finish,
          noPhoto: tr.signup.finishNoPhoto,
        }),
        onPress: finish,
      }}
    >
      <View className="gap-4">
        <View className="items-center gap-3">
          {photoUrl ? (
            <ProfilePhoto url={photoUrl} name={own.data?.display_name} />
          ) : (
            <View
              accessible={false}
              style={{
                width: side,
                height: side,
                borderRadius: shape.radius.pill,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: colors.accent,
                backgroundColor: colors.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person-outline" size={ICON.xl} color={colors.accent} />
            </View>
          )}
          <Button
            testID="signup-photo-add"
            variant="neutral"
            icon="camera-outline"
            label={photoSet ? tr.profile.photoChange : tr.profile.photoAdd}
            onPress={() => setSheet(true)}
          />
        </View>
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
      <PhotoSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onSet={() => {
          setPhotoSet(true);
          friend.react('ok');
        }}
      />
    </SignupStep>
  );
}
