import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { LegalText } from '@/components/LegalText';
import { CHAT_MUTES_KEY } from '@/features/chat/ChatOptionsMenu';
import { profileViewKeys } from '@/features/profile/queries';

import SettingsScreen from '../../../../app/(app)/settings';
import AccountScreen from '../../../../app/(app)/settings-account';
import BlockedScreen from '../../../../app/(app)/settings-blocked';
import MutedScreen from '../../../../app/(app)/settings-muted';
import NotificationSettingsScreen from '../../../../app/(app)/settings-notifications';
import PrivacyScreen from '../../../../app/(app)/settings-privacy';
import { GATE_NOW } from './deterministic';

// The Ayarlar family for the visual gate (`ekran/ayarlar…`): the routes themselves, drawn whole
// (a change to a route shows in its state), over an own query client filled with the boards'
// sample (docs/design/yeni-arayuz/project: Ayarlar, AyarHesap, Engellenenler, SessizAlinanlarBos,
// YasalMetin); no server, nothing signed in. The gate is signed out: the own profile is read under
// no account (useProfile's key with an undefined id), the reads stay off and answer from here.
const PUBLIC_ID = 'gorsel';
const MINUTE = 60_000;

function GateClient({ seed, children }: { seed: (c: QueryClient) => void; children: ReactNode }) {
  const [client] = useState(() => {
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    seed(c);
    return c;
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// The own profile as the routes read it: the row (useProfile) and profile/get (useProfileView).
function seedOwn(c: QueryClient, birthDate: string | null, notify = false) {
  c.setQueryData(['profile', undefined], {
    public_id: PUBLIC_ID,
    default_participation: 'anonymous',
    ...(notify ? { notify_dm: true, notify_friend_requests: true, notify_invites: true } : {}),
  });
  c.setQueryData(profileViewKeys.view(PUBLIC_ID), {
    publicId: PUBLIC_ID,
    displayName: null,
    bio: null,
    photoUrl: null,
    coverUrl: null,
    badges: [],
    age: null,
    birthDate,
  });
}

// Ayarlar (03i): "Oyunlara katılım" Anonim, no check-in.
export function SettingsFixture() {
  return (
    <GateClient seed={(c) => seedOwn(c, null)}>
      <SettingsScreen />
    </GateClient>
  );
}

// AyarHesap (03n): the board's birth date. The masked phone is the session's (signed out here:
// the row is drawn without it).
export function AccountFixture() {
  return (
    <GateClient seed={(c) => seedOwn(c, '2000-03-05')}>
      <AccountScreen />
    </GateClient>
  );
}

// Engellenenler (03p): the board's three, in its order (newest first).
export function BlockedFixture() {
  return (
    <GateClient
      seed={(c) =>
        c.setQueryData(
          ['blocks'],
          [
            { id: 'b1', blocked_alias: 'Mert', created_at: iso(5 * MINUTE) },
            { id: 'b2', blocked_alias: 'Ece', created_at: iso(3 * 60 * MINUTE) },
            { id: 'b3', blocked_alias: 'terra-sd62', created_at: iso(2 * 24 * 60 * MINUTE) },
          ],
        )
      }
    >
      <BlockedScreen />
    </GateClient>
  );
}

// SessizAlinanlarBos (03s): nobody muted.
export function MutedEmptyFixture() {
  return (
    <GateClient seed={(c) => c.setQueryData(CHAT_MUTES_KEY, { mutes: [] })}>
      <MutedScreen />
    </GateClient>
  );
}

// AyarBildirim (03l): the phone lets them through, the three kinds on.
export function NotificationsFixture() {
  return (
    <GateClient
      seed={(c) => {
        seedOwn(c, null, true);
        c.setQueryData(['pushPermission'], true);
      }}
    >
      <NotificationSettingsScreen />
    </GateClient>
  );
}

// AyarGizlilik (03m): the statistics switch on (the app's default).
export function PrivacyFixture() {
  return (
    <GateClient seed={(c) => seedOwn(c, null)}>
      <PrivacyScreen />
    </GateClient>
  );
}

// YasalMetin (03t): Gizlilik politikası, the board's text (the route, legal/[doc], draws this one).
export function LegalFixture() {
  return <LegalText inApp doc="privacy" />;
}

function iso(ago: number): string {
  return new Date(GATE_NOW - ago).toISOString();
}
