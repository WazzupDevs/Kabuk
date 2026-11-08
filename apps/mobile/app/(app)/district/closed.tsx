import { clockText, nextIstanbulMidnight, secondsUntil } from '@shared/district.ts';
import { upperTr } from '@shared/trText.ts';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Btn } from '@/aura/kit';
import { Countdown, Foot, GecitClosedScene, ScenePage } from '@/features/district/parts';
import { districtKeys, useDistrictState } from '@/features/district/queries';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { SEMT } from '@/theme/semt';

// GecitKapali (docs/SPEC_V4.md §4.V; the owner's calls, 8 Kasım): no right answer (it goes to no
// phone), "Kankin seninle gurur duyuyor." instead; the time to 00:00 Istanbul, sa:dk:sn each second.
export default function DistrictClosedScreen() {
  const queryClient = useQueryClient();
  const state = useDistrictState();
  const now = useNow(1000);
  const opensAt = state.data?.opensAt ?? nextIstanbulMidnight(new Date(now)).toISOString();
  const left = secondsUntil(opensAt, new Date(now));
  // At 00:00 the new day's question: the state again.
  useEffect(() => {
    if (left === 0) void queryClient.invalidateQueries({ queryKey: districtKeys.state });
  }, [left, queryClient]);
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const back = () => router.navigate('/explore');
  return (
    <ScenePage
      close
      onClose={back}
      testID="district-closed"
      centered
      scene={<GecitClosedScene label={tr.district.closed.sceneLabel} />}
      title={tr.district.closed.title}
      body={tr.district.closed.body}
      footer={
        <Foot>
          <Btn
            block
            label={tr.district.backToExplore}
            testID="district-back-explore"
            onPress={back}
          />
        </Foot>
      }
    >
      <View style={{ marginTop: SEMT.scene.countdownTop }}>
        <Countdown
          eyebrow={upperTr(tr.district.closed.until)}
          clock={clockText(left)}
          label={tr.district.closed.timerLabel(h, m, s)}
        />
      </View>
    </ScenePage>
  );
}
