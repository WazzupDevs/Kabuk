import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Linking, Pressable, View } from 'react-native';

import { Btn, Glass, Switch, T, Tag, useKit } from '@/aura/kit';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { useProfile } from '@/features/account/useProfile';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { patchProfile } from '@/features/account/patchProfile';

type Changes = { notifyDm?: boolean; notifyFriendRequests?: boolean; notifyInvites?: boolean };

// Bildirim ayarları (skall tuvali: BildirimAyarlari, BildirimIzinKapali; docs/SPEC_V4.md §4.G, K-53,
// K-62): whether the phone lets them through (with the way to its settings when not), then the
// three kinds. Read again when the app comes back from the phone's settings.
export default function NotificationSettingsScreen() {
  const { c } = useKit();
  const { colors } = useTheme();
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

  return (
    <Screen>
      <PageTop title={tr.settings.notificationSettings} />
      <View style={{ gap: KIT.size.rowGap }}>
        {off ? (
          // Aura v71 (BildirimAyarlari `.offc`): the lively card, 16 in.
          <View
            style={{
              padding: SPACING[4],
              borderRadius: KIT.size.glassRadiusSm,
              backgroundColor: colors.lively,
              gap: KIT.size.rowGap,
            }}
          >
            <View style={{ gap: SPACING[0.5] }}>
              <T v="h3" color={colors.onLively}>
                {tr.settings.phone.title}
              </T>
              <T v="fine" color={colors.onLively}>
                {tr.settings.phone.off}
              </T>
            </View>
            <Btn block label={tr.settings.phone.open} onPress={() => void Linking.openSettings()} />
          </View>
        ) : (
          <Glass sm style={[ROW, CARD_PAD]}>
            <View style={{ flex: 1, gap: SPACING[0.5] }}>
              <T v="h3">{tr.settings.phone.title}</T>
              <T v="fine">{tr.settings.phone.on}</T>
            </View>
            {permission.data ? <Tag tone="green" label={tr.settings.phone.onTag} /> : null}
          </Glass>
        )}
        <T v="h3" accessibilityRole="header" style={SECTION}>
          {tr.settings.friendsSection}
        </T>
        <View style={{ gap: KIT.size.rowGap, opacity: off ? OFF : 1 }}>
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
        </View>
        <T v="h3" accessibilityRole="header" style={SECTION}>
          {tr.settings.messagesSection}
        </T>
        <View style={{ opacity: off ? OFF : 1 }}>
          <SwitchRow
            label={tr.settings.dmTitle}
            hint={tr.settings.dmNote}
            value={value('notifyDm', p?.notify_dm)}
            disabled={!p || update.isPending}
            onChange={(v) => update.mutate({ notifyDm: v })}
            testID="notify-dm"
          />
        </View>
        {update.isError ? (
          <T v="fine" color={c.warn}>
            {errorMessage(update.error)}
          </T>
        ) : null}
        <T v="fine">{tr.settings.notifyFootnote}</T>
      </View>
    </Screen>
  );
}

// Aura v71: the rows fade to .45 while the phone's notifications are off; the cards 14 / 16 in,
// the section headings 8 further down.
const OFF = 0.45;
const ROW = { flexDirection: 'row', alignItems: 'center', gap: KIT.size.liGap } as const;
const CARD_PAD = { paddingVertical: SPACING[3] + SPACING[0.5], paddingHorizontal: SPACING[4] };
const SECTION = { marginTop: SPACING[2] };

// Masa kur's switch row: the whole glass card is the switch.
function SwitchRow({
  label,
  hint,
  value,
  disabled,
  onChange,
  testID,
}: {
  label: string;
  hint: string;
  value: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => {
        haptic('selection');
        onChange(!value);
      }}
    >
      <Glass sm style={[ROW, CARD_PAD]}>
        <View style={{ flex: 1, gap: SPACING[0.5] }}>
          <T v="h3">{label}</T>
          <T v="fine">{hint}</T>
        </View>
        <Switch on={value} disabled={disabled} />
      </Glass>
    </Pressable>
  );
}
