import { memo } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { gradientStyle } from '@/theme/gradient';
import { SUSLE_STAGE } from '@/theme/susleStage';

// The night card behind Süsle's large capsule (Atölye `susleStage` B, the owner's approval, 22
// Kasım): a deep navy card with a purple light behind the capsule and a few still stars, so that a
// white, silver or glowing accessory stands out and the room over the circle reads as sky. Drawn
// once, still; it never draws again with the look.
export const SceneNight = memo(function SceneNight({ style }: { style?: StyleProp<ViewStyle> }) {
  const S = SUSLE_STAGE;
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          borderRadius: S.night.radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: S.night.edge,
          ...gradientStyle(S.night.ground),
        },
        style,
      ]}
    >
      <Svg width="100%" height="100%">
        {S.stars.map(([x, y, r, soft]) => (
          <Circle
            key={`${x}-${y}`}
            cx={`${x * 100}%`}
            cy={`${y * 100}%`}
            r={r}
            fill={soft ? S.night.starSoft : S.night.star}
          />
        ))}
      </Svg>
    </View>
  );
});
