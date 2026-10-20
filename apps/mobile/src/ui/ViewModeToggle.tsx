import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { V46_VIEW_MODE } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { transitionStyle } from './motion';
import { V46Svg } from './V46Svg';

export type ViewMode = 'list' | 'map';

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  labels: Record<ViewMode, string>;
  // The group's name for a screen reader ("Görünüm").
  accessibilityLabel?: string;
  testID?: string;
};

const MODES: readonly ViewMode[] = ['list', 'map'];

// Keşfet's list/map switch (v46 `.vmode`): two round buttons in a soft pill, the list's three bars
// and the map's pin. The one on takes a white ground and a soft shadow, the other is faded
// (`opacity: .55`); ground, opacity and shadow ease (200 ms). A pressed button shrinks
// (`.va button:active`). Each button takes a touch 3 dp past its top and bottom (`button::after`),
// so the pill is one 44 dp target.
export function ViewModeToggle({ value, onChange, labels, accessibilityLabel, testID }: Props) {
  const { scheme } = useTheme();
  const m = V46_VIEW_MODE[scheme];
  const [pressing, setPressing] = useState<ViewMode | null>(null);
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={{
        flexDirection: 'row',
        gap: m.gap,
        paddingTop: m.padding[0],
        paddingRight: m.padding[1],
        paddingBottom: m.padding[2],
        paddingLeft: m.padding[3],
        borderRadius: m.radius,
        backgroundColor: m.bg,
      }}
    >
      {MODES.map((mode) => {
        const on = mode === value;
        const look = on ? m.button.on : m.button.off;
        return (
          <Pressable
            key={mode}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={labels[mode]}
            testID={testID ? `${testID}-${mode}` : undefined}
            hitSlop={m.button.hitSlop}
            onPressIn={() => setPressing(mode)}
            onPressOut={() => setPressing(null)}
            onPress={() => {
              if (!on) onChange(mode);
            }}
          >
            <Animated.View
              style={[
                {
                  width: m.button.size[0],
                  height: m.button.size[1],
                  borderRadius: m.button.radius,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: look.bg ?? 'transparent',
                  boxShadow: look.shadow ?? undefined,
                  opacity: look.opacity,
                  transform: [{ scale: pressing === mode ? m.button.pressedScale : 1 }],
                },
                transitionStyle(m.button.transitions),
              ]}
            >
              <V46Svg drawing={V46_VIEW_MODE.icons[mode]} size={m.icon.size} />
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}
