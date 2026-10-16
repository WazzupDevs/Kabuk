import type { Concept, Intent } from '@shared/rooms.ts';
import { hasActiveTable } from '@shared/navigation.ts';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ListRow } from '@/components/ListRow';
import { Rise } from '@/components/motion';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { type RecentGame, useRecentGames } from '@/features/activities/useRecentGames';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { NotificationsBell } from '@/features/notifications/Bell';
import { GAME_ORDER, GameCard, gameCardState, GameCell, GameGrid } from '@/features/games/GameCard';
import { useCreateSolo } from '@/features/rooms/useCreateSolo';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';

type Game = Concept;
type Mode = 'solo' | 'room';

// The intent "Bu oyunla lobiye aç" opens "Masanı lobiye aç" with, beside the game's tag (the table
// still starts without a game; docs/SPEC_V3.md §23.C).
const INTENT_OF: Record<Game, Intent> = {
  tabu: 'game',
  sohbet: 'chat',
  sahtekar: 'game',
  harf: 'game',
  sarki: 'game',
  ibre: 'game',
};

// Aktiviteler, the game hub (docs/SPEC_V3.md §18.3; canvas: Aşama 8 · Saha → Oyun listesi): the
// games as cards under "Tek telefonla" (the one-table room of the venue screen) and "İki masayla"
// ("Bu oyunla lobiye aç": the Mekan tab with "Masanı lobiye aç" open, the game's tag chosen). A card opens the game's sheet: what it is, how it is played and the action,
// or "Oynamak için mekana gir" away from a venue. Below, the caller's own recent games; the section
// is left out when there are none. No new game or content. At a venue, a "Tek telefonla" game the
// table's headcount is too few for is faded with its reason (pure/gameCatalog.ts) and does not open;
// "İki masayla" is never faded here: the other table, and so the total, is not known before a room.
// The server checks the count anyway (not_enough_players).
export default function ActivitiesScreen() {
  const table = useActiveTable();
  const now = useNow(30_000);
  const atVenue = hasActiveTable(table.data, now);
  const solo = useCreateSolo();
  const recent = useRecentGames();
  const [open, setOpen] = useState<{ game: Game; mode: Mode } | null>(null);
  const headcount = atVenue ? table.data?.headcount : undefined;
  const cardState = (game: Game, mode: Mode) =>
    mode === 'solo' && headcount !== undefined
      ? gameCardState(game, 'onePhone', headcount)
      : { disabled: false };

  const section = (mode: Mode) => (
    <View className="gap-2.5">
      <View className="flex-row items-baseline justify-between gap-3 px-1">
        <Text variant="heading" accessibilityRole="header">
          {mode === 'solo' ? tr.activities.oneTable : tr.activities.twoTables}
        </Text>
        <Text variant="fine">
          {mode === 'solo' ? tr.rooms.playWithTable : tr.activities.createWith}
        </Text>
      </View>
      <Card>
        <GameGrid>
          {GAME_ORDER.map((game) => {
            const card = cardState(game, mode);
            return (
              <GameCell key={game}>
                <GameCard
                  concept={game}
                  testID={`activities-${mode}-card-${game}`}
                  onPress={() => setOpen({ game, mode })}
                  disabled={card.disabled}
                  reason={card.reason}
                />
              </GameCell>
            );
          })}
        </GameGrid>
      </Card>
    </View>
  );

  return (
    <Screen edges={['top']}>
      <ScreenHeader title={tr.tabs.activities} trailing={<NotificationsBell />} />

      <View className="mt-3 gap-5">
        <Rise>{section('solo')}</Rise>
        <Rise index={1}>{section('room')}</Rise>
        {solo.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(solo.error)}
          </Text>
        ) : null}

        {recent.data && recent.data.length > 0 ? (
          <View className="mt-2 gap-3">
            <Text variant="heading" accessibilityRole="header">
              {tr.activities.recent}
            </Text>
            {recent.data.map((g) => (
              <RecentRow key={g.id} game={g} />
            ))}
          </View>
        ) : null}
      </View>

      <Sheet
        visible={open !== null}
        onClose={() => setOpen(null)}
        title={open ? tr.concepts[open.game] : ''}
      >
        {open ? (
          <View className="gap-2.5">
            <Text>{tr.activities[open.game].body}</Text>
            <Text variant="label">{tr.activities.howTo}</Text>
            {tr.activities[open.game].steps.map((step) => (
              <Text key={step} variant="fine">
                {step}
              </Text>
            ))}
          </View>
        ) : null}
        {open && !atVenue ? (
          <Button
            variant="neutral"
            label={tr.activities.goToVenue}
            onPress={() => {
              setOpen(null);
              router.navigate('/explore');
            }}
            testID={`activities-venue-${open.game}`}
          />
        ) : open?.mode === 'solo' ? (
          <Button
            variant="secondary"
            label={tr.rooms.playWithTable}
            loading={solo.isPending}
            disabled={solo.isPending}
            onPress={() => {
              setOpen(null);
              solo.mutate();
            }}
            testID={`activities-solo-${open.game}`}
          />
        ) : open ? (
          <Button
            label={tr.activities.createWith}
            onPress={() => {
              const game = open.game;
              setOpen(null);
              router.navigate({
                pathname: '/venue',
                params: { lobbyGame: game, lobbyIntent: INTENT_OF[game] },
              });
            }}
            testID={`activities-create-${open.game}`}
          />
        ) : null}
        <Button
          variant="ghost"
          label={tr.common.close}
          onPress={() => setOpen(null)}
          testID="activities-sheet-close"
        />
      </Sheet>
    </Screen>
  );
}

function RecentRow({ game }: { game: RecentGame }) {
  const label = tr.concepts[game.concept];
  return (
    <ListRow
      card
      title={label}
      meta={tr.activities.recentRow(game.otherAlias, game.completedAt)}
      leading={
        game.otherAlias ? (
          <Avatar kind="table" alias={game.otherAlias} size="lg" />
        ) : (
          <Avatar kind="table" alias={label} size="lg" />
        )
      }
      trailing={
        game.score !== null ? (
          <View accessible accessibilityLabel={game.won ? tr.activities.won : undefined}>
            <Tag
              variant={game.won ? 'accent' : 'neutral'}
              label={tr.activities.score(game.score)}
            />
          </View>
        ) : undefined
      }
    />
  );
}
