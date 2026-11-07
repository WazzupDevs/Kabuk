import type { GiftState } from '@shared/api/gifts.ts';
import { wearOne, withAccessories } from '@shared/gifts.ts';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, useWindowDimensions, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Glass, T, useKit } from '@/aura/kit';
import { FxSvg } from '@/components/FxSvg';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { RingLook } from '@/components/RingLook';
import { Screen } from '@/components/Screen';
import { tileArt } from '@/features/gifts/art';
import {
  type Accessory,
  accessoryById,
  byTier,
  shownAccessories,
  slotNames,
} from '@/features/gifts/model';
import { GiftTopBar, TierTag } from '@/features/gifts/parts';
import { useEquip, useGiftState, useWear } from '@/features/gifts/queries';
import { useOwnLook } from '@/features/profile/useOwnLook';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { accessoryFigure } from '@/theme/capsuleAccessories';
import { gradientStyle } from '@/theme/gradient';
import { EFSANEVI_FOIL, TIER_COLOR, TILE_FRAME, TILE_GROUND_DARK } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

// Aksesuarlarım (docs/SPEC_V4.md §4.U; Aura v134 Aksesuarlarim, AksesuarlarimHal): the chosen
// accessory on the person's own capsule with its slots, the collection by tier, "Tak" and "Çıkar".
// One accessory in each slot is worn (Tak puts it in its slots, whatever is worn there comes off;
// Çıkar takes the chosen one off); only the capsule shows them (rule 4). A retired accessory is
// shown only to its owner.
const PREVIEW = 72;
const GRID_GAP = 10;
const COLUMNS = 4;
const TILE_RADIUS = 16;
const TILE_INSET = 3;
const LOCK_MARK = 20;
// The standing capsule in a tile: 44 × 62 in an 80 tile.
const FIGURE_SHARE = 0.55;
const FIGURE_RATIO = 140 / 100;
const SKELETON_TILES = 8;

export default function AccessoriesScreen() {
  const gifts = useGiftState();
  const loading = useLoaderHold(gifts.isPending);
  const top = <GiftTopBar title={tr.gifts.accessories} onBack={() => router.back()} />;

  if (gifts.isPending || loading) {
    return (
      <Screen top={top}>
        <Skeleton />
      </Screen>
    );
  }
  if (!gifts.data) {
    return (
      <Screen top={top}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            kind="error"
            title={tr.gifts.accessoriesError}
            body={errorMessage(gifts.error)}
            action={{
              label: tr.common.retry,
              onPress: () => void gifts.refetch(),
              loading: gifts.isRefetching,
            }}
          />
        </View>
      </Screen>
    );
  }
  return <Collection state={gifts.data} top={top} />;
}

function Collection({ state, top }: { state: GiftState; top: React.ReactNode }) {
  const look = useOwnLook();
  const equip = useEquip();
  const wear = useWear();
  const busy = equip.isPending || wear.isPending;
  const owned = new Set(state.owned.map((o) => o.id));
  const shown = shownAccessories(owned);
  const wornSet = new Set(state.worn);
  const last = state.owned[state.owned.length - 1]?.id ?? null;
  const [picked, setPicked] = useState<string | null>(state.worn[0] ?? last);
  const chosen = accessoryById(picked && owned.has(picked) ? picked : null);
  const chosenWorn = chosen !== null && wornSet.has(chosen.id);
  // What Tak would take off: the worn ones in the chosen one's slots.
  const inItsSlots = chosen
    ? state.worn
        .filter((w) => w !== chosen.id && !wearOne(state.worn, chosen.id).includes(w))
        .flatMap((w) => accessoryById(w) ?? [])
    : [];
  const tile = useTileSize();
  const none = owned.size === 0;

  // Tak: the avatar pops (260/17).
  const reduce = useReduceMotion();
  const popScale = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: popScale.value }] }));
  const [popped, setPopped] = useState(0);
  useEffect(() => {
    if (popped === 0 || reduce) return;
    popScale.set(0.85);
    popScale.set(withSpring(1, GIFT_MOTION.wear));
  }, [popped, reduce, popScale]);

  const pop = () => setPopped((n) => n + 1);
  const put = (id: string) => equip.mutate(id, { onSuccess: pop });
  const off = (id: string) =>
    wear.mutate(
      state.worn.filter((w) => w !== id),
      { onSuccess: pop },
    );
  const failed = equip.error ?? wear.error;

  return (
    <Screen
      top={top}
      footer={
        none ? undefined : (
          <>
            {failed ? (
              <T v="fine" ink>
                {errorMessage(failed)}
              </T>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[3] }}>
              <Btn
                variant="glassy"
                label={tr.gifts.takeOff}
                disabled={!chosenWorn || busy}
                loading={wear.isPending}
                onPress={() => chosen && off(chosen.id)}
                style={{ flexGrow: 1 }}
              />
              <Btn
                icon="sparkles"
                label={tr.gifts.put}
                disabled={!chosen || chosenWorn || busy}
                loading={equip.isPending}
                onPress={() => chosen && put(chosen.id)}
                style={{ flexGrow: 1 }}
              />
            </View>
          </>
        )
      }
    >
      <Glass
        sm
        style={{
          paddingVertical: SPACING[3],
          paddingHorizontal: SPACING[4],
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: SPACING[4],
        }}
      >
        <Reanimated.View style={popStyle}>
          {look ? (
            <RingLook
              look={withAccessories(look, chosen ? wearOne(state.worn, chosen.id) : state.worn)}
              size={PREVIEW}
              accessibilityLabel={tr.profile.ownCapsule}
            />
          ) : (
            <View style={{ width: PREVIEW, height: PREVIEW }} />
          )}
        </Reanimated.View>
        <View style={{ flex: 1, minWidth: 150, gap: SPACING[1] }}>
          {chosen ? (
            <>
              <T v="h3">{chosen.name}</T>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: SPACING[2],
                }}
              >
                <TierTag tier={chosen.tier} />
                <T v="fine" strong>
                  {slotNames(chosen)}
                </T>
              </View>
              {inItsSlots.length > 0 ? (
                <T v="fine">{tr.gifts.wornNow(inItsSlots.map((a) => a.name).join(', '))}</T>
              ) : null}
            </>
          ) : (
            <>
              <T v="h3">{tr.gifts.none}</T>
              <T v="fine">{tr.gifts.noneHint}</T>
            </>
          )}
        </View>
      </Glass>

      <View
        style={{
          marginTop: SPACING[4],
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <T v="h3" accessibilityRole="header">
          {tr.gifts.collection}
        </T>
        <T v="fine" strong>
          {tr.gifts.progress(owned.size, shown.length)}
        </T>
      </View>

      {none ? (
        <View style={{ marginTop: SPACING[2.5] }}>
          <Grid>
            {shown.map((a) => (
              <Tile key={a.id} accessory={a} size={tile} owned={false} />
            ))}
          </Grid>
          <Btn
            block
            icon="gift"
            label={tr.gifts.toPacks}
            onPress={() => router.push('/gifts')}
            style={{ marginTop: SPACING[4] }}
          />
        </View>
      ) : (
        byTier(owned).map((group) => (
          <View key={group.tier} style={{ marginTop: SPACING[4], gap: SPACING[2.5] }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <TierTag tier={group.tier} />
              <T v="fine" strong>
                {tr.gifts.progress(
                  group.items.filter((a) => owned.has(a.id)).length,
                  group.items.length,
                )}
              </T>
            </View>
            <Grid>
              {group.items.map((a) => (
                <Tile
                  key={a.id}
                  accessory={a}
                  size={tile}
                  owned={owned.has(a.id)}
                  worn={wornSet.has(a.id)}
                  picked={a.id === chosen?.id}
                  onPress={() => setPicked(a.id)}
                />
              ))}
            </Grid>
          </View>
        ))
      )}
    </Screen>
  );
}

function useTileSize(): number {
  const { width } = useWindowDimensions();
  const { shape } = useTheme();
  return Math.floor((width - shape.screenPadding * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS);
}

function Grid({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>{children}</View>;
}

// A collection tile (GaleriHediye "Koleksiyon karosu"): owned on its tier's frame and art, worn
// with a check at the top left, picked with the accent ring; not owned a dashed square with the
// accessory's silhouette and a lock.
function Tile({
  accessory,
  size,
  owned,
  worn,
  picked,
  onPress,
}: {
  accessory: Accessory;
  size: number;
  owned: boolean;
  worn?: boolean;
  picked?: boolean;
  onPress?: () => void;
}) {
  const { c, scheme } = useKit();
  const { colors } = useTheme();
  const figureW = Math.round(size * FIGURE_SHARE);
  const figure = (
    <View
      style={{
        position: 'absolute',
        inset: TILE_INSET,
        borderRadius: TILE_RADIUS - 4,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <View style={{ width: figureW, height: figureW * FIGURE_RATIO }}>
        <FxSvg
          xml={accessoryFigure(accessory.id, owned ? null : colors.control)}
          width={figureW}
          height={figureW * FIGURE_RATIO}
        />
      </View>
    </View>
  );

  if (!owned) {
    return (
      <View
        accessible
        accessibilityLabel={tr.gifts.locked}
        style={{
          width: size,
          height: size,
          borderRadius: TILE_RADIUS,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colors.control,
          backgroundColor: colors.surface2,
        }}
      >
        {figure}
        <View
          style={{
            position: 'absolute',
            right: SPACING[1],
            bottom: SPACING[1],
            width: LOCK_MARK,
            height: LOCK_MARK,
            borderRadius: LOCK_MARK / 2,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CapIcon name="lock" color={c.muted} size={ICON.xs} />
        </View>
      </View>
    );
  }

  const tier = accessory.tier;
  const frame = TILE_FRAME[tier];
  const color = TIER_COLOR[scheme][tier];
  const ground = scheme === 'dark' ? TILE_GROUND_DARK : colors.surface;
  const inner = (
    <View
      style={{
        flex: 1,
        borderRadius: TILE_RADIUS - frame,
        overflow: 'hidden',
        backgroundColor: ground,
        // Destansı: a thin line inside, 3 in.
        boxShadow:
          tier === 'destansi' ? `inset 0 0 0 3px ${ground}, inset 0 0 0 4px ${color}` : undefined,
      }}
    >
      <Image
        source={tileArt(tier)}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={worn ? tr.gifts.wornTile(accessory.name) : accessory.name}
      accessibilityState={{ selected: !!picked }}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: TILE_RADIUS,
        boxShadow: picked ? `0 0 0 2px ${colors.canvas}, 0 0 0 4px ${colors.accent}` : undefined,
      }}
    >
      <View
        style={[
          { flex: 1, borderRadius: TILE_RADIUS, padding: frame },
          tier === 'efsanevi' ? gradientStyle(EFSANEVI_FOIL) : { backgroundColor: color },
        ]}
      >
        {inner}
      </View>
      {figure}
      {worn ? (
        <View
          style={{
            position: 'absolute',
            left: SPACING[1],
            top: SPACING[1],
            width: LOCK_MARK,
            height: LOCK_MARK,
            borderRadius: LOCK_MARK / 2,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CapIcon name="check" color={colors.onPrimary} size={ICON.xs} />
        </View>
      ) : null}
    </Pressable>
  );
}

// AksesuarlarimHal "yükleniyor": the card's skeleton and eight tiles.
function Skeleton() {
  const { colors } = useTheme();
  const tile = useTileSize();
  return (
    <View accessibilityState={{ busy: true }} style={{ gap: SPACING[4] }}>
      <Glass
        sm
        style={{
          paddingVertical: SPACING[3],
          paddingHorizontal: SPACING[4],
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING[4],
        }}
      >
        <View
          style={{
            width: PREVIEW,
            height: PREVIEW,
            borderRadius: PREVIEW / 2,
            backgroundColor: colors.track,
          }}
        />
        <View style={{ flex: 1, gap: SPACING[2] }}>
          <View
            style={{ height: 16, width: '60%', borderRadius: 8, backgroundColor: colors.track }}
          />
          <View
            style={{ height: 12, width: '40%', borderRadius: 6, backgroundColor: colors.track }}
          />
        </View>
      </Glass>
      <Grid>
        {Array.from({ length: SKELETON_TILES }, (_, i) => (
          <View
            key={i}
            style={{
              width: tile,
              height: tile,
              borderRadius: TILE_RADIUS,
              backgroundColor: colors.track,
            }}
          />
        ))}
      </Grid>
    </View>
  );
}
