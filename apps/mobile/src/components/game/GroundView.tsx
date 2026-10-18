import { type ReactNode, useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { GameGround } from '@/theme/gameColors';

type Props = {
  ground: GameGround;
  children?: ReactNode;
  // Layout only: size, padding, corners.
  style?: ViewStyle;
  testID?: string;
};

// A game screen's ground (docs/SPEC_V4.md §4.C, gameColors.ts): the game's vertical gradient behind
// its content, drawn with react-native-svg. A team's ground is flat (both stops the same).
export function GroundView({ ground, children, style, testID }: Props) {
  // useId's ":r1:" is not a safe SVG id.
  const id = `ground${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  return (
    <View style={[{ overflow: 'hidden' }, style]} testID={testID}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 1 1" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ground.top} />
            <Stop offset="1" stopColor={ground.bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}
