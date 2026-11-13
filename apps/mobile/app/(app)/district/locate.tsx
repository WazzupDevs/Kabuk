import type { DistrictRef, DistrictState } from '@shared/api/district.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, T, useKit } from '@/aura/kit';
import { districtScreen, useEnterDistrict } from '@/features/district/flow';
import { Foot, RISO, ScenePage, Spin, StillScene, WarnRow } from '@/features/district/parts';
import { putDistrictState, useDistrictState } from '@/features/district/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { districtApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { SEMT } from '@/theme/semt';

type Status = 'finding' | 'denied' | 'failed' | 'found' | 'choose';

const DENIED = 'location_denied';

// The dev project's hand pick (state.pickByHand): the districts of content/districts.json.
const HAND_PICK = ['beylikduzu', 'esenyurt', 'avcilar'] as const;

// SemteGitKonum and its states (SemteGitKonumHal; docs/SPEC_V4.md §4.V, rule 6): the first press of
// the card asks for the position here. The coordinate goes to `district/locate` and stays only in
// this screen's memory while a shared border's choice waits (the server checks the choice against
// the same place); it is written nowhere and goes into no analytics or report.
export default function DistrictLocateScreen() {
  const queryClient = useQueryClient();
  const { scheme } = useKit();
  const state = useDistrictState();
  const [status, setStatus] = useState<Status>('finding');
  const [candidates, setCandidates] = useState<DistrictRef[]>([]);
  const here = useRef<{ lat: number; lng: number; mocked: boolean } | null>(null);
  const enter = useEnterDistrict();

  const settle = useCallback(
    (next: DistrictState) => {
      putDistrictState(queryClient, next);
      if (next.located === 'outside') {
        router.replace('/district/outside');
        return;
      }
      if (next.district) {
        track('district_located', {});
        setStatus('found');
      }
    },
    [queryClient],
  );

  const locate = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({
      lat,
      lng,
      choice,
      mocked,
    }: {
      lat: number;
      lng: number;
      choice?: string;
      mocked: boolean;
    }) => districtApi.locate(lat, lng, choice, mocked),
    onSuccess: (answer) => {
      if (answer.candidates && answer.candidates.length > 1) {
        setCandidates(answer.candidates);
        setStatus('choose');
        putDistrictState(queryClient, answer.state);
        return;
      }
      here.current = null;
      settle(answer.state);
    },
    onError: () => setStatus('failed'),
  });
  const pick = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (ref: string) => districtApi.pick(ref),
    onSuccess: settle,
  });

  // The permission (asked here, the first press of the card) and the position.
  const position = useMutation({
    mutationFn: async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error(DENIED);
      const { coords, mocked } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { lat: coords.latitude, lng: coords.longitude, mocked: mocked === true };
    },
    onSuccess: (p) => {
      here.current = p;
      locate.mutate(p);
    },
    onError: (err) =>
      setStatus(err instanceof Error && err.message === DENIED ? 'denied' : 'failed'),
  });
  const find = position.mutate;
  // The screen opens finding.
  useEffect(() => {
    find();
  }, [find]);
  const again = () => {
    setStatus('finding');
    find();
  };
  // Back from the phone's settings with the permission given: the position is asked again.
  useEffect(() => {
    if (status !== 'denied') return undefined;
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      void Location.getForegroundPermissionsAsync().then((p) => {
        if (!p.granted) return;
        setStatus('finding');
        find();
      });
    });
    return () => sub.remove();
  }, [status, find]);
  // Leaving the screen forgets the place.
  useEffect(
    () => () => {
      here.current = null;
    },
    [],
  );

  const s = state.data;
  const busy = status === 'finding' || locate.isPending || pick.isPending;
  const next = () => {
    if (!s) return;
    const to = districtScreen(s);
    if (to === '/district/locate') return;
    if (to) router.replace(to);
    else enter.mutate();
  };

  const footer =
    status === 'denied' ? (
      <Foot>
        <Btn
          block
          label={tr.district.locate.openSettings}
          testID="district-settings"
          onPress={() => void Linking.openSettings()}
        />
      </Foot>
    ) : status === 'failed' ? (
      <Foot>
        <Btn
          block
          label={tr.district.locate.retry}
          testID="district-locate-retry"
          onPress={again}
        />
      </Foot>
    ) : (
      <Foot>
        {enter.isError ? <WarnRow tone="danger" text={errorMessage(enter.error)} /> : null}
        <Btn
          block
          label={tr.district.locate.next}
          testID="district-locate-next"
          disabled={status !== 'found'}
          loading={busy || enter.isPending}
          onPress={next}
        />
      </Foot>
    );

  return (
    <ScenePage
      testID="district-locate"
      scene={
        <StillScene
          source={RISO.map}
          height={SEMT.scene.short}
          label={tr.district.locate.sceneLabel}
        />
      }
      title={tr.district.locate.title}
      body={tr.district.locate.body}
      footer={footer}
    >
      <View style={{ marginTop: SEMT.scene.chipTop, gap: KIT.size.chipsGap }}>
        {status === 'finding' ? (
          <View style={{ flexDirection: 'row' }} accessibilityState={{ busy: true }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: KIT.size.chipGap,
                height: KIT.size.chip,
                paddingHorizontal: KIT.size.chipPadX,
              }}
            >
              <Spin color={KIT[scheme].muted} />
              <T v="fine">{tr.district.locate.finding}</T>
            </View>
          </View>
        ) : status === 'found' && s?.district ? (
          <View style={{ flexDirection: 'row' }}>
            <Chip
              testID="district-found"
              label={tr.district.locate.found(s.district.name)}
              icon="pin"
            />
          </View>
        ) : status === 'choose' ? (
          <>
            <T v="h3">{tr.district.locate.choose}</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipsGap }}>
              {candidates.map((c) => (
                <Chip
                  key={c.ref}
                  testID={`district-choose-${c.ref}`}
                  label={c.name}
                  icon="pin"
                  onPress={() => {
                    if (here.current && !locate.isPending) {
                      locate.mutate({ ...here.current, choice: c.ref });
                    }
                  }}
                />
              ))}
            </View>
          </>
        ) : status === 'denied' ? (
          <WarnRow tone="danger" icon="lock" text={tr.district.locate.denied} />
        ) : status === 'failed' ? (
          <WarnRow text={tr.district.locate.failed} />
        ) : null}
        {s?.pickByHand && status !== 'found' ? (
          <View style={{ gap: SEMT.pickGap }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipGap }}>
              <CapIcon name="info" color={KIT[scheme].muted} size={SEMT.warn.icon} />
              <T v="fine">{tr.district.locate.byHand}</T>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipsGap }}>
              {HAND_PICK.map((ref) => (
                <Chip
                  key={ref}
                  testID={`district-pick-${ref}`}
                  label={tr.district.names[ref]}
                  onPress={() => {
                    if (!pick.isPending) pick.mutate(ref);
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </ScenePage>
  );
}
