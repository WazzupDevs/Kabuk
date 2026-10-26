import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

import { usePressScale } from './motion';
import { Text } from './Text';

type Props = {
  label: string;
  hint?: string;
  // A big picture over the label (the table's face, the profile).
  picture: ReactNode;
  selected: boolean;
  disabled?: boolean;
  // Cannot be chosen yet (canvas: Faz 2 · 22.1 → "Profilimle" without a photo): a dashed outline
  // and a muted label; the reason stands under the cards.
  unavailable?: boolean;
  onPress: () => void;
  testID?: string;
};

// One of two side-by-side choices with a picture (canvas: Oda kur → nasıl görüneceksin?): a soft
// card, the chosen one ringed in the accent.
export function ChoiceCard({
  label,
  hint,
  picture,
  selected,
  disabled,
  unavailable = false,
  onPress,
  testID,
}: Props) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ selected, disabled: !!disabled || unavailable }}
      disabled={disabled || unavailable}
      onPress={() => {
        if (!selected) haptic('selection');
        onPress();
      }}
      className="flex-1"
    >
      {({ pressed }) => (
        <View
          className="items-center gap-2.5"
          style={[
            {
              paddingHorizontal: SPACING[3],
              paddingVertical: SPACING[3],
              borderRadius: shape.radius.lg,
              backgroundColor: unavailable ? 'transparent' : colors.surface,
              borderWidth: shape.stroke.feature + 1,
              borderStyle: unavailable ? 'dashed' : 'solid',
              borderColor: unavailable ? colors.muted : selected ? colors.primary : colors.cardLine,
              boxShadow: unavailable ? undefined : shape.shadow.card,
              opacity: disabled ? 0.5 : 1,
            },
            pressScale(pressed),
          ]}
        >
          {picture}
          <Text variant="bodyStrong" align="center" tone={unavailable ? 'muted' : undefined}>
            {label}
          </Text>
          {hint ? (
            <Text variant="fine" align="center">
              {hint}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
