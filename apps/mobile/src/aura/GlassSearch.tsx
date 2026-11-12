import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { CapIcon } from './CapIcon';
import { Glass, T, useKit } from './kit';

const X = KIT.size.explore;

// The glass search capsule (iskelet.md → 5.1, and Mesajlar's search in 5.4: "Keşfet'tekinin
// aynısı"): the search icon, the field and `trailing` at its right on one frosted capsule, 54 high
// unless it is given its own height. The hint is drawn by the app in the app's type: Android draws a
// field's own hint in the phone's system face (the owner's report, 27 and 28 Ekim).
export function GlassSearch({
  value,
  onChangeText,
  placeholder,
  testID,
  height = X.capsule,
  trailing,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
  height?: number;
  trailing?: ReactNode;
}) {
  const { c } = useKit();
  const { colors } = useTheme();
  return (
    <Glass
      frost
      radius={height / 2}
      style={{
        height,
        borderRadius: height / 2,
        paddingLeft: X.capsulePadX,
        paddingRight: trailing ? X.switchPad : X.capsulePadX,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[2],
      }}
    >
      <CapIcon name="search" color={colors.placeholder} size={X.icon} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel={placeholder}
          returnKeyType="search"
          style={[
            KIT_TYPE.body,
            { color: c.ink, paddingVertical: 0, paddingHorizontal: 0, includeFontPadding: false },
          ]}
        />
        {value.length === 0 ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}
          >
            <T v="body" lines={1} color={colors.placeholder}>
              {placeholder}
            </T>
          </View>
        ) : null}
      </View>
      {trailing}
    </Glass>
  );
}
