import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { BackHandler } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/theme/ThemeProvider';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

// The web preview's root (scripts/visual/web-shot.ts, `pnpm web:onizleme`): only the visual
// gate's route is meant to open here, drawn from its own sample data. No session, no push, no
// update gate, no error reporting, no launch curtain: nothing reaches the network. Android and
// iOS never load this file (Metro's platform resolution picks `_layout.tsx` there).
// The gate's emulator draws under a 24 dp status bar and no navigation bar (390×844 dp, edge to
// edge): the same insets here, so a screen sits where it sits in the Android shot.
const GATE_INSETS = { top: 24, right: 0, bottom: 0, left: 0 };

// react-native-web's BackHandler logs an error on every listener (the Android back key's sheets and
// menus add one), and the development overlay puts that error in the shot. The browser has no back
// key to listen to: a listener that does nothing.
BackHandler.addEventListener = () => ({ remove: () => undefined });

// A multiline TextInput is a <textarea>, two rows tall by default where Android's field grows from
// one line: the browser sizes it to its text instead (Chromium 123 and later).
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = 'textarea { field-sizing: content; }';
  document.head.appendChild(style);
}

export default function WebPreviewLayout() {
  return (
    <SafeAreaInsetsContext.Provider value={GATE_INSETS}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
            </ThemeProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaInsetsContext.Provider>
  );
}
