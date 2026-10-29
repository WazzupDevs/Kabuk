import type { Session } from '@supabase/supabase-js';
import { Image } from 'expo-image';
import { AppState } from 'react-native';
import { create } from 'zustand';

import { clearDmCache } from '@/features/friends/dmCache';
import { resetOnboarding } from '@/features/onboarding/store';
import { identify, resetAnalytics } from '@/lib/analytics';
import { setReportingUser } from '@/lib/errorReporting';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

type SessionState = {
  session: Session | null;
  initialized: boolean;
};

export const useSessionStore = create<SessionState>(() => ({ session: null, initialized: false }));

let started = false;
// The account the app last saw signed in; undefined before the first look.
let lastUser: string | null | undefined;

// Another account, or none: nothing read for the last one stays on the phone (audit AUTH-4: a
// session that dropped by itself kept the friends, the inbox, the table and the blocks in the
// cache for the next account, and the profile photos on disk).
function noteUser(user: string | null): void {
  const previous = lastUser;
  lastUser = user;
  // The conversations kept on the phone (dmCache.ts) go with the account, and with no account.
  if (user === null || (previous && previous !== user)) void clearDmCache();
  if (!previous || previous === user) return;
  queryClient.clear();
  void Image.clearMemoryCache();
  void Image.clearDiskCache();
}

// Call once at app start: loads the stored session and keeps the store in sync.
export function startSessionSync(): void {
  if (started) return;
  started = true;

  supabase.auth.getSession().then(({ data }) => {
    useSessionStore.setState({ session: data.session, initialized: true });
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    noteUser(session?.user.id ?? null);
    useSessionStore.setState({ session, initialized: true });
    if (session) identify(session.user.id);
    else {
      resetAnalytics();
      // Signed out, deleted or the session dropped: the next sign-up on this phone starts clean.
      resetOnboarding();
    }
    setReportingUser(session?.user.id ?? null);
  });

  // Refresh tokens only while the app is in the foreground (Supabase React Native guidance).
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
