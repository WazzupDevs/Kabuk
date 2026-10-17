import type { Gender } from '@shared/gender.ts';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';

import { GenderChoice, useSetGender } from './GenderChoice';

type Props = { visible: boolean; onClose: () => void };

// "Cinsiyetini seç" beside gender_required in the game flow (canvas: Faz 3 · 23.2 → Cinsiyet eksik):
// the one-time question in place of the sheet that asked, which comes back once it is saved.
export function GenderSheet({ visible, onClose }: Props) {
  const [gender, setGender] = useState<Gender | null>(null);
  const save = useSetGender(onClose);

  return (
    <Sheet visible={visible} onClose={onClose} title={tr.signup.genderGateTitle}>
      <Text variant="fine" tone="text">
        {tr.signup.genderGateBody}
      </Text>
      <GenderChoice value={gender} onChange={setGender} disabled={save.isPending} />
      {save.isError ? (
        <Text variant="fine" tone="danger">
          {errorMessage(save.error)}
        </Text>
      ) : null}
      <Button
        testID="gender-sheet-save"
        label={tr.signup.genderSave}
        onPress={() => gender && save.mutate(gender)}
        disabled={gender === null}
        loading={save.isPending}
      />
    </Sheet>
  );
}
