import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Quiet } from '@/components/Quiet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { HistoryActions, useHistoryActions } from '@/features/friends/historyActions';
import {
  friendKeys,
  useHistoryFriends,
  useIncomingFriendRequests,
  usePlayHistory,
  useSentFriendRequests,
  useSentVenueChatRequests,
  useVenueChatRequests,
} from '@/features/friends/queries';
import { useRetryAfterName } from '@/features/friends/useRetryAfterName';
import { VenueChatRequests } from '@/features/venueChat/VenueChatRequests';
import { errorMessage } from '@/i18n/errors';
import { historyConcept, tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { NARROW_SCREEN } from '@/theme/tokens';

// Bildirimler (docs/SPEC_V3.md §18.3: the bell on the tab screens): gelen istekler, gönderilen
// istekler and the play history (docs/SPEC_V2.md §6.1, §6.2); the former "Geçmiş ve istekler",
// with no table of its own. Every action on another table goes through the caller's own history
// row; nothing here carries a profile id. The screen says "masa", not "kişi".
export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const incoming = useIncomingFriendRequests();
  const chatIncoming = useVenueChatRequests();
  const sent = useSentFriendRequests();
  const sentChat = useSentVenueChatRequests();
  const history = usePlayHistory();
  // The records whose two accounts are friends now: "Arkadaş oldunuz · Mesajlaş" (§23.G).
  const historyFriends = useHistoryFriends();
  // Side by side the action and "Diğer" do not fit at 320 dp with the largest text.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  const { act, openMenu, sheets } = useHistoryActions();

  const refresh = () => queryClient.invalidateQueries({ queryKey: friendKeys.all });

  type Answer = { requestId: string; accept: boolean };
  const respond = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ requestId, accept }: Answer) => friendsApi.respond(requestId, accept),
    onSuccess: (_data, { accept }) => {
      if (!accept) return;
      track('friend_request_accepted', {});
      track('friendship_created', { source: 'request' });
    },
    onError: (err, answer) => void askNameForAnswer(err, answer),
    onSettled: refresh,
  });
  const runAnswer = useCallback((a: Answer) => respond.mutate(a), [respond]);
  const askNameForAnswer = useRetryAfterName(runAnswer);

  const loaded = [incoming, chatIncoming, sent, sentChat, history].every((q) => q.isSuccess);
  const nothing =
    loaded &&
    [incoming.data, chatIncoming.data, sent.data, sentChat.data, history.data].every(
      (rows) => (rows?.length ?? 0) === 0,
    );
  if (nothing) {
    return (
      <Screen>
        <ScreenHeader title={tr.notifications.title} onBack={() => router.back()} />
        <View className="flex-1 justify-center">
          <EmptyState
            kind="empty"
            title={tr.notifications.empty}
            body={tr.notifications.emptyHint}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={tr.notifications.title} onBack={() => router.back()} />

      <Section title={tr.friends.incomingTitle}>
        {incoming.data?.length === 0 && chatIncoming.data?.length === 0 ? (
          <Text tone="muted">{tr.friends.noIncoming}</Text>
        ) : null}
        <VenueChatRequests requests={chatIncoming.data ?? []} />
        {/* A friend request is a trust moment: hairline card, the rule spelled out, one clear
            action. */}
        <Quiet value>
          {incoming.data?.map((r) => (
            <Card key={r.request_id}>
              <View className="gap-3">
                <Text variant="bodyStrong">
                  {tr.friends.incoming(r.played_at, historyConcept(r.concept), r.other_alias)}
                </Text>
                <Text variant="fine">{tr.friends.people(r.other_headcount)}</Text>
                <View className="flex-row gap-2.5">
                  <View className="flex-1">
                    <Button
                      variant="neutral"
                      label={tr.friends.decline}
                      disabled={respond.isPending}
                      onPress={() => respond.mutate({ requestId: r.request_id, accept: false })}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      variant="positive"
                      label={tr.friends.accept}
                      loading={respond.isPending && respond.variables.requestId === r.request_id}
                      disabled={respond.isPending}
                      onPress={() => respond.mutate({ requestId: r.request_id, accept: true })}
                    />
                  </View>
                </View>
                <Text variant="fine">{tr.friends.declineNote}</Text>
                <Button
                  variant="ghost"
                  label={tr.friends.more}
                  onPress={() => openMenu(r.history_id)}
                />
              </View>
            </Card>
          ))}
        </Quiet>
        {respond.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(respond.error)}
          </Text>
        ) : null}
      </Section>

      {(sent.data && sent.data.length > 0) || (sentChat.data && sentChat.data.length > 0) ? (
        <Section title={tr.friends.sentTitle}>
          {sent.data?.map((r) => (
            <Text key={r.history_id}>
              {r.status === 'accepted'
                ? tr.friends.sentAccepted(r.other_alias)
                : tr.friends.sent(r.other_alias)}
            </Text>
          ))}
          {sentChat.data?.map((r) => (
            <Text key={`${r.created_at}-${r.to_name}`}>
              {r.status === 'accepted'
                ? tr.venueChat.sentAccepted(r.to_name ?? '')
                : tr.venueChat.sent(r.to_name ?? '')}
            </Text>
          ))}
        </Section>
      ) : null}

      <Section title={tr.friends.historyTitle}>
        {history.data?.length === 0 ? (
          <EmptyState icon="time-outline" body={tr.friends.noHistory} />
        ) : null}
        {history.data?.map((h) => (
          <Card key={h.id}>
            <View className="flex-row items-center gap-3">
              <Avatar kind="table" alias={h.other_alias} size="md" />
              <View className="flex-1">
                <Text variant="bodyStrong">
                  {tr.friends.historyRow(h.other_alias, historyConcept(h.concept), h.played_at)}
                </Text>
                <Text variant="fine" className="mt-0.5">
                  {tr.friends.people(h.other_headcount)}
                </Text>
              </View>
            </View>
            <HistoryActions
              record={h}
              friend={historyFriends.data?.get(h.id)}
              act={act}
              narrow={narrow}
              onMore={() => openMenu(h.id)}
            />
          </Card>
        ))}
        {act.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(act.error)}
          </Text>
        ) : null}
      </Section>

      {sheets}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6 gap-3">
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}
