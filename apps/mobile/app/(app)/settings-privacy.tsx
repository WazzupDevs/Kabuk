import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  Note,
  Eyebrow,
  Group,
  NOTES,
  SettingsPage,
  SettingsPageRow,
  SwitchRow,
} from '@/features/settings/SettingsParts';
import type { LegalDocKey } from '@/i18n/legalDocs.generated';
import { tr } from '@/i18n/tr';
import { analyticsEnabled, setAnalyticsEnabled } from '@/lib/analytics';
import { SPACING } from '@/theme/tokens';

function openText(doc: LegalDocKey) {
  router.push({ pathname: '/legal/[doc]', params: { doc } });
}

// Gizlilik (yeni arayüz tuvali, AyarGizlilik): the pages of who the account blocked and muted (no
// counts, karar 3), the capsule characters, what the anonymous name keeps, the usage statistics
// switch (the owner's call, 12 Kasım: on unless turned off), then the texts. The board's "Verilerin"
// (copy of the data) is its own proposal (ÖNERİ) and is not here.
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
    <SettingsPage title={tr.settings.privacyTitle}>
      <View>
        <Group>
          <SettingsPageRow
            testID="privacy-blocked"
            icon="block"
            label={tr.settings.blocked}
            onPress={() => router.push('/settings-blocked')}
          />
          <SettingsPageRow
            icon="mute"
            label={tr.settings.muted}
            onPress={() => router.push('/settings-muted')}
          />
          <SettingsPageRow
            icon="user"
            label={tr.settings.capsules}
            onPress={() => router.push('/profile/capsules')}
          />
        </Group>
        <View style={NOTES}>
          <Note>{tr.settings.nickPrivacy}</Note>
        </View>
        <View style={{ marginTop: SPACING[3] + SPACING[0.5] }}>
          <SwitchRow
            testID="privacy-analytics"
            label={tr.settings.analyticsTitle}
            hint={tr.settings.analyticsNote}
            value={analytics === true}
            loading={analytics === null}
            onChange={(next) => {
              setAnalyticsEnabled(next);
              setAnalytics(next);
            }}
          />
        </View>
        <Eyebrow label={tr.settings.legalSection} />
        <Group>
          <SettingsPageRow
            icon="doc"
            label={tr.settings.privacy}
            onPress={() => openText('privacy')}
          />
          <SettingsPageRow icon="doc" label={tr.settings.kvkk} onPress={() => openText('kvkk')} />
          <SettingsPageRow icon="doc" label={tr.settings.terms} onPress={() => openText('terms')} />
          <SettingsPageRow
            icon="doc"
            label={tr.settings.community}
            onPress={() => openText('community')}
          />
        </Group>
      </View>
    </SettingsPage>
  );
}
