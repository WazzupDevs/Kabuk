import type { RefereedTabuState, TabuCard } from '@shared/tabu.ts';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { GameStage } from '@/features/games/GameStage';
import { VoiceTabu } from '@/features/games/VoiceTabu';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

import { GATE_NOW } from './deterministic';

// Kapsül Anlat, the judging side while the other table tells (v46: Oyun → Kapsül Anlat → Rakip):
// the visual gate's trial game phase, with v46's sample data as the prototype draws it with the
// gate's seed (turn 2 of 6, 60 s left, 4–0, "Can anlatıyor", YAĞMUR). The room screen's GameStage
// around the game's own component with a fixed state; the turn's cards are put in the query
// cache, so nothing is asked of the server and every action is a no-op.
const ROOM = 'gorsel-oda';
const STATE: RefereedTabuState = {
  concept: 'tabu',
  mode: 'refereed',
  phase: 'playing',
  gameNo: 1,
  turnNo: 2,
  totalTurns: 6,
  turnSeconds: 60,
  cardsPerTurn: 12,
  describingTable: 'owner',
  turnPhase: 'running',
  turnEndsAt: new Date(GATE_NOW + 60_000).toISOString(),
  readyEndsAt: null,
  lastTurn: null,
  passesUsed: 0,
  maxPasses: 3,
  cardIndex: 0,
  describer: 'gorsel-anlatan',
  scores: { owner: 4, guest: 0 },
};
const CARDS: TabuCard[] = [
  { word: 'Yağmur', forbidden: ['şemsiye', 'ıslak', 'bulut', 'damla', 'hava'] },
];
const ALIASES = { owner: 'Mor Dalga', guest: 'Turuncu Kirpi' };
const DESCRIBER = 'Can';

export function TabuJudgePhase() {
  const queryClient = useQueryClient();
  // Before the first render: the card query finds its answer and never fetches.
  useState(() =>
    queryClient.setQueryData(['tabuTurnCards', ROOM, STATE.gameNo, STATE.turnNo], {
      turnNo: STATE.turnNo,
      cards: CARDS,
    }),
  );
  const noop = () => undefined;
  return (
    <GameStage
      title={tr.concepts.tabu}
      unread={0}
      chatOpen={false}
      onChat={noop}
      chat={null}
      onEndGame={noop}
      ending={false}
      endError={null}
      solo={false}
    >
      <View style={{ flexGrow: 1, gap: SPACING[3] }}>
        <VoiceTabu
          roomId={ROOM}
          state={STATE}
          side="guest"
          sessionId="gorsel-ben"
          aliasOf={(id) => (id === 'gorsel-anlatan' ? DESCRIBER : undefined)}
          aliases={ALIASES}
        />
      </View>
    </GameStage>
  );
}
