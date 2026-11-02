import { T } from '@/aura/kit';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { CheckMark } from '@/components/Checkbox';
import { haptic } from '@/lib/haptics';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';
import { useLabOff } from '@/lib/drawLab';
import { shadowParts } from '@/components/NativeShadow';

type Props = {
  terms: boolean;
  kvkk: boolean;
  onTerms: () => void;
  onKvkk: () => void;
};

// The two consents (skall tuvali, KayitOnay): each a choice box with its check, its line and "Oku".
export function ConsentBoxes({ terms, kvkk, onTerms, onKvkk }: Props) {
  return (
    <View style={{ gap: SPACING[2] }}>
      <ConsentBox label={tr.consents.terms} checked={terms} onToggle={onTerms} href="/terms" />
      <ConsentBox label={tr.consents.kvkk} checked={kvkk} onToggle={onKvkk} href="/kvkk" />
    </View>
  );
}

function ConsentBox({
  label,
  checked,
  onToggle,
  href,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  href: '/terms' | '/kvkk';
}) {
  const { scheme, colors } = useTheme();
  const dark = scheme === 'dark';
  const ring = dark ? colors.accent : KIT.primary;
  // Its soft shadow natively (NativeShadow.tsx).
  const shadow = shadowParts(
    useLabOff('golge'),
    KIT[scheme].glassShadow,
    undefined,
    KIT.size.glassRadiusSm,
    true,
    checked ? 2 : KIT.size.edge,
  );
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: SPACING[3],
        // Aura v71 (KayitOnay): 64 at least, 12 / 16 in; ticked, the 2 px line takes 1 from the room.
        minHeight: TOUCH.large,
        paddingVertical: checked ? KIT.size.consentPadY - 1 : KIT.size.consentPadY,
        paddingHorizontal: checked ? SPACING[4] - 1 : SPACING[4],
        // docs/design/aura (CheckIn's rows): a glass row; ticked, ringed in the primary.
        ...gradientStyle(KIT[scheme].glass),
        borderRadius: KIT.size.glassRadiusSm,
        borderWidth: checked ? 2 : KIT.size.edge,
        borderColor: checked ? ring : KIT[scheme].glassEdge,
        boxShadow: shadow.boxShadow,
      }}
    >
      {shadow.node}
      <View className="flex-1">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          onPress={() => {
            haptic('selection');
            onToggle();
          }}
          className="flex-row items-center"
          style={{ gap: SPACING[3], minHeight: TOUCH.button }}
        >
          <CheckMark checked={checked} />
          <View className="flex-1">
            <T v="fine" ink>
              {label}
            </T>
          </View>
        </Pressable>
      </View>
      <Link href={href} asChild>
        <Pressable accessibilityRole="link" className="min-h-11 justify-center px-1">
          <T v="btnSm" color={dark ? colors.accent : colors.primaryPressed}>
            {tr.consents.read}
          </T>
        </Pressable>
      </Link>
    </View>
  );
}
