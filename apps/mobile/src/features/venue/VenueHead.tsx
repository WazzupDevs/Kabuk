import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Chip, Live, Round, T, useKit } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { Wordmark } from '@/components/Wordmark';
import { IdentitySheet } from '@/features/checkin/IdentitySheet';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { ICON, OPACITY, SPACING } from '@/theme/tokens';

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
            // U19: the spot as a 40 chip; a press changes it while there is no table.
            <Chip
              md
              testID={onSpot ? 'change-spot' : undefined}
              accessibilityLabel={onSpot ? `${spot}, ${tr.venue.changeSpot}` : undefined}
              label={spot}
              onPress={onSpot}
            />
          ) : null}
          <Round
            big
            glassy
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
        {/* U21: who the person is here, apart from the actions; a press changes it while the one
            change is not spent. */}
        <View style={{ gap: SPACING[2] }}>
          <IdentityRow
            anonymous={anonymous}
            used={identity.switchUsed}
            onPress={() => {
              setMenu(false);
              if (identity.switchUsed) setUsedNote(true);
              else setAsking(true);
            }}
          />
          <Menu>
            <MenuItem
              testID="venue-profile"
              cap="personCircle"
              label={tr.venue.openProfile}
              onPress={() => {
                setMenu(false);
                router.navigate('/profile');
              }}
            />
            <MenuItem
              testID="venue-leave"
              cap="logout"
              negative
              loading={leaving}
              label={tr.venue.leave}
              onPress={() => {
                setMenu(false);
                onLeave();
              }}
            />
          </Menu>
        </View>
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

// The canvas's head row: its 44 round (U19).
const HEAD_HEIGHT = KIT.size.roundLg;
// The note that the one change is spent stays this long.
const USED_NOTE_MS = 2600;

// The app's written logo (src/components/Wordmark.tsx: "ska" and the two capsules), the owner's
// choice over the board's own drawing of it (28 Ekim); as tall as the board's, 38.
export function WordmarkRow({ small }: { small?: boolean } = {}) {
  return <Wordmark height={small ? WORDMARK_SMALL : WORDMARK_HEIGHT} />;
}
const WORDMARK_HEIGHT = 38;
const WORDMARK_SMALL = 26;

// The venue's name (h3, on two lines when long) and "Mekandasın" (14) with its live dot (U19).
export function VenueNameRow({ name }: { name: string }) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ gap: SPACING[3], paddingHorizontal: SPACING[0.5] }}
    >
      <T v="h3" accessibilityRole="header" testID="venue-name" style={{ flexShrink: 1 }}>
        {name}
      </T>
      <Live large label={tr.venue.here} />
    </View>
  );
}

// U21: the check-in's identity as a still row on --surface2 (MekanSecenekler `.srow.info`): its icon
// muted, the state h3 and, once the change is spent, the fine note under it.
function IdentityRow({
  anonymous,
  used,
  onPress,
}: {
  anonymous: boolean;
  used: boolean;
  onPress: () => void;
}) {
  const { c } = useKit();
  return (
    <Pressable testID="identity-switch" accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: INFO_GAP,
            minHeight: INFO_HEIGHT,
            paddingVertical: SPACING[3],
            paddingHorizontal: SPACING[4],
            borderRadius: INFO_RADIUS,
            backgroundColor: c.infoRow,
            opacity: pressed ? OPACITY.pressed : 1,
          }}
        >
          <CapIcon name={anonymous ? 'eyeOff' : 'user'} size={ICON.md} color={c.muted} />
          <View style={{ flex: 1, gap: SPACING[0.5] }}>
            <T v="h3">{anonymous ? tr.identity.switchOn : tr.identity.switchOff}</T>
            {used ? <T v="fine">{tr.identity.used}</T> : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}
const INFO_HEIGHT = 56;
const INFO_GAP = 14;
const INFO_RADIUS = 22;
