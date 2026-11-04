import { View } from 'react-native';

import { Btn } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

// Over the oldest message while an older page is read, and "Tekrar dene" when it could not be
// (the DM's, app/(app)/(tabs)/messages/[threadId].tsx → `older`).
export function OlderFoot({
  loading,
  failed,
  onRetry,
}: {
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <View className="items-center" style={{ paddingVertical: SPACING[2] }}>
        <Loader size={SPACING[8]} />
      </View>
    );
  }
  if (!failed) return null;
  return (
    <View className="items-center" style={{ paddingVertical: SPACING[2] }}>
      <Btn sm variant="glassy" label={tr.common.retry} onPress={onRetry} />
    </View>
  );
}
