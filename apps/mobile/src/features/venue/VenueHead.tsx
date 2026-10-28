import { APP_NAME } from '@shared/brand.ts';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { ClipPath, Defs, Rect } from 'react-native-svg';

import { Live, Round, T, Tag } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { IdentitySheet } from '@/features/checkin/IdentitySheet';
import { tr } from '@/i18n/tr';
import { BRAND } from '@/theme/brand';
import { KIT_TYPE } from '@/theme/auraKit';
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

// The canvas's head row and its spot tag.
const HEAD_HEIGHT = 44;
const TAG_HEIGHT = 36;
const PRESSED = 0.7;
// The note that the one change is spent stays this long.
const USED_NOTE_MS = 2600;

// The mark (two capsules, their overlap amber) and the app's name in 800 (aura.css, Mekan).
export function WordmarkRow({ small }: { small?: boolean } = {}) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={APP_NAME}
      className="flex-row items-center"
      style={{ gap: SPACING[2] }}
    >
      <Svg width={MARK_W} height={MARK_H} viewBox="0 0 132 300">
        <Defs>
          <ClipPath id="wordmarkClip">
            <Rect x={0} y={0} width={80} height={240} rx={40} />
          </ClipPath>
        </Defs>
        <Rect x={0} y={0} width={80} height={240} rx={40} fill={BRAND.purple} />
        <Rect x={52} y={60} width={80} height={240} rx={40} fill={BRAND.pink} />
        <Rect
          x={52}
          y={60}
          width={80}
          height={240}
          rx={40}
          fill={BRAND.orange}
          clipPath="url(#wordmarkClip)"
        />
      </Svg>
      <T v="h3" ink style={small ? KIT_TYPE.wordmarkSm : KIT_TYPE.wordmark}>
        {APP_NAME}
      </T>
    </View>
  );
}
const MARK_W = 14;
const MARK_H = 32;

// The venue's name and "Mekandasın" with its live dot.
export function VenueNameRow({ name }: { name: string }) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ gap: SPACING[3], paddingHorizontal: SPACING[0.5] }}
    >
      <T v="h3" accessibilityRole="header" testID="venue-name" style={{ flexShrink: 1 }}>
        {name}
      </T>
      <Live label={tr.venue.here} />
    </View>
  );
}
