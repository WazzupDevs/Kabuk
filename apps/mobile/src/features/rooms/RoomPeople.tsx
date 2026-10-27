import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { LookAvatar } from '@/components/LookAvatar';
import { Button } from '@/components/Button';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { useRoomSafety } from '@/features/chat/RoomSafety';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { SPACING, TOUCH } from '@/theme/tokens';

import { type TablePerson } from './queries';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  people: readonly TablePerson[];
  me: string;
  // A profiled person's public id at this table (room_member_profiles); none for an anonymous one.
  profiles: ReadonlyMap<string, string> | undefined;
};

// Masadakiler (skall tuvali: MasaKisiler, MasaKisilerKatilimci; docs/SPEC_V4.md §4.E, K-40):
// everyone at the table in two columns, the owner and the viewer marked; a person opens their
// card (MasaKisiSecenekler): the profile (profiled), Şikayet et and Engelle (K-13: the owner's
// block takes the person off the table, a participant's takes the participant off). The table is
// called by its icon (K-76): no other name to draw.
export function PeopleSheet({ visible, onClose, roomId, people, me, profiles }: Props) {
  const [person, setPerson] = useState<TablePerson | null>(null);
  const safety = useRoomSafety(roomId);
  const publicId = person ? profiles?.get(person.sessionId) : undefined;
  // Whether this phone owns the table: its block takes the person off (K-13).
  const iOwn = people.some((p) => p.owner && p.sessionId === me);
  const close = () => {
    setPerson(null);
    onClose();
  };

  return (
    <>
      <Sheet
        visible={visible && person === null}
        onClose={close}
        title={tr.table.peopleTitle}
        titleNote={tr.venue.people(people.length)}
      >
        <Text variant="fine">{tr.table.peopleNote}</Text>
        <View className="flex-row flex-wrap" style={{ rowGap: SPACING[2] }} testID="table-people">
          {people.map((p) => {
            const mine = p.sessionId === me;
            return (
              <Pressable
                key={p.sessionId}
                testID={`person-${p.alias}`}
                accessibilityRole="button"
                accessibilityLabel={mine ? tr.table.you(p.alias) : p.alias}
                disabled={mine}
                onPress={() => setPerson(p)}
                className="flex-row items-center gap-3"
                style={{
                  width: '50%',
                  minHeight: TOUCH.min + SPACING[1],
                  paddingRight: SPACING[2],
                }}
              >
                <PersonFace person={p} publicId={profiles?.get(p.sessionId)} size="md" />
                <View className="flex-1 gap-1">
                  <Text variant="heading">{p.alias}</Text>
                  {p.owner || mine ? (
                    <View className="flex-row flex-wrap gap-1">
                      {p.owner ? <Tag variant="leader" label={tr.table.ownerTag} /> : null}
                      {mine ? <Tag label={tr.table.youTag} /> : null}
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Button size="lg" variant="neutral" label={tr.common.close} onPress={close} />
      </Sheet>

      <Sheet visible={visible && person !== null} onClose={() => setPerson(null)}>
        {person ? (
          <View className="flex-row items-center gap-3">
            <PersonFace person={person} publicId={publicId} size="xl" />
            <Text variant="title" className="flex-1">
              {person.alias}
            </Text>
          </View>
        ) : null}
        <Menu>
          {publicId ? (
            <MenuItem
              icon="person-outline"
              testID="person-profile"
              label={tr.table.viewProfile}
              onPress={() => {
                close();
                router.push({ pathname: '/people/[publicId]', params: { publicId } });
              }}
            />
          ) : null}
          <MenuItem
            negative
            icon="alert"
            testID="person-report"
            label={tr.safety.report}
            onPress={() => {
              const target = person;
              close();
              if (target) safety.startReport(target.sessionId);
            }}
          />
          <MenuItem
            negative
            icon="ban-outline"
            testID="person-block"
            label={tr.safety.block}
            note={iOwn ? tr.table.blockOwnerNote : tr.table.blockMemberNote}
            loading={safety.blocking}
            onPress={() => person && safety.block(person.sessionId, close)}
          />
        </Menu>
        {safety.blockError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(safety.blockError)}
          </Text>
        ) : null}
        <Button
          size="lg"
          variant="neutral"
          label={tr.common.cancel}
          onPress={() => setPerson(null)}
        />
      </Sheet>
      {safety.reportForm}
    </>
  );
}

// A person's face at the table: the profile photo (read through the profile), or the anonymous
// seat's capsule.
function PersonFace({
  person,
  publicId,
  size,
}: {
  person: TablePerson;
  publicId: string | undefined;
  size: 'md' | 'xl';
}) {
  const view = useProfileView(person.profiled ? publicId : undefined);
  if (!person.profiled && person.look)
    return <LookAvatar look={person.look} size={AVATAR_SIZE[size]} />;
  return person.profiled ? (
    <Avatar kind="profile" name={person.alias} photoUrl={view.data?.photoUrl ?? null} size={size} />
  ) : (
    <Avatar kind="default" size={size} />
  );
}
