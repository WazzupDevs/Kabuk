import { CONCEPTS, type Concept, type Intent, INTENTS } from '@shared/rooms.ts';
import { ScrollView, View } from 'react-native';

import { Chip, T } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

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
  const hint =
    intent === 'game' ? tr.rooms.gameTagHint : intent ? tr.rooms.intentHint[intent] : null;
  return (
    <View style={{ gap: KIT.size.chipsGap }}>
      <T v="eyebrow">{tr.rooms.intentLabel}</T>
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
