import type { ReactNode } from 'react';

import { PREVIEW_SETS } from '../previews';

import { DmFixture } from './dmFixture';
import { ArchiveFixture, MesajlarFixture } from './mesajlarFixture';
import {
  EditProfileFixture,
  FriendProfileFixture,
  MutualFixture,
  OwnProfileFixture,
  ProfileLoadingFixture,
  SenderProfileFixture,
} from './profilFixture';
import { SemtEmptyFixture } from './semtEmptyFixture';
import { SemtSheetFixture } from './semtFixture';
import {
  AccountFixture,
  BlockedFixture,
  LegalFixture,
  MutedEmptyFixture,
  NotificationsFixture,
  PrivacyFixture,
  SettingsFixture,
} from './settingsFixture';

// `full`: the state draws the whole screen itself (a game's stage), one page, no side padding.
export type GateEntry = { render: () => ReactNode; full?: boolean };

// Every state the visual gate can open (CLAUDE.md → Görsel kapı; e2e/visual/states.json picks
// which ones it photographs). Keys:
// - `galeri/<set>`: a set of Ayarlar → Tasarım (test) → Bileşen önizleme;
// - `oyun/<game>/<phase>`: a phase of a game with a fixed state: the game's own stage component
//   with a fixture (its state as props, no server, no-op actions), e.g. before the turn, while
//   telling, the vote, the result. A new game adds its phases here in its first PR.
// - `ekran/<screen>`: a screen rebuilt from the skall tuvali, with its sample data.
export const GATE_STATES: Record<string, GateEntry> = {
  ...Object.fromEntries(PREVIEW_SETS.map((s) => [`galeri/${s.key}`, { render: s.render }])),
  // The screens rebuilt from the skall tuvali, with its sample data.
  'ekran/dm': { full: true, render: () => <DmFixture /> },
  // DmMesajMenu: the held message carries the viewer's own reaction (its face ringed in the bar).
  'ekran/dm/tepkili': { full: true, render: () => <DmFixture mine /> },
  'ekran/semt/secenekler': { full: true, render: () => <SemtSheetFixture sheet="options" /> },
  'ekran/semt/oturum-kapat': { full: true, render: () => <SemtSheetFixture sheet="end" /> },
  'ekran/semt/bos': { full: true, render: () => <SemtEmptyFixture /> },
  // The Mesajlar family: the routes themselves over the boards' sample (mesajlarFixture.tsx).
  'ekran/mesajlar': { full: true, render: () => <MesajlarFixture /> },
  'ekran/mesajlar/bos': { full: true, render: () => <MesajlarFixture variant="empty" /> },
  'ekran/mesajlar/sabit-dolu': {
    full: true,
    render: () => <MesajlarFixture variant="pinned-full" />,
  },
  'ekran/mesajlar/arsiv-rozet': {
    full: true,
    render: () => <MesajlarFixture variant="archive-unread" />,
  },
  'ekran/arsiv': { full: true, render: () => <ArchiveFixture /> },
  'ekran/arsiv/bos': { full: true, render: () => <ArchiveFixture empty /> },
  // The Ayarlar family: the routes themselves over the boards' sample (settingsFixture.tsx).
  'ekran/ayarlar': { full: true, render: () => <SettingsFixture /> },
  'ekran/ayarlar/hesap': { full: true, render: () => <AccountFixture /> },
  'ekran/ayarlar/engellenenler': { full: true, render: () => <BlockedFixture /> },
  'ekran/ayarlar/sessize-bos': { full: true, render: () => <MutedEmptyFixture /> },
  'ekran/ayarlar/bildirimler': { full: true, render: () => <NotificationsFixture /> },
  'ekran/ayarlar/gizlilik': { full: true, render: () => <PrivacyFixture /> },
  'ekran/ayarlar/yasal': { full: true, render: () => <LegalFixture /> },
  // The Profil family: the screens themselves over the boards' sample (profilFixture.tsx).
  'ekran/profil/baskasi': { full: true, render: () => <FriendProfileFixture /> },
  'ekran/profil/mekan': { full: true, render: () => <SenderProfileFixture /> },
  'ekran/profil/yukleniyor': { full: true, render: () => <ProfileLoadingFixture /> },
  'ekran/profil/ortak': { full: true, render: () => <MutualFixture /> },
  'ekran/profil/ben': { full: true, render: () => <OwnProfileFixture /> },
  'ekran/profil/ben-kaydir': { full: true, render: () => <OwnProfileFixture scrolled /> },
  'ekran/profil/duzenle': { full: true, render: () => <EditProfileFixture /> },
  'ekran/profil/duzenle-yaz': { full: true, render: () => <EditProfileFixture typed /> },
};
