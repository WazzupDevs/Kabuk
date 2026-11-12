import { upperTr } from '@shared/trText.ts';
import { Children, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { Glass, type SegBoard, T, useKit } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { SETTINGS } from '@/theme/settings';

// Ayarlar's parts as the board draws them (tuval Ayarlar, theme/settings.ts): its seg, its white
// group card, its eyebrows and its notes; Görünüm takes them too.
// The board's seg (tuval Ayarlar): a sunk track 46 high, its parts flush, the chosen one white.
export function segBoard(scheme: 'light' | 'dark'): SegBoard {
  return {
    item: SETTINGS.seg.item,
    radius: SETTINGS.seg.radius,
    type: 'segPick',
    face: SETTINGS[scheme].card,
    onShadow: SETTINGS[scheme].segOnShadow || undefined,
    track: SETTINGS[scheme].segTrack,
    gap: SETTINGS.seg.gap,
  };
}

// A group of rows on one white card (iskelet.md → 3.4), a hairline between them from the words to the card's edge.
export function Group({ children }: { children: ReactNode }) {
  const { scheme } = useKit();
  const look = SETTINGS[scheme];
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <Glass
      face={look.card}
      keepFace
      radius={SETTINGS.card.radius}
      style={{ overflow: 'hidden', borderRadius: SETTINGS.card.radius }}
    >
      {rows.map((row, i) => (
        <View key={isValidElement(row) && row.key !== null ? row.key : i}>
          {i > 0 ? (
            <View
              style={{
                height: KIT.size.hair,
                marginLeft: SETTINGS.row.hairIn,
                backgroundColor: look.hair,
              }}
            />
          ) : null}
          {row}
        </View>
      ))}
    </Glass>
  );
}

// A section's eyebrow (12/800, 0.1em), 18 under what is above it and 8 over its seg.
export function Eyebrow({ label }: { label: string }) {
  const { scheme } = useKit();
  const E = SETTINGS.eyebrow;
  return (
    <T
      v="sheetEyebrow"
      color={SETTINGS[scheme].eyebrow}
      accessibilityRole="header"
      style={{ marginTop: E.top, marginBottom: E.bottom, marginLeft: E.in }}
    >
      {upperTr(label)}
    </T>
  );
}

// A note under a seg or a group (12.5/500, 1.45).
export function Note({ children, color }: { children: string; color?: string }) {
  const { scheme } = useKit();
  return (
    <T v="boxNote" color={color ?? SETTINGS[scheme].note}>
      {children}
    </T>
  );
}
export const NOTES = {
  marginTop: SETTINGS.note.top,
  marginHorizontal: SETTINGS.note.in,
  gap: SETTINGS.note.gap,
} as const;
