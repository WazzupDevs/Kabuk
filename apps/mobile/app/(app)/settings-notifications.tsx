import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Linking, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, Tag, useKit } from '@/aura/kit';
import { useProfile } from '@/features/account/useProfile';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { patchProfile } from '@/features/account/patchProfile';
import {
  Eyebrow,
  Group,
  Note,
  NOTES,
  SettingsPage,
  SwitchRow,
} from '@/features/settings/SettingsParts';
import { KIT } from '@/theme/auraKit';
import { SETTINGS } from '@/theme/settings';
import { SPACING } from '@/theme/tokens';

type Changes = { notifyDm?: boolean; notifyFriendRequests?: boolean; notifyInvites?: boolean };

// Bildirim ayarları (yeni arayüz tuvali: AyarBildirim, AyarBildirimKapali; docs/SPEC_V4.md §4.G,
// K-53, K-62): whether the phone lets them through (a card with the way to its settings when not;
// the kinds below it dim and wait), then the three kinds as rows on the ground. Read again when the
// app comes back from the phone's settings. The board's "Mesajı bildirimde göster" is its own
// proposal (ÖNERİ) and is not here.
export default function NotificationSettingsScreen() {
  const { c, scheme } = useKit();
  const queryClient = useQueryClient();
  const own = useProfile();
  const permission = useQuery({
    queryKey: ['pushPermission'],
    queryFn: async () => (await Notifications.getPermissionsAsync()).granted,
  });
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void permission.refetch();
    });
    return () => sub.remove();
  }, [permission]);
  const update = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (changes: Changes) => profileApi.update(changes),
    onMutate: (changes) =>
      patchProfile(queryClient, {
        ...(changes.notifyDm !== undefined ? { notify_dm: changes.notifyDm } : {}),
        ...(changes.notifyFriendRequests !== undefined
          ? { notify_friend_requests: changes.notifyFriendRequests }
          : {}),
        ...(changes.notifyInvites !== undefined ? { notify_invites: changes.notifyInvites } : {}),
      }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
  const p = own.data;
  const off = permission.data === false;
  const value = (key: keyof Changes, saved: boolean | undefined) =>
    update.isPending && update.variables[key] !== undefined ? !!update.variables[key] : !!saved;

  const warn = KIT.warnBox[scheme];
  const R = SETTINGS.row;
  return (
    <SettingsPage title={tr.settings.notificationSettings}>
      <View>
        {off ? (
          <View>
            <View
              style={{
                paddingTop: SPACING[3] + SPACING[0.5],
                paddingHorizontal: SPACING[4],
                paddingBottom: SPACING[4],
                borderRadius: SPACING[5],
                backgroundColor: warn.bg,
                gap: SPACING[1],
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2.5] }}>
                <CapIcon name="bell" color={warn.fg} size={R.icon} />
                <View style={{ flex: 1 }}>
                  <T v="h3" ink>
                    {tr.settings.phone.offTitle}
                  </T>
                </View>
              </View>
              <T v="note" color={warn.fg}>
                {tr.settings.phone.offBody}
              </T>
              <View style={{ alignSelf: 'flex-start', marginTop: SPACING[2.5] }}>
                <Btn
                  sm
                  label={tr.settings.phone.offOpen}
                  onPress={() => void Linking.openSettings()}
                />
              </View>
            </View>
            <View style={NOTES}>
              <Note>{tr.settings.phone.offNote}</Note>
            </View>
          </View>
        ) : (
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: R.gap,
                minHeight: R.height,
              }}
            >
              <CapIcon name="bell" color={c.ink} size={R.icon} />
              <View style={{ flex: 1 }}>
                <T v="settingsRow" ink>
                  {tr.settings.phone.title}
                </T>
              </View>
              {permission.data ? <Tag tone="green" label={tr.settings.phone.onTag} /> : null}
            </View>
            <View style={NOTES}>
              <Note>{tr.settings.phone.onNote}</Note>
            </View>
          </View>
        )}
        <View style={{ opacity: off ? OFF : 1 }} pointerEvents={off ? 'none' : 'auto'}>
          <Eyebrow label={tr.settings.friendsSection} />
          <Group hairIn={0}>
            <SwitchRow
              label={tr.settings.notifyFriendRequests}
              hint={tr.settings.requestsNote}
              value={value('notifyFriendRequests', p?.notify_friend_requests)}
              disabled={!p || update.isPending}
              onChange={(v) => update.mutate({ notifyFriendRequests: v })}
              testID="notify-requests"
            />
            <SwitchRow
              label={tr.settings.invitesTitle}
              hint={tr.settings.invitesNote}
              value={value('notifyInvites', p?.notify_invites)}
              disabled={!p || update.isPending}
              onChange={(v) => update.mutate({ notifyInvites: v })}
              testID="notify-invites"
            />
          </Group>
          <Eyebrow label={tr.settings.messagesSection} />
          <SwitchRow
            label={tr.settings.dmTitle}
            hint={tr.settings.dmNote}
            value={value('notifyDm', p?.notify_dm)}
            disabled={!p || update.isPending}
            onChange={(v) => update.mutate({ notifyDm: v })}
            testID="notify-dm"
          />
        </View>
        <View style={{ marginTop: SPACING[4] + SPACING[0.5], gap: SETTINGS.note.gap }}>
          {update.isError ? <Note color={c.warn}>{errorMessage(update.error)}</Note> : null}
          <Note>{tr.settings.notifyFootnote}</Note>
        </View>
      </View>
    </SettingsPage>
  );
}

// The board dims the kinds to .45 while the phone's notifications are off and takes no touch there.
const OFF = 0.45;
