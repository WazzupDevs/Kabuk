import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Linking, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { Toggle } from '@/components/Toggle';
import { useProfile } from '@/features/account/useProfile';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

type Changes = { notifyDm?: boolean; notifyFriendRequests?: boolean; notifyInvites?: boolean };

// Bildirim ayarları (skall tuvali: BildirimAyarlari, BildirimIzinKapali; docs/SPEC_V4.md §4.G, K-53,
// K-62): whether the phone lets them through (with the way to its settings when not), then the
// three kinds. Read again when the app comes back from the phone's settings.
export default function NotificationSettingsScreen() {
  const { colors, shape } = useTheme();
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
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
  const p = own.data;
  const off = permission.data === false;
  const value = (key: keyof Changes, saved: boolean | undefined) =>
    update.isPending && update.variables[key] !== undefined ? !!update.variables[key] : !!saved;

  return (
    <Screen>
      <PageTop title={tr.settings.notificationSettings} />
      <View style={{ gap: SPACING[4] }}>
        {off ? (
          <View
            style={{
              padding: SPACING[4],
              borderRadius: shape.radius.lg,
              backgroundColor: colors.warnSoft,
            }}
          >
            <View className="gap-3">
              <View className="gap-0.5">
                <Text variant="label" tone="onWarnSoft">
                  {tr.settings.phone.title}
                </Text>
                <Text variant="fine" tone="onWarnSoft">
                  {tr.settings.phone.off}
                </Text>
              </View>
              <Button
                size="lg"
                label={tr.settings.phone.open}
                onPress={() => void Linking.openSettings()}
              />
            </View>
          </View>
        ) : (
          <Card>
            <View className="flex-row items-center gap-3">
              <View className="flex-1 gap-0.5">
                <Text variant="heading">{tr.settings.phone.title}</Text>
                <Text variant="fine">{tr.settings.phone.on}</Text>
              </View>
              {permission.data ? <Tag variant="positive" label={tr.settings.phone.onTag} /> : null}
            </View>
          </Card>
        )}
        <Text variant="heading">{tr.settings.friendsSection}</Text>
        <Card>
          <View className="gap-4" style={{ opacity: off ? 0.6 : 1 }}>
            <Toggle
              label={tr.settings.notifyFriendRequests}
              hint={tr.settings.requestsNote}
              value={value('notifyFriendRequests', p?.notify_friend_requests)}
              disabled={!p || update.isPending}
              onChange={(v) => update.mutate({ notifyFriendRequests: v })}
              testID="notify-requests"
            />
            <Toggle
              label={tr.settings.invitesTitle}
              hint={tr.settings.invitesNote}
              value={value('notifyInvites', p?.notify_invites)}
              disabled={!p || update.isPending}
              onChange={(v) => update.mutate({ notifyInvites: v })}
              testID="notify-invites"
            />
          </View>
        </Card>
        <Text variant="heading">{tr.settings.messagesSection}</Text>
        <Card>
          <View style={{ opacity: off ? 0.6 : 1 }}>
            <Toggle
              label={tr.settings.dmTitle}
              hint={tr.settings.dmNote}
              value={value('notifyDm', p?.notify_dm)}
              disabled={!p || update.isPending}
              onChange={(v) => update.mutate({ notifyDm: v })}
              testID="notify-dm"
            />
          </View>
        </Card>
        {update.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(update.error)}
          </Text>
        ) : null}
        <Text variant="fine">{tr.settings.notifyFootnote}</Text>
      </View>
    </Screen>
  );
}
