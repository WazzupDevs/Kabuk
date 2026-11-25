import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { CapsuleHale } from '@/components/CapsuleHale';
import { LookAvatar } from '@/components/LookAvatar';
import { SusleFilter } from '@/features/capsule/SusleFilter';
import { SusleTabs } from '@/features/capsule/SusleTabs';
import { tr } from '@/i18n/tr';
import { KIT, RADIUS_SCALE } from '@/theme/auraKit';
import { CAPSULE_EDIT } from '@/theme/capsuleEdit';
import { gradientStyle } from '@/theme/gradient';
import { PURPLE } from '@/theme/purpleTheme';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

// Atölye draft `purpleTheme` (the owner's ask, 22 Kasım): Süsle as it is (A) and the same layout in
// a purple night palette (B), from the owner's reference picture: the accent and the filled
// buttons purple, the page's ground a deep navy with purple clouds at its edges, the tray a flat
// see-through panel (no live glass, docs/decisions/cam-kapali.md). The type face does not change.
// Sample looks only; nothing reads the server. The palette: theme/purpleTheme.ts (a draft's).

const LOOK = 'c:mor e:klasik';
const TRIES = ['c:krem e:klasik', 'c:krem e:klasik', 'c:krem e:klasik'];
const SLOT_ICON: readonly CapIconName[] = [
  'palette',
  'eye',
  'user',
  'personCircle',
  'chat',
  'gift',
];
const SLOTS = (['c', 'e', 'h', 'f', 'm', 'n'] as const).map((id, i) => ({
  id,
  name: tr.capsule.slotNames[id],
  icon: SLOT_ICON[i] ?? 'user',
  label: tr.capsule.slotNames[id],
}));
const PACKS = ['Zarif', 'Çiçek', 'Sokak'];
const t = tr.design.workshop.purpleTheme;
const STAGE = 168;
const TILE = 64;
const noop = () => {};

export function PurpleThemeDraft({ purple, width }: { purple: boolean; width: number }) {
  const { c, scheme } = useKit();
  const { colors } = useTheme();
  const [slot, setSlot] = useState<string>('h');
  const E = CAPSULE_EDIT;
  const ink = purple ? PURPLE.ink : c.ink;
  return (
    <View
      style={{
        width,
        borderRadius: RADIUS_SCALE[3],
        overflow: 'hidden',
        ...(purple ? gradientStyle(PURPLE.ground) : { backgroundColor: colors.canvas }),
      }}
    >
      {/* The bar: the title and Kaydet. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: SPACING[4],
        }}
      >
        <T v="title" color={ink}>
          {tr.capsule.title}
        </T>
        {purple ? (
          <Filled label={tr.capsule.save} small />
        ) : (
          <Btn sm label={tr.capsule.save} onPress={noop} />
        )}
      </View>
      {/* The scene: the hale, the capsule, the two buttons under it. */}
      <View style={{ alignItems: 'center', gap: SPACING[3], paddingBottom: SPACING[4] }}>
        <View
          style={{
            width: STAGE + 40,
            height: STAGE + 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ position: 'absolute' }}>
            <CapsuleHale side={STAGE + 40} />
          </View>
          <LookAvatar look={`${LOOK} x:yapraktaci`} size={STAGE} still />
        </View>
        <View style={{ flexDirection: 'row', gap: E.actions.gap }}>
          {[
            { icon: 'reply' as const, label: tr.capsule.clearAll },
            { icon: 'shuffle' as const, label: tr.capsule.shuffleShort },
          ].map((b) => (
            <View key={b.label} style={{ width: E.actions.each }}>
              {purple ? (
                <Quiet icon={b.icon} label={b.label} />
              ) : (
                <Btn sm block variant="glassy" icon={b.icon} label={b.label} onPress={noop} />
              )}
            </View>
          ))}
        </View>
      </View>
      {/* The tray: the tabs, the packs, three tries, "Aksesuarı çıkar". */}
      <View
        style={{
          borderTopLeftRadius: E.panel.radius,
          borderTopRightRadius: E.panel.radius,
          paddingTop: E.panel.padTop,
          paddingBottom: SPACING[5],
          gap: SPACING[3],
          ...(purple
            ? { backgroundColor: PURPLE.panel.fill, borderWidth: 1, borderColor: PURPLE.panel.edge }
            : { backgroundColor: E[scheme].panel.fill }),
        }}
      >
        {purple ? (
          <PurpleTabs open={slot} onPick={setSlot} />
        ) : (
          <SusleTabs
            tabs={SLOTS}
            open={slot}
            onPick={setSlot}
            accessibilityLabel={tr.capsule.slots}
          />
        )}
        {purple ? (
          <PurpleChips />
        ) : (
          <SusleFilter packs={PACKS} open={null} onPick={noop} onViewAll={noop} />
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING[3] }}>
          {TRIES.map((look, i) => (
            <View
              key={i}
              style={{
                width: TILE + 8,
                height: TILE + 8,
                borderRadius: (TILE + 8) / 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: i === 1 ? (purple ? PURPLE.accent : KIT.pink) : 'transparent',
              }}
            >
              <View
                style={{
                  width: TILE,
                  height: TILE,
                  borderRadius: TILE / 2,
                  overflow: 'hidden',
                  backgroundColor: purple ? PURPLE.tile : E[scheme].tile,
                }}
              >
                <LookAvatar look={look} size={TILE} still />
              </View>
            </View>
          ))}
        </View>
        <View style={{ paddingHorizontal: SPACING[5] }}>
          {purple ? (
            <Filled label={tr.capsule.removeAccessory} icon="block" light />
          ) : (
            <View style={{ alignSelf: 'center' }}>
              <Btn icon="block" label={tr.capsule.removeAccessory} onPress={noop} />
            </View>
          )}
        </View>
      </View>
      <View style={{ padding: SPACING[3] }}>
        <T v="fine" color={purple ? PURPLE.muted : c.muted}>
          {purple ? t.noteB : t.noteA}
        </T>
      </View>
    </View>
  );
}

// B's filled button: the purple gradient (or the light one for "Aksesuarı çıkar").
function Filled({
  label,
  icon,
  small,
  light,
}: {
  label: string;
  icon?: CapIconName;
  small?: boolean;
  light?: boolean;
}) {
  const fg = light ? PURPLE.light.ink : PURPLE.filledInk;
  return (
    <Pill
      height={small ? KIT.size.btnSm : KIT.size.btn}
      style={gradientStyle(light ? PURPLE.light.fill : PURPLE.filled)}
    >
      {icon ? <CapIcon name={icon} color={fg} size={ICON.md} /> : null}
      <T v="btn" color={fg} lines={1} fit>
        {label}
      </T>
    </Pill>
  );
}

// B's quiet button: see-through with a purple edge.
function Quiet({ label, icon }: { label: string; icon: CapIconName }) {
  return (
    <Pill
      height={KIT.size.btnSm}
      style={{ backgroundColor: PURPLE.quiet.fill, borderWidth: 1, borderColor: PURPLE.quiet.edge }}
    >
      <CapIcon name={icon} color={PURPLE.ink} size={ICON.sm} />
      <T v="btn" color={PURPLE.ink} lines={1} fit>
        {label}
      </T>
    </Pill>
  );
}

function Pill({ height, style, children }: { height: number; style: object; children: ReactNode }) {
  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          paddingHorizontal: SPACING[4],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING[2],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function PurpleTabs({ open, onPick }: { open: string; onPick: (id: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: CAPSULE_EDIT.tabs.side }}>
      {SLOTS.map((s) => {
        const on = s.id === open;
        return (
          <View
            key={s.id}
            onTouchEnd={() => onPick(s.id)}
            style={{ flex: 1, alignItems: 'center', gap: CAPSULE_EDIT.tabs.gap, paddingBottom: 8 }}
          >
            <CapIcon name={s.icon} color={on ? PURPLE.accent : PURPLE.muted} size={ICON.lg} />
            <T v="fine" strong={on} color={on ? PURPLE.accent : PURPLE.muted}>
              {s.name}
            </T>
            <View
              style={{
                height: 3,
                width: '56%',
                borderRadius: 2,
                backgroundColor: on ? PURPLE.accent : 'transparent',
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

function PurpleChips() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: CAPSULE_EDIT.filter.gap,
        paddingHorizontal: CAPSULE_EDIT.panel.side,
      }}
    >
      {[tr.capsule.allPacks, ...PACKS].map((p, i) => (
        <Pill
          key={p}
          height={KIT.size.chip}
          style={{ backgroundColor: i === 0 ? PURPLE.chipOn.fill : PURPLE.chipOff.fill }}
        >
          <T v="capsuleChip" color={i === 0 ? PURPLE.chipOn.ink : PURPLE.chipOff.ink} lines={1}>
            {p}
          </T>
        </Pill>
      ))}
      <View style={{ flex: 1 }} />
      <T v="capsuleChip" color={PURPLE.ink} lines={1}>
        {tr.capsule.viewAll}
      </T>
      <CapIcon name="chevron" color={PURPLE.ink} size={CAPSULE_EDIT.filter.chevron} />
    </View>
  );
}
