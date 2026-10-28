import { unregisterPush } from '@/features/push/push';
import { callLeave } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

// "Çıkış yap" (Ayarlar, Hesap). The check-in and its table end first: signed out, the person sat
// on for up to 4 hours and its lobby table took requests nobody answered (audit AUTH-6). Without a
// check-in, or without the network, leaving changes nothing and signing out goes on.
export async function signOutOfApp(): Promise<void> {
  await callLeave().catch(() => undefined);
  await unregisterPush();
  await supabase.auth.signOut();
  queryClient.clear();
}
