import { groupHistory, historyDay, historyResult, historySessions } from '@shared/activities.ts';
import { explorePlace, todayEvents } from '@shared/explore.ts';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Image, useWindowDimensions, View } from 'react-native';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { Btn, Glass, Li, Seg, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { GameDisc } from '@/components/Glyph';
import { useLoaderHold } from '@/components/Loader';
import { Rise } from '@/components/motion';
import { Screen } from '@/components/Screen';
import { useTabBarSpace } from '@/components/TabBar';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { boxShadowParts } from '@/components/NativeShadow';
import { EventCard } from '@/features/activities/EventCard';
import { useGameResults } from '@/features/activities/useGameResults';
import { GiftCard } from '@/features/gifts/GiftCard';
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
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { NARROW_SCREEN, SPACING } from '@/theme/tokens';

type Tab = 'events' | 'history';

// The page starts 20 under the title (Screen's TOP_FADE); the tabs 20 under the gift card, and
// pinned 8 under the title with 8 under them.
const PAGE_TOP = SPACING[5];
const TABS_TOP = SPACING[5];
const PIN_PAD = SPACING[2];
const GIFT_OVERHANG = SPACING[3];

// U16: a record's picture 52, 16 round, on the raised shadow.
const THUMB = KIT.size.historyThumb;
const THUMB_RADIUS = 16;

// Aktiviteler (docs/SPEC_V4.md §4.C, K-15; v44: .acts): "Aktiviteler" lists today's events at the
// venues of Keşfet's city (K-38; the district is Keşfet's alone), earliest first, each opening the
// venue's page (K-43); no campaigns and no "ilgileniyorum". "Geçmiş" is the caller's play history
// under day headings, each record with its game's result; a record opens what Bildirimler offers
// for it ("Arkadaş ekle" or "İstek gönder", "Mesaj" once friends, "Diğer"). Nothing is sorted by
// location (rule 6). docs/design/aura → Aktiviteler: geçmiş / etkinlik yok: the large title, the
// sliding tabs, the place or day lines at 15, thin rows (the record's result stays, §4.C).
export default function ActivitiesScreen() {
  const [tab, setTab] = useState<Tab>('events');
  const now = useNow(60_000);
  const city = useCity();
  const narrow = useNarrow();
  const { scheme, shape } = useTheme();
  const { c } = useKit();
  // Scrolled up, the tabs pin under the title once they reach it; the list scrolls under them
  // (the owner's call, 8 Kasım).
  const scrollY = useSharedValue(0);
  const [giftH, setGiftH] = useState(0);
  const [pinned, setPinned] = useState(false);
  const pinAt = PAGE_TOP + giftH + TABS_TOP - PIN_PAD;
  useAnimatedReaction(
    () => giftH > 0 && scrollY.value >= pinAt,
    (now, before) => {
      if (now !== before) runOnJS(setPinned)(now);
    },
    [pinAt, giftH],
  );
  const tabs = (
    <Seg<Tab>
      narrow={narrow}
      value={tab}
      onChange={setTab}
      accessibilityLabel={tr.activities.tabs}
      options={[
        { value: 'events', label: tr.activities.events, testID: 'activities-tab-events' },
        { value: 'history', label: tr.activities.history, testID: 'activities-tab-history' },
      ]}
    />
  );
  return (
    <Screen
      edges={['top']}
      refreshable
      scrollY={scrollY}
      pinned={
        pinned ? (
          <View
            style={{
              paddingHorizontal: shape.screenPadding,
              paddingVertical: PIN_PAD,
              backgroundColor: AURA[scheme].ground,
              borderBottomWidth: KIT.size.hair,
              borderBottomColor: c.hair,
            }}
          >
            {tabs}
          </View>
        ) : null
      }
      // U15: the place as an eyebrow over the title (both tabs), 4 apart. The title stays on top;
      // the content scrolls under it (the owner's call, 8 Kasım: titles never scroll).
      top={
        <View style={{ gap: SPACING[1] }}>
          {city.place ? <T v="eyebrow">{tr.activities.fromVenues(city.place.city)}</T> : null}
          <T v="display" accessibilityRole="header">
            {tr.tabs.activities}
          </T>
        </View>
      }
    >
      {/* Hediye paketleri (§4.U, AktivitelerHediye): the gift card over the tabs. The packs and
          the number over the bronze one stand out over the card's top: room for them, or the
          list's top edge cuts them (the owner's report, 8 Kasım). */}
      <View
        style={{ paddingTop: GIFT_OVERHANG }}
        onLayout={(e) => setGiftH(e.nativeEvent.layout.height)}
      >
        <GiftCard />
      </View>
      {/* U15: the glass seg, 44 high; hidden while its pinned copy is over it. */}
      <View style={{ marginTop: TABS_TOP, opacity: pinned ? 0 : 1 }}>{tabs}</View>
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
      <View style={{ marginTop: SPACING[6] }}>
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
      <View style={{ marginTop: SPACING[6] }}>
        <EmptyState kind="loading" inPage body={tr.common.loading} />
      </View>
    );
  }
  if (events.length === 0) {
    // U15: the empty state upright in the middle of what is left.
    return (
      <FitEmpty testID="activities-no-events" lift={EMPTY_LIFT}>
        {(small) => (
          <EmptyState
            kind="empty"
            title={tr.activities.noEvents}
            body={tr.activities.noEventsHint}
            picture={small ? NO_EVENTS_PICTURE_SMALL : NO_EVENTS_PICTURE}
          />
        )}
      </FitEmpty>
    );
  }
  return (
    <View style={{ marginTop: SPACING[6] }}>
      {
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
      }
    </View>
  );
}

// AktivitelerBos `.empty`: the words centred a little above the middle (150 under them over the
// tab bar's room).
const EMPTY_LIFT = SPACING[12];

function History({ now }: { now: number }) {
  const history = usePlayHistory();
  const friends = useHistoryFriends();
  const results = useGameResults();
  const { act, openMenu, sheets } = useHistoryActions();
  const { c } = useKit();
  const [open, setOpen] = useState<string | null>(null);
  // Side by side the action and "Diğer" do not fit at 320 dp with the largest text.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  const loading = useLoaderHold(history.isPending);
  const today = new Date(now);

  // A failed refresh keeps the history (audit PRO-2).
  if (history.isError && !history.data) {
    return (
      <View style={{ marginTop: SPACING[6] }}>
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
      <View style={{ marginTop: SPACING[6] }}>
        <EmptyState kind="loading" inPage body={tr.common.loading} />
      </View>
    );
  }
  if (history.data.length === 0) {
    return (
      <FitEmpty testID="activities-no-history">
        {(small) => (
          <EmptyState kind="empty" riso="history" compact={small} body={tr.friends.noHistory} />
        )}
      </FitEmpty>
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
    <View style={{ marginTop: SPACING[6], gap: SPACING[6] }}>
      {groups.map((group) => (
        // U16: the day as an h3 in the ink, 12 over its rows on a small glass card.
        <View key={group.day} style={{ gap: SPACING[3] }}>
          <View style={{ paddingTop: KIT.size.secPadTop }}>
            <T v="h3" accessibilityRole="header">
              {tr.activities.days[group.day]}
            </T>
          </View>
          <Glass sm style={{ paddingVertical: KIT.size.listPadY }}>
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
        // The game and the day and time, then each person at that table, one row each on the
        // sheet's card, with what can be done. "Kapat" at the foot: only the people scroll (5.1).
        title={session ? tr.activities.game(historyConcept(session.first.concept)) : ''}
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
          <View style={{ gap: KIT.size.sheetGap }}>
            <T v="fine">
              {tr.activities.whenFull(
                session.first.played_at,
                historyDay(session.first.played_at, today),
              )}
            </T>
            <HistoryAddHint records={session.people} />
            <Glass sm style={{ overflow: 'hidden' }}>
              {session.people.map((record, i) => (
                <View
                  key={record.id}
                  style={{
                    gap: SPACING[1],
                    paddingVertical: KIT.size.liPadY,
                    paddingHorizontal: KIT.size.liPadX,
                    borderTopWidth: i > 0 ? KIT.size.hair : 0,
                    borderTopColor: c.hair,
                  }}
                >
                  <T v="h3">{record.other_alias}</T>
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
                </View>
              ))}
            </Glass>
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

// A game (docs/design/aura → Aktiviteler: geçmiş): its picture, its name and with whom, the time on
// the right; the result under the time.
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
      padY={SPACING[3]}
    >
      <Thumb concept={concept} />
      {/* U16: the day on the title's line at the right, the result under it at the right; the
          second line keeps its height with or without a result. */}
      <View style={{ flex: 1, gap: SPACING[0.5] }}>
        <View style={ROW_LINE}>
          <View style={{ flex: 1 }}>
            <T v="h3">{game}</T>
          </View>
          <T v="fine">{when}</T>
        </View>
        <View style={[ROW_LINE, { minHeight: KIT.size.tag }]}>
          <View style={{ flex: 1 }}>
            <T v="fine">{with_}</T>
          </View>
          {result && variant ? <Tag variant={variant} label={result} /> : null}
        </View>
      </View>
    </Li>
  );
}

const ROW_LINE = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: SPACING[2],
} as const;

// The hairline between two rows: from the words, 16 short of the card's right edge.
function RowHair() {
  const { c } = useKit();
  return (
    <View
      style={{
        height: KIT.size.hair,
        marginLeft: KIT.size.liPadX + THUMB + KIT.size.liGap,
        marginRight: KIT.size.liPadX,
        backgroundColor: c.hair,
      }}
    />
  );
}

// The riso pictures of the history row (Aura v65 §9.1): a chat and Vampir Köylü.
const VAMPIR_THUMB = require('../../../assets/riso/history-vampir.webp');
const CHAT_THUMB = require('../../../assets/riso/history-sohbet.webp');
// U15: the empty Etkinlikler's riso 240 × 165, 28 round.
const NO_EVENTS_PICTURE = {
  source: require('../../../assets/riso/empty-events.webp'),
  width: 240,
  height: 165,
  radius: 28,
};
// Where the page has no room for it: the small riso of a card (EmptyState → compact).
const NO_EVENTS_PICTURE_SMALL = { ...NO_EVENTS_PICTURE, width: 160, height: 110, radius: 22 };

// An empty state in the middle of what is left of the page. Where its last line would end under the
// tab bar (a short screen, the gift card over the tabs), it takes the small picture so it all shows
// without scrolling (audit M15-17).
function FitEmpty({
  testID,
  lift = 0,
  children,
}: {
  testID: string;
  lift?: number;
  children: (small: boolean) => ReactNode;
}) {
  const ref = useRef<View>(null);
  const { height } = useWindowDimensions();
  const bottom = useTabBarSpace();
  const [small, setSmall] = useState(false);
  const check = () => {
    if (small) return;
    ref.current?.measureInWindow((_x, y, _w, h) => {
      if (h > 0 && y + h > height - bottom) setSmall(true);
    });
  };
  return (
    <View
      testID={testID}
      style={{ flex: 1, justifyContent: 'center', paddingBottom: small ? 0 : lift }}
    >
      <View ref={ref} collapsable={false} onLayout={check}>
        {children(small)}
      </View>
    </View>
  );
}

// The game's disc; a chat without a game has the speech bubbles.
function Thumb({ concept }: { concept: HistoryConcept }) {
  const { c } = useKit();
  // skall.css --shadow-raised (the seg's chosen part has the same).
  const shadow = boxShadowParts(useLabOff('golge'), c.segShadow || undefined, THUMB_RADIUS);
  return (
    <View
      style={{
        width: THUMB,
        height: THUMB,
        borderRadius: THUMB_RADIUS,
        boxShadow: shadow.boxShadow,
      }}
    >
      {shadow.node}
      <View style={{ width: THUMB, height: THUMB, borderRadius: THUMB_RADIUS, overflow: 'hidden' }}>
        <Picture concept={concept} />
      </View>
    </View>
  );
}

// The riso pictures (Aura v65 §9.1); the other games keep their disc until theirs come (§9.2).
function Picture({ concept }: { concept: HistoryConcept }) {
  if (concept !== 'vampir' && concept !== 'chat') {
    return <GameDisc name={GAME_GLYPH[concept]} size={THUMB} />;
  }
  return (
    <Image
      source={concept === 'vampir' ? VAMPIR_THUMB : CHAT_THUMB}
      accessible={false}
      style={{ width: THUMB, height: THUMB }}
    />
  );
}
