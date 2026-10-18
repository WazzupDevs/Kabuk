import { View } from 'react-native';
import { type JsxAST, parse, SvgAst } from 'react-native-svg';

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

// Each look's SVG parsed once for the app's life (the CTO's 4.2b review: a list of 100 messages
// would otherwise parse the same 29 drawings again and again). The tree is plain elements, so every
// avatar of a look shares it.
const parsed = new Map<CapsuleLook, JsxAST | null>();
export function capsuleAst(look: CapsuleLook): JsxAST | null {
  let ast = parsed.get(look);
  if (ast === undefined) {
    ast = parse(capsuleSvg(look));
    parsed.set(look, ast);
  }
  return ast;
}

// An anonymous person's face, or the ghost of a profile whose photo was hidden (docs/SPEC_V4.md
// §4.D, K-4): the capsule of src/theme/capsules.ts on its disc, in the avatar sizes.
export function CapsuleAvatar({ look, size = 'md', accessibilityLabel }: Props) {
  const { shape } = useTheme();
  const side = AVATAR_SIZE[size];
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{ width: side, height: side, borderRadius: shape.radius.pill, overflow: 'hidden' }}
    >
      <SvgAst ast={capsuleAst(look)} override={{ width: side, height: side }} />
    </View>
  );
}
