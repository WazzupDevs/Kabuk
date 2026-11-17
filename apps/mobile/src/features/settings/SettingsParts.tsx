import { Children, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Li, type SegBoard, Switch, T, useKit } from '@/aura/kit';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Tap } from '@/motion/Tap';
import { KIT } from '@/theme/auraKit';
import { SETTINGS } from '@/theme/settings';
import { SPACING } from '@/theme/tokens';

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
export function Group({
  children,
  hairIn = SETTINGS.row.hairIn,
}: {
  children: ReactNode;
  // Where the hairline starts: under the words by default, 0 for switch rows, after the face in a
  // person's list.
  hairIn?: number;
}) {
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
                marginLeft: hairIn,
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
  testID?: string;
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

// A page of Ayarlar's family (Bildirim ayarları, Gizlilik, Engellenenler, Sessize alınanlar; yeni
// arayüz tuvali, `.pg` / `.ptop`): the ground without clouds, the back button and the title on one
// bar, the content from the page's side as Ayarlar has it. `list`: the page is a list and scrolls.
export function SettingsPage({
  title,
  sub,
  list,
  children,
}: {
  title: string;
  // Under the title on the bar (MasaDavet: the table and its seats).
  sub?: string;
  list?: boolean;
  children: ReactNode;
}) {
  const P = SETTINGS.page;
  return (
    <Screen
      plain
      list={list}
      side={P.side}
      barSide={P.barSide}
      barTop={P.barTop}
      padTop={P.top - SPACING[1]}
      top={
        <PageTop
          title={title}
          sub={sub}
          inline={{ row: P.barRow, back: KIT.size.round, gap: P.barGap }}
        />
      }
    >
      {children}
    </Screen>
  );
}

// A switch row (`.sr.tr2`): the name over its line, the switch at the right; the whole row is the
// switch. 56 at least, 10 above and under.
export function SwitchRow({
  label,
  hint,
  value,
  disabled,
  onChange,
  testID,
  loading,
}: {
  label: string;
  hint: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  testID: string;
  // Not known yet: the switch waits (disabled) and shows off.
  loading?: boolean;
}) {
  const { c } = useKit();
  const off = disabled || loading;
  return (
    <Tap
      testID={testID}
      feel="selection"
      sink={false}
      accessibilityRole="switch"
      accessibilityLabel={`${label}. ${hint}`}
      accessibilityState={{ checked: value, disabled: !!off }}
      disabled={off}
      onPress={() => onChange(!value)}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SETTINGS.row.gap,
          minHeight: SETTINGS.row.height,
          paddingVertical: SPACING[2.5],
        }}
      >
        <View style={{ flex: 1, gap: SPACING[0.5] }}>
          <T v="settingsRow" ink>
            {label}
          </T>
          <T v="fine" color={c.muted}>
            {hint}
          </T>
        </View>
        <Switch on={value} disabled={off} />
      </View>
    </Tap>
  );
}

// The line under a list page's title (`.lede`: 14/500, the muted ink, 2 under the bar).
export function Lede({ children }: { children: string }) {
  const { c } = useKit();
  return (
    <T v="note" color={c.muted} style={{ marginTop: SPACING[0.5] }}>
      {children}
    </T>
  );
}

// A person's row in Engellenenler and Sessize alınanlar (`.ur`): the face, the name over its line,
// the small button at the right; 64 at least, 12 apart. They stand in a `Group` whose hairline
// starts after the face (`PERSON_HAIR`).
export function PersonRow({
  face,
  name,
  line,
  action,
}: {
  face: ReactNode;
  name: string;
  line: string;
  action: ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[3],
        minHeight: KIT.size.lrMin,
      }}
    >
      {face}
      <View style={{ flex: 1 }}>
        <T v="settingsRow" ink>
          {name}
        </T>
        <T v="fine">{line}</T>
      </View>
      {action}
    </View>
  );
}
export const PERSON_HAIR = KIT.size.av.md + SPACING[3];
