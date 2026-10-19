import type { Concept } from '@shared/rooms.ts';
import { View } from 'react-native';

import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';

import { GAME_ORDER, GameCard, gameCardState, GameCell, GameGrid } from './GameCard';

type Props = {
  // The table's people: a game the headcount does not allow is faded with its reason.
  headcount: number;
  onPick: (game: Concept) => void;
  // A pick on its way: no second one (CLAUDE.md → Ekran davranışı). `pendingGame` alone keeps the
  // others pressable (Sohbet kartları' first card in a room).
  busy?: boolean;
  pendingGame?: Concept | null;
  error?: unknown;
};

// One table's games as cards (canvas: Aşama 8 · Saha → Oyun listesi): in the one-table room, and on
// the table screen before there is a room (K-36).
export function SoloGames({ headcount, onPick, busy = false, pendingGame = null, error }: Props) {
  return (
    <Card>
      <View className="gap-3">
        <View className="gap-0.5">
          <Text variant="heading" accessibilityRole="header">
            {tr.games.soloTitle}
          </Text>
          <Text variant="fine">{tr.games.soloHint(headcount)}</Text>
        </View>
        <GameGrid>
          {GAME_ORDER.map((game) => {
            const card = gameCardState(game, 'onePhone', headcount);
            return (
              <GameCell key={game}>
                <GameCard
                  concept={game}
                  testID={`solo-${game}`}
                  accessibilityLabel={tr.games.start(tr.concepts[game])}
                  disabled={card.disabled || busy || pendingGame === game}
                  reason={card.reason}
                  onPress={() => onPick(game)}
                />
              </GameCell>
            );
          })}
        </GameGrid>
        {error ? (
          <Text variant="fine" tone="danger">
            {errorMessage(error)}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
