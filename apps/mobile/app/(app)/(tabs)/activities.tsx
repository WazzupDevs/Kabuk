import { groupHistory, historyDay, historyResult, historySessions } from '@shared/activities.ts';
import { explorePlace, todayEvents } from '@shared/explore.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, useWindowDimensions, View } from 'react-native';

import { Btn, Glass, Li, Seg, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { GameDisc } from '@/components/Glyph';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { Tag } from '@/components/Tag';
import { boxShadowParts } from '@/components/NativeShadow';
import { EventCard } from '@/features/activities/EventCard';
import { useGameResults } from '@/features/activities/useGameResults';
import { GiftCard } from '@/features/gifts/GiftCard';
import { EmptyCard } from '@/features/explore/EmptyCard';
import { useExplorePlace } from '@/features/explore/placeStore';
import { useCityVenues } from '@/features/explore/useExploreVenues';
import {
  HistoryActions,
  HistoryAddHint,
  useHistoryActions,
} from '@/features/friends/historyActions';
import { useHistoryFriends, usePlayHistory } from '@/features/friends/queries';
import { GAME_GLYPH } from '@/features/games/GameCard';
import { errorMessage } from '@/i18n/errors';
import { type HistoryConcept, historyConcept, tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useNow } from '@/lib/useNow';
import { useNarrow } from '@/lib/useNarrow';
import { LargeTitle, Rise, Sheet, StickyFade, StickyField } from '@/motion';
import { ACTIVITIES as A } from '@/theme/activities';
import { KIT } from '@/theme/auraKit';
import { EXPLORE } from '@/theme/explore';
import { NARROW_SCREEN, SPACING } from '@/theme/tokens';

type Tab = 'events' | 'history';

// Aktiviteler (docs/SPEC_V4.md §4.C, K-15; v44: .acts): "Aktiviteler" lists today's events at the
// venues of Keşfet's city (K-38; the district is Keşfet's alone), earliest first, each opening the
// venue's page (K-43); no campaigns and no "ilgileniyorum". "Geçmiş" is the caller's play history
// under day headings, each record with its game's result; a record opens what Bildirimler offers
// for it ("Arkadaş ekle" or "İstek gönder", "Mesaj" once friends, "Diğer"). Nothing is sorted by
// location (rule 6). docs/design/iskelet.md → 5.3: a tab's large title (the place as its eyebrow)
// scrolling and fading with the content, the gift card, then Etkinlikler and Geçmiş as the sticky
// field pinning under the top (3.2); the gift card fades out and shrinks over the last 80 px before
// they pin. The scroll is the screen's (Screen → ScrollScreen), on the UI thread.
export default function ActivitiesScreen() {
  const [tab, setTab] = useState<Tab>('events');
  const now = useNow(60_000);
  const city = useCity();
  const narrow = useNarrow();
  const { scheme } = useKit();
  return (
    <Screen edges={['top']} refreshable side={A.side} padTop={A.top}>
      {/* U15: the place as an eyebrow over the title (both tabs), 4 apart; the title 36/800 6 in
          from the cards (tuval Aktivite). */}
      <LargeTitle kind="buyukBaslik">
        <View style={{ gap: SPACING[1], marginHorizontal: A.titleIn }}>
          {city.place ? <T v="eyebrow">{tr.activities.fromVenues(city.place.city)}</T> : null}
          <T v="exploreTitle" accessibilityRole="header">
            {tr.tabs.activities}
          </T>
        </View>
      </LargeTitle>
      {/* Hediye paketleri (§4.U): the gift card over the tabs; its packs stand out over its top
          (the room for them is the card's own). */}
      <StickyFade>
        <View style={{ paddingBottom: A.tabsTop }}>
          <GiftCard />
        </View>
      </StickyFade>
      <StickyField band side={A.side}>
        <Seg<Tab>
          narrow={narrow}
          board={{
            item: A.tabs.item,
            radius: A.tabs.radius,
            type: 'tabsBoard',
            face: A[scheme].tabsGlass,
            onShadow: A[scheme].tabOnShadow || undefined,
          }}
          value={tab}
          onChange={setTab}
          accessibilityLabel={tr.activities.tabs}
          options={[
            { value: 'events', label: tr.activities.events, testID: 'activities-tab-events' },
            { value: 'history', label: tr.activities.history, testID: 'activities-tab-history' },
          ]}
        />
      </StickyField>
      {tab === 'events' ? <Events now={now} city={city} /> : <History now={now} />}
    </Screen>
  );
}

// Keşfet's city (K-38): the venues and the place chosen there.
function useCity() {
  const { venues, cities, listed } = useCityVenues();
  const saved = useExplorePlace((s) => s.saved);
  const loadPlace = useExplorePlace((s) => s.load);
  useEffect(loadPlace, [loadPlace]);
  const place = useMemo(() => explorePlace(saved, listed), [saved, listed]);
  return { venues, cities, listed, place };
}

function Events({ now, city }: { now: number; city: ReturnType<typeof useCity> }) {
  const { venues, cities, listed, place } = city;
  const events = useMemo(
    () =>
      // Every city unless one is chosen in Keşfet (5 Kasım).
      todayEvents(place ? listed.filter((v) => v.city === place.city) : listed, now),
    [listed, place, now],
  );
  const pending = venues.isPending || cities.isPending;
  const loading = useLoaderHold(pending);

  // A failed refresh keeps the list (audit M8-02): the error only stands in for nothing read.
  if ((venues.isError && !venues.data) || (cities.isError && !cities.data)) {
    return (
      <View style={{ marginTop: A.listTop }}>
        <EmptyState
          kind="error"
          inPage
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
      </View>
    );
  }
  if (pending || loading) {
    return (
      // Aura v75 AktivitelerHal: 24 under the switch, as the list.
      <View style={{ marginTop: A.listTop }}>
        <EmptyState kind="loading" inPage body={tr.common.loading} />
      </View>
    );
  }
  if (events.length === 0) {
    // iskelet.md → 3.4: the small empty card, never half the screen.
    return (
      <View style={{ marginTop: A.listTop }}>
        <EmptyCard
          testID="activities-no-events"
          title={tr.activities.noEvents}
          body={tr.activities.noEventsHint}
          picture={NO_EVENTS_PICTURE}
        />
      </View>
    );
  }
  return (
    <View style={{ marginTop: A.listTop, gap: SPACING[3] }}>
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
  );
}

function History({ now }: { now: number }) {
  const history = usePlayHistory();
  const friends = useHistoryFriends();
  const results = useGameResults();
  const { act, openMenu, sheets } = useHistoryActions();
  const [open, setOpen] = useState<string | null>(null);
  // Side by side the name and its actions do not fit at 320 dp with the largest text.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  const loading = useLoaderHold(history.isPending);
  const today = new Date(now);
  const { c, scheme } = useKit();
  const S = A.sheet;

  // A failed refresh keeps the history (audit PRO-2).
  if (history.isError && !history.data) {
    return (
      <View style={{ marginTop: A.listTop }}>
        <EmptyState
          kind="error"
          inPage
          body={errorMessage(history.error)}
          action={{
            label: tr.common.retry,
            onPress: () => void history.refetch(),
            loading: history.isRefetching,
          }}
        />
      </View>
    );
  }
  if (history.isPending || loading) {
    return (
      // Aura v75 AktivitelerHal: 24 under the switch, as the list.
      <View style={{ marginTop: A.listTop }}>
        <EmptyState kind="loading" inPage body={tr.common.loading} />
      </View>
    );
  }
  if (history.data.length === 0) {
    return (
      <View style={{ marginTop: A.listTop }}>
        <EmptyCard
          testID="activities-no-history"
          title={tr.activities.noHistory}
          body={tr.friends.noHistory}
          picture={NO_HISTORY_PICTURE}
        />
      </View>
    );
  }

  // One row a game (the owner's report, 30 Ekim): the records of one table and game in a day
  // make one session, its people opened by a press (@shared/activities.ts → historySessions).
  const groups = groupHistory(history.data, today).map((group) => ({
    day: group.day,
    sessions: historySessions(group.rows),
  }));
  const session = groups.flatMap((g) => g.sessions).find((x) => x.key === open) ?? null;
  return (
    <View>
      {groups.map((group) => (
        // iskelet.md → 3.4 and 5.3: the day with its number of games beside it over its rows on
        // one grouped list card (tuval Aktivite: 26 over the day, 12 under it, 6 in).
        <View key={group.day} style={{ marginTop: A.dayTop, gap: A.dayBottom }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              columnGap: A.dayGap,
              marginHorizontal: A.titleIn,
            }}
          >
            <T v="exploreSection" accessibilityRole="header">
              {tr.activities.days[group.day]}
            </T>
            <T v="exploreCount" color={c.muted} tabular>
              {tr.activities.gameCount(group.sessions.length)}
            </T>
          </View>
          <Glass
            face={EXPLORE[scheme].card}
            radius={A.card.radius}
            style={{ padding: A.card.pad, borderRadius: A.card.radius }}
          >
            {group.sessions.map((x, i) => {
              const h = x.first;
              const result = historyResult(h, results.data ?? []);
              return (
                <Rise key={x.key} index={i}>
                  {i > 0 ? <RowHair /> : null}
                  <HistoryRow
                    concept={historyConcept(h.concept)}
                    alias={h.other_alias}
                    people={x.people.length}
                    when={tr.activities.when(h.played_at, historyDay(h.played_at, today))}
                    result={result ? tr.activities.results[result] : null}
                    variant={result ?? undefined}
                    onPress={() => setOpen(x.key)}
                  />
                </Rise>
              );
            })}
          </Glass>
        </View>
      ))}

      <Sheet
        visible={session !== null}
        onClose={() => setOpen(null)}
        // iskelet.md → 5.3: the game's picture, its name, the day and time and how many sat there
        // in the title; the green-toned note; then each person at that table on one grouped list
        // (MASADAKİLER), with what can be done. "Kapat" at the foot stays (E2E's
        // history-sheet-close): only the people scroll.
        title={session ? tr.activities.game(historyConcept(session.first.concept)) : ''}
        titleArt={
          session ? (
            <Thumb
              concept={historyConcept(session.first.concept)}
              side={S.art}
              radius={S.artRadius}
              shadow={A[scheme].artShadow}
            />
          ) : null
        }
        subtitle={
          session
            ? tr.activities.sheetNote(
                tr.activities.whenFull(
                  session.first.played_at,
                  historyDay(session.first.played_at, today),
                ),
                session.people.length,
              )
            : undefined
        }
        footer={
          <Btn
            block
            variant="glassy"
            label={tr.common.close}
            onPress={() => setOpen(null)}
            testID="history-sheet-close"
          />
        }
      >
        {session ? (
          <View style={{ gap: S.eyebrowTop }}>
            <HistoryAddHint boxed records={session.people} />
            <View style={{ gap: S.eyebrowBottom }}>
              <View style={{ paddingHorizontal: S.eyebrowIn }}>
                <T v="sheetEyebrow" color={c.muted} accessibilityRole="header">
                  {upperTr(tr.activities.atTable)}
                </T>
              </View>
              {/* tuval Sohbet: white 90 % on a white edge, 26 round, 4 / 6 inside; a hairline
                  over every row but the first, across the row. */}
              <View
                style={{
                  backgroundColor: A[scheme].people.fill,
                  borderWidth: KIT.size.edge,
                  borderColor: A[scheme].people.edge,
                  borderRadius: S.card.radius,
                  paddingHorizontal: S.card.padX,
                  paddingVertical: S.card.padY,
                  overflow: 'hidden',
                }}
              >
                {session.people.map((record, i) => (
                  <View
                    key={record.id}
                    style={{
                      paddingHorizontal: S.row.padX,
                      paddingVertical: S.row.padY,
                      borderTopWidth: i > 0 ? KIT.size.hair : 0,
                      borderTopColor: A[scheme].people.hair,
                    }}
                  >
                    <HistoryActions
                      record={record}
                      friend={friends.data?.get(record.id)}
                      act={act}
                      narrow={narrow}
                      row={{
                        lead: <Kanki index={i} />,
                        // One line, smaller where it does not fit: at 360 dp the name broke in
                        // its middle (docs/denetim/pano-fark-2026-11.md → PF-27).
                        title: (
                          <T v="placeName" lines={1} fit>
                            {record.other_alias}
                          </T>
                        ),
                      }}
                      onMore={() => {
                        setOpen(null);
                        openMenu(record.id);
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
            {act.isError ? (
              <T v="fine" color={KIT.danger}>
                {errorMessage(act.error)}
              </T>
            ) : null}
          </View>
        ) : null}
      </Sheet>
      {sheets}
    </View>
  );
}

// A game (iskelet.md → 5.3): its picture 56, its name and how many sat there (or with whom), the
// time at the right in digits of one width; the result under the time.
function HistoryRow({
  concept,
  alias,
  people,
  when,
  result,
  variant,
  onPress,
}: {
  concept: HistoryConcept;
  alias: string;
  people: number;
  when: string;
  result: string | null;
  variant: 'won' | 'lost' | 'done' | undefined;
  onPress: () => void;
}) {
  const { c, scheme } = useKit();
  const game = tr.activities.game(concept);
  const with_ = people > 1 ? tr.activities.withPeople(people) : tr.activities.withTable(alias);
  return (
    <Li
      testID={`history-row-${alias}`}
      accessibilityLabel={tr.activities.rowLabel(game, with_, when, result)}
      onPress={onPress}
      padY={A.row.pad}
      padX={A.row.pad}
      gap={A.row.gap}
    >
      <Thumb concept={concept} shadow={A[scheme].thumbShadow} />
      {/* tuval Aktivite: the name and who sat there, 3 apart; the time 4 down at the right, the
          result under it. */}
      <View style={{ flex: 1, minWidth: 0, gap: A.row.lineGap }}>
        <T v="placeName">{game}</T>
        <T v="placeSub" color={c.muted}>
          {with_}
        </T>
      </View>
      <View
        style={{
          alignSelf: 'flex-start',
          alignItems: 'flex-end',
          marginTop: A.row.timeTop,
          gap: A.row.lineGap,
        }}
      >
        <T v="exploreCount" color={c.muted} tabular>
          {when}
        </T>
        {result && variant ? <Tag variant={variant} label={result} /> : null}
      </View>
    </Li>
  );
}

// The hairline between two rows (3.4; tuval Aktivite): from the words after the picture, 10 short
// of the card's right edge.
function RowHair() {
  const { scheme } = useKit();
  return (
    <View
      style={{
        height: KIT.size.hair,
        marginLeft: A.row.pad + A.thumb.side + A.row.gap,
        marginRight: A.row.pad,
        backgroundColor: A[scheme].hair,
      }}
    />
  );
}

// A person at the table (5.3; tuval Sohbet): a riso buddy standing in a tinted round, both by the
// row's place in the list, never by who they are (the record carries no look of theirs, rule 4).
function Kanki({ index }: { index: number }) {
  const { scheme } = useKit();
  const S = A.sheet;
  const grounds = A[scheme].faces;
  return (
    <View
      style={{
        width: S.face,
        height: S.face,
        borderRadius: S.face / 2,
        overflow: 'hidden',
        backgroundColor: grounds[index % grounds.length],
      }}
    >
      <Image
        source={KANKI[index % KANKI.length]}
        accessible={false}
        resizeMode="contain"
        style={{
          position: 'absolute',
          left: S.buddy.left,
          top: S.buddy.top,
          width: S.buddy.width,
          height: S.buddy.height,
        }}
      />
    </View>
  );
}

// The riso pictures of the history row (Aura v65 §9.1): a chat and Vampir Köylü.
const VAMPIR_THUMB = require('../../../assets/riso/history-vampir.webp');
const CHAT_THUMB = require('../../../assets/riso/history-sohbet.webp');
// The small empty cards' riso (3.4).
const NO_EVENTS_PICTURE: number = require('../../../assets/riso/empty-events.webp');
const NO_HISTORY_PICTURE: number = require('../../../assets/riso/empty-history.webp');
// The buddies of the table's people (assets/riso/buddies).
const KANKI = [
  require('../../../assets/riso/buddies/riso_1a80a9.webp'),
  require('../../../assets/riso/buddies/riso_3c95b1.webp'),
  require('../../../assets/riso/buddies/riso_4957ac.webp'),
  require('../../../assets/riso/buddies/riso_6f419d.webp'),
  require('../../../assets/riso/buddies/riso_7d5ef2.webp'),
  require('../../../assets/riso/buddies/riso_b83534.webp'),
] as const;

// The game's picture (tuval Aktivite: 56, 14 round; the sheet's 54, 16 round), on its own soft
// shadow; a chat without a game has the speech bubbles.
function Thumb({
  concept,
  shadow: css,
  side = A.thumb.side,
  radius = A.thumb.radius,
}: {
  concept: HistoryConcept;
  shadow: string;
  side?: number;
  radius?: number;
}) {
  const shadow = boxShadowParts(useLabOff('golge'), css || undefined, radius);
  return (
    <View style={{ width: side, height: side, borderRadius: radius, boxShadow: shadow.boxShadow }}>
      {shadow.node}
      <View style={{ width: side, height: side, borderRadius: radius, overflow: 'hidden' }}>
        <Picture concept={concept} side={side} />
      </View>
    </View>
  );
}

// The riso pictures (Aura v65 §9.1); the other games keep their disc until theirs come (§9.2).
function Picture({ concept, side }: { concept: HistoryConcept; side: number }) {
  if (concept !== 'vampir' && concept !== 'chat') {
    return <GameDisc name={GAME_GLYPH[concept]} size={side} />;
  }
  return (
    <Image
      source={concept === 'vampir' ? VAMPIR_THUMB : CHAT_THUMB}
      accessible={false}
      style={{ width: side, height: side }}
    />
  );
}
