import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { Seg, useKit } from '@/aura/kit';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { useProfile } from '@/features/account/useProfile';
import { patchProfile } from '@/features/account/patchProfile';
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
import { openDrawLab } from '@/lib/drawLab';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { capsuleSkiaOn } from '@/theme/capsuleSkia';
import { errorReportingOn, sendErrorLog } from '@/lib/errorReporting';
import { SETTINGS } from '@/theme/settings';
import { designPickerEnabled } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

type Participation = 'profile' | 'anonymous';

// Ayarlar (docs/design/iskelet.md → 5.9; yeni arayüz tuvali, Ayarlar.dc.html; theme/settings.ts):
// a full page pushed from Profil, sliding in from the right as every page (the owner's call, 16
// Kasım), its back button and title still on the bar over the content. The pages first
// (Bildirimler, Gizlilik, Hesap: pushed on the same stack), then "Oyunlara katılım" (the identity
// each check-in starts with, §4.D) and its note, Görünüm, "Çıkış yap" in red (its confirmation),
// and in a test build only the test rows at the foot (the board's two; Çizim ölçümü kept beside
// them, a working tool the board does not draw).
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
      {/* The board's one note: what the choice does; under it why a profiled start waits. */}
      <View style={NOTES}>
        <Note>
          {value === 'profile'
            ? tr.settings.participation.subProfiled
            : tr.settings.participation.subAnonymous}
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

// "Test sürümü" (preview builds and development only; production never renders it): the component
// preview, Çizim ölçümü and, where Sentry is set up, "Hata kaydını gönder" (one message through the
// same filter as a crash: the user id only, errorReporting.ts).
function TestRows() {
  const { c } = useKit();
  const log = useMutation({
    meta: FEEL_ERROR,
    mutationFn: async () => {
      if (!(await sendErrorLog())) throw new Error('error log not sent');
    },
  });
  return (
    <View>
      <Eyebrow label={tr.settings.testSection} />
      <Group>
        <SettingsPageRow
          testID="preview-open"
          icon="eye"
          label={tr.design.previewOpen}
          onPress={() => router.push('/design-preview')}
        />
        <SettingsPageRow
          testID="draw-lab-open"
          icon="eye"
          label={tr.design.drawLab.open}
          onPress={() => openDrawLab(true, capsuleSkiaOn(Platform.OS))}
        />
        {errorReportingOn ? (
          <SettingsPageRow
            testID="send-error-log"
            icon="report"
            label={tr.settings.sendLog}
            loading={log.isPending}
            onPress={() => log.mutate()}
          />
        ) : null}
      </Group>
      {log.isSuccess || log.isError ? (
        <View style={NOTES}>
          <Note color={log.isError ? c.warn : undefined}>
            {log.isError ? tr.settings.sendLogFailed : tr.settings.sendLogDone}
          </Note>
        </View>
      ) : null}
    </View>
  );
}
