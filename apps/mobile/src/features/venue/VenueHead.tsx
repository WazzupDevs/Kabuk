import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Chip, PulseDot, Round, T, useKit } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { Wordmark } from '@/components/Wordmark';
import { IdentitySheet } from '@/features/checkin/IdentitySheet';
import { tr } from '@/i18n/tr';
import { Menu, type MenuAnchor, MenuItem, measureMenuAnchor } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';
import { VENUE } from '@/theme/venue';

// Mekan's head (docs/design/iskelet.md → 5.11): the skall wordmark at the left; at the right the
// spot (a press changes it while there is no table) and the clear "Seçenekler" whose menu grows
// out of it (3.5): the time at the venue with its bar filling, the check-in's one change of
// identity, Profil, and "Mekandan ayrıl" apart in red (its confirm sheet, the screen's).
export function VenueHead({
  spot,
  onSpot,
  identity,
  atTable,
  minutesLeft,
  stayShare,
  onLeave,
  leaving,
}: {
  spot: string | null;
  onSpot?: () => void;
  identity: { mode: 'anonymous' | 'profiled'; switchUsed: boolean };
  atTable: boolean;
  minutesLeft: number;
  // How much of the check-in's time has passed, 0 to 1.
  stayShare: number;
  onLeave: () => void;
  leaving: boolean;
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
        className="flex-row items-center justify-between"
        style={{ minHeight: HEAD_HEIGHT, marginTop: VENUE.headTop }}
      >
        <View style={{ marginLeft: VENUE.wordmarkIn }}>
          <WordmarkRow />
        </View>
        <View className="flex-row items-center" style={{ gap: SPACING[2] }}>
          {spot ? (
            // U19: the spot as a chip; a press changes it while there is no table.
            <Chip
              md
              testID={onSpot ? 'change-spot' : undefined}
              accessibilityLabel={onSpot ? `${spot}, ${tr.venue.changeSpot}` : undefined}
              label={spot}
              onPress={onSpot}
            />
          ) : null}
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
            testID="identity-switch"
            cap={anonymous ? 'personCircle' : 'eyeOff'}
            label={anonymous ? tr.identity.toProfile : tr.identity.toAnonymous}
            note={
              identity.switchUsed
                ? tr.identity.used
                : anonymous
                  ? tr.identity.toProfileNote
                  : tr.identity.toAnonymousNote
            }
            onPress={() => {
              if (identity.switchUsed) setUsedNote(true);
              else setAsking(true);
            }}
          />
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

// The venue's name alone, large (23/800), and 6 under it "Mekandasın" on its green pill with its
// beating dot (iskelet.md → 5.11; tuval Mekan). A long name shrinks to fit its two lines rather
// than ending in "…".
export function VenueNameRow({ name }: { name: string }) {
  const { scheme } = useKit();
  const here = VENUE[scheme].here;
  const H = VENUE.here;
  return (
    <View style={{ gap: VENUE.titleGap, paddingHorizontal: VENUE.titleIn }}>
      <T v="venueName" accessibilityRole="header" testID="venue-name" lines={2} fit>
        {name}
      </T>
      <View
        style={{
          alignSelf: 'flex-start',
          minHeight: H.height,
          paddingLeft: H.padLeft,
          paddingRight: H.padRight,
          borderRadius: H.height / 2,
          backgroundColor: here.fill,
          flexDirection: 'row',
          alignItems: 'center',
          gap: H.gap,
        }}
      >
        <PulseDot color={here.dot} size={H.dot} />
        <T v="hereTag" color={here.ink}>
          {tr.venue.here}
        </T>
      </View>
    </View>
  );
}
