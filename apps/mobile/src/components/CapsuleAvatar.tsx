import { View } from 'react-native';
import { type JsxAST, parse, SvgAst } from 'react-native-svg';

import { reportError } from '@/lib/errorReporting';
import { parseOnce } from '@/lib/parseOnce';
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

// Each look's SVG parsed once for the app's life; every avatar of a look shares the tree (plain
// elements). A look that does not parse is drawn as its bare disc.
const parsed = new Map<CapsuleLook, JsxAST | null>();
export function capsuleAst(look: CapsuleLook): JsxAST | null {
  return parseOnce(parsed, look, () => parse(capsuleSvg(look)), reportError);
}

// An anonymous person's face, or the ghost of a profile whose photo was hidden (docs/SPEC_V4.md
// §4.D, K-4): the capsule of src/theme/capsules.ts on its disc, in the avatar sizes.
export function CapsuleAvatar({ look, size = 'md', accessibilityLabel }: Props) {
  const { colors, shape } = useTheme();
  const side = AVATAR_SIZE[size];
  const ast = capsuleAst(look);
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{
        width: side,
        height: side,
        borderRadius: shape.radius.pill,
        overflow: 'hidden',
        backgroundColor: ast ? undefined : colors.surface2,
      }}
    >
      {ast ? <SvgAst ast={ast} override={{ width: side, height: side }} /> : null}
    </View>
  );
}
