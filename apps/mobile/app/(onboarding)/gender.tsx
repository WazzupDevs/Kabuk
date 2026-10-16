import type { Gender } from '@shared/gender.ts';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { GenderChoice, useSetGender } from '@/features/account/GenderChoice';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

// The one-time question for an account from before the gender step (docs/SPEC_V3.md §23.D; canvas:
// Faz 3 · 23.2 → tek seferlik cinsiyet ekranı): after the new KVKK notice, never skipped. Saving
// reads the profile again and the gate opens the app.
export default function GenderScreen() {
  const [gender, setGender] = useState<Gender | null>(null);
  const save = useSetGender();

  return (
    <Screen>
      <View className="mb-3 mt-2">
        <Wordmark height={SPACING[6]} />
      </View>
      <ScreenHeader title={tr.signup.genderGateTitle} subtitle={tr.signup.genderGateBody} />
      <View className="mt-6">
        <GenderChoice value={gender} onChange={setGender} disabled={save.isPending} />
      </View>
      {save.isError ? (
        <Text variant="fine" tone="danger" className="mt-4">
          {errorMessage(save.error)}
        </Text>
      ) : null}
      <View className="mt-auto pt-8">
        <Button
          testID="gender-save"
          label={tr.signup.genderSave}
          onPress={() => gender && save.mutate(gender)}
          disabled={gender === null}
          loading={save.isPending}
        />
      </View>
    </Screen>
  );
}
