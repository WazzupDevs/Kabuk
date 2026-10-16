import type { Database } from '@shared/database.ts';
import { groupRoomsBySpot } from '@shared/spots.ts';
import type { Side } from '@shared/teams.ts';
import { useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Rise } from '@/components/motion';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { NARROW_SCREEN } from '@/theme/tokens';

import { SpotHeading } from './SpotHeading';

type RunningRoom = Database['public']['Functions']['venue_running_rooms']['Returns'][number];

type Props = {
  rooms: readonly RunningRoom[];
  mySpotId: string | null;
  venueHasSpots: boolean;
  // While the table's one request waits, like "Katıl" today.
  disabled: boolean;
  onMember: (roomId: string, side: Side, leader: string) => void;
  onSpotHere: (spotId: string) => void;
};

// "Süren odalar" (docs/SPEC_V3.md §22.C; canvas: Faz 2 · 22.5 → Lobi): two-sided rooms with only
// the two leaders' aliases and each side's phones and people; no intent, profile or game. "Bu
// masadayım" beside each side that still has room (a side of 4 phones has none).
export function RunningRooms({
  rooms,
  mySpotId,
  venueHasSpots,
  disabled,
  onMember,
  onSpotHere,
}: Props) {
  // Side by side the name and the button do not fit at 320 dp with the largest text: the button
  // goes under the name.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  if (rooms.length === 0) return null;
  return (
    <View className="mt-6 gap-3" testID="running-rooms">
      <View className="mb-1 gap-0.5">
        <View className="flex-row items-center justify-between">
          <Text variant="heading" accessibilityRole="header">
            {tr.rooms.runningTitle}
          </Text>
          <Text variant="fine">{tr.rooms.roomCount(rooms.length)}</Text>
        </View>
        <Text variant="fine">{tr.rooms.runningHint}</Text>
      </View>
      {groupRoomsBySpot(rooms, mySpotId).map((group) => (
        <View key={group.spotId ?? 'none'} className="gap-3">
          {venueHasSpots ? (
            <SpotHeading spotId={group.spotId} spotName={group.spotName} mine={group.mine} />
          ) : null}
          {group.rooms.map((room, i) => {
            const side = (s: Side) => {
              const alias = s === 'owner' ? room.owner_alias : room.guest_alias;
              const open = group.mine && (s === 'owner' ? room.owner_open : room.guest_open);
              return (
                <SideLine
                  alias={alias}
                  phones={s === 'owner' ? room.owner_phones : room.guest_phones}
                  people={s === 'owner' ? room.owner_headcount : room.guest_headcount}
                  narrow={narrow}
                  testID={`running-member-${s}`}
                  onJoin={open ? () => onMember(room.room_id, s, alias) : undefined}
                  disabled={disabled}
                />
              );
            };
            const spotId = room.spot_id;
            return (
              <Rise key={room.room_id} index={i}>
                <Card className="gap-2.5">
                  {side('owner')}
                  <Versus />
                  {side('guest')}
                  {!group.mine && spotId !== null ? (
                    <Button
                      variant="neutral"
                      icon="location-outline"
                      label={tr.rooms.spotHere}
                      onPress={() => onSpotHere(spotId)}
                      disabled={disabled}
                    />
                  ) : null}
                </Card>
              </Rise>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function SideLine({
  alias,
  phones,
  people,
  narrow,
  testID,
  onJoin,
  disabled,
}: {
  alias: string;
  phones: number;
  people: number;
  narrow: boolean;
  testID: string;
  onJoin?: () => void;
  disabled: boolean;
}) {
  const info = (
    <View className="flex-1 flex-row items-center gap-2.5">
      <Avatar kind="table" alias={alias} size="md" />
      <View className="flex-1 gap-0.5">
        <Text variant="bodyStrong">{alias}</Text>
        <Text variant="fine">{`${tr.rooms.phones(phones)} · ${tr.rooms.people(people)}`}</Text>
      </View>
    </View>
  );
  if (!onJoin) return info;
  const button = (
    <Button
      variant="neutral"
      size="sm"
      testID={testID}
      label={tr.rooms.requestMember}
      onPress={onJoin}
      disabled={disabled}
    />
  );
  return narrow ? (
    <View className="gap-2">
      {info}
      {button}
    </View>
  ) : (
    <View className="flex-row items-center gap-2">
      {info}
      {button}
    </View>
  );
}

// "ile" between the two sides.
function Versus() {
  const { colors } = useTheme();
  const line = <View className="h-px flex-1" style={{ backgroundColor: colors.divider }} />;
  return (
    <View className="flex-row items-center gap-2" accessibilityElementsHidden>
      {line}
      <Text variant="fine">{tr.rooms.versus}</Text>
      {line}
    </View>
  );
}
