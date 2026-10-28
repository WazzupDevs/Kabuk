import { groupHistory, historyDay, historyResult } from '@shared/activities.ts';
import { explorePlace, todayEvents } from '@shared/explore.ts';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { GameDisc } from '@/components/Glyph';
import { Icon } from '@/components/Icon';
import { useLoaderHold } from '@/components/Loader';
import { Rise } from '@/components/motion';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { EventCard } from '@/features/activities/EventCard';
import { useGameResults } from '@/features/activities/useGameResults';
import { useExplorePlace } from '@/features/explore/placeStore';
import { useCityVenues } from '@/features/explore/useExploreVenues';
import { HistoryActions, useHistoryActions } from '@/features/friends/historyActions';
import { useHistoryFriends, usePlayHistory } from '@/features/friends/queries';
import { GAME_GLYPH } from '@/features/games/GameCard';
import { errorMessage } from '@/i18n/errors';
import { type HistoryConcept, historyConcept, tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { rowPress } from '@/theme/rowPress';
import { useTheme } from '@/theme/ThemeProvider';
import { NARROW_SCREEN, SPACING } from '@/theme/tokens';

type Tab = 'events' | 'history';

// v44: .hthumb, a record's picture.
const THUMB = SPACING[12] + SPACING[1];

// Aktiviteler (docs/SPEC_V4.md §4.C, K-15; v44: .acts): "Aktiviteler" lists today's events at the
// venues of Keşfet's city (K-38; the district is Keşfet's alone), earliest first, each opening the
// venue's page (K-43); no campaigns and no "ilgileniyorum". "Geçmiş" is the caller's play history
// under day headings, each record with its game's result; a record opens what Bildirimler offers
// for it ("Arkadaş ekle" or "İstek gönder", "Mesaj" once friends, "Diğer"). Nothing is sorted by
// location (rule 6).
export default function ActivitiesScreen() {
  const [tab, setTab] = useState<Tab>('events');
  const now = useNow(60_000);
  return (
    <Screen edges={['top']} refreshable>
      <ScreenHeader title={tr.tabs.activities} />
      <View className="mt-3">
        <Segmented<Tab>
          fill
          value={tab}
          onChange={setTab}
          accessibilityLabel={tr.activities.tabs}
          options={[
            { value: 'events', label: tr.activities.events, testID: 'activities-tab-events' },
            { value: 'history', label: tr.activities.history, testID: 'activities-tab-history' },
          ]}
        />
      </View>
      {tab === 'events' ? <Events now={now} /> : <History now={now} />}
    </Screen>
  );
}

function Events({ now }: { now: number }) {
  const { venues, cities, listed } = useCityVenues();
  const saved = useExplorePlace((s) => s.saved);
  const loadPlace = useExplorePlace((s) => s.load);
  useEffect(loadPlace, [loadPlace]);
  const place = useMemo(() => explorePlace(saved, listed), [saved, listed]);
  const events = useMemo(
    () =>
      place
        ? todayEvents(
            listed.filter((v) => v.city === place.city),
            now,
          )
        : [],
    [listed, place, now],
  );
  const pending = venues.isPending || cities.isPending;
  const loading = useLoaderHold(pending);

  if (venues.isError || cities.isError) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        body={errorMessage(venues.error ?? cities.error)}
        action={{
          label: tr.common.retry,
          onPress: () => {
            void venues.refetch();
            void cities.refetch();
          },
          loading: venues.isRefetching || cities.isRefetching,
        }}
      />
    );
  }
  if (pending || loading) {
    return (
      <View className="mt-12">
        <EmptyState kind="loading" body={tr.common.loading} />
      </View>
    );
  }
  return (
    <View className="mt-2">
      {place ? (
        <Text variant="label" tone="muted" className="mx-0.5 mb-2.5 mt-2">
          {tr.activities.fromVenues(place.city)}
        </Text>
      ) : null}
      {events.length === 0 ? (
        <View testID="activities-no-events" className="mt-6">
          <EmptyState
            kind="empty"
            title={tr.activities.noEvents}
            body={tr.activities.noEventsHint}
          />
        </View>
      ) : (
        <View style={{ gap: SPACING[3] }}>
          {events.map(({ venue, event }, i) => (
            <Rise key={`${venue.id}-${event.startsAt}-${event.title}`} index={i}>
              <EventCard
                venue={venue}
                event={event}
                now={now}
                onPress={() =>
                  router.navigate({ pathname: '/explore/[venueId]', params: { venueId: venue.id } })
                }
              />
            </Rise>
          ))}
        </View>
      )}
    </View>
  );
}

function History({ now }: { now: number }) {
  const history = usePlayHistory();
  const friends = useHistoryFriends();
  const results = useGameResults();
  const { act, openMenu, sheets } = useHistoryActions();
  const [open, setOpen] = useState<string | null>(null);
  // Side by side the action and "Diğer" do not fit at 320 dp with the largest text.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  const loading = useLoaderHold(history.isPending);
  const today = new Date(now);

  // A failed refresh keeps the history (audit PRO-2).
  if (history.isError && !history.data) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        body={errorMessage(history.error)}
        action={{
          label: tr.common.retry,
          onPress: () => void history.refetch(),
          loading: history.isRefetching,
        }}
      />
    );
  }
  if (history.isPending || loading) {
    return (
      <View className="mt-12">
        <EmptyState kind="loading" body={tr.common.loading} />
      </View>
    );
  }
  if (history.data.length === 0) {
    return (
      <View testID="activities-no-history" className="flex-1 justify-center">
        <EmptyState kind="empty" body={tr.friends.noHistory} />
      </View>
    );
  }

  const record = history.data.find((h) => h.id === open) ?? null;
  return (
    <View className="mt-3">
      <Card flush>
        <View style={{ paddingTop: SPACING[1], paddingBottom: SPACING[2] }}>
          {groupHistory(history.data, today).map((group) => (
            <View key={group.day}>
              <View
                style={{
                  paddingHorizontal: SPACING[4],
                  paddingTop: SPACING[3],
                  paddingBottom: SPACING[1],
                }}
              >
                <Text variant="label" tone="muted" accessibilityRole="header">
                  {tr.activities.days[group.day]}
                </Text>
              </View>
              {group.rows.map((h, i) => {
                const result = historyResult(h, results.data ?? []);
                return (
                  <Rise key={h.id} index={i}>
                    <HistoryRow
                      concept={historyConcept(h.concept)}
                      alias={h.other_alias}
                      when={tr.activities.when(h.played_at, historyDay(h.played_at, today))}
                      result={result ? tr.activities.results[result] : null}
                      variant={result ?? undefined}
                      onPress={() => setOpen(h.id)}
                    />
                  </Rise>
                );
              })}
            </View>
          ))}
        </View>
      </Card>

      <Sheet
        visible={record !== null}
        onClose={() => setOpen(null)}
        // skall tuvali (AktivitelerGecmisKayit): the person, then the game and the time.
        title={record ? record.other_alias : ''}
      >
        {record ? (
          <View>
            <Text variant="fine">
              {tr.activities.sheetLine(
                tr.activities.game(historyConcept(record.concept)),
                tr.activities.when(record.played_at, historyDay(record.played_at, today)),
              )}
            </Text>
            <HistoryActions
              record={record}
              friend={friends.data?.get(record.id)}
              act={act}
              narrow={narrow}
              onMore={() => {
                setOpen(null);
                openMenu(record.id);
              }}
            />
            {act.isError ? (
              <Text variant="fine" tone="danger" className="mt-2">
                {errorMessage(act.error)}
              </Text>
            ) : null}
          </View>
        ) : null}
        <Button
          size="lg"
          variant="neutral"
          label={tr.common.close}
          onPress={() => setOpen(null)}
          testID="history-sheet-close"
        />
      </Sheet>
      {sheets}
    </View>
  );
}

// A record (v44: .hrow): the game's picture, its name and the time, the other table and the result.
function HistoryRow({
  concept,
  alias,
  when,
  result,
  variant,
  onPress,
}: {
  concept: HistoryConcept;
  alias: string;
  when: string;
  result: string | null;
  variant: 'won' | 'lost' | 'done' | undefined;
  onPress: () => void;
}) {
  const theme = useTheme();
  const game = tr.activities.game(concept);
  return (
    <Pressable
      testID={`history-row-${alias}`}
      accessibilityRole="button"
      accessibilityLabel={tr.activities.rowLabel(game, alias, when, result)}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          className="flex-row items-center"
          style={{
            gap: SPACING[3] + SPACING[0.5],
            minHeight: SPACING[16] + SPACING[2],
            paddingVertical: SPACING[3],
            ...rowPress(theme, pressed),
          }}
        >
          <Thumb concept={concept} />
          <View className="flex-1" style={{ gap: SPACING[0.5] }}>
            <View className="flex-row items-baseline justify-between" style={{ gap: SPACING[2] }}>
              <Text variant="heading" className="shrink">
                {game}
              </Text>
              <Text variant="fine" tone="muted">
                {when}
              </Text>
            </View>
            <View
              className="flex-row flex-wrap items-center justify-between"
              style={{ gap: SPACING[2] }}
            >
              <Text variant="fine" tone="muted" className="shrink">
                {tr.activities.withTable(alias)}
              </Text>
              {result && variant ? <Tag variant={variant} label={result} /> : null}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

// The game's disc; a chat without a game has the speech bubbles.
function Thumb({ concept }: { concept: HistoryConcept }) {
  const { colors, shape } = useTheme();
  if (concept !== 'chat') return <GameDisc name={GAME_GLYPH[concept]} size={THUMB} />;
  return (
    <View
      accessible={false}
      className="items-center justify-center"
      style={{
        width: THUMB,
        height: THUMB,
        borderRadius: shape.radius.pill,
        backgroundColor: colors.surface2,
      }}
    >
      <Icon name="chatbubbles-outline" tone="muted" />
    </View>
  );
}
