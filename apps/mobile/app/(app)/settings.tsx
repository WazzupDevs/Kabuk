import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { IconSquare, Li, Seg, T, useKit } from '@/aura/kit';
import { RouteSheet } from '@/components/RouteSheet';
import { useProfile } from '@/features/account/useProfile';
import { patchProfile } from '@/features/account/patchProfile';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { AppearanceSetting } from '@/features/profile/AppearanceSetting';
import { Eyebrow, Group, Note, NOTES, segBoard } from '@/features/settings/SettingsParts';
import { SignOutSheet } from '@/features/settings/SignOutSheet';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { openDrawLab } from '@/lib/drawLab';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { capsuleSkiaOn } from '@/theme/capsuleSkia';
import { SETTINGS } from '@/theme/settings';
import { designPickerEnabled } from '@/theme/ThemeProvider';

type Participation = 'profile' | 'anonymous';

// Ayarlar (docs/design/iskelet.md → 5.9; tuval Ayarlar, theme/settings.ts): a sheet over Profil, its
// title and close button still, no "Tamam". The pages first (Bildirimler, Gizlilik, Hesap: white
// icons on coloured squares), then "Oyunlara katılım" (the identity each check-in starts with,
// §4.D) and its note, Görünüm, "Çıkış yap" apart in red on its own card (its confirm sheet), and in
// a test build only the test rows at the foot.
export default function SettingsScreen() {
  const { scheme } = useKit();
  const S = SETTINGS.sheet;
  return (
    <RouteSheet
      title={tr.settings.title}
      testID="settings"
      titleType="sheetGame"
      look={{
        ground: SETTINGS[scheme].ground || undefined,
        base: SETTINGS[scheme].base,
        padX: S.padX,
        padBottom: S.padBottom,
        headTop: S.headTop,
        titleIn: S.titleIn,
        closeIn: S.closeIn,
        bodyTop: S.bodyTop,
      }}
    >
      <Body />
    </RouteSheet>
  );
}

function Body() {
  const { c, scheme } = useKit();
  const look = SETTINGS[scheme];
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
  const [signingOut, setSigningOut] = useState(false);
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
        <PageRow
          testID="settings-notifications"
          icon="bell"
          tone={SETTINGS.tone.notifications}
          label={tr.settings.notifications}
          onPress={() => open('/settings-notifications')}
        />
        <PageRow
          testID="settings-privacy"
          icon="shield"
          tone={SETTINGS.tone.privacy}
          label={tr.settings.privacyTitle}
          onPress={() => open('/settings-privacy')}
        />
        <PageRow
          testID="settings-account"
          icon="user"
          tone={SETTINGS.tone.account}
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
        <Group>
          <Li
            testID="settings-sign-out"
            onPress={() => setSigningOut(true)}
            accessibilityLabel={tr.settings.signOut}
            padY={0}
            padX={SETTINGS.row.padX}
            minHeight={SETTINGS.signOut.height}
          >
            <View style={{ flex: 1 }}>
              <T v="settingsDanger" color={look.signOut} center>
                {tr.settings.signOut}
              </T>
            </View>
          </Li>
        </Group>
      </View>
      {designPickerEnabled ? <TestRows /> : null}
      <SignOutSheet visible={signingOut} onClose={() => setSigningOut(false)} />
    </View>
  );
}

// A row that opens a settings page: its square, its label and the chevron.
function PageRow({
  testID,
  icon,
  tone,
  label,
  onPress,
}: {
  testID: string;
  icon: CapIconName;
  tone: string;
  label: string;
  onPress: () => void;
}) {
  const { scheme } = useKit();
  const R = SETTINGS.row;
  return (
    <Li
      testID={testID}
      onPress={onPress}
      accessibilityLabel={label}
      padY={0}
      padX={R.padX}
      gap={R.gap}
      minHeight={R.height}
    >
      <IconSquare name={icon} tone={tone} size={R.icon} />
      <View style={{ flex: 1 }}>
        <T v="settingsRow" ink>
          {label}
        </T>
      </View>
      <CapIcon name="forward" color={SETTINGS[scheme].chevron} size={R.chevron} />
    </Li>
  );
}

// "TEST SÜRÜMÜ" (preview builds and development only; production never renders it): the component
// preview and Çizim ölçümü, as Tasarım (test) had them.
function TestRows() {
  return (
    <View>
      <Eyebrow label={tr.settings.testSection} />
      <Group>
        <PageRow
          testID="preview-open"
          icon="palette"
          tone={SETTINGS.tone.test}
          label={tr.design.previewOpen}
          onPress={() => router.push('/design-preview')}
        />
        <PageRow
          testID="draw-lab-open"
          icon="eye"
          tone={SETTINGS.tone.test}
          label={tr.design.drawLab.open}
          onPress={() => openDrawLab(true, capsuleSkiaOn(Platform.OS))}
        />
      </Group>
      <View style={NOTES}>
        <Note>{tr.design.drawLab.hint}</Note>
      </View>
    </View>
  );
}
