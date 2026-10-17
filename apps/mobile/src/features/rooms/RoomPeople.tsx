import type { RoomSeat } from '@shared/teams.ts';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Choice } from '@/components/Choice';
import { ListRow } from '@/components/ListRow';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { ProfiledTag } from './ProfiledTag';
import type { RoomPhone } from './queries';

type Me = RoomSeat & { sessionId: string };

// A phone as the room shows it (rule 4): its alias and table face; a profiled phone's name, age and
// photo while the room runs, read through room_member_profiles (docs/SPEC_V3.md §22.G).
function usePerson(phone: RoomPhone, profiles: ReadonlyMap<string, string> | undefined) {
  const publicId = phone.profiled ? (profiles?.get(phone.sessionId) ?? null) : null;
  const profile = useProfileView(publicId).data;
  const name = profile?.displayName
    ? profile.age !== null
      ? tr.profile.nameWithAge(profile.displayName, profile.age)
      : profile.displayName
    : phone.alias;
  const face = (size?: 'md' | 'lg') =>
    profile ? (
      <Avatar
        kind="profile"
        name={profile.displayName ?? phone.alias}
        photoUrl={profile.photoUrl}
        size={size}
      />
    ) : (
      <Avatar kind="table" alias={phone.alias} size={size} />
    );
  return { publicId, name, picture: face(), face };
}

// Each side's phones, the leader first, then by when they came.
function bySide(phones: readonly RoomPhone[], me: Me) {
  const order = (a: RoomPhone, b: RoomPhone) =>
    a.leader !== b.leader ? (a.leader ? -1 : 1) : a.joinedAt.localeCompare(b.joinedAt);
  return {
    mine: phones.filter((p) => p.side === me.side).sort(order),
    other: phones.filter((p) => p.side !== me.side).sort(order),
  };
}

function SideHeader({ label }: { label: string }) {
  return (
    <Text variant="overline" tone="muted" className="mt-1">
      {label}
    </Text>
  );
}

function PersonRow({
  phone,
  me,
  profiles,
}: {
  phone: RoomPhone;
  me: Me;
  profiles: ReadonlyMap<string, string> | undefined;
}) {
  const { publicId, name, picture } = usePerson(phone, profiles);
  const isMe = phone.sessionId === me.sessionId;
  const tags =
    phone.leader || isMe || phone.profiled ? (
      <View className="flex-row flex-wrap gap-1.5">
        {phone.leader ? <Tag variant="leader" label={tr.rooms.leaderTag} /> : null}
        {isMe ? <Tag label={tr.rooms.youTag} /> : null}
        {phone.profiled && !isMe ? <ProfiledTag /> : null}
      </View>
    ) : undefined;
  return (
    <ListRow
      title={name}
      leading={picture}
      below={tags}
      onPress={
        publicId && !isMe
          ? () => router.push({ pathname: '/people/[publicId]', params: { publicId } })
          : undefined
      }
    />
  );
}

// "Masadakiler" on the merged table (docs/SPEC_V3.md §23.F; canvas: Faz 3 · 23.3): this phone and
// its side, then the other side, each with its face and name (a profiled phone's name and age, an
// anonymous one's alias), side by side; "Tümü" opens the whole list (PeopleSheet).
export function PeopleStrip({
  phones,
  me,
  profiles,
  onAll,
}: {
  phones: readonly RoomPhone[];
  me: Me;
  profiles: ReadonlyMap<string, string> | undefined;
  onAll: () => void;
}) {
  const { colors, shape } = useTheme();
  const { mine, other } = bySide(phones, me);
  // This phone first on its side.
  const own = [
    ...mine.filter((p) => p.sessionId === me.sessionId),
    ...mine.filter((p) => p.sessionId !== me.sessionId),
  ];
  return (
    <View className="gap-1.5" testID="people-strip">
      <View className="flex-row items-center justify-between">
        <Text variant="overline" tone="muted">
          {tr.rooms.peopleStrip(phones.length)}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          testID="people-all"
          label={tr.rooms.peopleAll}
          onPress={onAll}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-start" style={{ gap: SPACING[3] }}>
          {own.map((p) => (
            <StripPerson key={p.sessionId} phone={p} me={me} profiles={profiles} />
          ))}
          {other.length > 0 ? (
            <View
              style={{
                width: shape.stroke.hairline,
                alignSelf: 'stretch',
                backgroundColor: colors.divider,
              }}
            />
          ) : null}
          {other.map((p) => (
            <StripPerson key={p.sessionId} phone={p} me={me} profiles={profiles} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function StripPerson({
  phone,
  me,
  profiles,
}: {
  phone: RoomPhone;
  me: Me;
  profiles: ReadonlyMap<string, string> | undefined;
}) {
  const { name, face } = usePerson(phone, profiles);
  const isMe = phone.sessionId === me.sessionId;
  return (
    <View className="items-center gap-1" style={{ width: SPACING[16] + SPACING[2] }}>
      {face('lg')}
      <Text variant="label" align="center">
        {name}
      </Text>
      {isMe ? (
        <Text variant="fine" align="center">
          {tr.rooms.youTag}
        </Text>
      ) : null}
    </View>
  );
}

// "Odadakiler" (canvas: Faz 2 · 22.5 → Odadakiler): the room's two sides and their phones, from
// the title. A profiled phone's row opens its profile while the room runs.
export function PeopleSheet({
  visible,
  onClose,
  phones,
  me,
  profiles,
}: {
  visible: boolean;
  onClose: () => void;
  phones: readonly RoomPhone[];
  me: Me;
  profiles: ReadonlyMap<string, string> | undefined;
}) {
  const { mine, other } = bySide(phones, me);
  return (
    <Sheet visible={visible} onClose={onClose} title={tr.rooms.peopleTitle} icon="people-outline">
      <View testID="room-people">
        <SideHeader label={tr.rooms.mySide(mine.length)} />
        {mine.map((p) => (
          <PersonRow key={p.sessionId} phone={p} me={me} profiles={profiles} />
        ))}
        {other.length > 0 ? (
          <>
            <View className="h-3" />
            <SideHeader label={tr.rooms.otherSide(other.length)} />
            {other.map((p) => (
              <PersonRow key={p.sessionId} phone={p} me={me} profiles={profiles} />
            ))}
          </>
        ) : null}
      </View>
      <Text variant="fine">{tr.rooms.peopleNote}</Text>
    </Sheet>
  );
}

function PersonChoice({
  phone,
  profiles,
  selected,
  onPress,
}: {
  phone: RoomPhone;
  profiles: ReadonlyMap<string, string> | undefined;
  selected: boolean;
  onPress: () => void;
}) {
  const { name, picture } = usePerson(phone, profiles);
  return (
    <Choice
      testID={`pick-${phone.sessionId}`}
      label={name}
      picture={picture}
      selected={selected}
      onPress={onPress}
    />
  );
}

// "Kimi engelliyorsun?" / "Kimi şikayet ediyorsun?" (canvas: Faz 2 · 22.5 → kişi seçimi): the
// person first, any phone of the room but this one. Blocking says in one sentence who leaves
// (docs/SPEC_V3.md §22.D): a leader's own member, or the one who blocks. There is no separate
// "Çıkar".
export function PickPersonSheet({
  mode,
  visible,
  onClose,
  phones,
  me,
  profiles,
  pending,
  error,
  onPick,
}: {
  mode: 'block' | 'report';
  visible: boolean;
  onClose: () => void;
  phones: readonly RoomPhone[];
  me: Me;
  profiles: ReadonlyMap<string, string> | undefined;
  pending: boolean;
  error: unknown;
  onPick: (sessionId: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const others = phones.filter((p) => p.sessionId !== me.sessionId);
  const { mine, other } = bySide(others, me);
  const target = others.find((p) => p.sessionId === picked) ?? null;
  const close = () => {
    setPicked(null);
    onClose();
  };
  const note =
    mode === 'report'
      ? tr.safety.reportNote
      : target
        ? me.leader && target.side === me.side
          ? tr.safety.blockOwnMember(target.alias)
          : tr.safety.blockLeaves
        : null;
  const list = (people: RoomPhone[]) =>
    people.map((p) => (
      <PersonChoice
        key={p.sessionId}
        phone={p}
        profiles={profiles}
        selected={picked === p.sessionId}
        onPress={() => setPicked(p.sessionId)}
      />
    ));
  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={mode === 'block' ? tr.safety.blockWho : tr.safety.reportWho}
      icon={mode === 'block' ? 'hand-left-outline' : 'flag-outline'}
    >
      <View accessibilityRole="radiogroup" className="gap-2">
        {mine.length > 0 ? <SideHeader label={tr.rooms.mySide(mine.length + 1)} /> : null}
        {list(mine)}
        {other.length > 0 ? <SideHeader label={tr.rooms.otherSide(other.length)} /> : null}
        {list(other)}
      </View>
      {note ? (
        <Card tone="note">
          <Text variant="fine" tone="text">
            {note}
          </Text>
        </Card>
      ) : null}
      {error ? (
        <Text variant="fine" tone="danger">
          {errorMessage(error)}
        </Text>
      ) : null}
      <Button
        variant={mode === 'block' ? 'danger' : 'primary'}
        testID={`pick-${mode}`}
        label={mode === 'block' ? tr.safety.blockConfirm : tr.common.continue}
        onPress={() => {
          if (!picked) return;
          onPick(picked);
          if (mode === 'report') setPicked(null);
        }}
        disabled={!picked}
        loading={pending}
      />
    </Sheet>
  );
}
