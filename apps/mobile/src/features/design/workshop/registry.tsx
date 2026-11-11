import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { tr } from '@/i18n/tr';

import type { DraftStatus } from './drafts';

// The workshop's draft registry: a design draft built from the real components, with the
// alternatives to compare. A draft is added here; titles, notes and labels come from tr.ts.
export type WorkshopDraft = {
  key: string;
  title: string;
  status: DraftStatus;
  note?: string;
  variants: { key: string; label: string; render: (width: number) => ReactNode }[];
};

const t = tr.design.workshop;

const noop = () => {};

// Example draft: only shows that the tool works.
const BUTTON_ORDER: WorkshopDraft = {
  key: 'buttonOrder',
  title: t.buttonOrder.title,
  status: 'draft',
  note: t.buttonOrder.note,
  variants: [
    {
      key: 'a',
      label: t.variantA,
      render: () => (
        <View className="gap-2">
          <Button label={t.buttonOrder.primary} onPress={noop} />
          <Button variant="neutral" label={t.buttonOrder.neutral} onPress={noop} />
        </View>
      ),
    },
    {
      key: 'b',
      label: t.variantB,
      render: () => (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button variant="neutral" label={t.buttonOrder.neutral} onPress={noop} />
          </View>
          <View className="flex-1">
            <Button label={t.buttonOrder.primary} onPress={noop} />
          </View>
        </View>
      ),
    },
  ],
};

export const WORKSHOP_DRAFTS: WorkshopDraft[] = [BUTTON_ORDER];
