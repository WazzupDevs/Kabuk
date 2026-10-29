import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/Checkbox';
import { Text } from '@/components/Text';
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
  const { scheme } = useTheme();
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
        minHeight: TOUCH.tab,
        paddingLeft: checked ? SPACING[4] - 1 : SPACING[4],
        paddingRight: checked ? SPACING[3] - 1 : SPACING[3],
        // docs/design/aura (CheckIn's rows): a glass row; ticked, ringed in the primary.
        ...gradientStyle(KIT[scheme].glass),
        borderRadius: KIT.size.glassRadiusSm,
        borderWidth: checked ? 2 : KIT.size.edge,
        borderColor: checked ? KIT.primary : KIT[scheme].glassEdge,
        boxShadow: shadow.boxShadow,
      }}
    >
      {shadow.node}
      <View className="flex-1">
        <Checkbox label={label} checked={checked} onToggle={onToggle} />
      </View>
      <Link href={href} asChild>
        <Pressable accessibilityRole="link" className="min-h-11 justify-center px-1">
          <Text tone="accent" variant="label">
            {tr.consents.read}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
