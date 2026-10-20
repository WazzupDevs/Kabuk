import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { tr } from '@/i18n/tr';
import { V46_BUTTONS, type V46ButtonId, type V46TabKey } from '@/theme/parts.generated';
import { V46_COMPONENTS } from '@/theme/tokens.generated';
import type { GalleryId } from '@/theme/v46Gallery';
import { Button, type ButtonLook } from '@/ui/Button';
import { useNarrow } from '@/ui/narrow';
import { RoundButton } from '@/ui/RoundButton';
import { SendButton } from '@/ui/SendButton';
import { TabBar, type TabBarItem, UnreadDot } from '@/ui/TabBar';
import { TopBar } from '@/ui/TopBar';
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
