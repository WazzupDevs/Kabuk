import { upperTr } from '@shared/trText.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { IconSquare, Li, RowList, Seg, T, useKit } from '@/aura/kit';
import { RouteSheet } from '@/components/RouteSheet';
import { useProfile } from '@/features/account/useProfile';
import { patchProfile } from '@/features/account/patchProfile';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { AppearanceSetting } from '@/features/profile/AppearanceSetting';
import { SignOutSheet } from '@/features/settings/SignOutSheet';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { openDrawLab } from '@/lib/drawLab';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { capsuleSkiaOn } from '@/theme/capsuleSkia';
import { SPACING } from '@/theme/tokens';
import { designPickerEnabled } from '@/theme/ThemeProvider';

type Participation = 'profile' | 'anonymous';

// Ayarlar (docs/design/iskelet.md → 5.9): a sheet over Profil, its title and close button still,
// no "Tamam". The pages first (Bildirimler, Gizlilik, Hesap: white icons on coloured squares), then
// "Oyunlara katılım" (the identity each check-in starts with, §4.D) and its note, Görünüm, "Çıkış
// yap" apart in red (its confirm sheet), and in a test build only the test rows at the foot.
export default function SettingsScreen() {
  return (
    <RouteSheet title={tr.settings.title} testID="settings">
      <Body />
    </RouteSheet>
  );
}

function Body() {
  const { c } = useKit();
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
  const inset = KIT.rowIcon.side + KIT.size.liGap;

  return (
    <View style={{ gap: SPACING[6] }}>
      <RowList inset={inset}>
        <PageRow
          testID="settings-notifications"
          icon="bell"
          tone={KIT.rowIconTone.notifications}
          label={tr.settings.notifications}
          onPress={() => open('/settings-notifications')}
        />
        <PageRow
          testID="settings-privacy"
          icon="shield"
          tone={KIT.rowIconTone.privacy}
          label={tr.settings.privacyTitle}
          onPress={() => open('/settings-privacy')}
        />
        <PageRow
          testID="settings-account"
          icon="user"
          tone={KIT.rowIconTone.account}
          label={tr.settings.accountTitle}
          onPress={() => open('/settings-account')}
        />
      </RowList>
      {/* The section's title an eyebrow in capitals, the seg 8 under it, its notes under the seg. */}
      <View style={{ gap: SPACING[1] }}>
        <T v="eyebrow" accessibilityRole="header">
          {upperTr(tr.settings.participation.title)}
        </T>
        <View style={SEG_AROUND}>
          <Seg<Participation>
            accessibilityLabel={tr.settings.participation.title}
            value={value}
            onChange={(next) => next !== value && participation.mutate(next)}
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
        </View>
        <T v="fine">{tr.settings.participation.sub}</T>
        {value === 'profile' && photo.known && !photo.has ? (
          <T v="fine" color={c.warn}>
            {tr.settings.participation.photoNeeded}
          </T>
        ) : identity ? (
          <T v="fine">
            {identity === 'profiled'
              ? tr.settings.participation.nowProfiled
              : tr.settings.participation.nowAnonymous}
          </T>
        ) : null}
        {participation.isError ? (
          <T v="fine" color={c.warn}>
            {errorMessage(participation.error)}
          </T>
        ) : null}
      </View>
      <AppearanceSetting />
      <RowList inset={inset}>
        <Li
          testID="settings-sign-out"
          onPress={() => setSigningOut(true)}
          accessibilityLabel={tr.settings.signOut}
          padY={KIT.size.lrPadY}
        >
          <IconSquare name="logout" tone={KIT.danger} />
          <View style={{ flex: 1 }}>
            <T v="h3" color={c.warn}>
              {tr.settings.signOut}
            </T>
          </View>
        </Li>
      </RowList>
      {designPickerEnabled ? <TestRows inset={inset} /> : null}
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
  const { c } = useKit();
  return (
    <Li testID={testID} onPress={onPress} accessibilityLabel={label} padY={KIT.size.lrPadY}>
      <IconSquare name={icon} tone={tone} />
      <View style={{ flex: 1 }}>
        <T v="h3">{label}</T>
      </View>
      <CapIcon name="forward" color={c.muted} size={KIT.size.lrChevron} />
    </Li>
  );
}

// "TEST SÜRÜMÜ" (preview builds and development only; production never renders it): the component
// preview and Çizim ölçümü, as Tasarım (test) had them.
function TestRows({ inset }: { inset: number }) {
  return (
    <View style={{ gap: SPACING[2] }}>
      <T v="eyebrow" accessibilityRole="header">
        {upperTr(tr.settings.testSection)}
      </T>
      <RowList inset={inset}>
        <PageRow
          testID="preview-open"
          icon="palette"
          tone={KIT.rowIconTone.test}
          label={tr.design.previewOpen}
          onPress={() => router.push('/design-preview')}
        />
        <PageRow
          testID="draw-lab-open"
          icon="eye"
          tone={KIT.rowIconTone.test}
          label={tr.design.drawLab.open}
          onPress={() => openDrawLab(true, capsuleSkiaOn(Platform.OS))}
        />
      </RowList>
      <T v="fine">{tr.design.drawLab.hint}</T>
    </View>
  );
}

const SEG_AROUND = { marginTop: SPACING[2], marginBottom: SPACING[1] } as const;
