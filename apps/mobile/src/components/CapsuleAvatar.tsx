import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { type CapsuleLook, capsuleSvg } from '@/theme/capsules';
import { useTheme } from '@/theme/ThemeProvider';

import { AVATAR_SIZE } from './Avatar';

type Props = {
  look: CapsuleLook;
  size?: keyof typeof AVATAR_SIZE;
  // What screen readers say: the capsule nick ("kapsul-ab12"), or nothing when the name is written
  // next to it.
  accessibilityLabel?: string;
};

// An anonymous person's face, or the ghost of a profile whose photo was hidden (docs/SPEC_V4.md
// §4.D, K-4): the capsule of src/theme/capsules.ts on its disc, in the avatar sizes.
export function CapsuleAvatar({ look, size = 'md', accessibilityLabel }: Props) {
  const { shape } = useTheme();
  const xml = useMemo(() => capsuleSvg(look), [look]);
  const side = AVATAR_SIZE[size];
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{ width: side, height: side, borderRadius: shape.radius.pill, overflow: 'hidden' }}
    >
      <SvgXml xml={xml} width={side} height={side} />
    </View>
  );
}
