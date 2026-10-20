import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoopsHeld } from '@/components/Loader';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { setSchemePreference, useSchemePreference, useTheme } from '@/theme/ThemeProvider';
import { type ColorScheme, SPACING } from '@/theme/tokens';
import { WidthScope } from '@/ui/narrow';

import { freezeWorld } from './deterministic';
import { GATE_STATES } from './registry';

// One state of the visual gate (CLAUDE.md → Görsel kapı), drawn the same on every run: the clock
// stopped, Math.random seeded, motion off, the scheme fixed. A state taller than the screen is
// photographed page by page: page `page` of `pages`; when the list has too few or too many pages,
// a banner says how many it takes and the gate's flow fails on it (scripts/visual/flow.ts).
// `gorsel-cerceve` is what the gate crops to (no status or navigation bar); `gorsel-hazir-<shot>`
// covers the frame, transparent, once the fonts, the scheme and the layout have settled (the shot
// number, so no other screen answers for it). A 1 dp marker in the corner was there but Android
// reported it invisible to Maestro (#184's first run). `width`: the state laid out that wide (dp)
// at the frame's left edge, src/ui's narrow look included (states.json → `genislik`). Loops (the
// loaders, Loader.tsx → LoopsHeld) hold their first frame: a busy button's loader is the same
// picture on every run, as v46's at its clock's start.
export function GateState({
  stateKey,
  scheme,
  page,
  pages,
  shot,
  width,
}: {
  stateKey: string;
  scheme: ColorScheme;
  page: number;
  pages: number;
  shot: string;
  width?: number;
}) {
  // Before the first render of the state, not in an effect after it.
  useState(() => freezeWorld());

  const theme = useTheme();
  const preference = useSchemePreference();
  useEffect(() => {
    if (preference !== scheme) setSchemePreference(scheme);
  }, [preference, scheme]);

  const [frame, setFrame] = useState(0);
  const [content, setContent] = useState(0);
  // The layout the gate photographs: `gorsel-hazir` waits 800 ms after it last changed.
  const layout = theme.scheme === scheme && frame > 0 && content > 0 ? `${frame}:${content}` : null;
  const [settled, setSettled] = useState<string | null>(null);
  useEffect(() => {
    if (layout === null) return;
    const timer = setTimeout(() => setSettled(layout), 800);
    return () => clearTimeout(timer);
  }, [layout]);

  const entry = GATE_STATES[stateKey];
  const needed = frame > 0 ? Math.max(1, Math.ceil((content - 1) / frame)) : pages;
  const wrongPages = !entry?.full && frame > 0 && content > 0 && needed !== pages;
  if (entry?.full) {
    return (
      <View style={{ flex: 1 }}>
        <ReducedMotionConfig mode={ReduceMotion.Always} />
        <View
          testID="gorsel-cerceve"
          style={{ flex: 1 }}
          onLayout={(e) => {
            setFrame(Math.round(e.nativeEvent.layout.height));
            setContent(Math.round(e.nativeEvent.layout.height));
          }}
        >
          <LoopsHeld.Provider value>{entry.render()}</LoopsHeld.Provider>
          {settled !== null && settled === layout ? <Ready shot={shot} /> : null}
        </View>
      </View>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.canvas }}>
      <ReducedMotionConfig mode={ReduceMotion.Always} />
      <View
        testID="gorsel-cerceve"
        style={{ flex: 1, overflow: 'hidden' }}
        onLayout={(e) => setFrame(Math.round(e.nativeEvent.layout.height))}
      >
        <View
          style={{
            transform: [{ translateY: -page * frame }],
            paddingHorizontal: entry?.bare ? 0 : theme.shape.screenPadding,
            paddingTop: SPACING[3],
            paddingBottom: SPACING[8],
          }}
          onLayout={(e) => setContent(Math.round(e.nativeEvent.layout.height))}
        >
          {entry ? (
            <LoopsHeld.Provider value>
              {width ? (
                <WidthScope width={width}>
                  <View style={{ width }}>{entry.render()}</View>
                </WidthScope>
              ) : (
                entry.render()
              )}
            </LoopsHeld.Provider>
          ) : (
            <Text testID="gorsel-yok">{tr.design.gate.unknown(stateKey)}</Text>
          )}
        </View>
        {wrongPages ? (
          <View
            testID="gorsel-eksik-sayfa"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: SPACING[3],
              backgroundColor: theme.colors.danger,
            }}
          >
            <Text variant="label" tone="onDanger">
              {tr.design.gate.pageCount(pages, needed)}
            </Text>
          </View>
        ) : null}
        {settled !== null && settled === layout ? <Ready shot={shot} /> : null}
      </View>
    </SafeAreaView>
  );
}

function Ready({ shot }: { shot: string }) {
  return (
    <View
      testID={`gorsel-hazir-${shot}`}
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
    />
  );
}
