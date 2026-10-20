import { Redirect, useLocalSearchParams } from 'expo-router';

import { GateState } from '@/features/design/gorsel/GateState';
import { designPickerEnabled } from '@/theme/ThemeProvider';

// The visual gate's route (CLAUDE.md → Görsel kapı): masa:///gorsel?durum=<key>&tema=light|dark
// &sayfa=<0…>&sayfalar=<n>&n=<shot>, opened by the gate's Maestro flows (scripts/visual/flow.ts).
// Outside the signed-in groups: a gate state needs no account. Test builds only. Every shot mounts
// a fresh state (its key).
export default function GorselScreen() {
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
