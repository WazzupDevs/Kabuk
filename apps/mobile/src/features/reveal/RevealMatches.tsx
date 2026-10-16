import type { RevealMatch } from '@shared/api/reveal.ts';
import { REVEAL } from '@shared/reveal.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Modal, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Quiet } from '@/components/Quiet';
import { Text } from '@/components/Text';
import { friendKeys } from '@/features/friends/queries';
import { useRetryAfterName } from '@/features/friends/useRetryAfterName';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { withAlpha } from '@/theme/contrast';
import { revealForeground, REVEAL_FOREGROUNDS } from '@/theme/reveal';
import { useTheme } from '@/theme/ThemeProvider';
import { NARROW_SCREEN, SPACING } from '@/theme/tokens';

// The pair's emoji disc beside each row.
const MARK = SPACING[11];

type Props = { roomId: string; color: string; matches: readonly RevealMatch[] };

// A phone's matches (docs/SPEC_V3.md §22.F; canvas: Faz 2 · 22.5 → Eşleşme): the room's colour on
// the whole screen, and under it every phone it matched: the pair's emoji, the name (the profile if
// it joined with it) and that pair's own "Arkadaş ekle". The colour is the server's, not the
// theme's: the pairs in a room find each other by it. The screen is not split; a long list scrolls.
export function RevealMatches({ roomId, color, matches }: Props) {
  const fg = revealForeground(color);
  const lightText = fg === REVEAL_FOREGROUNDS[0];
  const many = matches.length > 1;
  // Back to the venue after a while, as the two-table signal did.
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/venue'), REVEAL.signalSeconds * 1000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <StatusBar style={lightText ? 'light' : 'dark'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: color }}>
        <Quiet value>
          <View
            testID="reveal-matches"
            style={{ flex: 1, paddingHorizontal: SPACING[5], paddingVertical: SPACING[6] }}
            className="gap-3.5"
          >
            <Text variant="label" color={fg} align="center">
              {tr.reveal.signalTop}
            </Text>
            <Text variant="display" color={fg} align="center">
              {many ? tr.reveal.signalMany : tr.reveal.signal}
            </Text>
            <Text variant="bodyStrong" color={fg} align="center">
              {many ? tr.reveal.signalSameMany : tr.reveal.signalSame}
            </Text>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: SPACING[2] }}>
              {matches.map((m) => (
                <MatchRow key={m.sessionId} roomId={roomId} match={m} fg={fg} bg={color} />
              ))}
            </ScrollView>
            <Button
              label={tr.reveal.backToVenue}
              tint={{ background: fg, foreground: color, outline: true }}
              onPress={() => router.replace('/venue')}
            />
            <Text variant="fine" color={fg} align="center">
              {tr.reveal.addFriendBoth}
            </Text>
          </View>
        </Quiet>
      </SafeAreaView>
    </Modal>
  );
}

function MatchRow({
  roomId,
  match,
  fg,
  bg,
}: {
  roomId: string;
  match: RevealMatch;
  fg: string;
  bg: string;
}) {
  const { shape } = useTheme();
  // Side by side the name and the button do not fit at 320 dp with the largest text: the button
  // goes under the name.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  const name = match.profile?.displayName
    ? match.profile.age !== null
      ? tr.profile.nameWithAge(match.profile.displayName, match.profile.age)
      : match.profile.displayName
    : match.alias;
  const picture = match.profile ? (
    <Avatar
      kind="profile"
      name={match.profile.displayName ?? match.alias}
      photoUrl={match.profile.photoUrl}
    />
  ) : (
    <Avatar kind="table" alias={match.alias} />
  );
  const person = (
    <View className="flex-row items-center gap-2.5">
      {picture}
      <Text variant="bodyStrong" color={fg} className="flex-1">
        {name}
      </Text>
    </View>
  );
  return (
    <View
      className="flex-row items-start gap-2.5"
      style={{
        padding: SPACING[2.5],
        borderRadius: shape.radius.lg,
        backgroundColor: withAlpha(fg, 0.12),
      }}
    >
      <View
        accessibilityElementsHidden
        className="items-center justify-center"
        style={{
          width: MARK,
          height: MARK,
          borderRadius: shape.radius.pill,
          backgroundColor: withAlpha(fg, 0.16),
        }}
      >
        <Text variant="title">{match.emoji}</Text>
      </View>
      <View className="flex-1 gap-2">
        {narrow ? person : null}
        <View className={narrow ? 'gap-2' : 'flex-row items-center gap-2.5'}>
          {narrow ? null : <View className="flex-1">{person}</View>}
          <PairFriend roomId={roomId} alias={match.alias} fg={fg} bg={bg} />
        </View>
      </View>
    </View>
  );
}

// "Arkadaş ekle" for one pair (docs/SPEC_V3.md §22.F): on this phone's history row with that
// phone, which opens at once on the match. The answer is always the same; the other phone never
// learns about a single press.
function PairFriend({
  roomId,
  alias,
  fg,
  bg,
}: {
  roomId: string;
  alias: string;
  fg: string;
  bg: string;
}) {
  const queryClient = useQueryClient();
  const row = useQuery({
    queryKey: [...friendKeys.history, 'room', roomId, alias],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('play_history')
        .select('id, friend_action_at')
        .eq('room_id', roomId)
        .eq('other_alias', alias)
        .eq('reveal_mutual', true)
        .order('played_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (historyId: string) => friendsApi.addFromRoom(historyId),
    onSuccess: () => track('friend_add_pressed', {}),
    onError: (err, historyId) => void askName(err, historyId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: friendKeys.all }),
  });
  const run = useCallback((historyId: string) => add.mutate(historyId), [add]);
  const askName = useRetryAfterName(run);

  const history = row.data;
  if (!history) return null;
  if (history.friend_action_at !== null || add.isSuccess) {
    return (
      <Text variant="fine" color={fg} accessibilityLiveRegion="polite">
        {tr.reveal.addFriendDone}
      </Text>
    );
  }
  return (
    <View className="gap-1">
      <Button
        size="sm"
        tint={{ background: fg, foreground: bg, outline: true }}
        label={tr.reveal.addFriend}
        loading={add.isPending}
        onPress={() => add.mutate(history.id)}
      />
      {add.isError ? (
        <Text variant="fine" color={fg}>
          {errorMessage(add.error)}
        </Text>
      ) : null}
    </View>
  );
}
