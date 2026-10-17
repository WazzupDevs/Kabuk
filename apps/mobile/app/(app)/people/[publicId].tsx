import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { ReportModal } from '@/features/chat/ReportModal';
import { BackPill } from '@/features/profile/BackPill';
import { Badges, ProfileHero } from '@/features/profile/ProfileCard';
import { useProfileView } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

// Another account's profile: only while the viewer may see it (a friend, or the other table of
// the current room). Anything else, including a room that just ended, reads as "not visible".
export default function PersonScreen() {
  const { publicId } = useLocalSearchParams<{ publicId: string }>();
  const view = useProfileView(publicId);
  const [reporting, setReporting] = useState(false);

  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason) => safetyApi.reportProfile(publicId, reason),
    onSuccess: () => {
      track('report_submitted', {});
      setReporting(false);
      Alert.alert(tr.safety.reportSent);
    },
  });

  return (
    <Screen>
      {view.isPending ? (
        <View className="mt-16 items-center">
          <Loader />
        </View>
      ) : !view.data ? (
        <EmptyState icon="eye-off-outline" body={tr.profile.notVisible} />
      ) : (
        <View className="flex-1 gap-5">
          <ProfileHero profile={view.data} overlay={<BackPill />} />
          <View className="gap-3">
            <Text variant="overline" tone="muted">
              {tr.profile.badgesTitle}
            </Text>
            <Badges badges={view.data.badges} />
          </View>
          <View className="mt-auto pt-4">
            <Button
              variant="neutral"
              icon="flag-outline"
              label={tr.profile.report}
              onPress={() => setReporting(true)}
            />
          </View>
        </View>
      )}
      {!view.data ? (
        <View className="mt-auto pt-8">
          <Button label={tr.profile.back} onPress={() => router.back()} />
        </View>
      ) : null}
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => report.mutate(reason)}
        onClose={() => setReporting(false)}
      />
    </Screen>
  );
}
