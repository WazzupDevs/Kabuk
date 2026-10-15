import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AVATAR_SIZE } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

type Props = {
  // The server's photo_required: its text in place of the plain reason, in red.
  refused?: boolean;
  onAddPhoto: () => void;
};

// Why "Profilimle" cannot be chosen and the way out (canvas: Faz 2 · 22.1): one sentence and
// "Fotoğraf ekle", which opens the photo sheet in place.
export function PhotoNeeded({ refused = false, onAddPhoto }: Props) {
  return (
    <View className="items-start gap-2">
      <Text variant="fine" tone={refused ? 'danger' : 'text'} accessibilityLiveRegion="polite">
        {refused ? tr.errors.photo_required : tr.participation.photoNeeded}
      </Text>
      <Button
        variant="neutral"
        size="sm"
        icon="camera-outline"
        testID="photo-add"
        label={tr.profile.photoAdd}
        onPress={onAddPhoto}
      />
    </View>
  );
}

// In place of the profile picture while there is no photo: a dashed circle with a camera.
export function NoPhotoPicture({ size = 'xl' }: { size?: keyof typeof AVATAR_SIZE }) {
  const { colors, shape } = useTheme();
  const side = AVATAR_SIZE[size];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center"
      style={{
        width: side,
        height: side,
        borderRadius: shape.radius.pill,
        borderWidth: shape.stroke.control,
        borderStyle: 'dashed',
        borderColor: colors.muted,
      }}
    >
      <Ionicons name="camera-outline" size={ICON.md} color={colors.muted} />
    </View>
  );
}
