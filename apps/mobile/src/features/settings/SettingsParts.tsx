import { Children, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Li, type SegBoard, T, useKit } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { SETTINGS } from '@/theme/settings';

// Ayarlar's parts as the new board draws them (yeni arayüz tuvali, Ayarlar.dc.html;
// theme/settings.ts): its seg, its rows on the ground, its section heads and its notes; Görünüm
// takes them too.
// The board's seg (`.seg`): a sunk track, its parts 36 high and 4 apart, the chosen one the kit's
// (the ink with white words; in the dark the 94 % white).
export function segBoard(scheme: 'light' | 'dark'): SegBoard {
  const S = SETTINGS.seg;
  return {
    item: S.item,
    radius: S.item / 2 + KIT.size.segPad,
    type: 'btnSm',
    face: { fill: SETTINGS[scheme].track, edge: '', inset: '', shadow: '' },
    onShadow: KIT[scheme].segShadow || undefined,
    track: SETTINGS[scheme].track,
    gap: S.gap,
  };
}

// Rows one under another on the ground (`.sl`), a hairline between them from the words to the
// row's right edge.
export function Group({ children }: { children: ReactNode }) {
  const { scheme } = useKit();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View>
      {rows.map((row, i) => (
        <View key={isValidElement(row) && row.key !== null ? row.key : i}>
          {i > 0 ? (
            <View
              style={{
                height: KIT.size.hair,
                marginLeft: SETTINGS.row.hairIn,
                backgroundColor: SETTINGS[scheme].hair,
              }}
            />
          ) : null}
          {row}
        </View>
      ))}
    </View>
  );
}

// A row (`.sr`): its icon in the ink (in red for Çıkış yap), its words, and the chevron where it
// opens a page.
export function SettingsPageRow({
  testID,
  icon,
  label,
  onPress,
  danger,
}: {
  testID: string;
  icon: CapIconName;
  label: string;
  onPress: () => void;
  // Çıkış yap: the soft danger's ink, no chevron.
  danger?: boolean;
}) {
  const { c } = useKit();
  const R = SETTINGS.row;
  const ink = danger ? c.onDangerSoft : c.ink;
  return (
    <Li
      testID={testID}
      onPress={onPress}
      accessibilityLabel={label}
      padY={0}
      padX={0}
      gap={R.gap}
      minHeight={R.height}
    >
      <CapIcon name={icon} color={ink} size={R.icon} />
      <View style={{ flex: 1 }}>
        <T v="settingsRow" color={ink}>
          {label}
        </T>
      </View>
      {danger ? null : <CapIcon name="forward" color={c.muted} size={R.chevron} />}
    </Li>
  );
}

// A section's head (`.sh3`): in small letters, 13/700, the muted ink; 26 under what is above it
// and 8 over its seg.
export function Eyebrow({ label }: { label: string }) {
  const { c } = useKit();
  const E = SETTINGS.section;
  return (
    <T
      v="sectionHead"
      color={c.muted}
      accessibilityRole="header"
      style={{ marginTop: E.top, marginBottom: E.bottom }}
    >
      {label}
    </T>
  );
}

// A note under a seg (`.nt`: 13/500, the muted ink).
export function Note({ children, color }: { children: string; color?: string }) {
  const { c } = useKit();
  return (
    <T v="fine" color={color ?? c.muted}>
      {children}
    </T>
  );
}
export const NOTES = {
  marginTop: SETTINGS.note.top,
  gap: SETTINGS.note.gap,
} as const;
