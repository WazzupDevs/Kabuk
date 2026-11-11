import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

import { PreviewBlock } from '../PreviewBlock';
import { nextVariantKey, resolveVariantKey, validateDrafts } from './drafts';
import { WORKSHOP_DRAFTS } from './registry';

// Space between the two columns (the row's gap-2).
const COLUMN_GAP = SPACING[2];

// What is wrong with the registry (a key used twice, a draft with no variant), shown over the set:
// the registry draws components, so no test reads it.
const PROBLEMS = validateDrafts(WORKSHOP_DRAFTS);

// Atölye: the drafts of the registry drawn with the real components; one variant at full width, or
// the selected one and the next side by side (each column gets its measured width).
export function WorkshopSet() {
  const [draftKey, setDraftKey] = useState(WORKSHOP_DRAFTS[0]?.key ?? '');
  const [variantKey, setVariantKey] = useState('');
  const [side, setSide] = useState(false);
  const [width, setWidth] = useState(0);
  const draft = WORKSHOP_DRAFTS.find((d) => d.key === draftKey) ?? WORKSHOP_DRAFTS[0];

  if (!draft) {
    return (
      <View testID="workshop-set">
        <Text tone="muted">{tr.design.workshop.empty}</Text>
      </View>
    );
  }

  const selectedKey = resolveVariantKey(draft.variants, variantKey);
  const selected = draft.variants.find((v) => v.key === selectedKey);
  const other = draft.variants.find((v) => v.key === nextVariantKey(draft.variants, selectedKey));
  const shown = side && other ? [selected, other] : [selected];
  const columnWidth = shown.length === 2 ? Math.max(0, (width - COLUMN_GAP) / 2) : width;

  return (
    <View className="gap-4" testID="workshop-set">
      {PROBLEMS.map((p) => (
        <Text key={p} variant="fine" tone="muted">
          {p}
        </Text>
      ))}
      {WORKSHOP_DRAFTS.length > 1 ? (
        <View className="flex-row flex-wrap gap-2">
          {WORKSHOP_DRAFTS.map((d) => (
            <Button
              key={d.key}
              size="sm"
              variant={d.key === draft.key ? 'primary' : 'neutral'}
              label={d.title}
              testID={`workshop-draft-${d.key}`}
              onPress={() => setDraftKey(d.key)}
            />
          ))}
        </View>
      ) : null}
      <View className="gap-1">
        <Text variant="overline" tone="muted">
          {tr.design.workshop.status[draft.status]}
        </Text>
        {draft.note ? <Text tone="muted">{draft.note}</Text> : null}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {draft.variants.map((v) => (
          <Button
            key={v.key}
            size="sm"
            variant={v.key === selectedKey ? 'primary' : 'neutral'}
            label={v.label}
            testID={`workshop-variant-${v.key}`}
            onPress={() => setVariantKey(v.key)}
          />
        ))}
        {draft.variants.length > 1 ? (
          <Button
            size="sm"
            variant={side ? 'primary' : 'neutral'}
            label={tr.design.workshop.sideBySide}
            testID="workshop-side"
            onPress={() => setSide((s) => !s)}
          />
        ) : null}
      </View>
      <View
        className="flex-row gap-2"
        onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      >
        {shown.map((v) =>
          v ? (
            <View key={v.key} style={{ width: columnWidth }}>
              <PreviewBlock title={v.label}>
                {columnWidth > 0 ? v.render(columnWidth) : null}
              </PreviewBlock>
            </View>
          ) : null,
        )}
      </View>
    </View>
  );
}
