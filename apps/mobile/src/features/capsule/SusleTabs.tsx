import type { LookSlot } from '@shared/capsule.ts';
import { useState } from 'react';
import { View } from 'react-native';

import { T, useKit } from '@/aura/kit';
import { SlideLine, Tap } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { CAPSULE_EDIT } from '@/theme/capsuleEdit';

import { SlotIcon } from './SlotIcon';

export type SusleTab = {
  // The slot: its icon is the capsule buddy wearing that part (SlotIcon).
  id: LookSlot;
  name: string;
  // What a screen reader says (the name, and that it changed).
  label: string;
};

// The tray's tabs (yeni arayüz tuvali, KapsulSusle `.ptabs`; the six slots, Ağız the fifth): an
// icon over the name, the open one in ink with its icon in colour and a line under it that slides
// to the new tab on springs.seg (hareket 5.5; with reduced motion it is there at once).
export function SusleTabs({
  tabs,
  open,
  onPick,
  accessibilityLabel,
  inPill,
}: {
  tabs: readonly SusleTab[];
  open: string;
  onPick: (id: LookSlot) => void;
  accessibilityLabel: string;
  // In a glass pill (Süsle's panel, 23 Kasım): the pill's edge is the bound, no line under the row.
  inPill?: boolean;
}) {
  const { c } = useKit();
  const E = CAPSULE_EDIT;
  const [width, setWidth] = useState(0);
  const at = Math.max(
    0,
    tabs.findIndex((t) => t.id === open),
  );
  const each = tabs.length > 0 ? width / tabs.length : 0;
  const lineWidth = each * (1 - 2 * E.tabs.lineIn);
  const target = at * each + each * E.tabs.lineIn;
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        marginHorizontal: inPill ? 0 : E.tabs.side,
        borderBottomWidth: KIT.size.hair,
        borderBottomColor: inPill ? 'transparent' : c.hair,
      }}
    >
      {tabs.map((t) => {
        const on = t.id === open;
        return (
          // The tab's share of the row is this view's: Tap's `style` is its inner view's, so a
          // `flex: 1` there leaves the tabs as wide as their words (the owner's report, 17 Kasım).
          <View key={t.id} style={{ flex: 1, minWidth: 0 }}>
            <Tap
              testID={`capsule-tab-${t.id}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t.label}
              feel="selection"
              sink={false}
              onPress={() => onPick(t.id)}
              style={{
                alignItems: 'center',
                gap: E.tabs.gap,
                paddingTop: E.tabs.padTop,
                paddingBottom: E.tabs.padBottom,
              }}
            >
              <SlotIcon
                slot={t.id}
                size={E.tabs.icon}
                color={on ? c.ink : c.muted}
                second={on ? KIT.pink : c.muted}
              />
              <T v="eyebrow" ink={on} strong={on} lines={1} fit center>
                {t.name}
              </T>
            </Tap>
          </View>
        );
      })}
      <SlideLine
        x={target}
        style={{
          position: 'absolute',
          left: 0,
          bottom: -KIT.size.hair,
          width: lineWidth,
          opacity: width > 0 ? 1 : 0,
          height: E.tabs.line,
          borderRadius: E.tabs.line / 2,
          backgroundColor: c.ink,
        }}
      />
    </View>
  );
}
