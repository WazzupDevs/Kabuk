import { isIntent } from '@shared/rooms.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Loader } from '@/components/Loader';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING, TOUCH } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { LobbyChip } from '@/ui/LobbyRow';
import { MyTableCard, NoTableCard } from '@/ui/VenueCards';

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

  // The quiet line (K-35): the time left, and without a table the spot. Each part wraps inside
  // itself, so nothing leaves the card at 320 dp and the largest text size.
  const quiet = (
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
  );

  if (state === 'none' || !room) {
    return (
      <View testID="table-card">
        <NoTableCard
          testID="no-table"
          title={tr.venue.noTable}
          body={tr.venue.noTableHint}
          action={
            <Button
              look="birincil-48-15"
              block
              testID="table-create-open"
              label={tr.venue.createTable}
              onPress={onCreate}
            />
          }
          footer={quiet}
        />
      </View>
    );
  }

  const live = state === 'open';
  return (
    <View testID="table-card">
      <MyTableCard
        headTestID="go-to-table"
        nameTestID="table-name"
        statusTestID="table-state"
        openLabel={tr.venue.tableHead(
          room.name ?? '',
          room.phones,
          live ? tr.venue.lobbyOpen : tr.venue.lobbyOff,
        )}
        onOpen={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
        icon={<TableIcon icon={room.icon} size="mine" />}
        name={room.name ?? ''}
        status={tr.venue.status(room.phones, live ? tr.venue.lobbyOpen : tr.venue.lobbyOff)}
        inLobby={live}
        extra={
          live && (intent || tag) ? (
            <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
              {intent ? <LobbyChip label={tr.intents[intent]} /> : null}
              {tag ? <LobbyChip label={tr.concepts[tag]} /> : null}
            </View>
          ) : null
        }
        actions={
          owner ? (
            // The owner: into the lobby or out of it, and how a friend joins (v46: .two).
            <>
              <View style={{ flex: 1 }}>
                {state === 'private' ? (
                  <Button
                    look="birincil-48"
                    block
                    testID="lobby-open"
                    label={tr.venue.openLobby}
                    onPress={onOpenLobby}
                  />
                ) : (
                  <Button
                    look="yumusak-beyaz"
                    block
                    testID="withdraw-table"
                    label={tr.venue.withdraw}
                    onPress={() => withdraw.mutate()}
                    loading={withdraw.isPending}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  look="yumusak-beyaz"
                  block
                  testID="invite-open"
                  label={tr.venue.invite}
                  onPress={() => setInvite(true)}
                />
              </View>
            </>
          ) : null
        }
        footer={
          <>
            {quiet}
            {withdraw.error ? (
              <Text variant="fine" tone="danger" className="mt-2">
                {errorMessage(withdraw.error)}
              </Text>
            ) : null}
          </>
        }
      />
      {owner ? (
        <InviteSheet
          visible={invite}
          onClose={() => setInvite(false)}
          roomId={room.id}
          phones={room.phones}
        />
      ) : null}
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
