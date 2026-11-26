import { groupHistory, historyDay, historyResult, historySessions } from '@shared/activities.ts';
import { explorePlace, todayEvents } from '@shared/explore.ts';
import { upperTr } from '@shared/trText.ts';
import { useEffect, useMemo, useState } from 'react';
import { Image, useWindowDimensions, View } from 'react-native';

import { Btn, Li, Seg, T, Tag, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { GameDisc } from '@/components/Glyph';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { TabPane, useBuiltTabs } from '@/components/TabPane';
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
import { useNow } from '@/lib/useNow';
import { useNarrow } from '@/lib/useNarrow';
import { LargeTitle, Rise, Sheet, StickyField } from '@/motion';
import { ACTIVITIES as A } from '@/theme/activities';
import { KIT } from '@/theme/auraKit';
import { FLAT } from '@/theme/flatLists';
import { NARROW_SCREEN, SPACING } from '@/theme/tokens';
import { openVenue } from '@/features/explore/openVenue';

// A game's result on its row: won green, lost amber, done the plain glass (the kit's Tag).
const RESULT_TONE = { won: 'green', lost: 'amber', done: 'glassy' } as const;

type Tab = 'events' | 'history';
const TABS: readonly Tab[] = ['events', 'history'];

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
  const built = useBuiltTabs(tab, TABS);
  const now = useNow(60_000);
  const city = useCity();
  const narrow = useNarrow();
  const { scheme } = useKit();
  return (
    <Screen edges={['top']} refreshable side={A.side} padTop={A.top}>
      {/* U15: the place as an eyebrow over the title (both tabs), 4 apart; the title 32/500 (the
          new boards' `.display`). */}
      <LargeTitle kind="buyukBaslik">
        <View style={{ gap: SPACING[1], marginBottom: A.tabsTop }}>
          {city.place ? <T v="eyebrow">{tr.activities.fromVenues(city.place.city)}</T> : null}
          <T v="display" accessibilityRole="header">
            {tr.tabs.activities}
          </T>
        </View>
      </LargeTitle>
      <StickyField band side={A.side}>
        <Seg<Tab>
          narrow={narrow}
          board={{
            item: A.tabs.item,
            radius: A.tabs.radius,
            pad: A.tabs.pad,
            type: 'btnSm',
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
      {/* Both tabs stay built once built (TabPane): a switch only shows one. */}
      <TabPane built={built.has('events')} shown={tab === 'events'}>
        {/* Hediye paketleri (§4.U): the gift card under the tabs, the first card of Etkinlikler
            and as tall as an event's card (the owner's ask, 20 Kasım); its packs stand out over
            its top (the room for them is the card's own). */}
        <View style={{ marginTop: A.listTop }}>
          <GiftCard />
        </View>
        <Events now={now} city={city} />
      </TabPane>
      <TabPane built={built.has('history')} shown={tab === 'history'}>
        <History now={now} />
      </TabPane>
    </Screen>
  );
}

// The board's three events (AktivitelerDolu), for a development build's empty day: tonight, each
// two hours long.
function sampleEvents(now: number) {
  const at = (hour: number, minute: number) => {
    const d = new Date(now);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  const one = (
    id: string,
    name: string,
    kind: 'campus' | 'cafe',
    title: string,
    h: number,
    m: number,
  ) => ({
    venue: { id, name, kind },
    event: { title, startsAt: at(h, m), endsAt: at(h + 2, m) },
  });
  return [
    one('ornek-1', 'Kampüs bahçesi', 'campus', 'Tanışma ateşi: kamp gecesi', 20, 0),
    one('ornek-2', 'Hush Coffee', 'cafe', 'Tüm kahveler 1+1', 10, 0),
    one('ornek-3', 'Gölge Kafe', 'cafe', 'Vampir Köylü turnuvası', 21, 30),
  ];
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
  const real = useMemo(
    () =>
      // Every city unless one is chosen in Keşfet (5 Kasım).
      todayEvents(place ? listed.filter((v) => v.city === place.city) : listed, now),
    [listed, place, now],
  );
  // A development build with no event today shows the board's three (AktivitelerDolu), so the list
  // can be looked at (the owner's ask, 20 Kasım). Never in a release build.
  const sample = __DEV__ && real.length === 0;
  const events = sample ? sampleEvents(now) : real;
  const pending = venues.isPending || cities.isPending;
  const loading = useLoaderHold(pending);

  // A failed refresh keeps the list (audit M8-02): the error only stands in for nothing read.
  if ((venues.isError && !venues.data) || (cities.isError && !cities.data)) {
    return (
      <View style={{ marginTop: A.listTop }}>
        <EmptyState
          kind="error"
          inPage
          body={tr.activities.eventsError}
          error={venues.error ?? cities.error}
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
      // YukleniyorListe (Ortak kurallar C3): the mark in the middle of what is left.
      <View className="flex-1">
        <EmptyState kind="loading" inPage body={tr.common.loading} />
      </View>
    );
  }
  if (events.length === 0) {
    // AktivitelerBos: the riso and its two lines, no card.
    return (
      <View
        // In the middle of the room under the tabs, as every empty state (19 Kasım).
        style={{ flexGrow: 1, justifyContent: 'center', minHeight: A.emptyMin }}
        testID="activities-no-events"
      >
        <EmptyState
          kind="empty"
          riso="events"
          compact
          title={tr.activities.noEvents}
          body={tr.activities.noEventsHint}
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
            onPress={() => {
              if (sample) return;
              openVenue(venue.id, 'navigate');
            }}
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
  const { scheme } = useKit();
  const S = A.sheet;

  // A failed refresh keeps the history (audit PRO-2).
  if (history.isError && !history.data) {
    return (
      <View style={{ marginTop: A.listTop }}>
        <EmptyState
          kind="error"
          inPage
          body={errorMessage(history.error)}
          error={history.error}
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
      // YukleniyorListe (Ortak kurallar C3): the mark in the middle of what is left.
      <View className="flex-1">
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
        // Gecmis: a day's name with its number of games beside it (16/600 and 13/500 on one
        // baseline, 8 apart), its games as flat rows 6 under it, no card and no hairline.
        <View key={group.day} style={{ marginTop: A.listTop + FLAT.day.headTop }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: FLAT.day.gap }}>
            <T v="h3" ink accessibilityRole="header">
              {tr.activities.days[group.day]}
            </T>
            <T v="fine" tabular>
              {tr.activities.gameCount(group.sessions.length)}
            </T>
          </View>
          <View style={{ marginTop: A.listTop + FLAT.day.listTop }}>
            {group.sessions.map((x, i) => {
              const h = x.first;
              const result = historyResult(h, results.data ?? []);
              return (
                <Rise key={x.key} index={i}>
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
          </View>
        </View>
      ))}

      <Sheet
        visible={session !== null}
        onClose={() => setOpen(null)}
        // GecmisMasa: the game's picture, its name, the day and time and how many sat there in
        // the title; the note; then each person at that table (MASADAKİLER) as a flat row with
        // what can be done. "Kapat" at the foot stays (E2E's history-sheet-close): only the
        // people scroll.
        title={session ? tr.activities.game(historyConcept(session.first.concept)) : ''}
        titleType="title"
        look={{
          base: KIT.layer[scheme].sheet,
          padX: KIT.layer.size.sheetPadX,
          headTop: FLAT.game.headTop,
        }}
        titleArt={
          session ? (
            <Thumb
              concept={historyConcept(session.first.concept)}
              side={S.art}
              radius={S.artRadius}
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
          <View>
            <HistoryAddHint records={session.people} />
            <View style={{ marginTop: FLAT.game.labelTop, marginBottom: FLAT.game.labelBottom }}>
              <T v="eyebrow" accessibilityRole="header">
                {upperTr(tr.activities.atTable)}
              </T>
            </View>
            {session.people.map((record, i) => (
              <View
                key={record.id}
                style={{ minHeight: FLAT.person.height, justifyContent: 'center' }}
              >
                <HistoryActions
                  record={record}
                  friend={friends.data?.get(record.id)}
                  act={act}
                  narrow={narrow}
                  row={{
                    lead: <Kanki index={i} />,
                    // One line, smaller where it does not fit: at 360 dp the name broke in its
                    // middle (docs/denetim/pano-fark-2026-11.md → PF-27).
                    title: (
                      <T v="body" strong ink lines={1} fit>
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

// A game (`.rw` in Gecmis): its picture 52, its name and the time on one line, who sat there (or
// with whom) under it; the result beside that line's end. The time in digits of one width.
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
  const game = tr.activities.game(concept);
  const with_ = people > 1 ? tr.activities.withPeople(people) : tr.activities.withTable(alias);
  return (
    <Li
      testID={`history-row-${alias}`}
      accessibilityLabel={tr.activities.rowLabel(game, with_, when, result)}
      onPress={onPress}
      padY={FLAT.row.padY}
      padX={0}
      gap={FLAT.row.gap}
      minHeight={FLAT.row.minHeight}
    >
      <Thumb concept={concept} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="h3">{game}</T>
          </View>
          <T v="fine" tabular>
            {when}
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="body">{with_}</T>
          </View>
          {result && variant ? <Tag tone={RESULT_TONE[variant]} label={result} /> : null}
        </View>
      </View>
    </Li>
  );
}

// A person at the table (GecmisMasa `.kav`): a riso buddy standing in a tinted round, both by the
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

// The game's picture (Gecmis `.th`: 52, 14 round, drawn 1.04 times; the sheet's 56), no shadow; a
// chat without a game has the speech bubbles.
function Thumb({
  concept,
  side = FLAT.thumb.side,
  radius = FLAT.thumb.radius,
}: {
  concept: HistoryConcept;
  side?: number;
  radius?: number;
}) {
  return (
    <View style={{ width: side, height: side, borderRadius: radius, overflow: 'hidden' }}>
      <View style={{ width: side, height: side, transform: [{ scale: FLAT.thumb.scale }] }}>
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
