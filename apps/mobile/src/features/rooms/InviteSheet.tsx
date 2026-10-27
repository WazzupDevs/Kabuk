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
import { BRAND } from '@/theme/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// The brand's three colours on a sent invite's clock (skall tuvali, Davet).
const INVITE_DOTS = [BRAND.purple, BRAND.pink, BRAND.orange] as const;

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
  const { colors, shape } = useTheme();
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
    // skall tuvali (Davet, MasaDavetDolu, MasaDavetYukleniyor, MasaDavetHata, MasaDavetBos).
    <Sheet visible={visible} onClose={onClose} title={tr.invite.title}>
      <View className="gap-3" testID="invite-sheet">
        <Text variant="fine">{tr.invite.how}</Text>
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
          <View>
            {friends.data.map((f, i) => {
              const seconds = left(f.publicId);
              return (
                <View
                  key={f.publicId}
                  className="flex-row items-center gap-3"
                  testID={`invite-row-${f.displayName ?? ''}`}
                  style={{
                    minHeight: SPACING[16] - SPACING[1],
                    borderTopWidth: i > 0 ? shape.stroke.hairline : 0,
                    borderTopColor: colors.divider,
                  }}
                >
                  <Avatar
                    kind="profile"
                    name={f.displayName ?? ''}
                    photoUrl={f.photoUrl}
                    size="md"
                  />
                  <View className="flex-1 gap-0.5">
                    <Text variant="heading">{f.displayName ?? ''}</Text>
                    {seconds > 0 ? (
                      <Text variant="fine" testID="invite-sent">
                        {tr.invite.sent}
                      </Text>
                    ) : null}
                  </View>
                  {seconds > 0 ? (
                    <View
                      className="flex-row items-center"
                      accessibilityLabel={tr.invite.valid(seconds)}
                      style={{
                        gap: SPACING[2],
                        height: SPACING[9],
                        paddingHorizontal: SPACING[3],
                        borderRadius: shape.radius.pill,
                        backgroundColor: colors.surface2,
                      }}
                    >
                      <View className="flex-row" style={{ gap: SPACING[0.5] }}>
                        {INVITE_DOTS.map((c) => (
                          <View
                            key={c}
                            style={{
                              width: SPACING[1.5],
                              height: SPACING[1.5],
                              borderRadius: shape.radius.pill,
                              backgroundColor: c,
                            }}
                          />
                        ))}
                      </View>
                      <Text variant="label" tabular>
                        {tr.invite.clock(seconds)}
                      </Text>
                    </View>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="add"
                      iconTone="success"
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
        <Button size="lg" variant="neutral" label={tr.invite.done} onPress={onClose} />
      </View>
    </Sheet>
  );
}
