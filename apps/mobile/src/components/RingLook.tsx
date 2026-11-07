import { type ReactNode, useMemo } from 'react';
import { View } from 'react-native';

import { CARD_BOX, lookCard, lookGround } from '@/theme/capsuleLook';

import { FxSvg } from './FxSvg';

// A capsule in a ring with its head and its accessories reaching over it (the owner's call, 7
// Kasım: as on the gift card): the ring's ground, and over it the capsule cut by the ring at its
// foot, free above it, the accessories with a thin contour, an Efsanevi's halo inside the ring. The
// stage reaches over the ring's box (CARD_BOX): its parent must not clip. `inset` is the width of
// a ring drawn round the box (Av's white edge), so the capsule stands in what is inside it.
export function RingLook({
  look,
  size,
  inset = 0,
  ground = true,
  accessibilityLabel,
}: {
  look: string;
  size: number;
  inset?: number;
  // Draw the ring's own ground (the look's colour); off where the ring has one.
  ground?: boolean;
  accessibilityLabel?: string;
}) {
  const xml = useMemo(() => lookCard(look), [look]);
  const unit = (size - inset * 2) / 48;
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size }}
    >
      {ground ? (
        <View
          style={{
            position: 'absolute',
            inset,
            borderRadius: size / 2,
            backgroundColor: lookGround(look),
          }}
        />
      ) : null}
      <RingStage xml={xml} unit={unit} inset={inset} />
    </View>
  );
}

// The stage alone, placed on a ring of `unit` × 48 starting `inset` in.
export function RingStage({
  xml,
  unit,
  inset = 0,
  children,
}: {
  xml: string;
  unit: number;
  inset?: number;
  children?: (width: number, height: number) => ReactNode;
}) {
  const width = CARD_BOX.width * unit;
  const height = CARD_BOX.height * unit;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: inset + CARD_BOX.x * unit,
        top: inset + CARD_BOX.y * unit,
        width,
        height,
      }}
    >
      {children ? children(width, height) : <FxSvg xml={xml} width={width} height={height} />}
    </View>
  );
}
