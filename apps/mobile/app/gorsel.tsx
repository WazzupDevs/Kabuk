import { Redirect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';

import { GateState } from '@/features/design/gorsel/GateState';
import { designPickerEnabled } from '@/theme/ThemeProvider';

// The visual gate's route (CLAUDE.md → Görsel kapı): masa:///gorsel?durum=<key>&tema=light|dark
// &sayfa=<0…>&sayfalar=<n>&n=<shot>, opened by the gate's Maestro flows (scripts/visual/flow.ts).
// Outside the signed-in groups: a gate state needs no account. Test builds only. Every shot mounts
// a fresh state (its key), and the screens of the shots before it are dropped from the stack: the
// gate opens one state after another in the running app.
export default function GorselScreen() {
  const navigation = useNavigation();
  useEffect(() => {
    const state = navigation.getState();
    const current = state?.routes[state.index];
    if (state && current && state.routes.length > 1) {
      // React Navigation's CommonActions.reset, which this package does not import directly.
      navigation.dispatch({ type: 'RESET', payload: { ...state, index: 0, routes: [current] } });
    }
  }, [navigation]);
  const p = useLocalSearchParams<{
    durum?: string;
    tema?: string;
    sayfa?: string;
    sayfalar?: string;
    n?: string;
  }>();
  if (!designPickerEnabled) return <Redirect href="/" />;
  return (
    <GateState
      key={p.n ?? '0'}
      shot={p.n ?? '0'}
      stateKey={p.durum ?? ''}
      scheme={p.tema === 'dark' ? 'dark' : 'light'}
      page={Number(p.sayfa ?? 0)}
      pages={Math.max(1, Number(p.sayfalar ?? 1))}
    />
  );
}
