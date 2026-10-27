import { useEffect, useRef, useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text as AppText } from '@/components/Text';
import { noteTyping } from '@/lib/haptics';
import { V46_EXPLORE, V46_EXPLORE_ICONS } from '@/theme/parts.generated';
import { typeStyle, useTheme } from '@/theme/ThemeProvider';

import { transitionStyle } from './motion';
import { V46Svg } from './V46Svg';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  // "Mekan ara": shown while empty, and read by screen readers.
  placeholder: string;
  testID?: string;
  // Drawn as while typing (the gallery's and the visual gate's "yazarken").
  focusedPreview?: boolean;
};

// Keşfet's search (v46 `.dsearch`): a round field with a magnifier. While typing its edge turns
// purple and a soft ring grows around it (`:focus-within`), both easing 200 ms. The keyboard's
// action key searches. A keystroke holds the phone's touches (haptics.ts → noteTyping), as in
// every field. When the keyboard goes (Android's back, a sheet over it) the field lets go of the
// typing too, so a sheet closing does not bring the keyboard back (E2E, 27 Ekim).
export function SearchField({
  value,
  onChangeText,
  placeholder,
  testID,
  focusedPreview = false,
}: Props) {
  const theme = useTheme();
  const { scheme } = theme;
  const s = V46_EXPLORE[scheme].search;
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => input.current?.blur());
    return () => sub.remove();
  }, []);
  const look = focused || focusedPreview ? s.focus : s.idle;
  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s.gap,
          height: s.height,
          paddingRight: s.padding[1],
          paddingLeft: s.padding[3],
          borderRadius: s.radius,
          backgroundColor: s.bg,
          borderWidth: look.border.width,
          borderColor: look.border.color,
          boxShadow: look.shadow ?? undefined,
        },
        transitionStyle(s.transitions),
      ]}
    >
      <V46Svg drawing={V46_EXPLORE_ICONS.search} size={s.icon.size} color={s.icon.color} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <TextInput
          ref={input}
          value={value}
          onChangeText={(text) => {
            noteTyping();
            onChangeText(text);
          }}
          accessibilityLabel={placeholder}
          returnKeyType="search"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          testID={testID}
          // The canvas's field type (skall.css → `.field`: 14/20, 600), without Android's font
          // padding: a one-line field set its line low and looked off.
          style={[
            typeStyle(theme, 'body'),
            {
              height: s.field.height,
              padding: 0,
              color: s.field.color,
              includeFontPadding: false,
              textAlignVertical: 'center',
            },
          ]}
        />
        {/* The hint is drawn by the app, in the app's type: Android drew the field's own hint in
            another face (the owner's report, 27 Ekim). */}
        {value.length === 0 ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
          >
            <AppText variant="body" color={s.field.placeholderColor}>
              {placeholder}
            </AppText>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}
