import { CURRENT_LOCATION_CONSENT_VERSION } from '@shared/consent.ts';
import { HEADCOUNT_OPTIONS } from '@shared/checkin.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { ChoiceChip } from '@/components/ChoiceChip';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { useCheckinDraft } from '@/features/checkin/draft';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { callCheckIn } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { requestKey } from '@/lib/requestKey';

// "Kaç kişisiniz?" 1 / 2 / 3 / 4+ (docs/SPEC_V2.md §6.6). Anonymous or with the profile is chosen
// for each room from v3 on (docs/SPEC_V3.md §5.4), not here.
export default function HeadcountScreen() {
  const queryClient = useQueryClient();
  const { position, venue, spot, clear } = useCheckinDraft();
  const [headcount, setHeadcount] = useState<number | null>(null);
  // One key per headcount on this screen: the same check-in sent again (the app's retry after a 5xx,
  // or a press after an error whose check-in went through) returns the table it opened.
  const [keys] = useState(() => new Map<number, string>());
  const keyFor = (count: number): string => {
    const known = keys.get(count);
    if (known) return known;
    const key = requestKey();
    keys.set(count, key);
    return key;
  };

  const checkIn = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (count: number) => {
      if (!position || !venue) throw new Error('No check-in draft');
      return callCheckIn({
        action: 'check-in',
        venueId: venue.id,
        lat: position.lat,
        lng: position.lng,
        accuracyM: position.accuracyM,
        headcount: count,
        locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
        ...(spot ? { spotId: spot.id } : {}),
        // This app can be a member of a side (docs/SPEC_V3.md §22.B).
        teams: true,
        requestId: keyFor(count),
      });
    },
    onSuccess: async (result, count) => {
      track('check_in', { headcount: count });
      clear();
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.replace({ pathname: '/checkin/done', params: { alias: result.alias } });
    },
  });

  if (!venue) return <Redirect href="/explore" />;
  if (!position) return <Redirect href="/checkin" />;

  return (
    <Screen>
      <ScreenHeader
        eyebrow={spot ? tr.checkin.venueAtSpot(venue.name, spot.name) : venue.name}
        eyebrowIcon="location-outline"
        title={tr.checkin.headcountTitle}
        subtitle={tr.checkin.headcountHint}
        onBack={() => router.back()}
      />
      <View accessibilityRole="radiogroup" className="mt-4 flex-row flex-wrap gap-3">
        {HEADCOUNT_OPTIONS.map((n) => (
          <ChoiceChip
            key={n}
            testID={`headcount-${n}`}
            label={tr.checkin.headcountOption(n)}
            selected={headcount === n}
            onPress={() => setHeadcount(n)}
          />
        ))}
      </View>

      {checkIn.isError ? (
        <Text variant="fine" tone="danger" className="mt-4">
          {errorMessage(checkIn.error)}
        </Text>
      ) : null}
      <View className="mt-auto pt-8">
        <Button
          label={tr.checkin.open}
          onPress={() => headcount !== null && checkIn.mutate(headcount)}
          disabled={headcount === null}
          loading={checkIn.isPending}
        />
      </View>
    </Screen>
  );
}
