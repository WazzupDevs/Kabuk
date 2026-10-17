import { router } from 'expo-router';
import { type ReactNode, useEffect } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { tr } from '@/i18n/tr';
import { trackOnce } from '@/lib/analytics';
import { useNow } from '@/lib/useNow';

import { RevealMatches } from './RevealMatches';
import { useRevealMatches } from './useRevealMatches';

type Props = {
  roomId: string;
  sessionId: string;
  revealEndsAt: string;
  // "Tanışalım mı?" while the window runs; absent once the room can no longer be read (a member
  // after the room closed), where only the result is left.
  prompt?: ReactNode;
};

// The reveal per phone (docs/SPEC_V3.md §22.F): a match shows at once and only on the two phones of
// the pair; everything else only at reveal_ends_at, where a phone without a match sees "Güzel
// oyundu". It reads reveal/matches, not the room row, so a member whose room closed still sees its
// result.
export function Reveal({ roomId, sessionId, revealEndsAt, prompt }: Props) {
  const now = useNow(1000);
  const over = now >= Date.parse(revealEndsAt);
  const result = useRevealMatches(roomId, sessionId);
  const { refetch } = result;
  // The rest is told at reveal_ends_at: read once more then.
  useEffect(() => {
    if (over) refetch();
  }, [over, refetch]);

  const matched = result.color !== null && result.matches.length > 0;
  const noMatch = !matched && over && (result.unmatched !== null || !prompt) && result.settled;
  // Counted once per room on each phone: whether this phone matched, and how many.
  useEffect(() => {
    if (matched) trackOnce(`reveal:${roomId}`, 'reveal_mutual', { matches: result.matches.length });
    else if (noMatch) trackOnce(`reveal:${roomId}`, 'reveal_none', {});
  }, [matched, noMatch, roomId, result.matches.length]);

  if (matched && result.color) {
    return <RevealMatches roomId={roomId} color={result.color} matches={result.matches} />;
  }
  if (noMatch) {
    return (
      <Screen>
        <View className="flex-1 justify-center gap-6" testID="reveal-good-game">
          <Text variant="display" align="center">
            {tr.reveal.goodGame}
          </Text>
          <Button label={tr.reveal.backToVenue} onPress={() => router.replace('/venue')} />
        </View>
      </Screen>
    );
  }
  return (
    prompt ?? (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    )
  );
}
