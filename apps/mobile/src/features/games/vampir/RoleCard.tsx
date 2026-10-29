import { sideOf, type VampirRole } from '@shared/vampir.ts';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { KIT_TYPE } from '@/theme/auraKit';
import { VAMPIR_LOOK as L } from '@/theme/vampir';
import { PEEK_CARD_SVG, TABLE } from '@/theme/vampirTable';

import { ROLE_ART } from './roleArt';
import { TableRound } from './RoundTable';

const MAX_FONT = 1.3;

// "Rolüm" at the top right: the table's round with the card in it (the file's ICON.card); held, a
// small card with the role's picture, name and side.
export function PeekRole({ role }: { role: VampirRole }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TableRound
        label={tr.vampir.myRoleLabel}
        xml={PEEK_CARD_SVG}
        on={open}
        onPressIn={() => {
          setOpen(true);
          haptic('selection');
        }}
        onPressOut={() => setOpen(false)}
        testID="vampir-peek"
      />
      {open ? (
        <View pointerEvents="none" style={styles.pop}>
          <Image source={ROLE_ART[role]} style={styles.popArt} resizeMode="cover" />
          <View>
            <Text maxFontSizeMultiplier={MAX_FONT} style={[KIT_TYPE.h3, { color: L.dark }]}>
              {tr.vampir.roles[role].name}
            </Text>
            <Text
              maxFontSizeMultiplier={MAX_FONT}
              style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.muted }]}
            >
              {tr.vampir.teams[sideOf(role)]}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pop: {
    position: 'absolute',
    right: 0,
    top: TABLE.bar + 8,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 18,
    backgroundColor: L.tileOn,
    boxShadow: L.shadow.pop,
  },
  popArt: { width: L.size.popArt * 0.75, height: L.size.popArt, borderRadius: 8 },
});
