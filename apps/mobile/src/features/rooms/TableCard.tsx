import { isIntent } from '@shared/rooms.ts';
import { TABLE_SESSION_HOURS } from '@shared/checkin.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Crew, SceneGround } from '@/aura/Scene';
import { Button } from '@/components/Button';
import { CanvasBar } from '@/components/CanvasIcon';
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
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { GradientFill } from '@/components/GradientFill';
import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING, TABLE_CARD, TOUCH } from '@/theme/tokens';

import { InviteSheet } from './InviteSheet';
import { roomKeys, type TableRoomRow, useTablePeople } from './queries';
import { PersonFace } from './RoomPeople';
import { TableIcon } from './TableIcon';
import { TABLE_ICON_IMAGES } from './tableIconImages';

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
// the spot to change (the server refuses it at a table). Fuller since the owner's call (27 Ekim):
// the table's icon blurred large behind the card, a larger icon, the people's faces, the
// buttons with the family's icons and the time left as a bar.
// The words' part of the empty card: tall enough for the crew's scene (its text is 58 % wide).
const HERO_TEXT_HEIGHT = AURA.heroHeight - 2 * SPACING[4];
// The crew comes in after the card's own arrival.
const HERO_CREW_DELAY = 260;

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

  const backdrop = room?.icon ? TABLE_ICON_IMAGES[room.icon] : undefined;
  return (
    <Card testID="table-card" flush>
      {backdrop && state !== 'none' ? <Backdrop source={backdrop} /> : null}
      {state === 'none' || !room ? (
        <>
          <SceneGround />
          <Crew height={AURA.heroHeight} delay={HERO_CREW_DELAY} />
        </>
      ) : null}
      <View style={{ padding: SPACING[4] }}>
        {state === 'none' || !room ? (
          // The airy look's Mekan card (docs/design/aura → Mekan): the capsule buddies stand at the
          // right of the scene, the words and "Masa kur" at the left.
          <View testID="no-table" style={{ minHeight: HERO_TEXT_HEIGHT }}>
            <View style={{ width: '58%', gap: SPACING[1.5] }}>
              <Text variant="heading">{tr.venue.noTable}</Text>
              <Text variant="fine">{tr.venue.noTableHint}</Text>
              <View style={{ alignSelf: 'flex-start', marginTop: SPACING[1.5] }}>
                <Button
                  tight
                  size="sm"
                  testID="table-create-open"
                  label={tr.venue.createTable}
                  onPress={onCreate}
                />
              </View>
            </View>
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
              className="flex-row items-center"
              style={{ minHeight: TOUCH.min, gap: SPACING[3] + SPACING[0.5] }}
            >
              <TableIcon icon={room.icon} size="mine" />
              <View className="flex-1 gap-1">
                <Text variant="title" testID="table-name">
                  {room.name ?? ''}
                </Text>
                <Status people={room.phones} live={state === 'open'} />
                <PeopleFaces roomId={room.id} phones={room.phones} />
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
                      leading={<CanvasBar name="lobby" tone="onPrimary" size={ICON.md} />}
                      label={tr.venue.openLobby}
                      onPress={onOpenLobby}
                    />
                  ) : (
                    <Button
                      tight
                      variant="secondary"
                      testID="withdraw-table"
                      leading={<CanvasBar name="end" size={ICON.md} />}
                      label={tr.venue.withdraw}
                      onPress={() => withdraw.mutate()}
                      loading={withdraw.isPending}
                    />
                  )}
                </View>
                <View className="flex-1">
                  <Button
                    tight
                    variant="secondary"
                    testID="invite-open"
                    leading={<CanvasBar name="invite" size={ICON.md} />}
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

        <TimeBar minutesLeft={minutesLeft} />

        {withdraw.error ? (
          <Text variant="fine" tone="danger" className="mt-2">
            {errorMessage(withdraw.error)}
          </Text>
        ) : null}
      </View>

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

// The table's icon, blurred large behind the card: its colours as the card's ground, under a veil of
// the card's own so the text reads.
function Backdrop({ source }: { source: (typeof TABLE_ICON_IMAGES)[string] }) {
  const { colors } = useTheme();
  // A square as large as the card's longer side, centred: with `cover` on the card's own box the
  // blurred image stopped short of its right edge on Android (the owner's report, 27 Ekim).
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const side = box ? Math.max(box.width, box.height) : 0;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setBox(e.nativeEvent.layout)}
    >
      {box ? (
        <Image
          source={source}
          blurRadius={TABLE_CARD.backdropBlur}
          fadeDuration={0}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            width: side,
            height: side,
            left: (box.width - side) / 2,
            top: (box.height - side) / 2,
            opacity: TABLE_CARD.backdropOpacity,
          }}
        />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.surface, opacity: TABLE_CARD.veil },
        ]}
      />
    </View>
  );
}

// The people at the table (the owner's call, 27 Ekim), in the order they sat: a profiled person's
// photo, an anonymous one's capsule, overlapping a little, each on a ring of the card's ground. The
// people's faces go to everyone at the table while it runs (rule 4); the list is read again when
// the count changes.
function PeopleFaces({ roomId, phones }: { roomId: string; phones: number }) {
  const { colors, shape } = useTheme();
  const people = useTablePeople(roomId);
  const ids = (people.data ?? []).map((p) => p.sessionId).join(',');
  const profiles = useRoomMemberProfiles(roomId, ids).data;
  const refetch = people.refetch;
  const seen = useRef(phones);
  useEffect(() => {
    if (seen.current === phones) return;
    seen.current = phones;
    void refetch();
  }, [phones, refetch]);
  const sorted = [...(people.data ?? [])].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  if (sorted.length === 0) return null;
  return (
    <View className="flex-row" accessible={false} importantForAccessibility="no-hide-descendants">
      {sorted.map((p, i) => (
        <View
          key={p.sessionId}
          style={{
            marginLeft: i === 0 ? 0 : -TABLE_CARD.faceOverlap,
            borderRadius: shape.radius.pill,
            borderWidth: shape.stroke.control,
            borderColor: colors.surface,
          }}
        >
          <PersonFace person={p} publicId={profiles?.get(p.sessionId)} size="sm" />
        </View>
      ))}
    </View>
  );
}

// The check-in's time left as a bar (the whole is TABLE_SESSION_HOURS), filling from the accent to
// pink.
function TimeBar({ minutesLeft }: { minutesLeft: number }) {
  const { colors, shape } = useTheme();
  const share = Math.max(0, Math.min(1, minutesLeft / (TABLE_SESSION_HOURS * 60)));
  return (
    <View
      accessible={false}
      style={{
        marginTop: SPACING[2],
        height: TABLE_CARD.bar,
        borderRadius: shape.radius.pill,
        backgroundColor: colors.control,
        overflow: 'hidden',
      }}
    >
      {share > 0 ? (
        <View style={{ width: `${share * 100}%`, height: '100%' }}>
          <GradientFill
            css={`linear-gradient(90deg, ${colors.accent}, ${colors.buzz})`}
            radius={shape.radius.pill}
          />
        </View>
      ) : null}
    </View>
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
      <Text variant="fine">{tr.venue.people(people)}</Text>
      <View className="shrink flex-row gap-x-1.5" style={{ maxWidth: '100%' }}>
        <Text variant="fine" accessible={false}>
          {tr.common.separator}
        </Text>
        <Text variant="fine" className="shrink">
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
