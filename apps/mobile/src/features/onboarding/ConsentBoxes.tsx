import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/Checkbox';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

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
  const { colors, shape } = useTheme();
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: SPACING[3],
        minHeight: TOUCH.tab,
        paddingLeft: checked ? SPACING[4] - 1 : SPACING[4],
        paddingRight: checked ? SPACING[3] - 1 : SPACING[3],
        borderRadius: shape.radius.md,
        borderWidth: checked ? 2 : 1,
        borderColor: checked ? colors.primary : colors.control,
        backgroundColor: colors.surface,
      }}
    >
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
