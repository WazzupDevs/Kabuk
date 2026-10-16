import { PARTICIPATIONS, type Participation } from '@shared/profile.ts';
import { isIntent, JOIN_REQUEST_TTL_SECONDS, requesterStatus } from '@shared/rooms.ts';
import { groupRoomsBySpot } from '@shared/spots.ts';
import { lobbyActions, type TableState } from '@shared/tableCard.ts';
import type { Side } from '@shared/teams.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Choice } from '@/components/Choice';
import { Countdown } from '@/components/Countdown';
import { Rise } from '@/components/motion';
import { EmptyState } from '@/components/EmptyState';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
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
import { ICON, NARROW_SCREEN } from '@/theme/tokens';

import { BigAlias } from './BigAlias';
import { useJoinAsk } from './joinAsk';
import { participationHint } from './participation';
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
  // The owner of the table's current room: the host whose "Kabul" the requester sees.
  hostAlias: string | null;
};

// How long "… kabul etti." stays in place of the pending note, like "Masa şu an müsait değil".
const ACCEPTED_NOTE_MS = 15_000;

// What the table is about to ask for: "Katıl" (the guest's side) or, with a side, "Bu masadayım"
// (docs/SPEC_V3.md §22.C) with that side's leader.
type Asking = { roomId: string; side?: Side; leader?: string };

// "Açık masalar" (the waiting rooms), "Süren masalar" (Faz 2) and the table's own request
// (docs/SPEC_V3.md §23.C; canvas: Faz 3 · 23.1 Masa ve lobi). A card shows only the alias, the
// people, the intent and the game tag: no "profilli" mark (rule 4, step 23.1). Its buttons follow
// the table's state: "Katıl" without a room and from the table's own waiting room, "Bu masadayım"
// only without one, none once merged. At a venue with spots the tables are grouped by spot, the
// table's own first; a table at another spot offers "Bu noktadayım" instead of a request.
export function Lobby({
  venueId,
  sessionId,
  alias,
  since,
  mySpotId,
  venueHasSpots,
  state,
  hostAlias,
}: Props) {
  const queryClient = useQueryClient();
  const actions = lobbyActions(state);
  const profile = useProfile();
  const hasName = !!profile.data?.display_name;
  // Side by side "Katıl" and "Bu masadayım" do not fit at 320 dp with the largest text.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  // The room this table is about to ask for, and its choice for that room (docs/SPEC_V3.md §5.4).
  const [asking, setAsking] = useState<Asking | null>(null);
  const setJoinAsk = useJoinAsk((s) => s.set);
  const joinAsk = useJoinAsk((s) => s.ask);
  const [participation, setParticipation] = useState<Participation>('anonymous');
  // "Profilimle" needs a profile photo (docs/SPEC_V3.md §22.G): "Fotoğraf ekle" swaps the request
  // sheet for the photo sheet, and the request comes back once it closes.
  const photo = useOwnPhoto();
  const [photoSheet, setPhotoSheet] = useState(false);
  const lobby = useLobby(venueId);
  const myRequest = useMyRequest(sessionId, since);
  const now = useNow(1000);

  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ ask, profiled }: { ask: Asking; profiled: boolean }) => {
      void registerForPush();
      return roomsApi.requestJoin(ask.roomId, profiled, ask.side);
    },
    onSuccess: (data, { ask, profiled }) => {
      track('join_requested', { as_member: ask.side !== undefined, in_lobby: state === 'open' });
      track('participation_chosen', { mode: profiled ? 'profile' : 'anonymous' });
      setJoinAsk(ask.side && ask.leader ? { requestId: data.requestId, leader: ask.leader } : null);
      setAsking(null);
    },
    onError: (err) => {
      // The photo went (or was hidden) after the sheet read it: nothing sent, the sheet stays with
      // the reason, back to anonymous.
      if (err instanceof ApiError && err.code === 'photo_required') {
        setParticipation('anonymous');
        void photo.refresh();
      } else {
        setAsking(null);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.myRequest });
    },
  });
  const refused = request.error instanceof ApiError && request.error.code === 'photo_required';
  const needsPhoto = hasName && ((photo.known && !photo.has) || refused);
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
  // Felt only when accepted: a decline and a timeout look and feel the same (rule 5).
  useRequesterHaptic(requestId, status);
  const secondsLeft = mine ? Math.max(0, Math.ceil((Date.parse(mine.expiresAt) - now) / 1000)) : 0;
  const recentlyUnavailable =
    mine && status === 'unavailable' && now - Date.parse(mine.expiresAt) < 15_000;
  // A request this screen saw waiting, and when it saw it accepted: "… kabul etti." for a few
  // seconds where the pending note was (adjusted while rendering). Nothing opens the room: the
  // table card's "Masaya git" does.
  const [seen, setSeen] = useState<{ id: string; acceptedAt: number | null } | null>(null);
  if (mine && status === 'pending' && seen?.id !== mine.id)
    setSeen({ id: mine.id, acceptedAt: null });
  if (mine && status === 'accepted' && seen?.id === mine.id && seen.acceptedAt === null) {
    setSeen({ id: mine.id, acceptedAt: now });
  }
  const acceptedNow = !!mine && seen?.id === mine.id && seen.acceptedAt !== null;
  const acceptedBy = memberAsk?.leader ?? (state === 'merged' ? hostAlias : null);
  const showAccepted =
    acceptedNow && acceptedBy !== null && now - (seen?.acceptedAt ?? 0) < ACCEPTED_NOTE_MS;
  const acceptedRoom = acceptedNow ? mine?.roomId : undefined;
  useEffect(() => {
    // Counted here once per room, the same key as the room screen's: the requester may never open it.
    if (acceptedRoom) {
      trackOnce(`join_accepted:${acceptedRoom}`, 'join_accepted', { as_member: asMember });
    }
  }, [acceptedRoom, asMember]);

  const rooms = lobby.data?.open ?? [];
  const running = lobby.data?.running ?? [];
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
      ) : status === 'pending' ? (
        <Card tone="note" className="mb-3">
          <Text accessibilityLiveRegion="polite">{tr.rooms.requestPending(secondsLeft)}</Text>
        </Card>
      ) : null}
      {recentlyUnavailable ? (
        <Card tone="note" className="mb-3">
          <Text accessibilityLiveRegion="polite">{tr.rooms.requestUnavailable}</Text>
        </Card>
      ) : null}
      {showAccepted && acceptedBy ? (
        <Card tone="note" className="mb-3" testID="request-accepted">
          <View className="flex-row items-center gap-2.5">
            <Avatar kind="table" alias={acceptedBy} size="sm" />
            <Text variant="bodyStrong" className="flex-1" accessibilityLiveRegion="polite">
              {tr.rooms.requestAccepted(acceptedBy)}
            </Text>
          </View>
        </Card>
      ) : null}
      {(request.isError && !refused) || moveHere.isError ? (
        <Text variant="fine" tone="danger" className="mb-3">
          {errorMessage(request.error ?? moveHere.error)}
        </Text>
      ) : null}

      {lobby.isPending ? (
        <View className="gap-3">
          <Text variant="heading" accessibilityRole="header">
            {tr.rooms.lobbyTitle}
          </Text>
          <View className="flex-row items-center gap-2.5">
            <Loader kind="meet" size={ICON.md} label={null} />
            <Text variant="fine">{tr.rooms.lobbyLoading}</Text>
          </View>
        </View>
      ) : lobby.isError ? (
        <View className="gap-3">
          <Text variant="heading" accessibilityRole="header">
            {tr.rooms.lobbyTitle}
          </Text>
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
        </View>
      ) : rooms.length === 0 ? (
        // A merged or "Masanla oyna" table has nothing to do in an empty lobby.
        state === 'off' || state === 'open' || state === 'member' ? (
          <EmptyState
            kind="empty"
            body={state === 'off' ? tr.rooms.playWithTableHint : tr.rooms.lobbyEmptyOpen}
          />
        ) : null
      ) : (
        <View className="gap-3">
          <View className="mb-1 flex-row items-center justify-between">
            <Text variant="heading" accessibilityRole="header">
              {tr.rooms.lobbyTitle}
            </Text>
            <Text variant="fine">{tr.rooms.roomCount(rooms.length)}</Text>
          </View>
          {groupRoomsBySpot(rooms, mySpotId).map((group) => (
            <View key={group.spotId ?? 'none'} className="gap-3">
              {venueHasSpots ? (
                <SpotHeading spotId={group.spotId} spotName={group.spotName} mine={group.mine} />
              ) : null}
              {group.rooms.map((room, i) => {
                const spotId = room.spot_id;
                const intent = isIntent(room.intent) ? room.intent : null;
                const member = actions.member && room.memberOpen;
                return (
                  <Rise key={room.room_id} index={i}>
                    <Card className="gap-3">
                      <View className="flex-row items-center gap-3.5">
                        <Avatar kind="table" alias={room.alias} size="xl" />
                        <View className="flex-1 gap-1">
                          <Text variant="heading">{room.alias}</Text>
                          <Text variant="fine">{tr.rooms.people(room.headcount)}</Text>
                          {intent || room.gameTag ? (
                            <View className="flex-row flex-wrap items-center gap-1.5">
                              {intent ? <Tag variant={intent} label={tr.intents[intent]} /> : null}
                              {room.gameTag ? (
                                <Tag icon="dice-outline" label={tr.concepts[room.gameTag]} />
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                      </View>
                      {group.mine && (actions.join || member) ? (
                        // "Katıl": the guest's side as its leader; "Bu masadayım": a member of
                        // the owner's side, while it has room (docs/SPEC_V3.md §22.C).
                        <View className={narrow ? 'gap-2.5' : 'flex-row gap-2.5'}>
                          {actions.join ? (
                            <View className={narrow ? undefined : 'flex-1'}>
                              <Button
                                variant="neutral"
                                testID="request-join"
                                label={tr.rooms.requestJoin}
                                onPress={() => ask({ roomId: room.room_id })}
                                disabled={waiting}
                              />
                            </View>
                          ) : null}
                          {member ? (
                            <View className={narrow ? undefined : 'flex-1'}>
                              <Button
                                variant="neutral"
                                testID="request-member"
                                label={tr.rooms.requestMember}
                                onPress={() =>
                                  ask({ roomId: room.room_id, side: 'owner', leader: room.alias })
                                }
                                disabled={waiting}
                              />
                            </View>
                          ) : null}
                        </View>
                      ) : group.mine ? null : state === 'off' && spotId !== null ? (
                        // Moving is only for a table without a room (in_room).
                        <Button
                          variant="neutral"
                          testID="spot-here"
                          icon="location-outline"
                          label={tr.rooms.spotHere}
                          onPress={() => moveHere.mutate(spotId)}
                          disabled={waiting || moveHere.isPending}
                        />
                      ) : actions.join ? (
                        <Text variant="fine">{tr.rooms.otherSpot}</Text>
                      ) : null}
                    </Card>
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
        visible={asking !== null && !photoSheet}
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
        <Button
          testID="request-send"
          label={tr.rooms.sendRequest}
          onPress={() =>
            asking && request.mutate({ ask: asking, profiled: participation === 'profile' })
          }
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
    </View>
  );
}
