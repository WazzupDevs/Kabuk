import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { TOUCH } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

import { usePressScale } from './motion';
import { Text } from './Text';

type Props = { label: string; selected: boolean; onPress: () => void; testID?: string };

// A round single-choice button for short values ("Masada kaç kişisiniz?" 1 / 2 / 3 / 4+): a raised
// capsule with an outline, the chosen one filled with the accent.
export function ChoiceChip({ label, selected, onPress, testID }: Props) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  return (
    <Pressable
      accessibilityRole="radio"
      testID={testID}
      accessibilityState={{ selected }}
      onPress={() => {
        if (!selected) haptic('selection');
        onPress();
      }}
    >
      {({ pressed }) => (
        <View
          style={[
            {
              width: TOUCH.tab,
              height: TOUCH.tab,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: shape.radius.pill,
              backgroundColor: selected ? colors.text : colors.surface,
              borderWidth: shape.stroke.hairline * 1.5,
              borderColor: selected ? colors.text : colors.control,
            },
            pressScale(pressed),
          ]}
        >
          <Text variant="mark" tone={selected ? 'surface' : 'text'}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
