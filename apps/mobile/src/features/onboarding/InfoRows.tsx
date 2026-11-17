import { Text, View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';

import { SIGNUP_FONT_SCALE, useSignupLook } from './look';

export type InfoItem = {
  icon: CapIconName;
  text: string;
  // A second, quieter line under it.
  sub?: string;
  // A warning row: the danger colour.
  warn?: boolean;
  testID?: string;
};

// The short lines under a step's field (`.irs`, `.ir`): a 22 icon, its words beside it.
export function InfoRows({ items }: { items: readonly InfoItem[] }) {
  const look = useSignupLook();
  return (
    <View style={{ marginTop: SIGNUP.info.top }}>
      {items.map((item) => {
        const tone = item.warn ? look.danger : look.ink;
        return (
          <View
            key={item.text}
            testID={item.testID}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: SIGNUP.info.gap,
              paddingVertical: SIGNUP.info.padY,
            }}
          >
            <CapIcon name={item.icon} color={tone} size={SIGNUP.info.icon} />
            <View style={{ flex: 1 }}>
              <Text
                maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
                style={[SIGNUP_TYPE.info, { color: tone }]}
              >
                {item.text}
              </Text>
              {item.sub ? (
                <Text
                  maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
                  style={[SIGNUP_TYPE.infoSub, { color: look.muted }]}
                >
                  {item.sub}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
