import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Glass, RowList, Switch, T } from '@/aura/kit';
import { RisoKanki } from '@/aura/RisoKanki';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/features/settings/SettingsRow';
import type { LegalDocKey } from '@/i18n/legalDocs.generated';
import { tr } from '@/i18n/tr';
import { analyticsEnabled, setAnalyticsEnabled } from '@/lib/analytics';
import { Tap } from '@/motion/Tap';
import { KIT } from '@/theme/auraKit';
import { PAGE_KANKI } from '@/theme/kankiMotion';
import { SPACING } from '@/theme/tokens';

const SWITCH_ROW = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: KIT.size.liGap,
  paddingVertical: SPACING[3] + SPACING[0.5],
  paddingHorizontal: SPACING[4],
} as const;

function openText(doc: LegalDocKey) {
  router.push({ pathname: '/legal/[doc]', params: { doc } });
}

// Gizlilik (skall tuvali, Gizlilik; Aura v71): the pages of who the account blocked and muted
// (no counts, karar 3), the capsule characters, what the anonymous name keeps, the usage
// statistics switch (the owner's call, 12 Kasım: on unless turned off), then the texts; a riso
// buddy in the corner.
export default function PrivacyScreen() {
  // Read from the phone; the switch shows once it is known.
  const [analytics, setAnalytics] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    void analyticsEnabled().then((on) => {
      if (live) setAnalytics(on);
    });
    return () => {
      live = false;
    };
  }, []);
  return (
    <Screen
      backdrop={<RisoKanki place={PAGE_KANKI.privacy} scale={1} />}
      top={<PageTop title={tr.settings.privacyTitle} />}
    >
      <View style={{ gap: KIT.size.rowGap }}>
        <RowList inset={KIT.size.lrIcon + KIT.size.liGap}>
          <SettingsRow
            icon="block"
            chevron
            testID="privacy-blocked"
            label={tr.settings.blocked}
            onPress={() => router.push('/settings-blocked')}
          />
          <SettingsRow
            icon="mute"
            chevron
            label={tr.settings.muted}
            onPress={() => router.push('/settings-muted')}
          />
          <SettingsRow
            icon="user"
            chevron
            label={tr.settings.capsules}
            onPress={() => router.push('/profile/capsules')}
          />
        </RowList>
        <T v="fine">{tr.settings.nickPrivacy}</T>
        <Tap
          testID="privacy-analytics"
          feel="selection"
          accessibilityRole="switch"
          accessibilityLabel={tr.settings.analyticsTitle}
          accessibilityState={{ checked: analytics === true }}
          disabled={analytics === null}
          onPress={() => {
            setAnalyticsEnabled(!analytics);
            setAnalytics(!analytics);
          }}
        >
          <Glass sm style={SWITCH_ROW}>
            <View style={{ flex: 1, gap: SPACING[0.5] }}>
              <T v="h3">{tr.settings.analyticsTitle}</T>
              <T v="fine">{tr.settings.analyticsNote}</T>
            </View>
            <Switch on={analytics === true} disabled={analytics === null} />
          </Glass>
        </Tap>
        <RowList inset={KIT.size.lrIcon + KIT.size.liGap}>
          <SettingsRow
            icon="doc"
            chevron
            label={tr.settings.privacy}
            onPress={() => openText('privacy')}
          />
          <SettingsRow
            icon="doc"
            chevron
            label={tr.settings.kvkk}
            onPress={() => openText('kvkk')}
          />
          <SettingsRow
            icon="doc"
            chevron
            label={tr.settings.terms}
            onPress={() => openText('terms')}
          />
          <SettingsRow
            icon="doc"
            chevron
            label={tr.settings.community}
            onPress={() => openText('community')}
          />
        </RowList>
      </View>
    </Screen>
  );
}
