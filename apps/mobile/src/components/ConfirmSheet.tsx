import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Btn } from '@/aura/kit';
import { Sheet } from '@/motion/Sheet';

import { Text } from './Text';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  // A destructive action that cannot be undone ("Bitir", Engelle) in the danger colour.
  danger?: boolean;
  pending?: boolean;
  // The person's or the venue's picture over the sentence (iskelet.md → 3.5).
  picture?: ReactNode;
  testID?: string;
};

// A yes/no question in a bottom sheet ("Oyunu bitirelim mi?"; iskelet.md → 3.5): the picture if
// any, one sentence of what will happen, the clear cancel that keeps things as they are and the one
// action, a danger button when it cannot be undone. `testID` names the confirm button; cancel gets
// `${testID}-cancel`.
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger,
  pending,
  picture,
  testID,
}: Props) {
  return (
    <Sheet visible={visible} onClose={onCancel} title={title}>
      {picture ? <View className="items-center">{picture}</View> : null}
      <Text variant="fine">{body}</Text>
      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <Btn
            block
            variant="glassy"
            testID={testID ? `${testID}-cancel` : undefined}
            label={cancelLabel}
            onPress={onCancel}
          />
        </View>
        <View className="flex-1">
          <Btn
            block
            variant={danger ? 'danger' : 'primary'}
            testID={testID}
            label={confirmLabel}
            onPress={onConfirm}
            loading={pending}
          />
        </View>
      </View>
    </Sheet>
  );
}
