import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Live, Round, T, Tag } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { Wordmark } from '@/components/Wordmark';
import { IdentitySheet } from '@/features/checkin/IdentitySheet';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

// Mekan's head (docs/design/aura → Mekan): the skall wordmark at the left; at the right the spot
// (a press changes it while there is no table) and the round "Seçenekler", whose sheet holds the
// check-in's identity, Profil, the time left and "Mekandan ayrıl".
export function VenueHead({
  spot,
  onSpot,
  identity,
  atTable,
  minutesLeft,
  onLeave,
  leaving,
}: {
  spot: string | null;
  onSpot?: () => void;
  identity: { mode: 'anonymous' | 'profiled'; switchUsed: boolean };
  atTable: boolean;
  minutesLeft: number;
  onLeave: () => void;
  leaving: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const [asking, setAsking] = useState(false);
  const [usedNote, setUsedNote] = useState(false);
  useEffect(() => {
    if (!usedNote) return undefined;
    const timer = setTimeout(() => setUsedNote(false), USED_NOTE_MS);
    return () => clearTimeout(timer);
  }, [usedNote]);
  const anonymous = identity.mode === 'anonymous';
  return (
    <View style={{ gap: SPACING[2] }}>
      <View className="flex-row items-center justify-between" style={{ minHeight: HEAD_HEIGHT }}>
        <WordmarkRow />
        <View className="flex-row items-center" style={{ gap: SPACING[2] }}>
          {spot ? (
            onSpot ? (
              <Pressable
                testID="change-spot"
                accessibilityRole="button"
                accessibilityLabel={`${spot}, ${tr.venue.changeSpot}`}
                onPress={onSpot}
              >
                {({ pressed }) => (
                  <View style={{ opacity: pressed ? PRESSED : 1 }}>
                    <Tag label={spot} height={TAG_HEIGHT} />
                  </View>
                )}
              </Pressable>
            ) : (
              <Tag label={spot} height={TAG_HEIGHT} />
            )
          ) : null}
          <Round
            big
            icon="more"
            label={tr.venue.more}
            onPress={() => setMenu(true)}
            testID="venue-more"
          />
        </View>
      </View>
      <Sheet
        visible={menu}
        onClose={() => setMenu(false)}
        title={tr.venue.more}
        titleNote={tr.venue.remaining(Math.floor(minutesLeft / 60), minutesLeft % 60)}
      >
        <Menu>
          <MenuItem
            testID="identity-switch"
            icon={anonymous ? 'eye-off-outline' : 'person-outline'}
            label={anonymous ? tr.identity.switchOn : tr.identity.switchOff}
            note={identity.switchUsed ? tr.identity.used : undefined}
            onPress={() => {
              setMenu(false);
              if (identity.switchUsed) setUsedNote(true);
              else setAsking(true);
            }}
          />
          <MenuItem
            testID="venue-profile"
            icon="person-circle-outline"
            label={tr.venue.openProfile}
            onPress={() => {
              setMenu(false);
              router.navigate('/profile');
            }}
          />
          <MenuItem
            testID="venue-leave"
            icon="exit-outline"
            negative
            loading={leaving}
            label={tr.venue.leave}
            onPress={() => {
              setMenu(false);
              onLeave();
            }}
          />
        </Menu>
      </Sheet>
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

// The canvas's head row (its 48 round) and the spot tag as tall.
const HEAD_HEIGHT = KIT.size.roundLg;
const TAG_HEIGHT = KIT.size.roundLg;
const PRESSED = 0.7;
// The note that the one change is spent stays this long.
const USED_NOTE_MS = 2600;

// The app's written logo (src/components/Wordmark.tsx: "ska" and the two capsules), the owner's
// choice over the board's own drawing of it (28 Ekim); as tall as the board's, 38.
export function WordmarkRow({ small }: { small?: boolean } = {}) {
  return <Wordmark height={small ? WORDMARK_SMALL : WORDMARK_HEIGHT} />;
}
const WORDMARK_HEIGHT = 38;
const WORDMARK_SMALL = 26;

// The venue's name (18, on two lines when long) and "Mekandasın" (15) with its live dot.
export function VenueNameRow({ name }: { name: string }) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ gap: SPACING[3], paddingHorizontal: SPACING[0.5] }}
    >
      <T v="sec" accessibilityRole="header" testID="venue-name" style={{ flexShrink: 1 }}>
        {name}
      </T>
      <Live large label={tr.venue.here} />
    </View>
  );
}
