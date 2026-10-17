import { ALIAS_REROLLS_PER_CHECKIN, isIntent } from '@shared/rooms.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { type RoomSeat, sideHeadcount } from '@shared/teams.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { LiveDot } from '@/components/LiveDot';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { callRerollAlias, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { NARROW_SCREEN, SPACING } from '@/theme/tokens';

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
};

// The lobby's dot: beats while the table is open to it.
const LOBBY_BEAT_MS = 1600;

// The table card at the top of the venue screen, the home screen (docs/SPEC_V3.md §23.C; canvas:
// Aşama 2 · Ekranlar → Faz 3 · 23.1 Masa ve lobi): the table's name, people and time left, and its
// state with what it can do there. "Masaya git" opens the room screen: the waiting room with its
// "Masanla oyna" games, the two-sided room, or "Masanla oyna"; nothing opens it by itself.
export function TableCard({ table, room, state, seat, minutesLeft, venueHasSpots }: Props) {
  const { shape } = useTheme();
  const queryClient = useQueryClient();
  // Side by side the status and "Lobiden çek" do not fit at 320 dp with the largest text.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);

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

  const goToTable = () => {
    if (room) router.push({ pathname: '/room/[id]', params: { id: room.id } });
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
  const error = withdraw.error ?? leave.error;

  const goButton = <Button testID="go-to-table" label={tr.venue.goToTable} onPress={goToTable} />;
  const withdrawButton = (
    <Button
      variant="neutral"
      size="sm"
      testID="withdraw-table"
      label={tr.venue.withdraw}
      onPress={() => withdraw.mutate()}
      loading={withdraw.isPending}
    />
  );

  return (
    <Card tone="feature" className="mt-3" testID="table-card">
      <View className="flex-row items-center gap-4">
        <Avatar kind="table" alias={table.alias} size="lg" />
        <View className="flex-1 gap-1">
          <Text variant="overline" tone="muted">
            {tr.venue.yourTable}
          </Text>
          <Text variant="alias" testID="table-alias" numberOfLines={1} adjustsFontSizeToFit>
            {table.alias}
          </Text>
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Tag label={tr.venue.people(table.headcount)} />
            <Tag
              icon="time-outline"
              label={tr.venue.remaining(Math.floor(minutesLeft / 60), minutesLeft % 60)}
            />
          </View>
        </View>
      </View>
      <View className="my-2.5 bg-divider" style={{ height: shape.stroke.hairline }} />
      <View className="gap-2.5">
        {state === 'off' ? (
          <>
            <Status dot="off" label={tr.venue.lobbyOff} />
            {venueHasSpots ? (
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1 flex-row items-center gap-2">
                  <Icon name="location-outline" />
                  <Text variant="bodyStrong" className="flex-1">
                    {table.spot?.name ? tr.venue.spot(table.spot.name) : tr.venue.noSpot}
                  </Text>
                </View>
                <Button
                  variant="ghost"
                  testID="change-spot"
                  label={table.spot_id ? tr.venue.changeSpot : tr.venue.chooseSpot}
                  onPress={() => router.push('/spot')}
                />
              </View>
            ) : null}
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="fine" className="flex-1">
                {tr.venue.rerollsLeft(ALIAS_REROLLS_PER_CHECKIN - table.alias_rerolls)}
              </Text>
              <Button
                variant="ghost"
                testID="reroll-alias"
                label={tr.venue.rerollAlias}
                onPress={() => reroll.mutate()}
                disabled={table.alias_rerolls >= ALIAS_REROLLS_PER_CHECKIN}
                loading={reroll.isPending}
              />
            </View>
            {reroll.isError ? (
              <Text variant="fine" tone="danger">
                {errorMessage(reroll.error)}
              </Text>
            ) : null}
          </>
        ) : state === 'open' ? (
          <>
            {narrow ? (
              <Status dot="live" label={tr.venue.lobbyOpen} />
            ) : (
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <Status dot="live" label={tr.venue.lobbyOpen} />
                </View>
                {withdrawButton}
              </View>
            )}
            {intent || tag ? (
              <View className="flex-row flex-wrap items-center gap-1.5">
                {intent ? <Tag variant={intent} label={tr.intents[intent]} /> : null}
                {tag ? <Tag icon="dice-outline" label={tr.concepts[tag]} /> : null}
              </View>
            ) : null}
            <Text variant="fine" tone="text">
              {tr.venue.openHint}
            </Text>
            {narrow ? withdrawButton : null}
            {goButton}
          </>
        ) : state === 'member' ? (
          <>
            <Status dot="live" label={tr.venue.lobbyOpen} />
            {leaderAlias ? (
              <Text variant="fine" tone="text">
                {tr.venue.memberOf(leaderAlias)}
              </Text>
            ) : null}
            {goButton}
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
          </>
        ) : state === 'merged' ? (
          <>
            <Status dot="merged" label={tr.venue.merged} />
            {other?.alias ? (
              <View className="flex-row items-center gap-3">
                <Avatar kind="table" alias={other.alias} size="md" />
                <View className="flex-1 gap-0.5">
                  <Text variant="bodyStrong">{tr.rooms.withOther(other.alias)}</Text>
                  <Text variant="fine">
                    {`${tr.rooms.people(sideHeadcount(other.headcount ?? 1, other.phones ?? 1))} · ${tr.rooms.phones(other.phones ?? 1)}`}
                  </Text>
                </View>
              </View>
            ) : null}
            {goButton}
          </>
        ) : (
          <>
            <Status dot="merged" label={tr.venue.solo} />
            {goButton}
          </>
        )}
        {error ? (
          <Text variant="fine" tone="danger">
            {errorMessage(error)}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

// The table's state with its dot: hollow off the lobby, beating in it, filled once merged.
function Status({ dot, label }: { dot: 'off' | 'live' | 'merged'; label: string }) {
  const { colors, shape } = useTheme();
  const size = SPACING[2.5];
  return (
    <View className="flex-row items-center gap-2" testID="table-state">
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
      <Text variant="bodyStrong">{label}</Text>
    </View>
  );
}
