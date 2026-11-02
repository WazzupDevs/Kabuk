import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Av, Btn, Glass, T, Tag, useKit } from '@/aura/kit';
import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { LookAvatar } from '@/components/LookAvatar';
import { Button } from '@/components/Button';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { useRoomSafety } from '@/features/chat/RoomSafety';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

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

// Masadakiler (U24, docs/design/aura → Masadakiler; docs/SPEC_V4.md §4.E, K-40): everyone at the
// table one a row, the owner and the viewer marked; a person opens their
// card (MasaKisiSecenekler): the profile (profiled), Şikayet et and Engelle (K-13: the owner's
// block takes the person off the table, a participant's takes the participant off). The table is
// called by its icon (K-76): no other name to draw.
export function PeopleSheet({ visible, onClose, roomId, people, me, profiles }: Props) {
  const { c } = useKit();
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
      {/* U24 (Masadakiler): 84 from the top, the headcount under the title; everyone on glass,
          one a row (56, a 40 face, h3), the owner's and the viewer's tags at the row's right. */}
      <Sheet
        visible={visible && person === null}
        onClose={close}
        top={KIT.peopleSheet.top}
        title={tr.table.peopleTitle}
        subtitle={tr.table.peopleCount(tr.venue.people(people.length))}
        footer={<Btn block variant="glassy" label={tr.common.close} onPress={close} />}
      >
        <Glass sm style={{ overflow: 'hidden' }} testID="table-people">
          {people.map((p, i) => {
            const mine = p.sessionId === me;
            return (
              <Pressable
                key={p.sessionId}
                testID={`person-${p.alias}`}
                accessibilityRole="button"
                accessibilityLabel={mine ? tr.table.you(p.alias) : p.alias}
                disabled={mine}
                onPress={() => setPerson(p)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: KIT.size.rowGap,
                  minHeight: KIT.peopleSheet.height,
                  paddingVertical: KIT.peopleSheet.padY,
                  paddingHorizontal: KIT.peopleSheet.padX,
                  borderTopWidth: i > 0 ? KIT.size.hair : 0,
                  borderTopColor: c.hair,
                }}
              >
                <ListFace person={p} publicId={profiles?.get(p.sessionId)} self={mine} />
                <T v="h3" style={{ flex: 1 }}>
                  {p.alias}
                </T>
                {p.owner ? <Tag tone="purple" label={tr.table.ownerTag} /> : null}
                {mine ? <Tag label={tr.table.youTag} /> : null}
              </Pressable>
            );
          })}
        </Glass>
      </Sheet>

      <Sheet visible={visible && person !== null} onClose={() => setPerson(null)}>
        {person ? (
          <View className="flex-row items-center gap-3">
            <PersonFace
              person={person}
              publicId={publicId}
              size="xl"
              self={person.sessionId === me}
            />
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
export function PersonFace({
  person,
  publicId,
  size,
  self,
}: {
  person: TablePerson;
  publicId: string | undefined;
  size: 'sm' | 'md' | 'xl';
  // The phone's own seat: the table's profile list holds the others only, so its photo comes from
  // the own profile.
  self?: boolean;
}) {
  const own = useProfile();
  const id = publicId ?? (self ? own.data?.public_id : undefined);
  const view = useProfileView(person.profiled ? id : undefined);
  if (!person.profiled && person.look)
    return <LookAvatar look={person.look} size={AVATAR_SIZE[size]} />;
  return person.profiled ? (
    <Avatar kind="profile" name={person.alias} photoUrl={view.data?.photoUrl ?? null} size={size} />
  ) : (
    <Avatar kind="default" size={size} />
  );
}

// A face in Masadakiler (U24): 40, the profile photo, or the anonymous seat's capsule as the app
// draws it.
function ListFace({
  person,
  publicId,
  self,
}: {
  person: TablePerson;
  publicId: string | undefined;
  self: boolean;
}) {
  const own = useProfile();
  const id = publicId ?? (self ? own.data?.public_id : undefined);
  const view = useProfileView(person.profiled ? id : undefined);
  if (!person.profiled && person.look)
    return (
      <Av size="list" name={person.alias}>
        <LookAvatar look={person.look} size={KIT.size.av.list} />
      </Av>
    );
  return <Av size="list" name={person.alias} photoUrl={view.data?.photoUrl ?? null} />;
}
