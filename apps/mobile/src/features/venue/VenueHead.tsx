import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Chip, PulseDot, Round, T, useKit } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { IdentityToggle } from '@/components/IdentityToggle';
import { Wordmark } from '@/components/Wordmark';
import { IdentitySheet } from '@/features/checkin/IdentitySheet';
import { tr } from '@/i18n/tr';
import {
  BarArrive,
  Menu,
  type MenuAnchor,
  MenuItem,
  measureMenuAnchor,
  ScrollFade,
} from '@/motion';
import { TOP_BAR } from '@/motion/TopBar';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';
import { VENUE } from '@/theme/venue';

// Mekan's head (yeni arayüz tuvali: MekanMasa, MekanKaydir; docs/design/iskelet.md → 5.11): the
// skall wordmark at the left, and once the venue's name has scrolled under the bar the name small
// with "Mekandasın" in its place; at the right the identity toggle (the check-in's one change:
// the own capsule or the own photo, the other opens the change, a spent change says so) and the
// clear "Seçenekler" whose menu grows out of it (3.5): the time at the venue with its bar filling,
// Profil, and "Mekandan ayrıl" apart in red (its confirm dialog, the screen's).
export function VenueHead({
  venueName,
  identity,
  atTable,
  minutesLeft,
  stayShare,
  onLeave,
  leaving,
  feed,
}: {
  venueName: string;
  identity: { mode: 'anonymous' | 'profiled'; switchUsed: boolean };
  atTable: boolean;
  minutesLeft: number;
  // How much of the check-in's time has passed, 0 to 1.
  stayShare: number;
  onLeave: () => void;
  leaving: boolean;
  // The feed view (docs/SPEC_V4.md §4.Y): everyone writes with the profile, so the identity toggle
  // (the table's and the venue chat's choice) is not shown.
  feed?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const moreRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const [asking, setAsking] = useState(false);
  const [usedNote, setUsedNote] = useState(false);
  useEffect(() => {
    if (!usedNote) return undefined;
    const timer = setTimeout(() => setUsedNote(false), USED_NOTE_MS);
    return () => clearTimeout(timer);
  }, [usedNote]);
  const anonymous = identity.mode === 'anonymous';
  const openMenu = () =>
    measureMenuAnchor(moreRef.current, (at) => {
      setAnchor(at);
      setMenu(true);
    });
  return (
    <View style={{ gap: SPACING[2] }}>
      <View
        className="flex-row items-center"
        style={{ minHeight: HEAD_HEIGHT, marginTop: VENUE.headTop, gap: VENUE.headGap }}
      >
        <View
          style={{
            flex: 1,
            minWidth: 0,
            alignSelf: 'stretch',
            justifyContent: 'center',
            marginLeft: VENUE.wordmarkIn,
          }}
        >
          <ScrollFade fade={BAR_NAME} shrink={BAR_NAME} scaleTo={1}>
            <WordmarkRow />
          </ScrollFade>
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <BarArrive from={BAR_NAME[0]} to={BAR_NAME[1]}>
                <BarName name={venueName} />
              </BarArrive>
            </View>
          </View>
        </View>
        <View className="flex-row items-center" style={{ gap: VENUE.headGap }}>
          {feed ? null : (
            <IdentityToggle
              testID="venue-identity"
              size={VENUE.toggle}
              mode={identity.mode}
              locked={identity.switchUsed}
              onPick={() => setAsking(true)}
              onLocked={() => setUsedNote(true)}
            />
          )}
          <View ref={moreRef} collapsable={false}>
            <Round
              glass="clear"
              icon="more"
              side={KIT.size.topBtn}
              label={tr.venue.more}
              onPress={openMenu}
              testID="venue-more"
            />
          </View>
        </View>
      </View>
      {anchor ? (
        <Menu anchor={anchor} visible={menu} onClose={() => setMenu(false)}>
          <Stay minutesLeft={minutesLeft} share={stayShare} />
          <MenuItem
            testID="venue-profile"
            cap="user"
            label={tr.venue.openProfile}
            onPress={() => router.navigate('/profile')}
          />
          <MenuItem
            testID="venue-leave"
            cap="logout"
            negative
            loading={leaving}
            label={tr.venue.leave}
            onPress={onLeave}
          />
        </Menu>
      ) : null}
      <IdentitySheet
        visible={asking}
        onClose={() => setAsking(false)}
        toAnonymous={!anonymous}
        atTable={atTable}
      />
      {usedNote ? <Banner tone="info" testID="identity-used" body={tr.identity.used} /> : null}
    </View>
  );
}

// The canvas's head row: its 46 clear round (iskelet.md → 2.1).
const HEAD_HEIGHT = KIT.size.topBtn;
// The wordmark gives way to the venue's small name over the large title's bar range (3.1).
const BAR_NAME = TOP_BAR.buyukBaslik.barTitle;

// The scrolled bar's venue (MekanKaydir `.sv`): the name small on one line, "Mekandasın" with its
// dot 2 under it. A copy of what the page says; the screen reader reads the page's.
function BarName({ name }: { name: string }) {
  const { scheme } = useKit();
  const here = VENUE[scheme].here;
  const B = VENUE.bar;
  return (
    <View style={{ gap: B.lineGap }}>
      <T v="venueBarName" ink lines={1} fit>
        {name}
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: B.dotGap }}>
        <View
          style={{
            width: B.dot,
            height: B.dot,
            borderRadius: B.dot / 2,
            backgroundColor: here.ink,
          }}
        />
        <T v="venueBarHere" color={here.ink}>
          {tr.venue.here}
        </T>
      </View>
    </View>
  );
}
// The note that the one change is spent stays this long.
const USED_NOTE_MS = 2600;

// The menu's first row, not a press (tuval Mekan): "Mekanda kalma süren", the time left, and the
// bar filling as the check-in's time passes.
function Stay({ minutesLeft, share }: { minutesLeft: number; share: number }) {
  const { scheme } = useKit();
  const look = VENUE[scheme];
  const S = VENUE.stay;
  return (
    <View
      accessible
      style={{
        paddingTop: S.padTop,
        paddingHorizontal: S.padX,
        paddingBottom: S.padBottom,
        gap: S.gap,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: S.gap }}>
        <T v="friendTag" color={look.stayLabel}>
          {tr.venue.stay}
        </T>
        <T v="friendTag" color={look.stayValue} tabular>
          {tr.venue.remaining(Math.floor(minutesLeft / 60), minutesLeft % 60)}
        </T>
      </View>
      <View
        style={{
          height: S.bar,
          borderRadius: S.bar / 2,
          backgroundColor: look.stayTrack,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.min(1, Math.max(0, share)) * 100}%`,
            height: S.bar,
            borderRadius: S.bar / 2,
            backgroundColor: KIT.primary,
          }}
        />
      </View>
    </View>
  );
}

// The app's written logo (src/components/Wordmark.tsx: "ska" and the two capsules), the owner's
// choice over the board's own drawing of it (28 Ekim); 28 tall, only its scale smaller than the
// board's 38 (the owner's call, 2 Kasım, 6.6).
export function WordmarkRow({ small }: { small?: boolean } = {}) {
  return <Wordmark height={small ? WORDMARK_SMALL : WORDMARK_HEIGHT} />;
}
const WORDMARK_HEIGHT = 28;
const WORDMARK_SMALL = 26;

// The venue's name alone, large (`.vn`), and 8 under it "Mekandasın" on its green pill with its
// beating dot, the spot's chip beside it (MekanMasa; iskelet.md → 5.11). A long name shrinks to
// fit its two lines rather than ending in "…".
export function VenueNameRow({
  name,
  spot,
  onSpot,
}: {
  name: string;
  spot: string | null;
  onSpot?: () => void;
}) {
  const { scheme } = useKit();
  const here = VENUE[scheme].here;
  return (
    <View style={{ gap: VENUE.titleGap, paddingHorizontal: VENUE.titleIn }}>
      <T v="venueName" accessibilityRole="header" testID="venue-name" lines={2} fit>
        {name}
      </T>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: VENUE.hereRowGap,
        }}
      >
        <HereTag ink={here.ink} fill={here.fill} dot={here.dot} />
        {spot ? (
          // U19: the spot as a chip beside it (the board's bar has no room for it); a press
          // changes it while there is no table.
          <Chip
            md
            testID={onSpot ? 'change-spot' : undefined}
            accessibilityLabel={onSpot ? `${spot}, ${tr.venue.changeSpot}` : undefined}
            label={spot}
            onPress={onSpot}
          />
        ) : null}
      </View>
    </View>
  );
}

// "Mekandasın" on its green pill with its beating dot.
function HereTag({ ink, fill, dot }: { ink: string; fill: string; dot: string }) {
  const H = VENUE.here;
  return (
    <View
      style={{
        minHeight: H.height,
        paddingLeft: H.padLeft,
        paddingRight: H.padRight,
        borderRadius: H.height / 2,
        backgroundColor: fill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: H.gap,
      }}
    >
      <PulseDot color={dot} size={H.dot} />
      <T v="hereTag" color={ink}>
        {tr.venue.here}
      </T>
    </View>
  );
}
