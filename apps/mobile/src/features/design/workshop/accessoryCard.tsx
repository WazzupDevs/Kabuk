import type { GiftTier } from '@shared/gifts.ts';
import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';

import { T, useKit } from '@/aura/kit';
import { CachedSvg } from '@/components/CachedSvg';
import { optionArt } from '@/features/capsule/tileArt';
import { blankCard, CARD_FRAME_CORNER, CARD_RATIO } from '@/features/gifts/art';
import { CARD_ROUND, CardFace, TierGems } from '@/features/gifts/parts';
import { tr } from '@/i18n/tr';
import { ACCESSORY_CARD } from '@/theme/accessoryCard';
import { KIT } from '@/theme/auraKit';
import { CAPSULE_EDIT } from '@/theme/capsuleEdit';
import { SPACING } from '@/theme/tokens';

// Atölye draft `accessoryCard` (the owner's ask, 23 Kasım): Süsle's strip with the tier cards a gift
// pack opens in place of the rounds, one accessory of each tier. A today (the rounds), B the tier's
// card with the accessory alone drawn large in its round, C the card as the gift shows it (the
// capsule wearing the accessory). The cards at their strip size, sideways as the strip scrolls;
// drawn still from the real drawings, nothing reads the server.

export type CardLook = 'round' | 'alone' | 'gift';

const SAMPLE: { id: string; name: string; tier: GiftTier }[] = [
  { id: 'anahtarkolye', name: 'Anahtar kolye', tier: 'siradan' },
  { id: 'pervanelisapka', name: 'Pervaneli şapka', tier: 'nadir' },
  { id: 'buyucutakimi', name: 'Büyücü takımı', tier: 'destansi' },
  { id: 'ejderboynuzu', name: 'Ejder boynuzu', tier: 'efsanevi' },
];
const CHOSEN = 1;

export function AccessoryCardDraft({ look, width }: { look: CardLook; width: number }) {
  const { c } = useKit();
  const t = tr.design.workshop.accessoryCard;
  return (
    <View style={{ width, gap: SPACING[3] }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: SPACING[3],
          paddingVertical: SPACING[3],
          paddingHorizontal: SPACING[2],
          alignItems: 'flex-start',
        }}
      >
        {SAMPLE.map((s, i) =>
          look === 'round' ? (
            <Round key={s.id} {...s} chosen={i === CHOSEN} />
          ) : (
            <Card key={s.id} {...s} chosen={i === CHOSEN} gift={look === 'gift'} />
          ),
        )}
      </ScrollView>
      <T v="fine" color={c.muted}>
        {look === 'round' ? t.noteA : look === 'alone' ? t.noteB : t.noteC}
      </T>
    </View>
  );
}

// Today: the round on the slate, the gems and the name under it.
function Round({
  id,
  name,
  tier,
  chosen,
}: {
  id: string;
  name: string;
  tier: GiftTier;
  chosen: boolean;
}) {
  const { c, scheme } = useKit();
  const xml = optionArt('h', { accessory: id }, undefined) ?? '';
  const size = KIT.size.stripItem;
  return (
    <View style={{ alignItems: 'center', gap: SPACING[2], width: ACCESSORY_CARD.width }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: CAPSULE_EDIT[scheme].tile,
          borderWidth: chosen ? ACCESSORY_CARD.ring : 0,
          borderColor: KIT.pink,
        }}
      >
        <CachedSvg xml={xml} width={KIT.size.stripArt} height={KIT.size.stripArt} />
      </View>
      <TierGems tier={tier} />
      <T v="fine" strong center color={c.ink}>
        {name}
      </T>
    </View>
  );
}

// The tier's card: B the accessory alone in its round, C the gift's face (CardFace). The name
// under it; the tier is the card's own frame.
function Card({
  id,
  name,
  tier,
  chosen,
  gift,
}: {
  id: string;
  name: string;
  tier: GiftTier;
  chosen: boolean;
  gift: boolean;
}) {
  const { c } = useKit();
  const C = ACCESSORY_CARD;
  const w = C.width;
  const h = w / CARD_RATIO;
  const corner = CARD_FRAME_CORNER * w;
  const art = CARD_ROUND.r * w * 2 * C.art;
  const xml = gift ? '' : (optionArt('h', { accessory: id }, undefined) ?? '');
  return (
    <View style={{ alignItems: 'center', gap: SPACING[2], width: w }}>
      <View style={{ width: w, height: h, transform: [{ scale: chosen ? C.lift : 1 }] }}>
        {gift ? (
          <CardFace id={id} tier={tier} width={w} height={h} />
        ) : (
          <>
            <Image source={blankCard(tier)} style={{ width: w, height: h }} />
            <View
              style={{
                position: 'absolute',
                left: CARD_ROUND.x * w - art / 2,
                top: CARD_ROUND.y * h - art / 2,
              }}
            >
              <CachedSvg xml={xml} width={art} height={art} />
            </View>
          </>
        )}
        {chosen ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -C.ring - 1,
              top: -C.ring - 1,
              right: -C.ring - 1,
              bottom: -C.ring - 1,
              borderRadius: corner + C.ring + 1,
              borderWidth: C.ring,
              borderColor: KIT.pink,
            }}
          />
        ) : null}
      </View>
      <T v="fine" strong center color={c.ink}>
        {name}
      </T>
    </View>
  );
}
