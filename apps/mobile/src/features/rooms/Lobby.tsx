import { PARTICIPATIONS, type Participation } from '@shared/profile.ts';
import { isIntent, JOIN_REQUEST_TTL_SECONDS, requesterStatus } from '@shared/rooms.ts';
import { groupRoomsBySpot } from '@shared/spots.ts';
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
import { NARROW_SCREEN } from '@/theme/tokens';

import { BigAlias } from './BigAlias';
import { useJoinAsk } from './joinAsk';
import { participationHint } from './participation';
import { ProfiledTag } from './ProfiledTag';
import { roomKeys, useLobby, useMyRequest } from './queries';
import { RunningRooms } from './RunningRooms';
import { SpotHeading } from './SpotHeading';
import { useCreateSolo } from './useCreateSolo';

type Props = {
  venueId: string;
  sessionId: string;
  // The table's alias: the name a "Bu masadayım" request tells its leader.
  alias: string;
  since: string;
  // The table's spot, and whether the venue has spots at all (docs/SPEC_V3.md §4.3).
  mySpotId: string | null;
  venueHasSpots: boolean;
};

// What the table is about to ask for: "Katıl" (the guest's side) or, with a side, "Bu masadayım"
// (docs/SPEC_V3.md §22.C) with that side's leader.
type Asking = { roomId: string; side?: Side; leader?: string };

// Open rooms at the venue, the running rooms (Faz 2) and the table's own request. When nothing is
// open "Masanla oyna" shows instead (MVP_SPEC §4.3). At a venue with spots the rooms are grouped
// by spot, the table's own first; a room at another spot offers "Bu noktadayım" instead of a
// request.
export function Lobby({ venueId, sessionId, alias, since, mySpotId, venueHasSpots }: Props) {
  const queryClient = useQueryClient();
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
  const solo = useCreateSolo();
  const lobby = useLobby(venueId);
  const myRequest = useMyRequest(sessionId, since);
  const now = useNow(1000);

  const request = useMutation({
    mutationFn: ({ ask, profiled }: { ask: Asking; profiled: boolean }) => {
      void registerForPush();
      return roomsApi.requestJoin(ask.roomId, profiled, ask.side);
    },
    onSuccess: (data, { ask, profiled }) => {
      track('join_requested', { as_member: ask.side !== undefined });
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
      {(request.isError && !refused) || moveHere.isError ? (
        <Text variant="fine" tone="danger" className="mb-3">
          {errorMessage(request.error ?? moveHere.error)}
        </Text>
      ) : null}

      {rooms.length === 0 ? (
        <EmptyState
          kind="empty"
          body={tr.rooms.playWithTableHint}
          action={{ label: tr.rooms.playWithTable, onPress: () => solo.mutate() }}
        />
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
                const waitedMin = Math.floor((now - Date.parse(room.waiting_since)) / 60_000);
                const spotId = room.spot_id;
                const intent = isIntent(room.intent) ? room.intent : null;
                return (
                  <Rise key={room.room_id} index={i}>
                    <Card className="gap-3">
                      <View className="flex-row items-center gap-3.5">
                        <Avatar kind="table" alias={room.alias} size="xl" />
                        <View className="flex-1 gap-0.5">
                          <Text variant="heading">{room.alias}</Text>
                          <Text variant="fine">
                            {`${tr.rooms.people(room.headcount)} · ${tr.rooms.phones(room.phones)} · ${tr.rooms.waitingFor(waitedMin)}`}
                          </Text>
                        </View>
                        {intent ? <Tag variant={intent} label={tr.intents[intent]} /> : null}
                      </View>
                      {room.profiled ? (
                        <View className="flex-row">
                          <ProfiledTag />
                        </View>
                      ) : null}
                      {group.mine ? (
                        // "Katıl": the guest's side as its leader; "Bu masadayım": a member of
                        // the owner's side, while it has room (docs/SPEC_V3.md §22.C).
                        <View className={narrow ? 'gap-2.5' : 'flex-row gap-2.5'}>
                          <View className={narrow ? undefined : 'flex-1'}>
                            <Button
                              variant="neutral"
                              testID="request-join"
                              label={tr.rooms.requestJoin}
                              onPress={() => ask({ roomId: room.room_id })}
                              disabled={waiting}
                            />
                          </View>
                          {room.memberOpen ? (
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
                      ) : spotId !== null ? (
                        <Button
                          variant="neutral"
                          testID="spot-here"
                          icon="location-outline"
                          label={tr.rooms.spotHere}
                          onPress={() => moveHere.mutate(spotId)}
                          disabled={waiting || moveHere.isPending}
                        />
                      ) : (
                        <Text variant="fine">{tr.rooms.otherSpot}</Text>
                      )}
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
