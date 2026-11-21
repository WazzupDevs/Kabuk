import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Av, Btn, T, useKit } from '@/aura/kit';
import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { LookAvatar } from '@/components/LookAvatar';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { useRoomSafety } from '@/features/chat/RoomSafety';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { confirm } from '@/lib/overlayStore';
import { useNarrow } from '@/lib/useNarrow';
import { KIT } from '@/theme/auraKit';
import { ROOM } from '@/theme/room';
import { VENUE } from '@/theme/venue';
import { Tap } from '@/motion';

import { roomKeys, type TablePerson } from './queries';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  // The table's name (its icon's, K-76) and its seats, for the line under the title.
  tableName: string;
  phones: number;
  people: readonly TablePerson[];
  me: string;
  // A profiled person's public id at this table (room_member_profiles); none for an anonymous one.
  profiles: ReadonlyMap<string, string> | undefined;
};

// Masadakiler (yeni arayüz tuvali, Masadakiler, MasaAt; docs/SPEC_V4.md §4.E, K-40): everyone at
// the table two a row, "Sen" for the viewer, "Masa sahibi" under the owner; the owner's "At" beside
// everyone else (K-88: off without a block, after its dialog). A press on a person opens their card
// (MasaKisiSecenekler): the profile (profiled), Şikayet et, the owner's "Masadan çıkar" and Engelle
// (K-13: the owner's block takes the person off the table, a participant's takes the participant
// off). Only what the table already shows its people: the faces and the names (rule 4).
export function PeopleSheet({
  visible,
  onClose,
  roomId,
  tableName,
  phones,
  people,
  me,
  profiles,
}: Props) {
  const { c, scheme } = useKit();
  const narrow = useNarrow();
  const [person, setPerson] = useState<TablePerson | null>(null);
  const safety = useRoomSafety(roomId);
  const publicId = person ? profiles?.get(person.sessionId) : undefined;
  // Whether this phone owns the table: its block takes the person off (K-13).
  const iOwn = people.some((p) => p.owner && p.sessionId === me);
  const close = () => {
    setPerson(null);
    onClose();
  };
  const queryClient = useQueryClient();
  const remove = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (sessionId: string) => roomsApi.remove(roomId, sessionId),
    onSuccess: close,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.people(roomId) });
    },
  });
  // "At" (MasaAt): the centred dialog with the person's face; a failed try stays open.
  const kick = (p: TablePerson) =>
    confirm({
      face: <ListFace person={p} publicId={profiles?.get(p.sessionId)} self={false} size="lg" />,
      title: tr.table.kickTitle(p.alias),
      note: tr.table.kickBody(tableName),
      tone: 'danger',
      confirmLabel: tr.table.kickConfirm,
      confirmIcon: 'personRemove',
      cancelLabel: tr.common.cancel,
      testID: 'person-kick-confirm',
      onConfirm: async () => {
        await remove.mutateAsync(p.sessionId);
      },
    });
  const P = ROOM.people;
  // Two a row; one a row at 320 dp or the largest text, so a name and "At" keep their room.
  const perRow = narrow ? 1 : 2;
  const rows: TablePerson[][] = [];
  people.forEach((p, i) => {
    if (i % perRow === 0) rows.push([p]);
    else rows[rows.length - 1]?.push(p);
  });

  return (
    <>
      <Sheet
        visible={visible && person === null}
        onClose={close}
        title={tr.table.peopleTitle}
        titleType="pageBarTitle"
        subtitle={tr.table.peopleSub(
          tableName,
          tr.table.seats(phones, MAX_TABLE_PHONES),
          phones >= MAX_TABLE_PHONES,
        )}
      >
        <View testID="table-people" style={{ marginTop: P.listTop - KIT.size.rowGap }}>
          {rows.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', columnGap: P.colGap }}>
              {row.map((p) => {
                const mine = p.sessionId === me;
                return (
                  <View key={p.sessionId} style={{ flex: 1, minWidth: 0 }}>
                    {r > 0 ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: P.hairIn,
                          right: 0,
                          height: KIT.size.hair,
                          backgroundColor: KIT.layer[scheme].menuHair,
                        }}
                      />
                    ) : null}
                    <Tap
                      testID={`person-${p.alias}`}
                      accessibilityRole="button"
                      accessibilityLabel={mine ? tr.table.you(p.alias) : p.alias}
                      disabled={mine}
                      onPress={() => setPerson(p)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: P.gap,
                        paddingVertical: P.padY,
                      }}
                    >
                      <ListFace
                        person={p}
                        publicId={profiles?.get(p.sessionId)}
                        self={mine}
                        size="sm"
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <T v="roomPerson" ink lines={1} fit>
                          {mine ? tr.table.youTag : p.alias}
                        </T>
                        {p.owner ? (
                          <T v="roomOwner" color={VENUE[scheme].here.ink} lines={1} fit>
                            {tr.table.ownerTag}
                          </T>
                        ) : null}
                      </View>
                      {iOwn && !mine ? (
                        <Btn
                          sm
                          variant="danger"
                          testID={`person-kick-${p.alias}`}
                          label={tr.table.kick}
                          accessibilityLabel={tr.table.kickLabel(p.alias)}
                          disabled={remove.isPending || safety.blocking}
                          onPress={() => kick(p)}
                        />
                      ) : null}
                    </Tap>
                  </View>
                );
              })}
              {row.length < perRow ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </View>
        <T v="roomNote" color={c.muted} style={{ marginTop: P.noteTop - KIT.size.rowGap }}>
          {tr.table.peopleNote}
        </T>
      </Sheet>

      <Sheet
        visible={visible && person !== null}
        onClose={() => {
          remove.reset();
          setPerson(null);
        }}
      >
        {person ? (
          <View className="flex-row items-center gap-3">
            <PersonFace
              person={person}
              publicId={publicId}
              size="xl"
              self={person.sessionId === me}
            />
            <T v="title" style={{ flex: 1 }}>
              {person.alias}
            </T>
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
          {iOwn ? (
            <MenuItem
              negative
              icon="logout"
              testID="person-remove"
              label={tr.table.remove}
              note={tr.table.removeNote}
              loading={remove.isPending}
              onPress={() => {
                if (person && !safety.blocking) remove.mutate(person.sessionId);
              }}
            />
          ) : null}
          <MenuItem
            negative
            icon="ban-outline"
            testID="person-block"
            label={tr.safety.block}
            note={iOwn ? tr.table.blockOwnerNote : tr.table.blockMemberNote}
            loading={safety.blocking}
            onPress={() => person && !remove.isPending && safety.block(person.sessionId, close)}
          />
        </Menu>
        {(remove.error ?? safety.blockError) ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(remove.error ?? safety.blockError)}
          </T>
        ) : null}
        <Btn block variant="glassy" label={tr.common.cancel} onPress={() => setPerson(null)} />
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

// A face in Masadakiler (32) and over its "At" dialog (64): the profile photo, or the anonymous
// seat's capsule as the app draws it.
function ListFace({
  person,
  publicId,
  self,
  size,
}: {
  person: TablePerson;
  publicId: string | undefined;
  self: boolean;
  size: 'sm' | 'lg';
}) {
  const own = useProfile();
  const id = publicId ?? (self ? own.data?.public_id : undefined);
  const view = useProfileView(person.profiled ? id : undefined);
  if (!person.profiled && person.look)
    return (
      <Av size={size} name={person.alias}>
        <LookAvatar look={person.look} size={KIT.size.av[size]} />
      </Av>
    );
  return <Av size={size} name={person.alias} photoUrl={view.data?.photoUrl ?? null} />;
}
