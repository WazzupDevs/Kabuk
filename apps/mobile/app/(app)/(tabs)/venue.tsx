import { sessionDurationMinutes } from '@shared/analytics.ts';
import { seatsAnonymously } from '@shared/gender.ts';
import type { Concept, Intent } from '@shared/rooms.ts';
import { tableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { type ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { Toast, type ToastMessage } from '@/components/Toast';
import { useVenueSpots } from '@/features/checkin/spots';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { CreateTableSheet } from '@/features/rooms/CreateTableSheet';
import { Lobby } from '@/features/rooms/Lobby';
import { OpenLobbySheet } from '@/features/rooms/OpenLobbySheet';
import { useCurrentRoom, useRoom, useVenueTables } from '@/features/rooms/queries';
import { TableCard } from '@/features/rooms/TableCard';
import { VenueHead, VenueNameRow } from '@/features/venue/VenueHead';
import { VenueChatCard } from '@/features/venueChat/VenueChatCard';
import { FeedView } from '@/features/venueFeed/FeedView';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { trackOnce } from '@/lib/analytics';
import { callLeave } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { confirm } from '@/lib/overlayStore';
import { useNow } from '@/lib/useNow';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { PinHide, PinLayer, PinMorph } from '@/motion';
import { AURA } from '@/theme/aura';
import { gradientStyle } from '@/theme/gradient';
import { KIT } from '@/theme/auraKit';
import { VENUE } from '@/theme/venue';
import { VENUE_FEED_LOOK } from '@/theme/venueFeed';
import { Seg, T, useKit } from '@/aura/kit';
import { ACTIVITIES } from '@/theme/activities';

type LobbySheet = { intent: Intent | null; gameTag: Concept | null };

// "Masalar" is Mekan as it was (the table's card, the venue chat, the lobby); "Akış" the venue's
// posts (docs/SPEC_V4.md §4.Y).
type VenueView = 'tables' | 'feed';

function endSession(checkInId: string, startedAt: string) {
  trackOnce(`session_ended:${checkInId}`, 'session_ended', {
    duration_min: sessionDurationMinutes(startedAt, Date.now()),
  });
}

// Mekan, the home screen (yeni arayüz tuvali: MekanMasaYok … MasaBuradayim; docs/SPEC_V4.md §4.E):
// the person's card ("Henüz masan yok" with "Masa kur" and "Açık masalar", or its table), the venue
// chat and the lobby; a join request's notice over the tab bar. Without a check-in it sends the
// person to Keşfet. The card's picture opens the table.
export default function VenueScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const checkIn = useActiveTable();
  const currentRoom = useCurrentRoom(checkIn.data);
  const spots = useVenueSpots(checkIn.data?.venue_id);
  const tables = useVenueTables(checkIn.data?.venue_id);
  const photo = useOwnPhoto();
  const venueHasSpots = (spots.data ?? []).length > 0;
  const now = useNow(30_000);
  const [lobbySheet, setLobbySheet] = useState<LobbySheet | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<ToastMessage | null>(null);
  // Where the lobby starts in the content ("Açık masalar" on the card without a table goes there).
  const [lobbyAt, setLobbyAt] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const [view, setView] = useState<VenueView>('tables');
  // The feed is built the first time it is opened and both views stay built after it: a switch
  // only shows one and hides the other (the owner's report, 25 Kasım: each switch built its view
  // again, about a second).
  const [feedSeen, setFeedSeen] = useState(false);
  // Where the switch's top stands in the content: past it the pinned stack comes in.
  const [blockAt, setBlockAt] = useState(0);
  const [blockH, setBlockH] = useState(0);
  // The page's two cards' heights: how long their fold is (the snap's second offset).
  const [tableH, setTableH] = useState(0);
  const [chatH, setChatH] = useState(0);
  const reduceMotion = useReduceMotion();
  const { scheme } = useKit();

  const leave = useMutation({
    meta: FEEL_ERROR,
    mutationFn: callLeave,
    onSuccess: () => {
      if (checkIn.data) endSession(checkIn.data.id, checkIn.data.created_at);
      return queryClient.invalidateQueries();
    },
  });

  // "Mekandan ayrıl" asks first (iskelet.md → 3.5): a centred dialog (lib/overlayStore → confirm);
  // the pano's (MekanAyril) danger button; a table of the person's leaves with it. A failed try
  // stays open with its error.
  const openLeave = () => {
    const tableName = currentRoom.data?.name;
    confirm({
      title: tr.venue.leaveConfirmTitle,
      note: tableName ? tr.venue.leaveConfirmBodyTable(tableName) : tr.venue.leaveConfirmBody,
      icon: 'logout',
      tone: 'danger',
      confirmLabel: tr.venue.leaveConfirm,
      confirmIcon: 'logout',
      cancelLabel: tr.common.cancel,
      testID: 'venue-leave-confirm',
      onConfirm: async () => {
        await leave.mutateAsync();
      },
    });
  };

  const expiresAt = checkIn.data ? Date.parse(checkIn.data.expires_at) : null;
  const expired = expiresAt !== null && expiresAt <= now;

  const checkInId = checkIn.data?.id;
  const startedAt = checkIn.data?.created_at;
  useEffect(() => {
    if (!expired) return;
    if (checkInId && startedAt) endSession(checkInId, startedAt);
    void queryClient.invalidateQueries({ queryKey: ['activeTable'] });
  }, [expired, queryClient, checkInId, startedAt]);

  const room = currentRoom.data ?? null;
  // The scenes the venue's tables show; Masa kur fades them (K-45).
  const usedIcons = useMemo(
    () =>
      new Set(
        [...(tables.data?.open ?? []), ...(tables.data?.running ?? [])].flatMap((t) =>
          t.icon ? [t.icon] : [],
        ),
      ),
    [tables.data],
  );

  if (checkIn.isPending) {
    return (
      <Screen edges={['top']}>
        <View className="flex-1">
          <EmptyState kind="loading" body={tr.common.loading} />
        </View>
      </Screen>
    );
  }

  // Not read (no network): the check-in may well be there; Keşfet would say it is gone (audit
  // UI-10).
  if (checkIn.isError && !checkIn.data) {
    return (
      <Screen edges={['top']}>
        <EmptyState
          page
          kind="error"
          body={errorMessage(checkIn.error)}
          error={checkIn.error}
          action={{ label: tr.common.retry, onPress: () => void checkIn.refetch() }}
        />
      </Screen>
    );
  }

  if (!checkIn.data || expired || expiresAt === null) {
    return <Redirect href="/explore" />;
  }

  const state = tableState(room, !!room && room.owner_session_id === checkIn.data.id);
  const minutesLeft = Math.max(0, Math.ceil((expiresAt - now) / 60_000));
  // How the person sits at a table: a man and "Belirtmek istemiyorum" always with the profile,
  // whatever the check-in's identity (audit VEN-1).
  const anonymous = seatsAnonymously(checkIn.data.identity.mode, photo.gender);
  // A profiled person without a visible photo can neither set up a table nor ask (photo_required).
  const needsPhoto = !anonymous && photo.known && !photo.has;

  // How much of the check-in's time has passed (the menu's filling bar).
  const startedMs = Date.parse(checkIn.data.created_at);
  const stayShare = expiresAt > startedMs ? (now - startedMs) / (expiresAt - startedMs) : 1;
  // The pinned stack under the bar (the owner's design, 24 Kasım): the switch and the two strips.
  const gaps = VENUE.gaps;
  const fold = AURA.venueCollapse;
  const P = VENUE.pinned;
  const switchHeight = ACTIVITIES.tabs.item + 2 * ACTIVITIES.tabs.pad;
  const pinnedHeight = P.padTop + switchHeight + 2 * (P.gap + fold.tableStrip) + P.padBottom;

  // The spot at the top right; while there is no table a press changes it (the server refuses it
  // at a table).
  const spotName = venueHasSpots ? (checkIn.data.spot?.name ?? tr.venue.chooseSpot) : null;
  // The window less the pinned strips (the table's under the bar, the chat's under it) and the
  // room under the page's last row (Screen's own).
  const lobbyRoom = Math.max(
    0,
    // The scroll's top is the bar's foot (under the status bar), not the old 104 pin: with that
    // the page ended before the cards had folded and always sprang back open (24 Kasım).
    windowHeight - (insets.top + pinnedHeight + gaps.lobby) - insets.bottom,
  );
  // Down to the lobby, its heading just under the pinned strips.
  const showLobby = () =>
    scroll.current?.scrollTo({
      y: Math.max(0, lobbyAt - (pinnedHeight + gaps.lobby)),
      animated: !reduceMotion,
    });
  // "Masalar / Akış": in the page and in the pinned stack alike.
  const switchFor = (pinned: boolean) => (
    <Seg
      board={{
        item: ACTIVITIES.tabs.item,
        radius: ACTIVITIES.tabs.radius,
        pad: ACTIVITIES.tabs.pad,
        type: 'btnSm',
        face: VENUE[scheme].segFace,
        onShadow: VENUE[scheme].segOnShadow || undefined,
      }}
      value={view}
      onChange={(next) => {
        // Each view starts from its top.
        scroll.current?.scrollTo({ y: 0, animated: false });
        if (next === 'feed') setFeedSeen(true);
        setView(next);
      }}
      accessibilityLabel={tr.venueFeed.viewLabel}
      options={[
        {
          value: 'tables',
          label: tr.venueFeed.tabTables,
          testID: pinned ? 'venue-pinned-tables' : 'venue-view-tables',
        },
        {
          value: 'feed',
          label: tr.venueFeed.tabFeed,
          testID: pinned ? 'venue-pinned-feed' : 'venue-view-feed',
        },
      ]}
    />
  );
  // The switch is pinned under the bar from the top, over the venue's name (the owner's call,
  // 25 Kasım: where Mesajlar has its own); the cards take over once the table card reaches it.
  const pinAt = blockH > 0 ? blockAt + blockH : 0;
  const pinFrom = Math.max(1, pinAt - VENUE.pinned.padTop - switchHeight);
  const stackOn = pinAt > 0;
  // Let go while the cards fold, the page settles fully open or fully folded (Twitter's header;
  // the own profile's snap); let go while the head goes under the bar, it settles at the top or with
  // the switch pinned (never the big title half under the bar's small one, the owner's report, 24
  // Kasım). The fold is as long as all the two cards lose (PinMorph).
  const strip = AURA.venueCollapse.tableStrip;
  const foldLength =
    tableH > 0 && chatH > 0
      ? tableH -
        strip +
        (chatH - strip) +
        (gaps.card - VENUE.pinned.gap) +
        (gaps.chat - VENUE.pinned.gap)
      : 0;
  const snaps =
    view === 'tables' && pinAt > 0 && foldLength > 0
      ? [0, pinFrom, pinFrom + foldLength]
      : undefined;
  return (
    <View style={{ flex: 1 }}>
      <Screen
        edges={['top']}
        scrollRef={scroll}
        snapToOffsets={snaps}
        pinned={
          pinAt > 0 ? (
            <PinnedStack
              from={pinFrom}
              // The feed keeps the same switch (its slide stays one motion, the owner's report,
              // 25 Kasım); only the cards are off.
              cardsOff={view !== 'tables'}
              head={switchFor(true)}
              cards={[
                <TableCard
                  key="table"
                  checkIn={checkIn.data}
                  room={room}
                  state={state}
                  onCreate={() => setCreating(true)}
                  onOpenLobby={() => setLobbySheet({ intent: null, gameTag: null })}
                  onShowLobby={showLobby}
                />,
                <VenueChatCard
                  key="chat"
                  venueId={checkIn.data.venue_id}
                  sessionId={checkIn.data.id}
                  identity={checkIn.data.identity.mode}
                  at={0}
                />,
              ]}
            />
          ) : undefined
        }
        side={VENUE.side}
        barSide={VENUE.side}
        padTop={VENUE.pinned.padTop}
        top={
          <VenueHead
            venueName={checkIn.data.venue?.name ?? ''}
            identity={checkIn.data.identity}
            atTable={!!room}
            minutesLeft={minutesLeft}
            stayShare={stayShare}
            onLeave={openLeave}
            leaving={leave.isPending}
            // The check-in's identity is for the table and the venue chat; the feed has none.
            feed={view === 'feed'}
            nameBy={pinAt > 0 ? pinFrom : undefined}
          />
        }
      >
        {/* The order of Mekan's board (docs/design/aura → Mekan): the venue's name, the person's
          scene, the venue chat, the lobby. */}
        <View
          onLayout={(e) => {
            setBlockAt(e.nativeEvent.layout.y);
            setBlockH(e.nativeEvent.layout.height);
          }}
        >
          {/* The table's changes reach the card while it is on screen (Realtime and the check). */}
          {room ? <RoomWatch roomId={room.id} /> : null}
          {/* "Masalar / Akış" first: pinned under the bar with the tables (its room kept here), in
              the page with the feed. */}
          {stackOn ? <View style={{ height: switchHeight }} /> : switchFor(false)}
          <View style={{ marginTop: VENUE_FEED_LOOK.switchTop }}>
            <VenueNameRow
              name={checkIn.data.venue?.name ?? ''}
              spot={spotName}
              onSpot={state === 'none' ? () => router.push('/spot') : undefined}
            />
          </View>
          {leave.isError ? (
            <T v="fine" color={KIT.danger}>
              {errorMessage(leave.error)}
            </T>
          ) : null}
        </View>
        {feedSeen ? (
          <View style={view === 'feed' ? null : HIDDEN}>
            <FeedView venueId={checkIn.data.venue_id} />
          </View>
        ) : null}
        <View style={view === 'tables' ? null : HIDDEN}>
          <PinLayer>
            <View style={{ marginTop: gaps.card }}>
              <PinHide
                from={pinAt > 0 ? pinFrom : Number.MAX_SAFE_INTEGER}
                onHeight={(h) => h > 0 && setTableH(h)}
              >
                <TableCard
                  checkIn={checkIn.data}
                  room={room}
                  state={state}
                  onCreate={() => setCreating(true)}
                  onOpenLobby={() => setLobbySheet({ intent: null, gameTag: null })}
                  onShowLobby={showLobby}
                />
              </PinHide>
            </View>
          </PinLayer>
          <PinLayer>
            <View style={{ marginTop: gaps.chat }}>
              <PinHide
                from={pinAt > 0 ? pinFrom : Number.MAX_SAFE_INTEGER}
                onHeight={(h) => h > 0 && setChatH(h)}
              >
                <VenueChatCard
                  venueId={checkIn.data.venue_id}
                  sessionId={checkIn.data.id}
                  identity={checkIn.data.identity.mode}
                  at={0}
                />
              </PinHide>
            </View>
          </PinLayer>
          {/* At least as tall as what is left under the two strips: with few open tables the page ran
          out of scroll before the table card had folded, and stopped half folded with its buttons
          cut at its foot (docs/denetim/pano-fark-2026-11.md → PF-78). */}
          <View
            style={{ marginTop: gaps.lobby, minHeight: lobbyRoom }}
            onLayout={(e) => {
              if (e.nativeEvent.layout.height > 0) setLobbyAt(e.nativeEvent.layout.y);
            }}
          >
            <Lobby
              venueId={checkIn.data.venue_id}
              sessionId={checkIn.data.id}
              since={checkIn.data.created_at}
              mySpotId={checkIn.data.spot_id}
              venueHasSpots={venueHasSpots}
              state={state}
              roomId={room?.id ?? null}
              myPhones={room?.phones ?? 1}
              needsPhoto={needsPhoto}
              onNotice={setNotice}
            />
            {lobbySheet && room && state === 'private' ? (
              <OpenLobbySheet
                onClose={() => setLobbySheet(null)}
                // Opened from further down the screen, the card's new "Lobide açık" is scrolled away.
                onOpened={() => scroll.current?.scrollTo({ y: 0, animated: !reduceMotion })}
                roomId={room.id}
                venueId={checkIn.data.venue_id}
                intent={lobbySheet.intent}
                gameTag={lobbySheet.gameTag}
              />
            ) : null}
            {creating && state === 'none' ? (
              <CreateTableSheet
                onClose={() => setCreating(false)}
                venueId={checkIn.data.venue_id}
                venueName={checkIn.data.venue?.name ?? ''}
                usedIcons={usedIcons}
                anonymous={anonymous}
              />
            ) : null}
          </View>
        </View>
      </Screen>
      {/* The request's notice 16 over the tab bar (MasaIstekBekliyor `.snk`). */}
      <Toast
        message={notice}
        bottom={insets.bottom + AURA.tabBar.bottom + AURA.tabBar.height + VENUE.notice.above}
        testID="lobby-notice"
      />
    </View>
  );
}

// A view kept built while the other shows.
const HIDDEN = { display: 'none' } as const;

// The pinned stack (the owner's design, 24 Kasım): the switch sticks under the bar the moment the
// page's own switch reaches it, and the two cards shrink there into their strips, one height, their
// foot following the finger (PinMorph); scrolled back, they grow into the open cards and hand back
// to the page. Touches reach it only while it shows.
function PinnedStack({
  from,
  cardsOff,
  head,
  cards,
}: {
  from: number;
  cardsOff: boolean;
  head: ReactNode;
  cards: readonly [ReactNode, ReactNode];
}) {
  const { scheme } = useKit();
  const P = VENUE.pinned;
  const ground = AURA[scheme].ground;
  return (
    <View pointerEvents="box-none">
      <PinMorph
        from={from}
        cardsOff={cardsOff}
        ground={ground}
        strip={AURA.venueCollapse.tableStrip}
        head={<View style={{ paddingHorizontal: VENUE.side, paddingTop: P.padTop }}>{head}</View>}
        gaps={[
          { open: VENUE.gaps.card, folded: P.gap },
          { open: VENUE.gaps.chat, folded: P.gap },
        ]}
        cards={[
          <View key="table" style={{ paddingHorizontal: VENUE.side }}>
            {cards[0]}
          </View>,
          <View key="chat" style={{ paddingHorizontal: VENUE.side, paddingBottom: P.padBottom }}>
            {cards[1]}
          </View>,
        ]}
        under={
          <View
            pointerEvents="none"
            style={[
              { height: P.fadeUnder },
              gradientStyle(`linear-gradient(180deg, ${ground}, ${ground}00)`),
            ]}
          />
        }
      />
    </View>
  );
}

// Keeps the table live while Mekan shows its card: its row's changes re-read the current table
// (useRoom).
function RoomWatch({ roomId }: { roomId: string }) {
  useRoom(roomId);
  return null;
}
