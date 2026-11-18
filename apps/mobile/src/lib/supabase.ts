import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/database.ts';

import { env } from './env';
import { isOffline } from './offline';

// Off the network (the visual gate, lib/offline.ts) every request fails before it leaves the phone.
const send: typeof fetch = (input, init) =>
  isOffline() ? Promise.reject(new Error('offline')) : fetch(input, init);

export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  global: { fetch: send },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
