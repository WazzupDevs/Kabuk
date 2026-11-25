import { Redirect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';

import { OverlayHost } from '@/components/OverlayHost';
import { GateState } from '@/features/design/gorsel/GateState';
import { dropMenu, MenuHost } from '@/motion/Menu';
import { MenuLayer } from '@/motion/menuLayer';
import { designPickerEnabled } from '@/theme/ThemeProvider';

// The visual gate's route (CLAUDE.md → Görsel kapı): masa:///gorsel?durum=<key>&tema=light|dark
// &sayfa=<0…>&sayfalar=<n>[&genislik=<dp>]&n=<shot>, opened by the gate's Maestro flows
// (scripts/visual/flow.ts).
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
    genislik?: string;
    n?: string;
  }>();
  // A menu the shot before opened (its store outlives the route) is not this shot's.
  useEffect(() => {
    dropMenu();
  }, [p.n]);
  if (!designPickerEnabled) return <Redirect href="/" />;
  return (
    <>
      {/* The menus a screen opens (menuLayer.tsx), as in the signed-in group's layout. */}
      <MenuLayer>
        <GateState
          key={p.n ?? '0'}
          shot={p.n ?? '0'}
          stateKey={p.durum ?? ''}
          scheme={p.tema === 'dark' ? 'dark' : 'light'}
          page={Number(p.sayfa ?? 0)}
          pages={Math.max(1, Number(p.sayfalar ?? 1))}
          width={p.genislik ? Number(p.genislik) : undefined}
        />
        {/* The menus a screen opens with openMenu (motion/Menu.tsx): drawn here, never in it. */}
        <MenuHost />
      </MenuLayer>
      {/* The confirmation dialogs a screen opens (`confirm`, overlayStore.ts): the signed-in
          group's layout draws them, this route is outside it. */}
      <OverlayHost />
    </>
  );
}
