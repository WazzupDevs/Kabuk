import {
  GIFT_TIERS,
  regionOf,
  SET_REGION_ORDER,
  setBalloonOf,
  type SetRegion,
  wornSetPieces,
} from '@shared/gifts.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import { Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, T, Tag, useKit } from '@/aura/kit';
import { CachedSvg } from '@/components/CachedSvg';
import { LookAvatar } from '@/components/LookAvatar';
import { Sheet } from '@/components/Sheet';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { SET_BALLOONS } from '@/theme/setBalloons';
import { TIER_COLOR } from '@/theme/gifts';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';
import { useState } from 'react';

import { TierGems } from './parts';
import { useEquip, useGiftState } from './queries';

// Set balonu (docs/SPEC_V4.md §4.U; the owner's call, 8 Kasım; the preview he approved): on the
// profile under Arkadaşlar, three slots for the capsule's three regions (Baş; Yüz: the eyes, the
// face, the mouth; Gövde: the neck, the colour). A piece of one skin set in each gives that set's
// balloon wherever the person writes anonymously. A slot shows the set piece worn there; a tap
// opens the region's set pieces, by set, the ones not owned faded under a lock; choosing one wears
// it (gifts/equip). A new set's pieces join the sheet by themselves (content/gift-packs.json).
const DISC = 74;
const OPTION = 64;
const RING = 3;
const LOCK = 24;
const CAPSULE = 'c:krem e:klasik';
const pieceLook = (id: string) => `${CAPSULE} x:${id}`;

export function SetCard() {
  const { c, scheme } = useKit();
  const gifts = useGiftState();
  const [open, setOpen] = useState<SetRegion | null>(null);
  if (!gifts.data) return null;
  const worn = gifts.data.worn;
  const look = worn.map((id) => `x:${id}`).join(' ');
  const pieces = wornSetPieces(look);
  const balloon = setBalloonOf(look);
  // The set with the most regions worn, and how many.
  const counts = GIFT_CATALOG.sets.map((s) => ({
    set: s,
    n: SET_REGION_ORDER.filter((r) => pieces[r]?.set === s.id).length,
  }));
  const lead = counts.reduce((a, b) => (b.n > a.n ? b : a), counts[0] ?? { set: null, n: 0 });
  const filled = SET_REGION_ORDER.filter((r) => pieces[r]).length;
  const mixed = filled === SET_REGION_ORDER.length && !balloon;
  const gold = TIER_COLOR[scheme].efsanevi;
  const skin = balloon ? SET_BALLOONS[balloon] : null;

  return (
    <Glass sm style={{ marginTop: SPACING[4], padding: SPACING[4], gap: SPACING[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
        <View style={{ flex: 1, gap: SPACING[0.5] }}>
          <T v="h3" accessibilityRole="header">
            {tr.gifts.setTitle}
          </T>
          <T v="fine">
            {balloon && lead.set
              ? tr.gifts.setOn(lead.set.name)
              : mixed
                ? tr.gifts.setMixed
                : filled > 0 && lead.set
                  ? tr.gifts.setMore(lead.set.name)
                  : tr.gifts.setHint}
          </T>
        </View>
        <Tag
          label={
            balloon && lead.set
              ? tr.gifts.setChipOn(lead.set.name)
              : mixed
                ? tr.gifts.setChipMixed
                : lead.set && lead.n > 0
                  ? tr.gifts.setChipCount(lead.set.name, lead.n, SET_REGION_ORDER.length)
                  : tr.gifts.setChipNone(SET_REGION_ORDER.length)
          }
          colors={
            skin
              ? { bg: skin.chipOn, fg: skin.name.ink }
              : mixed
                ? { bg: c.raisedRound, fg: c.warn }
                : { bg: c.raisedRound, fg: c.ink }
          }
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {SET_REGION_ORDER.map((region) => {
          const piece = pieces[region];
          return (
            <Pressable
              key={region}
              accessibilityRole="button"
              accessibilityLabel={tr.gifts.setSlotLabel(
                tr.gifts.setRegion[region],
                piece?.name ?? tr.gifts.setEmpty,
              )}
              onPress={() => setOpen(region)}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                gap: SPACING[1],
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: DISC,
                  height: DISC,
                  borderRadius: DISC / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(piece
                    ? { boxShadow: `0 0 0 ${RING}px ${gold}, 0 0 14px ${gold}88` }
                    : { borderWidth: 2, borderStyle: 'dashed', borderColor: c.hair }),
                }}
              >
                {piece ? (
                  <LookAvatar look={pieceLook(piece.id)} size={DISC} />
                ) : (
                  <CapIcon name="plus" color={c.muted} size={ICON.lg} />
                )}
              </View>
              <T v="fine" strong center>
                {tr.gifts.setRegion[region]}
              </T>
              <T v="fine" center>
                {piece?.name ?? tr.gifts.setEmpty}
              </T>
            </Pressable>
          );
        })}
      </View>
      <RegionSheet
        region={open}
        owned={new Set(gifts.data.owned.map((o) => o.id))}
        worn={new Set(worn)}
        onClose={() => setOpen(null)}
      />
    </Glass>
  );
}

// A region's set pieces, by set (Elf, Ninja, then whatever sets come); the ones not owned faded
// with a small lock on the capsule. Choosing an owned one wears it in its slot.
function RegionSheet({
  region,
  owned,
  worn,
  onClose,
}: {
  region: SetRegion | null;
  owned: ReadonlySet<string>;
  worn: ReadonlySet<string>;
  onClose: () => void;
}) {
  const { c } = useKit();
  const { colors } = useTheme();
  const equip = useEquip();
  const groups = region
    ? GIFT_CATALOG.sets.map((set) => ({
        set,
        items: GIFT_CATALOG.accessories.filter(
          (a) => a.set === set.id && !a.retired && a.slots.some((s) => regionOf(s) === region),
        ),
      }))
    : [];
  return (
    <Sheet
      visible={region !== null}
      onClose={onClose}
      title={region ? tr.gifts.setRegion[region] : undefined}
      subtitle={tr.gifts.setSheetNote}
    >
      <View style={{ gap: SPACING[4] }}>
        {groups.map(({ set, items }) => (
          <View key={set.id} style={{ gap: SPACING[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1.5] }}>
              {set.id in SET_BALLOONS ? (
                <View style={{ width: 12, height: 12 }}>
                  <CachedSvg
                    xml={SET_BALLOONS[set.id as keyof typeof SET_BALLOONS].name.mark}
                    width={12}
                    height={12}
                  />
                </View>
              ) : null}
              <T v="fine" strong ink>
                {set.name}
              </T>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[3] }}>
              {items.map((a) => {
                const mine = owned.has(a.id);
                const on = worn.has(a.id);
                return (
                  <Pressable
                    key={a.id}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !mine, selected: on }}
                    accessibilityLabel={mine ? a.name : tr.gifts.setLocked(a.name)}
                    disabled={!mine || equip.isPending}
                    onPress={() => equip.mutate(a.id, { onSuccess: onClose })}
                    style={{ width: OPTION + SPACING[5], alignItems: 'center', gap: SPACING[1] }}
                  >
                    <View
                      style={{
                        width: OPTION,
                        height: OPTION,
                        borderRadius: OPTION / 2,
                        ...(on ? { boxShadow: `0 0 0 ${RING}px ${colors.accent}` } : null),
                      }}
                    >
                      <View style={{ opacity: mine ? 1 : LOCKED_FADE }}>
                        <LookAvatar look={pieceLook(a.id)} size={OPTION} />
                      </View>
                      {!mine ? (
                        <View
                          style={{
                            position: 'absolute',
                            right: -2,
                            bottom: -2,
                            width: LOCK,
                            height: LOCK,
                            borderRadius: LOCK / 2,
                            backgroundColor: c.ink,
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 0 2px ${c.sheetBase}`,
                          }}
                        >
                          <CapIcon name="lock" color={c.sheetBase} size={ICON.sm} />
                        </View>
                      ) : null}
                    </View>
                    <T v="fine" center>
                      {a.name}
                    </T>
                    <TierGems tier={GIFT_TIERS[3]} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {equip.isError ? (
          <T v="fine" color={c.warn}>
            {errorMessage(equip.error)}
          </T>
        ) : null}
      </View>
    </Sheet>
  );
}
const LOCKED_FADE = 0.4;
