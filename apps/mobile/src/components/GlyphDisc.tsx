import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { BRAND } from '@/theme/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import type { IconName } from './Button';

// skall tuvali (skall.css → `.glyph`): a 48 round soft disc with a brand-purple line icon; `hot`
// fills it pink with a white icon (an event happening now).
export function GlyphDisc({ icon, hot }: { icon: IconName; hot?: boolean }) {
  const { colors, shape } = useTheme();
  return (
    <View
      className="items-center justify-center"
      style={{
        width: SPACING[12],
        height: SPACING[12],
        borderRadius: shape.radius.pill,
        backgroundColor: hot ? BRAND.pink : colors.surface2,
      }}
    >
      <Ionicons name={icon} size={ICON.md} color={hot ? BRAND.white : BRAND.purple} />
    </View>
  );
}
