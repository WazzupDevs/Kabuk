import { type ReactNode, useState } from 'react';
import { Image, type ImageSourcePropType, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, Pattern } from 'react-native-svg';

import { useKit } from '@/aura/kit';
import type { venueType } from '@/lib/venueType';
import { EXPLORE } from '@/theme/explore';
import { RISO_PAPER, TICKET, TICKET_TONE } from '@/theme/profileCover';

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
// shape cut out of it, so the map shows through the notches. Since 23 Kasım (the owner's ask) it
// stands as the profile's capsule ticket does (IdentityTicket): the riso paper, the 2 edge and the
// scheme's print 4 right and 5 down under it, the dashed perforation in the edge's ink.
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
  const tone = TICKET_TONE[scheme];
  const [box, setBox] = useState({ w: 0, h: 0 });
  const { w, h } = box;
  const r = compact ? small.radius : m.cardRadius;
  const n = k.notch;
  const e = TICKET.edgeWidth / 2;
  const ox = TICKET.printX;
  const oy = TICKET.printY;
  const cell = RISO_PAPER.cell;
  // Clockwise from the top left, the notches bitten into the top and foot edges; inset by the
  // edge's half so its stroke stays inside, moved by (x, y) for the print.
  const shape = (x: number, y: number) => {
    const L = x + e;
    const Tp = y + e;
    const R = x + w - e;
    const B = y + h - e;
    const c = x + k.cut;
    return (
      `M${L + r} ${Tp}H${c - n}A${n} ${n} 0 0 0 ${c + n} ${Tp}H${R - r}A${r} ${r} 0 0 1 ${R} ${Tp + r}` +
      `V${B - r}A${r} ${r} 0 0 1 ${R - r} ${B}H${c + n}A${n} ${n} 0 0 0 ${c - n} ${B}` +
      `H${L + r}A${r} ${r} 0 0 1 ${L} ${B - r}V${Tp + r}A${r} ${r} 0 0 1 ${L + r} ${Tp}Z`
    );
  };
  return (
    <View
      testID={testID}
      onLayout={(ev) => setBox({ w: ev.nativeEvent.layout.width, h: ev.nativeEvent.layout.height })}
      style={{
        minHeight,
        // Every ticket of a kind is one height: the list's and the map's (the owner's ask, 24
        // Kasım: the map's cards were each their own size).
        height: minHeight,
        // Room for the print at the right (as the profile's ticket).
        marginRight: ox,
        flexDirection: 'row',
        alignItems: 'center',
        gap,
        paddingVertical: pad,
        paddingRight: pad,
        paddingLeft: k.block + k.blockGap + gap,
      }}
    >
      {w > 0 ? (
        <Svg
          width={w + ox}
          height={h + oy}
          style={{ position: 'absolute', left: 0, top: 0 }}
          importantForAccessibility="no-hide-descendants"
        >
          <Defs>
            {/* The riso halftone on the paper (iskelet.md → 2.5). */}
            <Pattern id="venue-tram" width={cell} height={cell} patternUnits="userSpaceOnUse">
              <Circle cx={cell / 4} cy={cell / 4} r={RISO_PAPER.dot} fill={tone.dots} />
              <Circle cx={(3 * cell) / 4} cy={(3 * cell) / 4} r={RISO_PAPER.dot} fill={tone.dots} />
            </Pattern>
          </Defs>
          <Path d={shape(ox, oy)} fill={tone.print} />
          <Path d={shape(0, 0)} fill={tone.paper} />
          <Path d={shape(0, 0)} fill="url(#venue-tram)" />
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
      {/* The edge and the perforation over the picture's block, as the profile ticket's. */}
      {w > 0 ? (
        <Svg
          width={w}
          height={h}
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: 0 }}
          importantForAccessibility="no-hide-descendants"
        >
          <Path d={shape(0, 0)} fill="none" stroke={tone.edge} strokeWidth={TICKET.edgeWidth} />
          <Line
            x1={k.cut}
            x2={k.cut}
            y1={k.lineIn}
            y2={h - k.lineIn}
            stroke={tone.dash}
            strokeWidth={TICKET.dashWidth}
            strokeDasharray={k.dash.join(' ')}
          />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}
