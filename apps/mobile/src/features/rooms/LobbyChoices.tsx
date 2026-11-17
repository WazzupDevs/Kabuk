import { CONCEPTS, type Concept, type Intent, INTENTS } from '@shared/rooms.ts';
import { Image, ScrollView, View } from 'react-native';

import { Chip, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { Tap } from '@/motion/Tap';
import { KIT } from '@/theme/auraKit';
import { TABLE_SETUP } from '@/theme/tableSetup';

import { conceptOf, GAME_CARDS } from './PosterCard';

// The lobby's optional intent and game tag ("Masanı lobiye aç" and "Masa kur"; docs/SPEC_V4.md
// §4.E). No chip is "nothing": none chosen is no tag, and a press on the chosen chip takes it back.
// The game chips open only under "Oyun", one row that scrolls sideways (the owner's call, 2 Kasım,
// 15.1, 15.2).
export function LobbyChoices({
  intent,
  tag,
  onIntent,
  onTag,
}: {
  intent: Intent | null;
  tag: Concept | null;
  onIntent: (next: Intent | null) => void;
  onTag: (next: Concept | null) => void;
}) {
  const { c } = useKit();
  const hint =
    intent === 'game' ? tr.rooms.gameTagHint : intent ? tr.rooms.intentHint[intent] : null;
  return (
    <View style={{ gap: KIT.size.chipsGap }}>
      {/* "Niyetin", its "· isteğe bağlı" quieter (MekanLobiAc `.lb`). */}
      <T v="kesfetSort" ink>
        {tr.rooms.intentLabel}{' '}
        <T v="kesfetSub" color={c.muted}>
          {tr.rooms.intentOptional}
        </T>
      </T>
      <View style={ROW}>
        {INTENTS.map((v) => (
          <Chip
            key={v}
            testID={`intent-${v}`}
            label={tr.intents[v]}
            on={intent === v}
            onPress={() => {
              const next = intent === v ? null : v;
              onIntent(next);
              // Out of "Oyun" the game row closes and its tag goes with it.
              if (next !== 'game') onTag(null);
            }}
          />
        ))}
      </View>
      {intent === 'game' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          accessibilityLabel={tr.rooms.gameTagLabel}
          contentContainerStyle={ROW}
          testID="game-tags"
        >
          {CONCEPTS.map((v) => (
            <Chip
              key={v}
              testID={`game-tag-${v}`}
              label={tr.concepts[v]}
              on={tag === v}
              onPress={() => onTag(tag === v ? null : v)}
            />
          ))}
        </ScrollView>
      ) : null}
      {hint ? <T v="fine">{hint}</T> : null}
    </View>
  );
}

const ROW = { flexDirection: 'row' as const, gap: KIT.size.chipsGap };

// Masa kur's intent and game tag (yeni arayüz tuvali, MasaKurLobi 32b `.niy`): "Niyetin (isteğe
// bağlı)" over the two parts in a sunk track, the chosen one in the ink; the games under "Oyun" a
// row of chips with the game's picture, sideways. As above: none chosen is no tag, a press on the
// chosen part or chip takes it back, out of "Oyun" the game row closes.
export function CreateLobbyChoices({
  intent,
  tag,
  onIntent,
  onTag,
}: {
  intent: Intent | null;
  tag: Concept | null;
  onIntent: (next: Intent | null) => void;
  onTag: (next: Concept | null) => void;
}) {
  const { c, scheme } = useKit();
  const I = TABLE_SETUP.intent;
  const g = TABLE_SETUP.game;
  const hint =
    intent === 'game' ? tr.rooms.gameTagHint : intent ? tr.rooms.intentHint[intent] : null;
  const chip = KIT.size.chip;
  const art = chip - 2 * g.pad;
  return (
    <View style={{ paddingTop: I.padTop, paddingBottom: I.padBottom }}>
      <T v="kesfetSort" color={c.muted} style={{ marginBottom: I.labelGap }}>
        {tr.createTable.intentLabel}
      </T>
      <View
        accessibilityRole="radiogroup"
        style={{
          flexDirection: 'row',
          gap: I.gap,
          padding: I.pad,
          borderRadius: I.item,
          backgroundColor: c.infoRow,
        }}
      >
        {INTENTS.map((v) => {
          const on = intent === v;
          return (
            <View key={v} style={{ flex: 1 }}>
              <Tap
                testID={`intent-${v}`}
                accessibilityRole="radio"
                accessibilityLabel={tr.intents[v]}
                accessibilityState={{ checked: on }}
                feel="selection"
                sink={false}
                onPress={() => {
                  const next = on ? null : v;
                  onIntent(next);
                  if (next !== 'game') onTag(null);
                }}
                style={{
                  height: I.item,
                  borderRadius: I.item / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? c.segOn : undefined,
                }}
              >
                <T v="btnSm" color={on ? c.segOnInk : c.muted} lines={1} fit>
                  {tr.intents[v]}
                </T>
              </Tap>
            </View>
          );
        })}
      </View>
      {intent === 'game' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          accessibilityLabel={tr.rooms.gameTagLabel}
          style={{ marginTop: I.gamesTop, marginHorizontal: -KIT.size.sheetPadX }}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: g.gap,
            paddingHorizontal: KIT.size.sheetPadX,
          }}
          testID="game-tags"
        >
          {CONCEPTS.map((v) => {
            const on = tag === v;
            const picture = GAME_CARDS.find((card) => conceptOf(card.id) === v)?.art;
            return (
              <Tap
                key={v}
                testID={`game-tag-${v}`}
                accessibilityLabel={tr.concepts[v]}
                accessibilityState={{ selected: on }}
                onPress={() => onTag(on ? null : v)}
                style={{
                  height: chip,
                  borderRadius: chip / 2,
                  paddingLeft: picture ? g.pad : g.padRight,
                  paddingRight: g.padRight,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: g.gap,
                  backgroundColor: on ? c.segOn : g[scheme].ground,
                  borderWidth: KIT.size.hair,
                  borderColor: on ? c.segOn : g[scheme].ring,
                }}
              >
                {picture ? (
                  <Image
                    source={picture}
                    fadeDuration={0}
                    resizeMode="cover"
                    style={{ width: art, height: art, borderRadius: art / 2 }}
                  />
                ) : null}
                <T v="kesfetChip" color={on ? c.segOnInk : c.ink}>
                  {tr.concepts[v]}
                </T>
              </Tap>
            );
          })}
        </ScrollView>
      ) : null}
      {hint ? (
        <T v="menuNote" color={c.muted} style={{ marginTop: I.noteTop }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}
