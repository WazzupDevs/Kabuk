import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { tr } from '@/i18n/tr';
import {
  V46_BUTTONS,
  V46_EXPLORE,
  type V46ButtonId,
  type V46TabKey,
  type V46ThumbKind,
} from '@/theme/parts.generated';
import { V46_COMPONENTS } from '@/theme/tokens.generated';
import type { GalleryId } from '@/theme/v46Gallery';
import { Button, type ButtonLook } from '@/ui/Button';
import { CityButton } from '@/ui/CityButton';
import { FilterChips } from '@/ui/FilterChips';
import { HereCard } from '@/ui/HereCard';
import { LiveDot } from '@/ui/LiveDot';
import { useNarrow } from '@/ui/narrow';
import { RoundButton } from '@/ui/RoundButton';
import { SearchField } from '@/ui/SearchField';
import { SendButton } from '@/ui/SendButton';
import { TabBar, type TabBarItem, UnreadDot } from '@/ui/TabBar';
import { TopBar } from '@/ui/TopBar';
import { VenueList } from '@/ui/VenueList';
import { VenueRow } from '@/ui/VenueRow';
import { VenueThumb } from '@/ui/VenueThumb';
import { type ViewMode, ViewModeToggle } from '@/ui/ViewModeToggle';

// What the v46 gallery draws for a component once it is rewritten in src/ui (v46 native, step 3):
// each state v46 shows for it (envanter `variants`: normal, pressed; the send button also ready),
// with v46's sample data. A component not here shows as "henüz yok" with v46's measurements. The
// visual gate photographs each one's first state (features/design/gorsel/registry.tsx). The
// motions that play on an event play here on a press: a disabled button shakes, the bell swings
// and its count grows, the ready send button sends.
// `wide`: drawn as wide as the screen (a head), not as wide as its content.
export type GalleryState = {
  key: 'normal' | 'pressed' | 'ready';
  render: () => ReactNode;
  wide?: boolean;
};

const s = tr.design.gallery.samples;
const noop = () => undefined;

// A full-width button in the width v46 gives it there: at 360 its measured width, at v46's narrow
// width the one it has there.
function Wide({ id, children }: { id: V46ButtonId; children: ReactNode }) {
  const narrow = useNarrow();
  const width = (narrow ? V46_BUTTONS[id].narrow?.width : null) ?? V46_COMPONENTS[id].width;
  return <View style={{ width, maxWidth: '100%' }}>{children}</View>;
}

type ButtonSample = {
  look: ButtonLook;
  label: string;
  wide?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

// The inventory's text button ids with the look, sample text and state each draws (every one: the
// type says so).
const BUTTONS: Record<
  Exclude<V46ButtonId, 'yuvarlak-geri' | 'yuvarlak-simge' | 'gonder'>,
  ButtonSample
> = {
  'birincil-52': { look: 'birincil-52', label: s.start, wide: true },
  'birincil-52-yukleniyor': { look: 'birincil-52', label: s.sendCode, wide: true, loading: true },
  'birincil-52-pasif': { look: 'birincil-52', label: s.sendCode, wide: true, disabled: true },
  'birincil-48': { look: 'birincil-48', label: s.setUp, wide: true },
  'birincil-48-pasif': { look: 'birincil-48', label: s.save, wide: true, disabled: true },
  'birincil-48-15': { look: 'birincil-48-15', label: s.newTable, wide: true },
  'birincil-36': { look: 'birincil-36', label: s.invite },
  'yumusak-beyaz': { look: 'yumusak-beyaz', label: s.backToVenue, wide: true },
  'yumusak-lavanta': { look: 'yumusak-lavanta', label: s.cancel, wide: true },
  'yumusak-36': { look: 'yumusak-36', label: s.unblock },
  tehlike: { look: 'tehlike', label: s.endTable, wide: true },
  'tehlike-yumusak': { look: 'tehlike-yumusak', label: s.end },
  basari: { look: 'basari', label: s.friends, wide: true },
  'kenarli-36': { look: 'kenarli-36', label: s.invite },
  'kenarli-44': { look: 'kenarli-44', label: s.editProfile, wide: true },
  baglanti: { look: 'baglanti', label: s.read },
};

function pressable(id: V46ButtonId, draw: (pressed: boolean) => ReactNode): GalleryState[] {
  const states: GalleryState[] = [{ key: 'normal', render: () => draw(false) }];
  if ((V46_COMPONENTS[id].variants as readonly string[]).includes('pressed')) {
    states.push({ key: 'pressed', render: () => draw(true) });
  }
  return states;
}

function buttonStates(id: V46ButtonId, b: ButtonSample): GalleryState[] {
  return pressable(id, (pressed) => {
    const button = (
      <Button
        look={b.look}
        label={b.label}
        onPress={noop}
        disabled={b.disabled}
        loading={b.loading}
        block={b.wide}
        pressedPreview={pressed}
      />
    );
    return b.wide ? <Wide id={id}>{button}</Wide> : button;
  });
}

// The tab bar as v46 draws it on each tab's screen: that tab selected, Mesajlar with its unread dot
// (v46's sample data has an unread message on every screen). A press selects the tab, so the Mekan
// mark's slide can be seen. Without a blur target: v46's gallery draws it over an empty ground.
const TAB_ITEMS: readonly TabBarItem[] = (
  ['explore', 'activities', 'venue', 'messages', 'profile'] as const
).map((key) => ({ key, label: tr.tabs[key], unread: key === 'messages' }));

function SampleTabBar({ selected }: { selected: V46TabKey }) {
  const [tab, setTab] = useState(selected);
  return <TabBar items={TAB_ITEMS} selected={tab} onPress={setTab} />;
}

// The list/map switch; a press switches it.
function SampleViewMode({ mode }: { mode: ViewMode }) {
  const [value, setValue] = useState(mode);
  return <ViewModeToggle value={value} onChange={setValue} labels={s.views} />;
}

const tabBar = (selected: V46TabKey): readonly GalleryState[] => [
  { key: 'normal', render: () => <SampleTabBar selected={selected} /> },
];

// A head as wide as the screen; `gorsel-ust-row` is its title's row (the visual gate's crop).
const head = (render: () => ReactNode): readonly GalleryState[] => [
  { key: 'normal', render, wide: true },
];

const NAVIGATION: Partial<Record<GalleryId, readonly GalleryState[]>> = {
  'alt-sekme-kesfet': tabBar('explore'),
  'alt-sekme-aktiviteler': tabBar('activities'),
  'alt-sekme-mekan': tabBar('venue'),
  'alt-sekme-mesajlar': tabBar('messages'),
  'alt-sekme-profil': tabBar('profile'),
  'bildirim-noktasi': [{ key: 'normal', render: () => <UnreadDot /> }],
  'ust-kesfet': head(() => (
    <TopBar
      kind="explore"
      title={tr.tabs.explore}
      right={<SampleViewMode mode="list" />}
      testID="gorsel-ust"
    />
  )),
  'ust-aktiviteler': head(() => (
    <TopBar kind="activities" title={tr.tabs.activities} testID="gorsel-ust" />
  )),
  'ust-mesajlar': head(() => (
    <TopBar
      kind="messages"
      title={tr.tabs.messages}
      right={<Bell pressed={false} />}
      testID="gorsel-ust"
    />
  )),
  'ust-alt': head(() => (
    <TopBar kind="sub" title={s.privacy} onBack={noop} backLabel={s.back} testID="gorsel-ust" />
  )),
  'ust-alt-sayili': head(() => (
    <TopBar
      kind="sub"
      title={s.friendsTitle}
      count={s.friendsCount}
      onBack={noop}
      backLabel={s.back}
      testID="gorsel-ust"
    />
  )),
  'liste-harita': [{ key: 'normal', render: () => <SampleViewMode mode="list" /> }],
  'liste-harita-harita': [{ key: 'normal', render: () => <SampleViewMode mode="map" /> }],
};

// Keşfet's parts with v46's sample data (its list in its own order, each row's icon as v46 draws
// it). The search is live: type in it; a chip or the city button answers a press.
const VENUE_THUMBS: readonly V46ThumbKind[] = ['cay', 'kafe', 'kafe', 'kafe', 'yemek'];
const QUIET = tr.explore.buckets.calm;

function SampleSearch({ word = '', focused = false }: { word?: string; focused?: boolean }) {
  const [value, setValue] = useState(word);
  return (
    <SearchField
      value={value}
      onChangeText={setValue}
      placeholder={tr.explore.search}
      focusedPreview={focused}
    />
  );
}

function SampleChips() {
  const [kind, setKind] = useState<'all' | 'campus' | 'cafe'>('all');
  const k = tr.explore.kinds;
  return (
    <FilterChips
      items={[
        { key: 'all', label: k.all },
        { key: 'campus', label: k.campus },
        { key: 'cafe', label: k.cafe },
      ]}
      value={kind}
      onChange={setKind}
    />
  );
}

// A row in the list's card, as v46 draws it there; `gorsel-satir` is the row (the gate's crop).
const venueRow = (i: number, pressed = false) => {
  const v = s.venues[i];
  const thumb = VENUE_THUMBS[i];
  if (!v || !thumb) return null;
  return (
    <VenueList>
      <VenueRow
        thumb={thumb}
        name={v.name}
        sub={v.sub}
        status={{ text: v.status, live: v.status !== QUIET }}
        index={0}
        onPress={noop}
        pressedPreview={pressed}
        testID="gorsel-satir"
      />
    </VenueList>
  );
};

// v46's side padding on its screens (the chips reach past it by as much).
const SIDE = -V46_EXPLORE.light.chips.margin[3];

// Within the screen's side padding, where v46 puts it (Keşfet's search, list and cards);
// `gorsel-parca` is the part itself (the visual gate's crop).
const padded = (render: () => ReactNode, key: GalleryState['key'] = 'normal'): GalleryState => ({
  key,
  wide: true,
  render: () => (
    <View style={{ paddingHorizontal: SIDE }}>
      <View testID="gorsel-parca">{render()}</View>
    </View>
  ),
});

const EXPLORE: Partial<Record<GalleryId, readonly GalleryState[]>> = {
  arama: [padded(() => <SampleSearch />)],
  'arama-odak': [padded(() => <SampleSearch focused />)],
  'arama-dolu': [padded(() => <SampleSearch word={s.searchWord} />)],
  // As wide as the screen: the row reaches past the side padding by itself.
  'suzgec-cipleri': [
    {
      key: 'normal',
      wide: true,
      render: () => (
        <View style={{ paddingHorizontal: SIDE }}>
          <SampleChips />
        </View>
      ),
    },
  ],
  'sehir-secici': [
    padded(() => (
      <CityButton label={s.place} count={s.venueCount} onPress={noop} rowTestID="gorsel-sehir" />
    )),
  ],
  'mekan-listesi': [
    padded(() => (
      <VenueList>
        {s.venues.map((v, i) => {
          const thumb = VENUE_THUMBS[i];
          return thumb ? (
            <VenueRow
              key={v.name}
              thumb={thumb}
              name={v.name}
              sub={v.sub}
              status={{ text: v.status, live: v.status !== QUIET }}
              index={i}
              onPress={noop}
            />
          ) : null;
        })}
      </VenueList>
    )),
  ],
  'mekan-satiri': [padded(() => venueRow(0)), padded(() => venueRow(0, true), 'pressed')],
  'mekan-satiri-sessiz': [padded(() => venueRow(3))],
  'mekan-simgesi-kafe': [{ key: 'normal', render: () => <VenueThumb kind="kafe" /> }],
  'mekan-simgesi-cay': [{ key: 'normal', render: () => <VenueThumb kind="cay" /> }],
  'mekan-simgesi-yemek': [{ key: 'normal', render: () => <VenueThumb kind="yemek" /> }],
  'mekan-simgesi-kampus': [{ key: 'normal', render: () => <VenueThumb kind="kampus" /> }],
  'su-an-buradasin': [
    padded(() => (
      <HereCard
        label={tr.explore.here}
        thumb="kampus"
        name={s.hereName}
        sub={s.hereSub}
        action={tr.explore.backToVenue}
        onPress={noop}
      />
    )),
  ],
  'canli-nokta': [
    { key: 'normal', render: () => <LiveDot size={V46_EXPLORE.light.here.label.dot} /> },
  ],
};

export const UI_GALLERY: Partial<Record<GalleryId, readonly GalleryState[]>> = {
  ...Object.fromEntries(
    (Object.entries(BUTTONS) as [V46ButtonId, ButtonSample][]).map(([id, b]) => [
      id,
      buttonStates(id, b),
    ]),
  ),
  'yuvarlak-geri': pressable('yuvarlak-geri', (pressed) => (
    <RoundButton
      look="yuvarlak-geri"
      onPress={noop}
      accessibilityLabel={s.back}
      pressedPreview={pressed}
    />
  )),
  'yuvarlak-simge': pressable('yuvarlak-simge', (pressed) => <Bell pressed={pressed} />),
  gonder: [
    ...pressable('gonder', (pressed) => (
      <SendButton onPress={noop} accessibilityLabel={s.send} pressedPreview={pressed} />
    )),
    {
      key: 'ready',
      render: () => <SendButton onPress={noop} accessibilityLabel={s.send} ready />,
    },
  ],
  ...NAVIGATION,
  ...EXPLORE,
};

// The bell with v46's sample count; each press is a new notice: it swings and the count grows.
function Bell({ pressed }: { pressed: boolean }) {
  const [notices, setNotices] = useState(0);
  return (
    <RoundButton
      look="yuvarlak-simge"
      onPress={() => setNotices((n) => n + 1)}
      accessibilityLabel={s.notifications}
      badge={String(Number(s.badge) + notices)}
      ring={notices}
      pressedPreview={pressed}
    />
  );
}
