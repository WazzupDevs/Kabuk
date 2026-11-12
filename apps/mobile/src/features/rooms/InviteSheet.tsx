import { MAX_TABLE_PHONES, TABLE_INVITE_TTL_SECONDS } from '@shared/tables.ts';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Li, RowList, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { useFriends } from '@/features/friends/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { PopIn, Sheet } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { ICON, SPACING } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  phones: number;
};

// "Masana davet et" (docs/design/iskelet.md → 5.11; docs/SPEC_V4.md §4.G): the close button, two
// lines on how it works, the owner's friends in one grouped list, each with a clear "Davet et". A
// press turns it into "Gönderildi" and the ring beside it fills over the invite's 2 minutes. Every
// invite looks the same once sent: a row's state follows its own press only, so an accepted,
// declined or expired invite and a friend who is not at the venue are never told apart, and who is
// at the venue is never shown (rule 4). Passive while the table is full.
export function InviteSheet({ visible, onClose, roomId, phones }: Props) {
  const { scheme } = useKit();
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
    <Sheet visible={visible} onClose={onClose} title={tr.invite.title}>
      <View style={{ gap: KIT.size.sheetGap }} testID="invite-sheet">
        <View style={{ gap: SPACING[0.5] }}>
          <T v="fine">{tr.invite.how}</T>
          <T v="fine">{tr.invite.howLong}</T>
        </View>
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
          <EmptyState
            kind="empty"
            riso="friends"
            compact
            title={tr.invite.empty}
            body={tr.invite.emptyHint}
          />
        ) : (
          <RowList person>
            {friends.data.map((f) => {
              const seconds = left(f.publicId);
              return (
                <View key={f.publicId} testID={`invite-row-${f.displayName ?? ''}`}>
                  <Li
                    minHeight={KIT.inviteRow.height}
                    padY={KIT.inviteRow.padY}
                    padX={KIT.inviteRow.padLeft}
                  >
                    <Av name={f.displayName ?? ''} photoUrl={f.photoUrl} />
                    <View style={{ flex: 1 }}>
                      <T v="h3">{f.displayName ?? ''}</T>
                    </View>
                    {seconds > 0 ? (
                      <PopIn rise={0}>
                        <View
                          accessible
                          accessibilityLabel={`${tr.invite.sent}, ${tr.invite.valid(seconds)}`}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}
                        >
                          <T v="fine" strong testID="invite-sent">
                            {tr.invite.sent}
                          </T>
                          <Ring share={1 - seconds / TABLE_INVITE_TTL_SECONDS} />
                        </View>
                      </PopIn>
                    ) : (
                      <Btn
                        sm
                        variant="glassy"
                        label={tr.invite.send}
                        disabled={full}
                        loading={invite.isPending && invite.variables === f.publicId}
                        onPress={() => invite.mutate(f.publicId)}
                      />
                    )}
                  </Li>
                </View>
              );
            })}
          </RowList>
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

// The invite's 2 minutes as a ring that fills, a step each second.
const RING = 24;
const RING_LINE = 3;
function Ring({ share }: { share: number }) {
  const { c } = useKit();
  const r = (RING - RING_LINE) / 2;
  const round = 2 * Math.PI * r;
  return (
    <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={RING / 2}
        cy={RING / 2}
        r={r}
        stroke={c.hair}
        strokeWidth={RING_LINE}
        fill="none"
      />
      <Circle
        cx={RING / 2}
        cy={RING / 2}
        r={r}
        stroke={KIT.primary}
        strokeWidth={RING_LINE}
        strokeLinecap="round"
        strokeDasharray={`${round} ${round}`}
        strokeDashoffset={round * (1 - Math.min(1, Math.max(0, share)))}
        fill="none"
      />
    </Svg>
  );
}
