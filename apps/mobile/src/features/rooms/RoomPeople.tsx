import { TABLE_NAME_REROLLS } from '@shared/tables.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { useRoomSafety } from '@/features/chat/RoomSafety';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { SPACING, TOUCH } from '@/theme/tokens';

import { roomKeys, type TablePerson } from './queries';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  people: readonly TablePerson[];
  me: string;
  // The owner's rename box (v46: .renamebox, owner only).
  owner: { name: string; rerolls: number } | null;
  // A profiled person's public id at this table (room_member_profiles); none for an anonymous one.
  profiles: ReadonlyMap<string, string> | undefined;
};

// Masadakiler (v46 data-msheet; docs/SPEC_V4.md §4.E, K-40): everyone at the table, the owner
// marked, "N kişi"; a person opens the profile (profiled) and Şikayet and Engelle (K-13: the
// owner's block takes the person off the table, a participant's takes the participant off). The
// owner renews the table's name here, 3 times a table.
export function PeopleSheet({ visible, onClose, roomId, people, me, owner, profiles }: Props) {
  const queryClient = useQueryClient();
  const [person, setPerson] = useState<TablePerson | null>(null);
  const safety = useRoomSafety(roomId);
  const rerollsLeft = owner ? TABLE_NAME_REROLLS - owner.rerolls : 0;

  const reroll = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.rerollName(roomId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    },
  });

  const publicId = person ? profiles?.get(person.sessionId) : undefined;
  const close = () => {
    setPerson(null);
    onClose();
  };

  return (
    <>
      <Sheet
        visible={visible && person === null}
        onClose={close}
        title={tr.table.people(people.length)}
      >
        <Text variant="fine">{tr.table.peopleNote}</Text>
        <View className="gap-1" testID="table-people">
          {people.map((p) => {
            const mine = p.sessionId === me;
            return (
              <Pressable
                key={p.sessionId}
                testID={`person-${p.alias}`}
                accessibilityRole="button"
                disabled={mine}
                onPress={() => setPerson(p)}
                className="flex-row items-center gap-3"
                style={{ minHeight: TOUCH.min + SPACING[1] }}
              >
                {p.profiled ? (
                  <Avatar kind="profile" name={p.alias} size="md" />
                ) : (
                  <Avatar kind="default" size="md" />
                )}
                <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
                  <Text variant="heading">{mine ? tr.table.you(p.alias) : p.alias}</Text>
                  {p.owner ? <Tag label={tr.table.ownerTag} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        {owner ? (
          <Card tone="note">
            <View className="gap-1.5" testID="table-rename">
              <Text variant="caption" tone="muted">
                {tr.table.nameLabel}
              </Text>
              <View className="flex-row items-center gap-3">
                <Text variant="heading" className="flex-1">
                  {owner.name}
                </Text>
                {rerollsLeft > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    testID="table-reroll"
                    label={tr.venue.rerollName}
                    loading={reroll.isPending}
                    onPress={() => reroll.mutate()}
                  />
                ) : null}
              </View>
              <Text variant="fine">{tr.venue.rerollsLeft(rerollsLeft)}</Text>
              {reroll.isError ? (
                <Text variant="fine" tone="danger">
                  {errorMessage(reroll.error)}
                </Text>
              ) : null}
            </View>
          </Card>
        ) : null}
        <Button size="lg" variant="neutral" label={tr.common.close} onPress={close} />
      </Sheet>

      <Sheet
        visible={visible && person !== null}
        onClose={() => setPerson(null)}
        title={person?.alias ?? ''}
      >
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
            icon="flag-outline"
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
            loading={safety.blocking}
            onPress={() => person && safety.block(person.sessionId, close)}
          />
        </Menu>
        {safety.blockError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(safety.blockError)}
          </Text>
        ) : null}
      </Sheet>
      {safety.reportForm}
    </>
  );
}
