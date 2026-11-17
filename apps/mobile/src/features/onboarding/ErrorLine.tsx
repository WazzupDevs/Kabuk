import { Text, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';

import { SIGNUP_FONT_SCALE, useSignupLook } from './look';

// A step's error (KayitKodHatali `.er`): the warning icon and the words in the danger colour,
// 12 under what failed. Read aloud as it appears.
export function ErrorLine({ text, testID }: { text: string; testID?: string }) {
  const look = useSignupLook();
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SIGNUP.error.gap,
        marginTop: SIGNUP.error.top,
      }}
    >
      <CapIcon name="warn" color={look.danger} size={SIGNUP.error.icon} />
      <Text
        maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
        style={[SIGNUP_TYPE.error, { color: look.danger, flex: 1 }]}
      >
        {text}
      </Text>
    </View>
  );
}
