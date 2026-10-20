import { type JsxAST, parse, SvgAst } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { reportError } from '@/lib/errorReporting';
import { parseOnce } from '@/lib/parseOnce';
import { type CoverKind, EVENT_COVERS } from '@/theme/eventCovers';
import { useTheme } from '@/theme/ThemeProvider';

// Each cover parsed once for the app's life (the CapsuleAvatar pattern); one that does not parse is
// drawn as a quiet block.
const parsed = new Map<CoverKind, JsxAST | null>();
function coverAst(kind: CoverKind): JsxAST | null {
  return parseOnce(parsed, kind, () => parse(EVENT_COVERS[kind]), reportError);
}

// An event's cover (v44: .evc .cover; docs/SPEC_V4.md K-44): the drawing of its venue's kind,
// filling the card behind its tags and plate, cut from the top.
export function EventCover({ kind }: { kind: CoverKind }) {
  const { colors } = useTheme();
  const ast = coverAst(kind);
  return (
    <View
      accessible={false}
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: colors.surface2 }]}
    >
      {ast ? <SvgAst ast={ast} override={{ width: '100%', height: '100%' }} /> : null}
    </View>
  );
}
