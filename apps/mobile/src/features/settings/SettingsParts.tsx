import { Children, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { type AvBoard, Btn, Li, type SegBoard, Switch, T, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
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
// opens a page (none on a red row nor with `chevron={false}`). `loading`: pressed and waiting, the
// meeting capsules in the chevron's place and a second press does nothing.
export function SettingsPageRow({
  testID,
  icon,
  label,
  onPress,
  danger,
  chevron = !danger,
  loading,
}: {
  testID?: string;
  icon: CapIconName;
  label: string;
  onPress: () => void;
  // Çıkış yap: the soft danger's ink, no chevron.
  danger?: boolean;
  chevron?: boolean;
  loading?: boolean;
}) {
  const { c } = useKit();
  const R = SETTINGS.row;
  const ink = danger ? c.onDangerSoft : c.ink;
  return (
    <Li
      testID={testID}
      onPress={loading ? undefined : onPress}
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
      {loading ? (
        <Loader kind="meet" size={R.chevron} delay={0} label={null} />
      ) : chevron ? (
        <CapIcon name="forward" color={c.muted} size={R.chevron} />
      ) : null}
    </Li>
  );
}

// A row that cannot be changed here (Hesap `.sr.inf`): the icon, the value over its name (16/22 600
// over 13/18 500 muted) and the lock at the right.
export function InfoRow({
  icon,
  label,
  value,
}: {
  icon: CapIconName;
  label: string;
  value: string;
}) {
  const { c } = useKit();
  const R = SETTINGS.row;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: R.gap, minHeight: R.height }}
    >
      <CapIcon name={icon} color={c.ink} size={R.icon} />
      <View style={{ flex: 1, gap: SPACING[0.5] }}>
        <T v="settingsValue" ink>
          {value}
        </T>
        <T v="fine" color={c.muted}>
          {label}
        </T>
      </View>
      <View style={{ opacity: SETTINGS.lock.opacity }}>
        <CapIcon name="lock" color={c.muted} size={SETTINGS.lock.size} />
      </View>
    </View>
  );
}

// Telefon bildirimleri's state (`.stt`): a dot and the word on the soft green, a pill.
export function StatusPill({ label }: { label: string }) {
  const { scheme } = useKit();
  const S = SETTINGS.status;
  const look = SETTINGS[scheme].status;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: S.gap,
        height: S.height,
        paddingHorizontal: S.padX,
        borderRadius: S.height / 2,
        backgroundColor: look.bg,
      }}
    >
      <View
        style={{ width: S.dot, height: S.dot, borderRadius: S.dot / 2, backgroundColor: look.fg }}
      />
      <T v="tag" color={look.fg}>
        {label}
      </T>
    </View>
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
  const { c, scheme } = useKit();
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
        <Switch on={value} disabled={off} look={SETTINGS[scheme].switch} />
      </View>
    </Tap>
  );
}

// The line under a list page's title (`.lede`: 14/500, the muted ink, 2 under the bar).
export function Lede({ children }: { children: string }) {
  const { c } = useKit();
  return (
    <T v="note" color={c.muted} style={{ marginTop: SPACING[0.5] - SETTINGS.page.listPull }}>
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
      <View style={{ flex: 1, gap: SPACING[0.5] }}>
        <T v="settingsRow" ink>
          {name}
        </T>
        <T v="fine">{line}</T>
      </View>
      {action}
    </View>
  );
}
// The person's face (`.uav`): the plain 44 disc, no ring and no shadow.
export const PERSON_FACE: AvBoard = { ring: 0, ringColor: 'transparent', shadow: '' };
export const PERSON_HAIR = KIT.size.av.md + SPACING[3];
// The row's small soft button (`.ur .btn.soft`: 14 inside, 13/16 600; the board's 34 high; in
// the dark the flat #1B211F with the ink's words).
const PERSON_BTN = {
  type: 'toastBtn',
  padLeft: SETTINGS.personBtn.padX,
  padRight: SETTINGS.personBtn.padX,
} as const;
export function PersonButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { c, scheme } = useKit();
  const dark = scheme === 'dark';
  return (
    <Btn
      bar={KIT.size.rowBtnMd}
      variant="glassy"
      look={PERSON_BTN}
      fill={dark ? SETTINGS.dark.track : undefined}
      tint={dark ? c.ink : undefined}
      label={label}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      // In the row's middle (`.ur` centres it).
      style={{ alignSelf: 'center' }}
    />
  );
}

// Under a list page's line, the style of what fills the rest of the page (a Screen's part that
// grows): the rows 12 under it, or the empty state centred in the room down to the board's 190 from
// the screen's foot (`.emp`).
export function listArea(empty: boolean) {
  return {
    flexGrow: 1,
    marginTop: SPACING[3],
    justifyContent: empty ? 'center' : 'flex-start',
    paddingBottom: empty ? SETTINGS.empty.bottom : 0,
  } as const;
}
