import { type ReactNode } from 'react';
import { View } from 'react-native';

import { Glass } from '@/aura/kit';
import type { ExploreFace } from '@/theme/explore';

import { MorphCard, useMorphSlot } from './PinReveal';

// Mekan's table card and venue chat (the owner's design, 24 Kasım): in the page each is its open
// card and scrolls with it; once the page has scrolled them under the bar, the screen's pinned
// stack (PinMorph) draws them shrinking into their strips under the switch, and growing back as the
// page scrolls down. Inside the stack a card morphs (MorphCard); in the page it is its open card.
export function CollapsingCard({
  folded,
  radius,
  face,
  testID,
  children,
}: {
  // Its strip's height (the stack gives it: PinMorph → strip).
  strip: number;
  folded: ReactNode;
  radius: number;
  stripRadius?: number;
  // A board's own face (theme/venue.ts: the table card's white and its one shadow).
  face?: ExploreFace;
  at?: number;
  band?: number;
  testID?: string;
  children: ReactNode;
}) {
  const slot = useMorphSlot();
  if (slot) {
    return (
      <MorphCard
        slot={slot}
        open={children}
        folded={folded}
        radius={radius}
        frame={(height) => (
          <Glass radius={radius} face={face} style={height === null ? { flex: 1 } : { height }} />
        )}
      />
    );
  }
  return (
    <View testID={testID}>
      <Glass radius={radius} face={face}>
        <View style={{ borderRadius: radius, overflow: 'hidden' }}>{children}</View>
      </Glass>
    </View>
  );
}

// Whether this card is the pinned stack's copy (it then listens to nothing of its own).
export function useInStrip(): boolean {
  return useMorphSlot() !== null;
}

// A part of a scrolling screen drawn over the parts after it (Screen: a sticky field over what
// flows under it).
export function PinLayer({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
