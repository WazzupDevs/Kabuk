import { MAX_TABLE_PHONES, TABLE_INVITE_TTL_SECONDS } from '@shared/tables.ts';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { Sheet } from '@/components/Sheet';
import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/Text';
import { useFriends } from '@/features/friends/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  phones: number;
};

// "Masana davet et" (v46 data-sheet; docs/SPEC_V4.md §4.G): the owner's friends, each with
// "Davet et". Every invite looks the same once sent ("Davet gönderildi" and its 2 minutes): an
// accepted, declined or expired invite and a friend who is not at the venue are never told apart,
// and who is at the venue is never shown (rule 4).
export function InviteSheet({ visible, onClose, roomId, phones }: Props) {
  const friends = useFriends();
  const now = useNow(1000);
  // When each invite went out, by the friend's public id; this sheet's memory only.
  const [sent, setSent] = useState<Record<string, number>>({});
  const full = phones >= MAX_TABLE_PHONES;

  const invite = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (publicId: string) => roomsApi.invite(roomId, publicId),
    onSuccess: (_data, publicId) => setSent((s) => ({ ...s, [publicId]: Date.now() })),
  });

  const left = (publicId: string): number => {
    const at = sent[publicId];
    return at ? Math.max(0, Math.ceil((at + TABLE_INVITE_TTL_SECONDS * 1000 - now) / 1000)) : 0;
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={tr.invite.title} icon="people-outline">
      <View className="gap-3" testID="invite-sheet">
        <Text tone="muted">{tr.invite.how}</Text>
        {friends.isPending ? (
          <View className="items-center py-4">
            <Loader />
          </View>
        ) : friends.isError ? (
          <EmptyState
            kind="error"
            title={tr.invite.failed}
            body={tr.invite.failedHint}
            action={{ label: tr.common.retry, onPress: () => void friends.refetch() }}
          />
        ) : friends.data.length === 0 ? (
          <EmptyState kind="empty" title={tr.invite.empty} body={tr.invite.emptyHint} />
        ) : (
          <View className="gap-2">
            {friends.data.map((f) => {
              const seconds = left(f.publicId);
              return (
                <View
                  key={f.publicId}
                  className="flex-row items-center gap-3"
                  testID={`invite-row-${f.displayName ?? ''}`}
                >
                  <Avatar
                    kind="profile"
                    name={f.displayName ?? ''}
                    photoUrl={f.photoUrl}
                    size="md"
                  />
                  <View className="flex-1 gap-0.5">
                    <Text variant="bodyStrong">{f.displayName ?? ''}</Text>
                    {seconds > 0 ? (
                      <Text variant="fine">{tr.invite.valid(seconds)}</Text>
                    ) : null}
                  </View>
                  {seconds > 0 ? (
                    <Text variant="label" tone="muted" testID="invite-sent">
                      {tr.invite.sent}
                    </Text>
                  ) : (
                    <Button
                      size="sm"
                      label={tr.invite.send}
                      disabled={full}
                      loading={invite.isPending && invite.variables === f.publicId}
                      onPress={() => invite.mutate(f.publicId)}
                    />
                  )}
                </View>
              );
            })}
            {full ? <Text variant="fine">{tr.invite.full}</Text> : null}
          </View>
        )}
        {invite.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(invite.error)}
          </Text>
        ) : null}
        <Button variant="neutral" label={tr.invite.done} onPress={onClose} />
      </View>
    </Sheet>
  );
}
