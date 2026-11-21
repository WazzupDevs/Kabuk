import { MAX_TABLE_PHONES, TABLE_INVITE_TTL_SECONDS } from '@shared/tables.ts';
import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';
import { create } from 'zustand';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Li, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { SettingsPage } from '@/features/settings/SettingsParts';
import { useFriends } from '@/features/friends/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNowUntil } from '@/lib/useNow';
import { PopIn } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { ROOM } from '@/theme/room';
import { ICON } from '@/theme/tokens';
import { VENUE } from '@/theme/venue';

import { useRoom } from './queries';

// When each invite went out, by the table and the friend's public id: this phone's memory only,
// kept while the app runs so the page shows its own presses again when it opens.
const useInvitesSent = create<{ at: Record<string, number> }>(() => ({ at: {} }));
const sentKey = (roomId: string, publicId: string) => `${roomId}:${publicId}`;

// "Masana davet et" (yeni arayüz tuvali, MasaDavet; docs/SPEC_V4.md §4.G): a page with its back
// button, the table and its seats under the title, how it works, then the owner's friends one a
// row, each with "Davet et". A press turns it into "Gönderildi" for the invite's 2 minutes. Every
// invite looks the same once sent: a row's state follows its own press only, so an accepted,
// declined or expired invite and a friend who is not at the venue are never told apart, and who is
// at the venue is never shown (rule 4). Passive while the table is full.
export function InvitePage({ roomId }: { roomId: string }) {
  const { scheme, c } = useKit();
  const look = VENUE[scheme];
  const I = ROOM.invite;
  const room = useRoom(roomId);
  const friends = useFriends();
  const sent = useInvitesSent((s) => s.at);
  const phones = room.data?.phones ?? 0;
  const full = phones >= MAX_TABLE_PHONES;
  // The last invite's end: the clock runs only while a sent row waits to turn back.
  const lastAt = Math.max(
    0,
    ...Object.entries(sent).flatMap(([key, at]) => (key.startsWith(`${roomId}:`) ? [at] : [])),
  );
  const runsUntil =
    lastAt > 0 ? new Date(lastAt + TABLE_INVITE_TTL_SECONDS * 1000).toISOString() : null;
  const now = useNowUntil(runsUntil, 1000);

  const invite = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (publicId: string) => roomsApi.invite(roomId, publicId),
    onSuccess: (_data, publicId) => {
      const at = Date.now();
      useInvitesSent.setState((s) => ({ at: { ...s.at, [sentKey(roomId, publicId)]: at } }));
    },
  });

  const left = (publicId: string): number => {
    const at = sent[sentKey(roomId, publicId)];
    return at ? Math.max(0, Math.ceil((at + TABLE_INVITE_TTL_SECONDS * 1000 - now) / 1000)) : 0;
  };

  const warn = KIT.warnBox[scheme];
  return (
    <SettingsPage
      list
      title={tr.invite.title}
      sub={
        room.data
          ? tr.invite.sub(room.data.name ?? '', tr.table.seats(phones, MAX_TABLE_PHONES))
          : undefined
      }
    >
      <View testID="invite-sheet">
        <T v="fine" style={{ marginTop: I.noteTop }}>
          {tr.invite.how}
        </T>
        <View style={{ marginTop: I.listTop, gap: KIT.size.sheetGap }}>
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
            <EmptyState kind="loading" body={tr.common.loading} />
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
            <View>
              {friends.data.map((f, i) => {
                const seconds = left(f.publicId);
                return (
                  <View key={f.publicId} testID={`invite-row-${f.displayName ?? ''}`}>
                    {i > 0 ? (
                      <View
                        style={{
                          height: KIT.size.hair,
                          marginLeft: I.hairIn,
                          marginRight: I.hairOut,
                          backgroundColor: KIT.layer[scheme].menuHair,
                        }}
                      />
                    ) : null}
                    <Li padY={I.padY} padX={0} gap={I.gap} minHeight={I.min}>
                      <Av size="md" name={f.displayName ?? ''} photoUrl={f.photoUrl} />
                      <View style={{ flex: 1 }}>
                        <T v="settingsRow" ink>
                          {f.displayName ?? ''}
                        </T>
                      </View>
                      {seconds > 0 ? (
                        <PopIn rise={0}>
                          <View
                            accessible
                            accessibilityLabel={`${tr.invite.sent}, ${tr.invite.valid(seconds)}`}
                            style={{
                              minWidth: I.action,
                              height: KIT.size.btnSm,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: I.checkGap,
                            }}
                          >
                            <CapIcon name="check" size={I.check} color={look.dot.open} soft={1} />
                            <T v="btnSm" color={c.muted} testID="invite-sent">
                              {tr.invite.sent}
                            </T>
                          </View>
                        </PopIn>
                      ) : (
                        <Btn
                          sm
                          label={tr.invite.send}
                          disabled={full}
                          style={{ minWidth: I.action }}
                          loading={invite.isPending && invite.variables === f.publicId}
                          onPress={() => invite.mutate(f.publicId)}
                        />
                      )}
                    </Li>
                  </View>
                );
              })}
            </View>
          )}
          {invite.isError ? (
            <T v="fine" color={KIT.danger}>
              {errorMessage(invite.error)}
            </T>
          ) : null}
        </View>
      </View>
    </SettingsPage>
  );
}
