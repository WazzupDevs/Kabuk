import { MAX_TABLE_PHONES, TABLE_INVITE_TTL_SECONDS } from '@shared/tables.ts';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Glass, T, useKit } from '@/aura/kit';
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
import { KIT } from '@/theme/auraKit';
import { ICON, SPACING } from '@/theme/tokens';

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
  const { colors, shape, scheme } = useTheme();
  const { c } = useKit();
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

  const warn = KIT.warnBox[scheme];
  return (
    // U23 (MasaDavet; skall tuvali Davet, MasaDavetYukleniyor, MasaDavetHata, MasaDavetBos): the
    // note in body, a full table's warning above the list, the friends on glass sm (64 a row, h3),
    // each "Davet et" passive while the table is full (U10).
    <Sheet
      visible={visible}
      onClose={onClose}
      title={tr.invite.title}
      // "Tamam" at the foot, however many friends (K4, X3).
      footer={<Btn block variant="glassy" label={tr.invite.done} onPress={onClose} />}
    >
      <View style={{ gap: KIT.size.sheetGap }} testID="invite-sheet">
        <T v="body">{tr.invite.how}</T>
        {full ? (
          <View
            testID="invite-full"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: KIT.warnBox.gap,
              paddingHorizontal: KIT.warnBox.padX,
              paddingVertical: KIT.warnBox.padY,
              borderRadius: KIT.warnBox.radius,
              backgroundColor: warn.bg,
            }}
          >
            <CapIcon name="info" size={ICON.md} color={warn.fg} />
            <T v="fine" color={warn.fg} style={{ flex: 1 }}>
              {tr.invite.full}
            </T>
          </View>
        ) : null}
        {friends.isPending ? (
          <View style={{ alignItems: 'center', paddingVertical: SPACING[4] }}>
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
          <Glass sm style={{ overflow: 'hidden' }}>
            {friends.data.map((f, i) => {
              const seconds = left(f.publicId);
              return (
                <View
                  key={f.publicId}
                  testID={`invite-row-${f.displayName ?? ''}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: KIT.size.rowGap,
                    minHeight: KIT.inviteRow.height,
                    paddingVertical: KIT.inviteRow.padY,
                    paddingLeft: KIT.inviteRow.padLeft,
                    paddingRight: KIT.inviteRow.padRight,
                    borderTopWidth: i > 0 ? KIT.size.hair : 0,
                    borderTopColor: c.hair,
                  }}
                >
                  <Av name={f.displayName ?? ''} photoUrl={f.photoUrl} />
                  <View style={{ flex: 1, gap: SPACING[0.5] }}>
                    <T v="h3">{f.displayName ?? ''}</T>
                    {seconds > 0 ? (
                      <T v="fine" testID="invite-sent">
                        {tr.invite.sent}
                      </T>
                    ) : null}
                  </View>
                  {seconds > 0 ? (
                    <View
                      accessibilityLabel={tr.invite.valid(seconds)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: SPACING[2],
                        height: SPACING[9],
                        paddingHorizontal: SPACING[3],
                        borderRadius: shape.radius.pill,
                        backgroundColor: colors.surface2,
                      }}
                    >
                      <View style={{ flexDirection: 'row', gap: SPACING[0.5] }}>
                        {INVITE_DOTS.map((dot) => (
                          <View
                            key={dot}
                            style={{
                              width: SPACING[1.5],
                              height: SPACING[1.5],
                              borderRadius: shape.radius.pill,
                              backgroundColor: dot,
                            }}
                          />
                        ))}
                      </View>
                      <Text variant="label" tabular>
                        {tr.invite.clock(seconds)}
                      </Text>
                    </View>
                  ) : (
                    <Btn
                      sm
                      variant="glassy"
                      icon="plus"
                      label={tr.invite.send}
                      disabled={full}
                      loading={invite.isPending && invite.variables === f.publicId}
                      onPress={() => invite.mutate(f.publicId)}
                    />
                  )}
                </View>
              );
            })}
          </Glass>
        )}
        {invite.isError ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(invite.error)}
          </T>
        ) : null}
      </View>
    </Sheet>
  );
}
