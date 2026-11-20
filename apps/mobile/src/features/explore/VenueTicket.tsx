import { type ReactNode, useState } from 'react';
import { Image, type ImageSourcePropType, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { useKit } from '@/aura/kit';
import type { venueType } from '@/lib/venueType';
import { EXPLORE } from '@/theme/explore';

// The ticket's picture block, the venue's type picture (the list rows' own files).
export const TICKET_PICTURE: Record<ReturnType<typeof venueType>, ImageSourcePropType> = {
  kafe: require('../../../assets/riso/venue-kafe.webp') as ImageSourcePropType,
  cay: require('../../../assets/riso/venue-cay.webp') as ImageSourcePropType,
  yemek: require('../../../assets/riso/venue-yemek.webp') as ImageSourcePropType,
  kampus: require('../../../assets/riso/venue-kampus.webp') as ImageSourcePropType,
};

// A venue as a cinema ticket, the map's card as the board draws it (KesfetHarita `.vc`) and, since
// 20 Kasım (the owner's ask), each venue of Keşfet's list. The picture's block at the left
// edge, a notch at the top and foot of the perforation 104 in with a dashed line between them, then
// the 56 picture, the words and the round; the face white (the dark scheme's #121614) with the
// shape cut out of it, so the map shows through the notches; no shadow (the board's mask cuts it).
export function VenueTicket({
  testID,
  picture,
  compact,
  children,
}: {
  testID?: string;
  picture: ImageSourcePropType;
  // The list's lower ticket (theme/explore.ts → row.ticket); the map's card is the full one.
  compact?: boolean;
  children: ReactNode;
}) {
  const { scheme } = useKit();
  const m = EXPLORE.map;
  const small = EXPLORE.row.ticket;
  const k = compact ? { ...m.ticket, ...small } : m.ticket;
  const minHeight = compact ? small.minHeight : m.cardMinHeight;
  const pad = compact ? small.pad : m.cardPad;
  const gap = compact ? small.gap : m.cardGap;
  const face = EXPLORE[scheme].solid;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const { w, h } = box;
  const r = compact ? small.radius : m.cardRadius;
  const n = k.notch;
  // Clockwise from the top left, the notches bitten into the top and foot edges.
  const shape =
    `M${r} 0H${k.cut - n}A${n} ${n} 0 0 0 ${k.cut + n} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}` +
    `V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${k.cut + n}A${n} ${n} 0 0 0 ${k.cut - n} ${h}` +
    `H${r}A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
  return (
    <View
      testID={testID}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={{
        minHeight,
        // The list's tickets are all one height.
        height: compact ? small.minHeight : undefined,
        flexDirection: 'row',
        alignItems: 'center',
        gap,
        paddingVertical: pad,
        paddingRight: pad,
        paddingLeft: k.block + k.blockGap + gap,
      }}
    >
      {w > 0 ? (
        <Svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Path d={shape} fill={face.fill} stroke={face.edge} strokeWidth={1} />
          <Line
            x1={k.cut}
            x2={k.cut}
            y1={k.lineIn}
            y2={h - k.lineIn}
            stroke={scheme === 'light' ? k.lineLight : k.lineDark}
            strokeWidth={k.line}
            strokeDasharray={k.dash.join(' ')}
          />
        </Svg>
      ) : null}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: k.block,
          borderTopLeftRadius: r,
          borderBottomLeftRadius: r,
          overflow: 'hidden',
        }}
      >
        <Image
          source={picture}
          fadeDuration={0}
          resizeMode="cover"
          accessible={false}
          style={{ width: k.block, height: '100%' }}
        />
      </View>
      {children}
    </View>
  );
}
