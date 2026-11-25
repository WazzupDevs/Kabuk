import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { tr } from '@/i18n/tr';

import { AccessoryCardDraft } from './accessoryCard';
import type { DraftStatus } from './drafts';
import { PurpleThemeDraft } from './purpleTheme';
import { SusleStageDraft } from './susleStage';

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

// Süsle in a purple night palette (the owner's ask, 22 Kasım): A today, B purple; the layout is the
// same, only the colours change.
const PURPLE_THEME: WorkshopDraft = {
  key: 'purpleTheme',
  title: t.purpleTheme.title,
  status: 'draft',
  note: t.purpleTheme.note,
  variants: [
    {
      key: 'a',
      label: t.variantA,
      render: (width) => <PurpleThemeDraft purple={false} width={width} />,
    },
    {
      key: 'b',
      label: t.variantB,
      render: (width) => <PurpleThemeDraft purple width={width} />,
    },
  ],
};

// The ground behind Süsle's large capsule (the owner's ask, 22 Kasım).
const SUSLE_STAGE: WorkshopDraft = {
  key: 'susleStage',
  title: t.susleStage.title,
  status: 'approved',
  note: t.susleStage.approved,
  variants: [
    { key: 'a', label: t.variantA, render: (w) => <SusleStageDraft ground="today" width={w} /> },
    { key: 'b', label: t.variantB, render: (w) => <SusleStageDraft ground="night" width={w} /> },
    { key: 'c', label: t.variantC, render: (w) => <SusleStageDraft ground="glow" width={w} /> },
  ],
};

// Süsle's options as upright cards in place of the rounds (the owner's ask, 23 Kasım).
const ACCESSORY_CARD: WorkshopDraft = {
  key: 'accessoryCard',
  title: t.accessoryCard.title,
  status: 'draft',
  note: t.accessoryCard.note,
  variants: [
    { key: 'a', label: t.variantA, render: (w) => <AccessoryCardDraft look="round" width={w} /> },
    { key: 'b', label: t.variantB, render: (w) => <AccessoryCardDraft look="alone" width={w} /> },
    { key: 'c', label: t.variantC, render: (w) => <AccessoryCardDraft look="gift" width={w} /> },
  ],
};

export const WORKSHOP_DRAFTS: WorkshopDraft[] = [
  ACCESSORY_CARD,
  SUSLE_STAGE,
  PURPLE_THEME,
  BUTTON_ORDER,
];
