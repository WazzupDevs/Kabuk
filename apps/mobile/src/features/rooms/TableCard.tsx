import { isIntent } from '@shared/rooms.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { LiveDot } from '@/components/LiveDot';
import { Loader } from '@/components/Loader';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING, TOUCH } from '@/theme/tokens';

import { InviteSheet } from './InviteSheet';
import { roomKeys, type TableRoomRow } from './queries';
import { TableIcon } from './TableIcon';

type CheckIn = {
  id: string;
  spot_id: string | null;
  spot: { name: string } | null;
  venue_id: string;
};

type Props = {
  checkIn: CheckIn;
  room: TableRoomRow | null;
  state: TableState;
  minutesLeft: number;
  venueHasSpots: boolean;
  // "Masa kur" and "Lobiye aç": the venue screen's sheets.
  onCreate: () => void;
  onOpenLobby: () => void;
};

// The lobby's dot: beats while the table is open to it.
const LOBBY_BEAT_MS = 1600;

// The person's card at the top of Mekan (v46: .card.mine and .nomasa; docs/SPEC_V4.md §4.E).
// Without a table: "Henüz masan yok" and "Masa kur". With one: its icon, name, people and lobby
// state; the head opens the table. The owner gets "Lobiye aç" or "Lobiden çek" and "Davet et"; the
// owner's icon opens the picker (K-59). Under it a quiet line: the time left and, without a table,
// the spot to change (the server refuses it at a table).
export function TableCard({
  checkIn,
  room,
  state,
  minutesLeft,
  venueHasSpots,
  onCreate,
  onOpenLobby,
}: Props) {
  const queryClient = useQueryClient();
  const [invite, setInvite] = useState(false);

  const settle = () => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    void queryClient.invalidateQueries({ queryKey: roomKeys.venueTables(checkIn.venue_id) });
    if (room) void queryClient.invalidateQueries({ queryKey: roomKeys.room(room.id) });
  };
  // "Lobiden çek": the table stays, only out of the lobby.
  const withdraw = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.setVisibility(room?.id ?? '', false),
    onSettled: settle,
  });

  const intent = room && isIntent(room.intent) ? room.intent : null;
  const tag = room ? gameTag(room.game_tag) : null;
  const owner = state === 'private' || state === 'open';

  return (
    <Card testID="table-card">
      {state === 'none' || !room ? (
        <View className="gap-3" testID="no-table">
          <View className="flex-row items-center gap-3">
            <Icon name="people-outline" tone="muted" />
            <View className="flex-1 gap-0.5">
              <Text variant="heading">{tr.venue.noTable}</Text>
              <Text variant="fine">{tr.venue.noTableHint}</Text>
            </View>
          </View>
          <Button testID="table-create-open" label={tr.venue.createTable} onPress={onCreate} />
        </View>
      ) : (
        <>
          <Pressable
            testID="go-to-table"
            accessibilityRole="button"
            accessibilityLabel={tr.venue.tableHead(
              room.name ?? '',
              room.phones,
              state === 'open' ? tr.venue.lobbyOpen : tr.venue.lobbyOff,
            )}
            onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
            className="flex-row items-center gap-3"
            style={{ minHeight: TOUCH.min }}
          >
            <TableIcon icon={room.icon} size="mine" />
            <View className="flex-1 gap-0.5">
              <Text variant="heading" testID="table-name">
                {room.name ?? ''}
              </Text>
              <Status people={room.phones} live={state === 'open'} />
            </View>
            <Icon name="chevron-forward" tone="muted" />
          </Pressable>

          {state === 'open' && (intent || tag) ? (
            <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
              {intent ? <Tag variant={intent} label={tr.intents[intent]} /> : null}
              {tag ? <Tag icon="dice-outline" label={tr.concepts[tag]} /> : null}
            </View>
          ) : null}

          {owner ? (
            // The owner: into the lobby or out of it, and how a friend joins (v46: .two).
            <View className="mt-3 flex-row gap-2.5">
              <View className="flex-1">
                {state === 'private' ? (
                  <Button
                    tight
                    testID="lobby-open"
                    label={tr.venue.openLobby}
                    onPress={onOpenLobby}
                  />
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
        </>
      )}

      {/* The quiet line (K-35): the time left, and without a table the spot. Each part wraps
          inside itself, so nothing leaves the card at 320 dp and the largest text size. */}
      <View
        className="mt-2 flex-row flex-wrap items-center"
        style={{ columnGap: SPACING[3], rowGap: SPACING[2] }}
      >
        <QuietPart>
          <Icon name="time-outline" size={ICON.sm} tone="muted" />
          <Text variant="fine" className="shrink">
            {tr.venue.remaining(Math.floor(minutesLeft / 60), minutesLeft % 60)}
          </Text>
        </QuietPart>
        {state === 'none' && venueHasSpots ? (
          <QuietPart>
            <Icon name="location-outline" size={ICON.sm} tone="muted" />
            <Text variant="fine" className="shrink">
              {checkIn.spot?.name ? tr.venue.spot(checkIn.spot.name) : tr.venue.noSpot}
            </Text>
            <QuietLink
              testID="change-spot"
              label={checkIn.spot_id ? tr.venue.changeSpot : tr.venue.chooseSpot}
              onPress={() => router.push('/spot')}
            />
          </QuietPart>
        ) : null}
      </View>

      {withdraw.error ? (
        <Text variant="fine" tone="danger" className="mt-2">
          {errorMessage(withdraw.error)}
        </Text>
      ) : null}

      {room && owner ? (
        <InviteSheet
          visible={invite}
          onClose={() => setInvite(false)}
          roomId={room.id}
          phones={room.phones}
        />
      ) : null}
    </Card>
  );
}

// The head's second line (v46: .mine-head small): the lobby's dot, the people and the lobby state.
// The dot is hollow off the lobby and beats in it. The separator and the state wrap as one, so a
// narrow card never leaves the "·" at a line's end.
function Status({ people, live }: { people: number; live: boolean }) {
  const { colors, shape } = useTheme();
  const size = SPACING[2];
  return (
    <View className="flex-row flex-wrap items-center gap-x-1.5" testID="table-state">
      {live ? (
        <LiveDot tone="success" periodMs={LOBBY_BEAT_MS} size={size} />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: shape.radius.pill,
            borderWidth: shape.stroke.control,
            borderColor: colors.muted,
          }}
        />
      )}
      <Text variant="label" tone="muted">
        {tr.venue.people(people)}
      </Text>
      <View className="shrink flex-row gap-x-1.5" style={{ maxWidth: '100%' }}>
        <Text variant="label" tone="muted" accessible={false}>
          {tr.common.separator}
        </Text>
        <Text variant="label" tone="muted" className="shrink">
          {live ? tr.venue.lobbyOpen : tr.venue.lobbyOff}
        </Text>
      </View>
    </View>
  );
}

// One part of the quiet line: an icon, a fact and maybe a link, wrapping inside itself when the card
// is narrow (the link goes under, a long fact breaks) and never wider than the card.
function QuietPart({ children }: { children: ReactNode }) {
  return (
    <View
      className="shrink flex-row flex-wrap items-center"
      style={{ maxWidth: '100%', columnGap: SPACING[1.5], rowGap: SPACING[1] }}
    >
      {children}
    </View>
  );
}

// A text link on the quiet line: the label in the accent, 44 high to the touch. Busy, the mark
// takes the label's place and a second press does nothing (CLAUDE.md → Ekran davranışı).
function QuietLink({
  label,
  onPress,
  loading = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  testID?: string;
}) {
  const { typography } = useTheme();
  const slop = (TOUCH.min - typography.label.lineHeight) / 2;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading, busy: loading }}
      disabled={loading}
      onPress={onPress}
      hitSlop={{ top: slop, bottom: slop, left: SPACING[2], right: SPACING[2] }}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? OPACITY.pressed : 1 }}>
          <View style={{ opacity: loading ? 0 : 1 }}>
            <Text variant="label" tone="accent">
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
