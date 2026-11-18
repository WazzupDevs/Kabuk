import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import { Platform, View } from 'react-native';

import { Seg, useKit } from '@/aura/kit';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { useProfile } from '@/features/account/useProfile';
import { patchProfile } from '@/features/account/patchProfile';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { AppearanceSetting } from '@/features/profile/AppearanceSetting';
import {
  Eyebrow,
  Group,
  Note,
  NOTES,
  SettingsPageRow,
  segBoard,
} from '@/features/settings/SettingsParts';
import { useSignOutConfirm } from '@/features/settings/signOutConfirm';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { appBuild } from '@/lib/appBuild';
import { openDrawLab } from '@/lib/drawLab';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { capsuleSkiaOn } from '@/theme/capsuleSkia';
import { SETTINGS } from '@/theme/settings';
import { designPickerEnabled } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

type Participation = 'profile' | 'anonymous';

// Ayarlar (docs/design/iskelet.md → 5.9; yeni arayüz tuvali, Ayarlar.dc.html; theme/settings.ts):
// a full page pushed from Profil, sliding in from the right as every page (the owner's call, 16
// Kasım), its back button and title still on the bar over the content. The pages first
// (Bildirimler, Gizlilik, Hesap: pushed on the same stack), then "Oyunlara katılım" (the identity
// each check-in starts with, §4.D) and its note, Görünüm, "Çıkış yap" in red (its confirmation),
// and in a test build only the test rows at the foot.
export default function SettingsScreen() {
  const P = SETTINGS.page;
  return (
    <View testID="settings" style={{ flex: 1 }}>
      <Screen
        plain
        side={P.side}
        barSide={P.barSide}
        barTop={P.barTop}
        // The rows 4 under the bar's row, the bar's own 4 under it included.
        padTop={P.top - SPACING[1]}
        top={
          <PageTop
            title={tr.settings.title}
            inline={{ row: P.barRow, back: KIT.size.round, gap: P.barGap }}
          />
        }
      >
        <Body />
      </Screen>
    </View>
  );
}

function Body() {
  const { c, scheme } = useKit();
  const queryClient = useQueryClient();
  const own = useProfile();
  const photo = useOwnPhoto();
  const identity = useActiveTable().data?.identity.mode;
  const value: Participation =
    own.data?.default_participation === 'profile' ? 'profile' : 'anonymous';
  const participation = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (next: Participation) => profileApi.update({ defaultParticipation: next }),
    onMutate: (next) => patchProfile(queryClient, { default_participation: next }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
  const signOut = useSignOutConfirm();
  const open = (path: Parameters<typeof router.push>[0]) => router.push(path);
  const now = identity
    ? identity === 'profiled'
      ? tr.settings.participation.nowProfiled
      : tr.settings.participation.nowAnonymous
    : null;
  const photoNeeded = value === 'profile' && photo.known && !photo.has;

  return (
    <View>
      <Group>
        <SettingsPageRow
          testID="settings-notifications"
          icon="bell"
          label={tr.settings.notifications}
          onPress={() => open('/settings-notifications')}
        />
        <SettingsPageRow
          testID="settings-privacy"
          icon="lock"
          label={tr.settings.privacyTitle}
          onPress={() => open('/settings-privacy')}
        />
        <SettingsPageRow
          testID="settings-account"
          icon="user"
          label={tr.settings.accountTitle}
          onPress={() => open('/settings-account')}
        />
      </Group>
      <Eyebrow label={tr.settings.participation.title} />
      <Seg<Participation>
        accessibilityLabel={tr.settings.participation.title}
        value={value}
        onChange={(next) => next !== value && participation.mutate(next)}
        board={segBoard(scheme)}
        options={[
          {
            value: 'profile',
            label: tr.settings.participation.profile,
            testID: 'participation-profile',
          },
          {
            value: 'anonymous',
            label: tr.settings.participation.anonymous,
            testID: 'participation-anonymous',
          },
        ]}
      />
      {/* The board's one note: what the choice does, then (photo aside) this check-in's identity. */}
      <View style={NOTES}>
        <Note>
          {now && !photoNeeded
            ? `${tr.settings.participation.sub} ${now}`
            : tr.settings.participation.sub}
        </Note>
        {photoNeeded ? <Note color={c.warn}>{tr.settings.participation.photoNeeded}</Note> : null}
        {participation.isError ? (
          <Note color={c.warn}>{errorMessage(participation.error)}</Note>
        ) : null}
      </View>
      <AppearanceSetting />
      <View style={{ marginTop: SETTINGS.signOut.top }}>
        <SettingsPageRow
          testID="settings-sign-out"
          icon="logout"
          label={tr.settings.signOut}
          onPress={signOut.ask}
          danger
        />
      </View>
      {designPickerEnabled ? <TestRows /> : null}
    </View>
  );
}

// "TEST SÜRÜMÜ" (preview builds and development only; production never renders it): the component
// preview and Çizim ölçümü, as Tasarım (test) had them.
function TestRows() {
  return (
    <View>
      <Eyebrow label={tr.settings.testSection} />
      <Group>
        <SettingsPageRow
          testID="preview-open"
          icon="palette"
          label={tr.design.previewOpen}
          onPress={() => router.push('/design-preview')}
        />
        <SettingsPageRow
          testID="draw-lab-open"
          icon="eye"
          label={tr.design.drawLab.open}
          onPress={() => openDrawLab(true, capsuleSkiaOn(Platform.OS))}
        />
      </Group>
      <View style={NOTES}>
        <Note>{tr.design.drawLab.hint}</Note>
      </View>
      <BuildIdNote />
    </View>
  );
}

// The test section's version line (docs/decisions/gorsel-dogrulama.md → the release report): the
// running update's id, short, and the native build number; read only.
function BuildIdNote() {
  const id = Updates.updateId?.slice(0, 8) ?? tr.settings.buildIdEmbedded;
  return (
    <View style={NOTES}>
      <Note>{tr.settings.buildId(id, appBuild)}</Note>
    </View>
  );
}
