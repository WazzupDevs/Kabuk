import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from 'expo-router';
import * as Updates from 'expo-updates';
import { create } from 'zustand';

import { reportError } from '@/lib/errorReporting';
import { createLaunchGuard } from '@/lib/launchGuard';
import { type LaunchKind, launchKindFrom, launchRecord } from '@/theme/launchMotion';

// The launch: whether the curtain is still over the app (the status bar stays light on it) and
// whether the app has its first screen (the curtain waits for it, hareket.md: "Açılış hareketi
// uygulamayı bekletmez").
export const useLaunchStore = create<{ curtain: boolean; ready: boolean }>(() => ({
  curtain: true,
  ready: false,
}));

export function markLaunchReady(): void {
  if (!useLaunchStore.getState().ready) useLaunchStore.setState({ ready: true });
}

// The system splash goes at the curtain's first frame, or at the latest at the cap; a curtain that
// has not begun by then, or fails, is dropped (src/lib/launchGuard.ts). The cap counts from here,
// as the root layout first loads.
export const launchGuard = createLaunchGuard({
  hideSplash: () => SplashScreen.hideAsync(),
  dropCurtain: () => useLaunchStore.setState({ curtain: false }),
  report: reportError,
});

const STORAGE_KEY = 'skall.launch.v1';
// Once this JS context has launched, a new root (the app reopened while in memory) is a quick launch.
let launchedHere = false;

// The first launch after install; quick when the app was in memory or an update was just applied;
// cold otherwise (launchKindFrom). Unreadable storage counts as a cold launch.
export async function decideLaunchKind(): Promise<LaunchKind> {
  const inMemory = launchedHere;
  launchedHere = true;
  if (inMemory) return 'quick';
  const build = Updates.updateId ?? 'embedded';
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    void AsyncStorage.setItem(STORAGE_KEY, launchRecord(build)).catch(() => undefined);
    return launchKindFrom(stored, build, false);
  } catch {
    return 'cold';
  }
}
