import { isIntent, JOIN_REQUEST_TTL_SECONDS, requesterStatus } from '@shared/rooms.ts';
import { groupRoomsBySpot } from '@shared/spots.ts';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { lobbyActions, requestGone, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useReducer, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Btn, Li, RowList, T, Tag, useKit } from '@/aura/kit';
import { Reveal } from '@/aura/Reveal';
import { EmptyState } from '@/components/EmptyState';
import type { ToastMessage } from '@/components/Toast';
import { EmptyCard } from '@/features/explore/EmptyCard';
import { Loader } from '@/components/Loader';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { registerForPush } from '@/features/push/push';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNowUntil } from '@/lib/useNow';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { VENUE } from '@/theme/venue';

import { roomKeys, useMyRequest, useVenueTables, type VenueTable } from './queries';
import { SpotHeading } from './SpotHeading';
import { TableThumb } from './TableCard';
import { TABLE_ICON_IMAGES } from './tableIconImages';

// After "Kabul edildi" the table opens by itself (v46: the row's note, then the table).
const OPEN_AFTER_ACCEPT_MS = 1800;
// An accept is news only this long after its 60 s window: a request is answered inside it.
const ACCEPT_NEWS_MS = 30_000;
// Accepts already acted on, or found old (this run of the app).
const doneAccepts = new Set<string>();

type Props = {
  venueId: string;
  sessionId: string;
  // The check-in's start: only its own requests count.
  since: string;
  // The person's spot, and whether the venue has spots at all (docs/SPEC_V3.md §4.3).
  mySpotId: string | null;
  venueHasSpots: boolean;
  state: TableState;
  // The person's table: left out of the lists; its people count for the 12.
  roomId: string | null;
  myPhones: number;
  // A profiled identity without a visible photo can neither ask nor sit (photo_required).
  needsPhoto: boolean;
  // The request's notice over the tab bar (the screen's Toast): waiting with its seconds, "Masa şu
  // an müsait değil" or "Kabul edildi"; null once there is nothing to say.
  onNotice: (notice: ToastMessage | null) => void;
};

// Mekan's lobby (yeni arayüz tuvali: MekanKaydir, MasaIstekBekliyor, MasaIstekMusaitDegil,
// MasaBuradayim; docs/SPEC_V4.md §4.E): "Açık masalar" with "Katıl" and "Süren masalar" with "Bu
// masadayım", one read of venue_tables. "Katıl": a person without a table alone, an owner with the
// whole table; a participant leaves first. A request waits 60 s, its row's button passive and the
// notice over the tab bar counting down; a refusal and a time-out look the same ("Masa şu an müsait
// değil", rule 5); an accepted one opens the table. At a venue with spots the tables are grouped by
// spot, the person's own first.
export function Lobby({
  venueId,
  sessionId,
  since,
  mySpotId,
  venueHasSpots,
  state,
  roomId,
  myPhones,
  needsPhoto,
  onNotice,
}: Props) {
  const queryClient = useQueryClient();
  const tables = useVenueTables(venueId);
  const mine = useMyRequest(sessionId, since);
  // The clock runs only while the person's request waits (its countdown, then its time-out); the
  // rest of the time the lobby is not drawn again each second.
  const now = useNowUntil(
    mine.data && mine.data.status !== 'accepted' ? mine.data.expiresAt : null,
    1000,
  );
  // The request this screen sent, and to which table; the plain row once it is gone.
  const [asked, setAsked] = useState<{ roomId: string; name: string } | null>(null);

  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ table, asMember }: { table: VenueTable; asMember: boolean }) =>
      roomsApi.requestJoin(table.roomId, asMember),
    onSuccess: (_data, { table, asMember }) => {
      track('join_requested', { as_member: asMember });
      // The spec's second moment to ask for push (MVP_SPEC §9): sending a join request.
      void registerForPush();
      setAsked({ roomId: table.roomId, name: table.name });
      void queryClient.invalidateQueries({ queryKey: roomKeys.myRequest });
    },
    onError: (err) => {
      // The table filled, closed or moved meanwhile: the lobby is read again.
      if (err instanceof ApiError && (requestGone(err.code) || err.code === 'table_full')) {
        void queryClient.invalidateQueries({ queryKey: roomKeys.venueTables(venueId) });
      }
    },
  });

  const status = mine.data ? requesterStatus(mine.data.status, mine.data.expiresAt, now) : null;
  const waitingOn = mine.data && status === 'pending' ? mine.data.roomId : null;
  const unavailable = mine.data && status === 'unavailable' ? mine.data.roomId : null;
  // An accept counts once, while it is news (audit VEN-3): an old one sent the person back to a
  // table it had left on every visit, counted again, and kept "Kabul edildi" on its row with no
  // "Katıl" for the whole check-in.
  const [, recheck] = useReducer((n: number) => n + 1, 0);
  const acceptedId = mine.data && status === 'accepted' ? mine.data.id : null;
  const acceptedEnds = mine.data?.expiresAt;
  const accepted =
    mine.data && acceptedId && !doneAccepts.has(acceptedId) ? mine.data.roomId : null;

  // Accepted: the person sits at that table now (Masadakiler, K-69); it opens after the note.
  useEffect(() => {
    if (!accepted || !acceptedId || !acceptedEnds) return;
    if (Date.now() > Date.parse(acceptedEnds) + ACCEPT_NEWS_MS) {
      doneAccepts.add(acceptedId);
      recheck();
      return;
    }
    track('table_joined', { via: 'request' });
    void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    const timer = setTimeout(() => {
      doneAccepts.add(acceptedId);
      router.push({ pathname: '/room/[id]', params: { id: accepted } });
    }, OPEN_AFTER_ACCEPT_MS);
    return () => clearTimeout(timer);
  }, [accepted, acceptedId, acceptedEnds, queryClient]);
  const askedRoom = asked?.roomId;
  useEffect(() => {
    if (unavailable && unavailable === askedRoom) track('join_unavailable', { as_member: false });
  }, [unavailable, askedRoom]);

  // 320 dp or the largest text: a row's action goes under its words (docs/design/aura → Mekan ve
  // lobi: 320 dp, en büyük yazı), so neither the name nor the button is cut.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width / Math.min(fontScale, MAX_FONT_SCALE) < NARROW_ROW_DP;
  // Loading and on an error "Açık masalar" has no count and "Süren masalar" is not shown: the
  // lobby is one read, its loader and its error show once, under "Açık masalar".
  // A failed refresh keeps the tables read before (audit M8-02).
  const read = !!tables.data;
  const others = (list: VenueTable[]) => list.filter((t) => t.roomId !== roomId);
  const open = others(tables.data?.open ?? []);
  const running = others(tables.data?.running ?? []);

  // With no open table to join, neither "masandaki n kişi de seninle gelir" nor "önce masandan
  // çık" says anything (the owner's report, 2 Kasım, 7.6).
  const joinable = open.length > 0;
  const ownerNote =
    joinable && (state === 'private' || state === 'open')
      ? myPhones > 1
        ? tr.lobby.bringsTable(myPhones - 1)
        : null
      : null;
  const note = needsPhoto
    ? tr.lobby.needsPhoto
    : state === 'participant' && joinable
      ? tr.lobby.leaveFirst
      : ownerNote;

  // The request's notice (MasaIstekBekliyor, MasaIstekMusaitDegil): what the row said before, now
  // over the tab bar. Waiting, it stays and counts down; a refusal and a time-out say the same.
  const requestId = mine.data?.id ?? null;
  const tableName = (id: string) =>
    [...(tables.data?.open ?? []), ...(tables.data?.running ?? [])].find((t) => t.roomId === id)
      ?.name ?? (asked?.roomId === id ? asked.name : null);
  const left =
    mine.data && status === 'pending'
      ? Math.min(
          JOIN_REQUEST_TTL_SECONDS,
          Math.max(0, Math.ceil((Date.parse(mine.data.expiresAt) - now) / 1000)),
        )
      : null;
  const acceptedName = accepted ? tableName(accepted) : null;
  const noticeKind: 'waiting' | 'accepted' | 'unavailable' | null =
    left !== null
      ? 'waiting'
      : acceptedName
        ? 'accepted'
        : unavailable && unavailable === askedRoom
          ? 'unavailable'
          : null;
  const noticeTitle =
    noticeKind === 'waiting'
      ? tr.lobby.waiting(left ?? 0)
      : noticeKind === 'accepted'
        ? tr.lobby.accepted(acceptedName ?? '')
        : noticeKind === 'unavailable'
          ? tr.lobby.unavailable
          : null;
  useEffect(() => {
    if (!noticeKind || !noticeTitle || !requestId) {
      onNotice(null);
      return;
    }
    onNotice({
      id: `${requestId}:${noticeKind}`,
      title: noticeTitle,
      stay: noticeKind === 'waiting',
      lead:
        noticeKind === 'waiting' ? (
          <Loader kind="meet" size={VENUE.notice.lead} delay={0} label={null} />
        ) : undefined,
    });
  }, [noticeKind, noticeTitle, requestId, onNotice]);
  useEffect(() => () => onNotice(null), [onNotice]);

  const groups = (list: VenueTable[]) =>
    groupRoomsBySpot(
      list.map((t) => ({ ...t, spot_id: t.spotId, spot_name: t.spotName })),
      mySpotId,
    );

  const L = VENUE.lobby;
  return (
    <View className="gap-3" testID="lobby">
      <SectionHead
        title={tr.lobby.openTitle}
        count={read && open.length > 0 ? open.length : null}
      />
      {note ? <T v="fine">{note}</T> : null}
      {tables.isPending ? (
        <EmptyState kind="loading" body={tr.lobby.loading} />
      ) : !tables.data ? (
        <EmptyState
          kind="error"
          body={errorMessage(tables.error)}
          error={tables.error}
          action={{ label: tr.common.retry, onPress: () => void tables.refetch() }}
        />
      ) : open.length === 0 ? (
        <NoOpenTables />
      ) : (
        groups(open).map((group) => (
          <View key={group.spotId ?? 'none'} className="gap-2.5">
            {venueHasSpots ? (
              <SpotHeading spotId={group.spotId} spotName={group.spotName} mine={group.mine} />
            ) : null}
            <RowList plain inset={L.row.picture + L.row.gap}>
              {group.rooms.map((table, i) => {
                const actions = lobbyActions(state, myPhones, table.phones);
                const busy = request.isPending && request.variables?.table.roomId === table.roomId;
                const waiting = waitingOn === table.roomId;
                const full = actions.full || table.phones >= MAX_TABLE_PHONES;
                return (
                  <Reveal key={table.roomId} index={i} step={MOTION.stagger.row}>
                    <LobbyRow
                      table={table}
                      narrow={narrow}
                      line={tr.venue.seatsCount(table.phones, MAX_TABLE_PHONES)}
                      action={
                        actions.join && !needsPhoto && accepted !== table.roomId ? (
                          <Btn
                            sm
                            variant="glassy"
                            testID={`join-${table.name}`}
                            label={full ? tr.venue.statusFull : tr.lobby.join}
                            disabled={full || waitingOn !== null}
                            loading={busy}
                            onPress={() => request.mutate({ table, asMember: false })}
                            look={{ padLeft: 0, padRight: 0 }}
                            style={{ width: L.join }}
                            accessibilityLabel={waiting ? tr.lobby.waiting(left ?? 0) : undefined}
                          />
                        ) : null
                      }
                    />
                  </Reveal>
                );
              })}
            </RowList>
          </View>
        ))
      )}

      {/* No running table, no heading and no note (the canvas's call, 31 Ekim; the owner's report,
          10 Kasım: an empty "Süren masalar" stood alone under the open ones). */}
      {read && running.length > 0 ? (
        <View style={{ marginTop: L.runningTop, gap: L.noteTop }}>
          <SectionHead title={tr.lobby.runningTitle} count={running.length} />
          <T v="fine">
            {state === 'none' && !needsPhoto ? tr.lobby.runningNote : tr.lobby.runningNoteShort}
          </T>
        </View>
      ) : null}
      {/* By spot as well, the person's own first (audit VEN-13): "Bu masadayım" to a table at
          another spot only met different_spot. */}
      {(read ? groups(running) : []).map((group) => (
        <View key={group.spotId ?? 'none'} className="gap-2.5">
          {venueHasSpots ? (
            <SpotHeading spotId={group.spotId} spotName={group.spotName} mine={group.mine} />
          ) : null}
          <RowList plain inset={L.row.picture + L.row.gap}>
            {group.rooms.map((table, i) => {
              const actions = lobbyActions(state, myPhones, table.phones);
              const busy = request.isPending && request.variables?.table.roomId === table.roomId;
              const waiting = waitingOn === table.roomId;
              return (
                <Reveal key={table.roomId} index={i} step={MOTION.stagger.row}>
                  <LobbyRow
                    table={table}
                    narrow={narrow}
                    line={tr.venue.people(table.phones)}
                    running
                    action={
                      actions.member && !needsPhoto && accepted !== table.roomId ? (
                        <Btn
                          sm
                          variant="glassy"
                          testID={`here-${table.name}`}
                          label={tr.lobby.here}
                          disabled={waitingOn !== null}
                          loading={busy}
                          onPress={() => request.mutate({ table, asMember: true })}
                          look={{ padLeft: L.herePadX, padRight: L.herePadX }}
                          accessibilityLabel={waiting ? tr.lobby.waiting(left ?? 0) : undefined}
                        />
                      ) : null
                    }
                  />
                </Reveal>
              );
            })}
          </RowList>
        </View>
      ))}

      {request.isError ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(request.error)}
        </T>
      ) : null}
    </View>
  );
}

// The heading with the tables' count beside it (`.oh`: "6 masa", never a spot's count, rule 6).
// No count while the section is empty: its empty card already says so.
function SectionHead({ title, count }: { title: string; count: number | null }) {
  const { c } = useKit();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: VENUE.lobby.headGap }}>
      <T v="venueLobbyTitle" ink accessibilityRole="header">
        {title}
      </T>
      {count ? (
        <T v="kesfetCount" color={c.muted} tabular>
          {tr.lobby.tables(count)}
        </T>
      ) : null}
    </View>
  );
}

// Under this width (in dp at the text's size) a row's action goes under its words.
const NARROW_ROW_DP = 360;
const MAX_FONT_SCALE = 1.3;

// A table in the lobby (MekanKaydir `.orw`): its square picture in its edge, the name, and under it
// the intent's tag and the phones out of 12 (a running table: its phones); the action at the right.
// No person's name and no face (rule 4: the lobby carries the name, the picture, the phones, the
// intent and the game tag only). On the ground, a hairline between rows. `narrow`: the action
// under the words, in line with them; the tags wrap.
function LobbyRow({
  table,
  line,
  action,
  narrow,
  running,
}: {
  table: VenueTable;
  line: string;
  action: ReactNode;
  narrow: boolean;
  running?: boolean;
}) {
  const { scheme, c } = useKit();
  const intent = !running && isIntent(table.intent) ? table.intent : null;
  const R = VENUE.lobby.row;
  const T_ = VENUE.lobby.tag;
  const tagLook = VENUE[scheme].tag;
  return (
    <Li testID={`lobby-row-${table.name}`} top={narrow} padY={R.padY} gap={R.gap}>
      <TableThumb
        picture={table.icon ? TABLE_ICON_IMAGES[table.icon] : undefined}
        size={R.picture}
        radius={R.radius}
        edge={R.edge}
      />
      <View style={{ flex: 1, minWidth: 0, gap: R.lineGap }}>
        <T v="mapName" ink>
          {table.name}
        </T>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: R.partGap,
          }}
        >
          {intent ? (
            <View
              style={{
                minWidth: T_.width,
                height: T_.height,
                paddingHorizontal: T_.padX,
                borderRadius: T_.height / 2,
                backgroundColor: tagLook.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <T v="tag" color={tagLook.fg}>
                {tr.intents[intent]}
              </T>
            </View>
          ) : null}
          <T v="tag" color={c.muted} tabular>
            {line}
          </T>
          {running || !table.gameTag ? null : <Tag label={tr.concepts[table.gameTag]} />}
        </View>
        {narrow && action ? (
          <View style={{ paddingTop: ROW_ACTION_TOP, alignItems: 'flex-start' }}>{action}</View>
        ) : null}
      </View>
      {narrow ? null : action}
    </Li>
  );
}
const ROW_ACTION_TOP = 4;

// U19: no open table. The riso 160 × 110, 22 round on the raised shadow; the title on one line, the
// note at most 280 wide (Mekan).
const NO_OPEN = require('../../../assets/riso/venue-no-open.webp');
// No open table: the small empty card (iskelet.md → 3.4, 5.11).
function NoOpenTables() {
  return (
    <EmptyCard
      testID="lobby-empty"
      picture={NO_OPEN}
      title={tr.lobby.emptyTitle}
      body={tr.lobby.emptyBody}
    />
  );
}
