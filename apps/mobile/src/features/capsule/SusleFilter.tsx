import { ScrollView, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Chip, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { Tap } from '@/motion';
import { CAPSULE_EDIT } from '@/theme/capsuleEdit';

// The row under Süsle's tabs (yeni arayüz tuvali, KapsulSusle `.frow`): the theme packs the open
// slot has pieces of, "Tümü" first, fading at the right; "Tümüne bak" at the end opens the catalog.
// Both scroll or stay as they are: the link never leaves the screen (the packs scroll beside it).
export function SusleFilter({
  packs,
  open,
  onPick,
  onViewAll,
}: {
  packs: readonly string[];
  open: string | null;
  onPick: (pack: string | null) => void;
  onViewAll: () => void;
}) {
  const { c } = useKit();
  const E = CAPSULE_EDIT;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: E.filter.top,
        paddingLeft: E.panel.side,
        paddingRight: E.panel.side,
        gap: E.filter.gap * 2,
      }}
    >
      <ScrollView
        horizontal
        accessibilityLabel={tr.capsule.packs}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        fadingEdgeLength={{ start: 0, end: E.panel.fadeEnd }}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: E.filter.gap, alignItems: 'center' }}
      >
        {[null, ...packs].map((p) => (
          <Chip
            key={p ?? ''}
            label={p ?? tr.capsule.allPacks}
            on={p === open}
            onPress={() => onPick(p)}
          />
        ))}
      </ScrollView>
      <Tap
        testID="capsule-view-all"
        accessibilityRole="link"
        accessibilityLabel={tr.capsule.viewAll}
        onPress={onViewAll}
        style={{ flexDirection: 'row', alignItems: 'center', gap: E.filter.link }}
      >
        <T v="capsuleChip" ink lines={1} fit>
          {tr.capsule.viewAll}
        </T>
        <CapIcon name="chevron" color={c.ink} size={E.filter.chevron} />
      </Tap>
    </View>
  );
}
