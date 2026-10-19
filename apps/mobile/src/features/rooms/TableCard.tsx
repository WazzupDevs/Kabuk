import { ALIAS_REROLLS_PER_CHECKIN, isIntent } from '@shared/rooms.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { type RoomSeat, sideHeadcount } from '@shared/teams.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { LiveDot } from '@/components/LiveDot';
import { Loader } from '@/components/Loader';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { callRerollAlias, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING, TOUCH } from '@/theme/tokens';

import { roomKeys, type TableRoomRow } from './queries';

type Table = {
  id: string;
  alias: string;
  headcount: number;
  alias_rerolls: number;
  spot_id: string | null;
  spot: { name: string } | null;
  venue_id: string;
};

type Props = {
  table: Table;
  room: TableRoomRow | null;
  state: TableState;
  // This phone's side and whether it leads it; null while a member's side is still being read.
  seat: RoomSeat | null;
  minutesLeft: number;
  venueHasSpots: boolean;
  // This phone has opened the merged table once (openedTables): "Birleşti" from then on.
  opened: boolean;
  // "Lobiye aç": the venue screen's sheet (OpenLobbySheet).
  onOpenLobby: () => void;
};

// The lobby's dot: beats while the table is open to it.
const LOBBY_BEAT_MS = 1600;

// The table card at the top of the venue screen, the home screen (v45: .card.mine; docs/SPEC_V3.md
// §23.C). Its head opens the table: the room when there is one, else the table screen with the
// table's games, which makes nothing until a game is picked (K-36). Under the head a quiet line: the
// time left and, without a room, the spot and the name to change (K-35; the server refuses both in a
// room). Then what the state allows: "Lobiye aç" or "Lobiden çek", and "Davet et".
export function TableCard({
  table,
  room,
  state,
  seat,
  minutesLeft,
  venueHasSpots,
  opened,
  onOpenLobby,
}: Props) {
  const queryClient = useQueryClient();
  const [invite, setInvite] = useState(false);

  const reroll = useMutation({
    meta: FEEL_ERROR,
    mutationFn: callRerollAlias,
    onSuccess: () => {
      track('alias_rerolled', {});
      return queryClient.invalidateQueries({ queryKey: ['activeTable'] });
    },
  });
  const settle = () => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    void queryClient.invalidateQueries({ queryKey: roomKeys.lobby(table.venue_id) });
    if (room) void queryClient.invalidateQueries({ queryKey: roomKeys.room(room.id) });
  };
  // "Lobiden çek": the leader ends the waiting room, as "Odayı bitir" did (docs/SPEC_V3.md §23.C).
  const withdraw = useMutation({ meta: FEEL_ERROR, mutationFn: roomsApi.end, onSettled: settle });
  // A member leaves the side (docs/SPEC_V3.md §22.D).
  const leave = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.leave(room?.id ?? ''),
    onSuccess: () => track('team_left', {}),
    onSettled: settle,
  });

  const openTable = () => {
    if (room) router.push({ pathname: '/room/[id]', params: { id: room.id } });
    else router.push('/table');
  };
  const confirmLeave = () => {
    Alert.alert(tr.rooms.leaveConfirmTitle, tr.rooms.leaveConfirmMember, [
      { text: tr.common.cancel, style: 'cancel' },
      { text: tr.rooms.leave, style: 'destructive', onPress: () => leave.mutate() },
    ]);
  };

  const mySide = seat?.side;
  const leaderAlias =
    room && mySide ? (mySide === 'owner' ? room.owner_alias : room.guest_alias) : null;
  const other =
    room && mySide
      ? mySide === 'owner'
        ? { alias: room.guest_alias, headcount: room.guest_headcount, phones: room.guest_phones }
        : { alias: room.owner_alias, headcount: room.owner_headcount, phones: room.owner_phones }
      : null;
  const intent = room && isIntent(room.intent) ? room.intent : null;
  const tag = room ? gameTag(room.game_tag) : null;
  const error = withdraw.error ?? leave.error ?? reroll.error;

  // Kabul is the meeting (docs/SPEC_V3.md §23.E): the joining side goes to the host's table, the
  // host's side waits for it; once this phone has opened the table, "Birleşti".
  const status =
    state === 'off' ? (
      <Status people={table.headcount} dot="off" label={tr.venue.lobbyOff} />
    ) : state === 'open' || state === 'member' ? (
      <Status people={table.headcount} dot="live" label={tr.venue.lobbyOpen} />
    ) : state === 'merged' ? (
      opened || !other?.alias ? (
        <Status
          people={table.headcount}
          dot="merged"
          label={tr.venue.merged}
          testID="table-merged"
        />
      ) : mySide === 'guest' ? (
        <Status
          people={table.headcount}
          dot="live"
          label={tr.venue.acceptedGoTo(other.alias)}
          testID="table-accepted"
        />
      ) : (
        <Status
          people={table.headcount}
          dot="live"
          label={tr.venue.coming(
            other.alias,
            sideHeadcount(other.headcount ?? 1, other.phones ?? 1),
          )}
          testID="table-coming"
        />
      )
    ) : (
      <Status people={table.headcount} dot="merged" label={tr.venue.solo} />
    );

  return (
    <Card className="mt-3" testID="table-card">
      <Pressable
        testID="go-to-table"
        accessibilityRole="button"
        accessibilityLabel={`${table.alias}, ${tr.venue.openTable}`}
        onPress={openTable}
        className="flex-row items-center gap-3"
        style={{ minHeight: TOUCH.min }}
      >
        <Avatar kind="table" alias={table.alias} size="md" />
        <View className="flex-1 gap-0.5">
          <Text variant="heading" testID="table-alias">
            {table.alias}
          </Text>
          {status}
        </View>
        <Icon name="chevron-forward" tone="muted" />
      </Pressable>

      {/* The quiet line (K-35): the time left, and without a room the spot and the name, as text
          links so the line stays small (their touch areas grow to 44). */}
      <View
        className="mt-2 flex-row flex-wrap items-center"
        style={{ columnGap: SPACING[3], rowGap: SPACING[2] }}
      >
        <View className="flex-row items-center gap-1">
          <Icon name="time-outline" size={ICON.sm} tone="muted" />
          <Text variant="fine">
            {tr.venue.remaining(Math.floor(minutesLeft / 60), minutesLeft % 60)}
          </Text>
        </View>
        {state === 'off' && venueHasSpots ? (
          <View className="flex-row items-center gap-1.5">
            <Icon name="location-outline" size={ICON.sm} tone="muted" />
            <Text variant="fine">
              {table.spot?.name ? tr.venue.spot(table.spot.name) : tr.venue.noSpot}
            </Text>
            <QuietLink
              testID="change-spot"
              label={table.spot_id ? tr.venue.changeSpot : tr.venue.chooseSpot}
              onPress={() => router.push('/spot')}
            />
          </View>
        ) : null}
        {state === 'off' ? (
          <View className="flex-row items-center gap-1.5">
            <QuietLink
              testID="reroll-alias"
              label={tr.venue.rerollAlias}
              onPress={() => reroll.mutate()}
              disabled={table.alias_rerolls >= ALIAS_REROLLS_PER_CHECKIN}
              loading={reroll.isPending}
            />
            <Text variant="fine">
              {tr.venue.rerollsLeft(ALIAS_REROLLS_PER_CHECKIN - table.alias_rerolls)}
            </Text>
          </View>
        ) : null}
      </View>

      {state === 'open' && (intent || tag) ? (
        <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
          {intent ? <Tag variant={intent} label={tr.intents[intent]} /> : null}
          {tag ? <Tag icon="dice-outline" label={tr.concepts[tag]} /> : null}
        </View>
      ) : null}

      {state === 'off' || state === 'open' ? (
        // The table's leader: into the lobby or out of it, and how a friend joins (v45: .two).
        <View className="mt-3 flex-row gap-2.5">
          <View className="flex-1">
            {state === 'off' ? (
              <Button tight testID="lobby-open" label={tr.venue.openLobby} onPress={onOpenLobby} />
            ) : (
              <Button
                tight
                variant="neutral"
                testID="withdraw-table"
                label={tr.venue.withdraw}
                onPress={() => withdraw.mutate()}
                loading={withdraw.isPending}
              />
            )}
          </View>
          <View className="flex-1">
            <Button
              tight
              variant="neutral"
              testID="invite-open"
              label={tr.venue.invite}
              onPress={() => setInvite(true)}
            />
          </View>
        </View>
      ) : null}

      {state === 'member' ? (
        <View className="mt-2 gap-2">
          {leaderAlias ? (
            <Text variant="fine" tone="text">
              {tr.venue.memberOf(leaderAlias)}
            </Text>
          ) : null}
          <View className="flex-row">
            <Button
              variant="neutral"
              size="sm"
              testID="leave-table"
              label={tr.rooms.leave}
              onPress={confirmLeave}
              loading={leave.isPending}
            />
          </View>
        </View>
      ) : null}

      {state === 'merged' && other?.alias ? (
        <View className="mt-2 flex-row items-center gap-3">
          <Avatar kind="table" alias={other.alias} size="md" />
          <View className="flex-1 gap-0.5">
            <Text variant="bodyStrong">{tr.rooms.withOther(other.alias)}</Text>
            <Text variant="fine">
              {`${tr.rooms.people(sideHeadcount(other.headcount ?? 1, other.phones ?? 1))} · ${tr.rooms.phones(other.phones ?? 1)}`}
            </Text>
          </View>
        </View>
      ) : null}

      {error ? (
        <Text variant="fine" tone="danger" className="mt-2">
          {errorMessage(error)}
        </Text>
      ) : null}

      <Sheet
        visible={invite}
        onClose={() => setInvite(false)}
        title={tr.venue.inviteTitle}
        icon="people-outline"
      >
        <View className="gap-3" testID="invite-sheet">
          <Text>{tr.venue.inviteName(table.alias)}</Text>
          <Text tone="muted">{tr.venue.inviteHow}</Text>
          {state === 'off' ? (
            <>
              <Text variant="bodyStrong">{tr.venue.inviteOpenFirst}</Text>
              <Button
                testID="invite-open-lobby"
                label={tr.venue.openLobby}
                onPress={() => {
                  setInvite(false);
                  onOpenLobby();
                }}
              />
            </>
          ) : null}
        </View>
      </Sheet>
    </Card>
  );
}

// The head's second line (v45: .mine-head small): the state's dot, the people and the state. The dot
// is hollow off the lobby, beating in it and on the way to the other table, filled once merged.
function Status({
  people,
  dot,
  label,
  testID,
}: {
  people: number;
  dot: 'off' | 'live' | 'merged';
  label: string;
  testID?: string;
}) {
  const { colors, shape } = useTheme();
  const size = SPACING[2];
  return (
    <View className="flex-row flex-wrap items-center gap-x-1.5" testID="table-state">
      {dot === 'live' ? (
        <LiveDot tone="success" periodMs={LOBBY_BEAT_MS} size={size} />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: shape.radius.pill,
            borderWidth: dot === 'off' ? shape.stroke.control : 0,
            borderColor: colors.muted,
            backgroundColor: dot === 'merged' ? colors.violet : 'transparent',
          }}
        />
      )}
      <Text variant="label" tone="muted">
        {tr.venue.people(people)}
      </Text>
      <Text variant="label" tone="muted" accessible={false}>
        ·
      </Text>
      <Text variant="label" tone="muted" className="shrink" testID={testID}>
        {label}
      </Text>
    </View>
  );
}

// A text link on the quiet line: the label in the accent, 44 high to the touch. Busy, the mark
// takes the label's place and a second press does nothing (CLAUDE.md → Ekran davranışı).
function QuietLink({
  label,
  onPress,
  disabled = false,
  loading = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const { typography } = useTheme();
  const inactive = disabled || loading;
  const slop = (TOUCH.min - typography.label.lineHeight) / 2;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={{ top: slop, bottom: slop, left: SPACING[2], right: SPACING[2] }}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? OPACITY.pressed : 1 }}>
          <View style={{ opacity: loading ? 0 : 1 }}>
            <Text variant="label" tone={disabled ? 'muted' : 'accent'}>
              {label}
            </Text>
          </View>
          {loading ? (
            <View className="absolute inset-0 items-center justify-center">
              <Loader kind="meet" size={ICON.sm} delay={0} label={null} />
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
