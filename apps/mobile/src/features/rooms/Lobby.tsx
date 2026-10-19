import { gameFlowView } from '@shared/gender.ts';
import { PARTICIPATIONS, type Participation } from '@shared/profile.ts';
import { isIntent, JOIN_REQUEST_TTL_SECONDS, requesterStatus } from '@shared/rooms.ts';
import { groupRoomsBySpot } from '@shared/spots.ts';
import { lobbyActions, type TableState } from '@shared/tableCard.ts';
import type { Side } from '@shared/teams.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Choice } from '@/components/Choice';
import { Countdown } from '@/components/Countdown';
import { Rise } from '@/components/motion';
import { StateMark } from '@/components/EmptyState';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { Loader, MissMark } from '@/components/Loader';
import { GenderSheet } from '@/features/account/GenderSheet';
import { useProfile } from '@/features/account/useProfile';
import { PhotoNeeded } from '@/features/profile/PhotoNeeded';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { registerForPush } from '@/features/push/push';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track, trackOnce } from '@/lib/analytics';
import { ApiError, callChangeSpot, roomsApi } from '@/lib/api';
import { useRequesterHaptic } from '@/lib/haptics';
import { useNow } from '@/lib/useNow';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { MISS_MS } from '@/theme/markMotion';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import { BigAlias } from './BigAlias';
import { useJoinAsk } from './joinAsk';
import { participationHint } from './participation';
import { ProfilePreview } from './ProfilePreview';
import { roomKeys, useLobby, useMyRequest } from './queries';
import { RunningRooms } from './RunningRooms';
import { SpotHeading } from './SpotHeading';

type Props = {
  venueId: string;
  sessionId: string;
  // The table's alias: the name a "Bu masadayım" request tells its leader.
  alias: string;
  since: string;
  // The table's spot, and whether the venue has spots at all (docs/SPEC_V3.md §4.3).
  mySpotId: string | null;
  venueHasSpots: boolean;
  // The table card's state (@shared/tableCard.ts): which requests the lobby offers.
  state: TableState;
};

// An open table as the lobby reads it.
type LobbyRoom = NonNullable<ReturnType<typeof useLobby>['data']>['open'][number];

// The lobby's loading box (v45: .lobby-load, 140 high).
const LOAD_HEIGHT = SPACING[16] * 2 + SPACING[3];

// What the table is about to ask for: "Katıl" (the guest's side) or, with a side, "Bu masadayım"
// (docs/SPEC_V3.md §22.C) with that side's leader.
type Asking = { roomId: string; side?: Side; leader?: string };

// The "Katıl" requests this app sent, by id ("Bu masadayım" is not one): only a "Katıl" that did not
// meet takes its table out of this table's lobby (venue_lobby: `not as_member`); a "Bu masadayım"
// can be sent again. Kept for the app's session, so reopening the venue screen still knows them;
// after a restart the server's lobby alone decides.
const joinRequests = new Set<string>();

// "Açık masalar" (the waiting rooms), "Süren masalar" (Faz 2) and the table's own request
// (docs/SPEC_V3.md §23.C; canvas: Faz 3 · 23.1 Masa ve lobi). A card shows only the alias, the
// people, the intent and the game tag: no "profilli" mark (rule 4, step 23.1). Its buttons follow
// the table's state: "Katıl" without a room and from the table's own waiting room, "Bu masadayım"
// only without one, none once merged. At a venue with spots the tables are grouped by spot, the
// table's own first; a table at another spot offers "Bu noktadayım" instead of a request.
export function Lobby({ venueId, sessionId, alias, since, mySpotId, venueHasSpots, state }: Props) {
  const queryClient = useQueryClient();
  const actions = lobbyActions(state);
  const profile = useProfile();
  const hasName = !!profile.data?.display_name;
  // The room this table is about to ask for, and its choice for that room (docs/SPEC_V3.md §5.4).
  const [asking, setAsking] = useState<Asking | null>(null);
  const setJoinAsk = useJoinAsk((s) => s.set);
  const joinAsk = useJoinAsk((s) => s.ask);
  const [participation, setParticipation] = useState<Participation>('anonymous');
  // "Profilimle" needs a profile photo (docs/SPEC_V3.md §22.G): "Fotoğraf ekle" swaps the request
  // sheet for the photo sheet, and the request comes back once it closes; "Cinsiyetini seç" does
  // the same with the one-time gender question (§23.D).
  const photo = useOwnPhoto();
  const [photoSheet, setPhotoSheet] = useState(false);
  const [genderSheet, setGenderSheet] = useState(false);
  // The server said this account joins only with its profile (the phone did not know its gender).
  const [mustProfile, setMustProfile] = useState(false);
  const lobby = useLobby(venueId);
  const myRequest = useMyRequest(sessionId, since);
  const now = useNow(1000);

  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ ask, profiled }: { ask: Asking; profiled: boolean }) => {
      void registerForPush();
      return roomsApi.requestJoin(ask.roomId, profiled, ask.side);
    },
    onSuccess: (data, { ask }) => {
      // Never the anonymous or profiled choice: it would stand in for the gender (§23.L).
      track('join_requested', { as_member: ask.side !== undefined, in_lobby: state === 'open' });
      if (ask.side === undefined) joinRequests.add(data.requestId);
      setJoinAsk(ask.side && ask.leader ? { requestId: data.requestId, leader: ask.leader } : null);
      setAsking(null);
    },
    onError: (err) => {
      // The photo went (or was hidden) after the sheet read it: nothing sent, the sheet stays with
      // the reason, back to anonymous.
      if (err instanceof ApiError && err.code === 'photo_required') {
        setParticipation('anonymous');
        void photo.refresh();
      } else if (err instanceof ApiError && err.code === 'anonymous_not_allowed') {
        // The sheet stays and shows the profile that goes; nothing is sent until the next press.
        setMustProfile(true);
        void photo.refresh();
      } else if (!(err instanceof ApiError && err.code === 'gender_required')) {
        setAsking(null);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.myRequest });
    },
  });
  const code = request.error instanceof ApiError ? request.error.code : null;
  const refused = code === 'photo_required';
  const needsPhoto = hasName && ((photo.known && !photo.has) || refused);
  const view = gameFlowView(
    photo.gender,
    code === 'gender_required'
      ? 'gender_required'
      : mustProfile || code === 'anonymous_not_allowed'
        ? 'anonymous_not_allowed'
        : null,
  );
  // Refusals the request sheet shows in place; anything else closes it and shows above the lobby.
  const handled = refused || code === 'anonymous_not_allowed' || code === 'gender_required';
  const moveHere = useMutation({
    meta: FEEL_ERROR,
    mutationFn: callChangeSpot,
    onSuccess: () => {
      track('spot_changed', {});
      return queryClient.invalidateQueries({ queryKey: ['activeTable'] });
    },
  });

  const mine = myRequest.data;
  const status = mine ? requesterStatus(mine.status, mine.expiresAt, now) : null;
  // The waiting "Bu masadayım" request, as this phone sent it.
  const memberAsk = mine && joinAsk?.requestId === mine.id ? joinAsk : null;
  const asMember = memberAsk !== null;
  const viewStale = mine?.status === 'pending' && status === 'unavailable';
  const { refetch } = myRequest;
  // Refetch once the local clock passes expires_at, so the view and the UI agree.
  useEffect(() => {
    if (viewStale) void refetch();
  }, [viewStale, refetch]);
  const requestId = mine?.id;
  useEffect(() => {
    if (requestId && status === 'unavailable') {
      trackOnce(`join_unavailable:${requestId}`, 'join_unavailable', { as_member: asMember });
    }
  }, [requestId, status, asMember]);
  // A table asked once with "Katıl" and not met leaves this table's lobby (venue_lobby hides it):
  // once the row's miss has played the row goes here too, without waiting for the server's clock to
  // pass the same second, and its "Katıl" never comes back. The lobby is read again for the rest. A
  // "Bu masadayım" keeps its row: it can be sent again.
  const [leftRequest, setLeftRequest] = useState<string | null>(null);
  useEffect(() => {
    if (!requestId || status !== 'unavailable' || !joinRequests.has(requestId)) return undefined;
    const id = setTimeout(() => {
      setLeftRequest(requestId);
      void queryClient.invalidateQueries({ queryKey: roomKeys.lobby(venueId) });
    }, MISS_MS);
    return () => clearTimeout(id);
  }, [requestId, status, venueId, queryClient]);
  // Felt only when accepted: a decline and a timeout look and feel the same (rule 5).
  useRequesterHaptic(requestId, status);
  const secondsLeft = mine ? Math.max(0, Math.ceil((Date.parse(mine.expiresAt) - now) / 1000)) : 0;
  const recentlyUnavailable =
    mine && status === 'unavailable' && now - Date.parse(mine.expiresAt) < 15_000;
  // A request this screen saw waiting, and when it saw it accepted (adjusted while rendering). The
  // table card says so ("Kabul edildi, X masasının yanına git", docs/SPEC_V3.md §23.E); nothing
  // opens the room: the card's "Masaya git" does.
  const [seen, setSeen] = useState<{ id: string; acceptedAt: number | null } | null>(null);
  if (mine && status === 'pending' && seen?.id !== mine.id)
    setSeen({ id: mine.id, acceptedAt: null });
  if (mine && status === 'accepted' && seen?.id === mine.id && seen.acceptedAt === null) {
    setSeen({ id: mine.id, acceptedAt: now });
  }
  const acceptedNow = !!mine && seen?.id === mine.id && seen.acceptedAt !== null;
  const acceptedRoom = acceptedNow ? mine?.roomId : undefined;
  useEffect(() => {
    // Counted here once per room, the same key as the room screen's: the requester may never open it.
    if (acceptedRoom) {
      trackOnce(`join_accepted:${acceptedRoom}`, 'join_accepted', { as_member: asMember });
    }
  }, [acceptedRoom, asMember]);

  const leftRoom = mine && leftRequest === mine.id ? mine.roomId : null;
  const rooms = (lobby.data?.open ?? []).filter((r) => r.room_id !== leftRoom);
  const running = lobby.data?.running ?? [];
  // A request to an open table shows in its row (v45: .row .wait); one to a table that is not
  // listed (gone from the lobby, or a running table's side) keeps the note above the lobby.
  const inRow = !!mine && rooms.some((r) => r.room_id === mine.roomId);
  // A merged or "Masanla oyna" table has nothing to do in an empty lobby: no card, and no heading
  // over nothing.
  const emptyCard = state === 'off' || state === 'open' || state === 'member';
  const lobbyShown = !lobby.isSuccess || rooms.length > 0 || emptyCard;
  const waiting = status === 'pending' || request.isPending;
  const ask = (next: Asking) => {
    setParticipation('anonymous');
    request.reset();
    setAsking(next);
  };

  return (
    <View className="mt-6">
      {status === 'pending' && memberAsk ? (
        // "Bu masadayım": the table's own alias at its largest, the name the leader sees on the
        // request card (canvas: Faz 2 · 22.5 → İsteyen: adını söyle).
        <Card tone="feature" className="mb-3 gap-3" testID="member-pending">
          <Text variant="overline" tone="muted">
            {tr.rooms.tellLeader}
          </Text>
          <BigAlias alias={alias} />
          <Text variant="fine" tone="text" accessibilityLiveRegion="polite">
            {tr.rooms.tellLeaderBody(memberAsk.leader)}
          </Text>
          <Countdown
            secondsLeft={secondsLeft}
            totalSeconds={JOIN_REQUEST_TTL_SECONDS}
            label={tr.rooms.secondsLeft(secondsLeft)}
          />
        </Card>
      ) : status === 'pending' && !inRow ? (
        <Card tone="note" className="mb-3">
          <Text accessibilityLiveRegion="polite">{tr.rooms.requestPending(secondsLeft)}</Text>
        </Card>
      ) : null}
      {/* Not for a request whose row just left after its miss: the row said it already. */}
      {recentlyUnavailable && !inRow && leftRequest !== mine?.id ? (
        <Card tone="note" className="mb-3">
          <Text accessibilityLiveRegion="polite">{tr.rooms.requestUnavailable}</Text>
        </Card>
      ) : null}
      {(request.isError && !handled) || moveHere.isError ? (
        <Text variant="fine" tone="danger" className="mb-3">
          {errorMessage(request.error ?? moveHere.error)}
        </Text>
      ) : null}

      {/* "Açık masalar" and how many (v45: .sec), over every state of the list that shows. */}
      {lobbyShown ? (
        <View className="mb-2 flex-row items-baseline justify-between">
          <Text variant="heading" accessibilityRole="header">
            {tr.rooms.lobbyTitle}
          </Text>
          {lobby.isSuccess && rooms.length > 0 ? (
            <Text variant="label">{tr.rooms.roomCount(rooms.length)}</Text>
          ) : null}
        </View>
      ) : null}
      {lobby.isPending ? (
        // Tahterevalli while the lobby is read (v45: .lobby-load).
        <View className="items-center justify-center" style={{ minHeight: LOAD_HEIGHT }}>
          <Loader kind="seesaw" size={SPACING[10]} label={tr.rooms.lobbyLoading} />
        </View>
      ) : lobby.isError ? (
        <Card className="gap-3" testID="lobby-error">
          <Text variant="bodyStrong">{tr.rooms.lobbyError}</Text>
          <Button
            variant="neutral"
            icon="refresh-outline"
            label={tr.common.retry}
            onPress={() => void lobby.refetch()}
            loading={lobby.isRefetching}
          />
        </Card>
      ) : rooms.length === 0 ? (
        emptyCard ? (
          <Card testID="lobby-empty">
            <View className="flex-row items-center gap-3.5">
              <StateMark kind="empty" size={SPACING[16]} />
              <View className="flex-1 gap-0.5">
                <Text variant="bodyStrong">{tr.rooms.lobbyEmptyTitle}</Text>
                <Text variant="fine">
                  {state === 'off' ? tr.rooms.playWithTableHint : tr.rooms.lobbyEmptyOpen}
                </Text>
              </View>
            </View>
          </Card>
        ) : null
      ) : (
        <View className="gap-3">
          {groupRoomsBySpot(rooms, mySpotId).map((group) => (
            <View key={group.spotId ?? 'none'} className="gap-2.5">
              {venueHasSpots ? (
                <SpotHeading spotId={group.spotId} spotName={group.spotName} mine={group.mine} />
              ) : null}
              {group.rooms.map((room, i) => {
                const spotId = room.spot_id;
                const member = actions.member && room.memberOpen;
                const asked = mine?.roomId === room.room_id;
                const pendingHere = asked && status === 'pending';
                const missedHere = asked && !!recentlyUnavailable;
                return (
                  <Rise key={room.room_id} index={i}>
                    <LobbyRow
                      room={room}
                      note={
                        pendingHere
                          ? tr.rooms.requestPending(secondsLeft)
                          : missedHere
                            ? tr.rooms.requestUnavailable
                            : null
                      }
                      side={
                        pendingHere ? (
                          <Loader kind="swap" size={SPACING[7]} delay={0} label={null} />
                        ) : missedHere && mine ? (
                          // A request that did not meet: the miss once (keyed by the request),
                          // then the row leaves the lobby (one request per table).
                          <MissMark key={mine.id} size={SPACING[7]} />
                        ) : group.mine && actions.join ? (
                          <Button
                            variant="neutral"
                            size="sm"
                            testID="request-join"
                            label={tr.rooms.requestJoin}
                            onPress={() => ask({ roomId: room.room_id })}
                            disabled={waiting}
                          />
                        ) : null
                      }
                      below={
                        group.mine && member ? (
                          // "Bu masadayım": a member of the owner's side, while it has room
                          // (docs/SPEC_V3.md §22.C).
                          <Button
                            variant="neutral"
                            testID="request-member"
                            label={tr.rooms.requestMember}
                            onPress={() =>
                              ask({ roomId: room.room_id, side: 'owner', leader: room.alias })
                            }
                            disabled={waiting}
                          />
                        ) : group.mine ? null : state === 'off' && spotId !== null ? (
                          // Moving is only for a table without a room (in_room).
                          <Button
                            variant="neutral"
                            icon="location-outline"
                            testID="spot-here"
                            label={tr.rooms.spotHere}
                            onPress={() => moveHere.mutate(spotId)}
                            disabled={waiting || moveHere.isPending}
                          />
                        ) : actions.join ? (
                          <Text variant="fine">{tr.rooms.otherSpot}</Text>
                        ) : null
                      }
                    />
                  </Rise>
                );
              })}
            </View>
          ))}
        </View>
      )}

      <RunningRooms
        rooms={running}
        mySpotId={mySpotId}
        venueHasSpots={venueHasSpots}
        disabled={waiting || moveHere.isPending}
        canMember={actions.member}
        onMember={(roomId, side, leader) => ask({ roomId, side, leader })}
        onSpotHere={(spotId) => moveHere.mutate(spotId)}
      />

      <Sheet
        visible={asking !== null && !photoSheet && !genderSheet}
        onClose={() => {
          setAsking(null);
          request.reset();
        }}
        title={asking?.side ? tr.rooms.requestMember : tr.rooms.requestTitle}
        icon="people-outline"
      >
        {asking?.side && asking.leader ? (
          <Text variant="fine" tone="text">
            {tr.rooms.memberBody(asking.leader)}
          </Text>
        ) : null}
        {photo.loading ? (
          // Until the own profile answers: neither a choice nor a profile that may change a moment
          // later.
          <View className="items-center py-3">
            <Loader kind="meet" size={ICON.lg} label={null} />
          </View>
        ) : view !== 'choice' ? (
          <ProfilePreview
            sheet={asking?.side ? 'member' : 'join'}
            view={view}
            refused={code}
            onAddPhoto={() => setPhotoSheet(true)}
            onChooseGender={() => setGenderSheet(true)}
          />
        ) : (
          <>
            <Text variant="label">{tr.participation.title}</Text>
            <View accessibilityRole="radiogroup" className="gap-2">
              {PARTICIPATIONS.map((mode) => (
                <Choice
                  key={mode}
                  testID={`request-${mode}`}
                  label={tr.participation[mode]}
                  hint={participationHint(mode, hasName, asking?.side ? { alias } : undefined)}
                  // "Bu masadayım": the face the room's phones will see (canvas: Bu masadayım: seçim).
                  picture={
                    !asking?.side ? undefined : mode === 'anonymous' ? (
                      <Avatar kind="table" alias={alias} size="sm" />
                    ) : needsPhoto || !hasName ? null : (
                      <Avatar kind="profile" name={photo.name} photoUrl={photo.url} size="sm" />
                    )
                  }
                  selected={participation === mode}
                  disabled={mode === 'profile' && !hasName}
                  unavailable={
                    mode === 'profile' && needsPhoto ? (
                      <PhotoNeeded refused={refused} onAddPhoto={() => setPhotoSheet(true)} />
                    ) : undefined
                  }
                  onPress={() => setParticipation(mode)}
                />
              ))}
            </View>
          </>
        )}
        <Button
          testID="request-send"
          label={tr.rooms.sendRequest}
          onPress={() =>
            asking &&
            request.mutate({
              ask: asking,
              profiled: view !== 'choice' || participation === 'profile',
            })
          }
          disabled={photo.loading || view === 'gender' || (view === 'profile' && needsPhoto)}
          loading={request.isPending}
        />
      </Sheet>
      <PhotoSheet
        visible={photoSheet}
        onClose={() => {
          setPhotoSheet(false);
          request.reset();
        }}
      />
      <GenderSheet
        visible={genderSheet}
        onClose={() => {
          setGenderSheet(false);
          request.reset();
        }}
      />
    </View>
  );
}

// An open table (v45: .row): its avatar, its name, a line about this table's request to it, and its
// people, intent and game as tags. On the right "Katıl", or the request's mark while it waits
// (Kesişme) and when it did not meet (the miss); under it "Bu masadayım" or "Bu noktadayım".
function LobbyRow({
  room,
  note,
  side,
  below,
}: {
  room: LobbyRoom;
  note: string | null;
  side: ReactNode;
  below: ReactNode;
}) {
  const intent = isIntent(room.intent) ? room.intent : null;
  return (
    <Card flush>
      <View
        style={{
          gap: SPACING[2.5],
          paddingVertical: SPACING[2.5],
          paddingLeft: SPACING[2.5],
          paddingRight: SPACING[3],
        }}
      >
        <View className="flex-row items-center" style={{ gap: SPACING[3] }}>
          <Avatar kind="table" alias={room.alias} size="lg" />
          <View className="flex-1 gap-1">
            <Text variant="bodyStrong">{room.alias}</Text>
            {note ? (
              <Text variant="fine" accessibilityLiveRegion="polite">
                {note}
              </Text>
            ) : null}
            <View className="flex-row flex-wrap items-center gap-1.5">
              <Tag icon="people-outline" label={tr.rooms.people(room.headcount)} />
              {intent ? <Tag variant={intent} label={tr.intents[intent]} /> : null}
              {room.gameTag ? <Tag icon="dice-outline" label={tr.concepts[room.gameTag]} /> : null}
            </View>
          </View>
          {side ? (
            <View
              className="items-center justify-center"
              style={{ minWidth: TOUCH.min, minHeight: TOUCH.min }}
            >
              {side}
            </View>
          ) : null}
        </View>
        {below}
      </View>
    </Card>
  );
}
