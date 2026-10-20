import { Text, View } from 'react-native';

import { V46_EXPLORE, type V46ThumbKind } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { Button } from './Button';
import { LiveDot } from './LiveDot';
import { VenueThumb } from './VenueThumb';

type Props = {
  // "Şu an buradasın".
  label: string;
  thumb: V46ThumbKind;
  name: string;
  // Where and that the person is in (`Kantin · giriş yaptın`).
  sub: string;
  // "Mekana dön".
  action: string;
  onPress: () => void;
  testID?: string;
};

// Keşfet's card for the venue the person is checked in at (v46 `.vhere.card`): the live dot and
// "Şu an buradasın" in green, the venue's icon, name and where in it, and the soft button back to
// it (`yumusak-beyaz`, as wide as the card).
export function HereCard({ label, thumb, name, sub, action, onPress, testID }: Props) {
  const { scheme } = useTheme();
  const h = V46_EXPLORE[scheme].here;
  return (
    <View
      testID={testID}
      style={{
        marginTop: h.margin[0],
        backgroundColor: h.card.bg,
        borderWidth: h.card.border.width,
        borderColor: h.card.border.color,
        borderRadius: h.card.radius,
        boxShadow: h.card.shadow,
        paddingTop: h.padding[0],
        paddingRight: h.padding[1],
        paddingBottom: h.padding[2],
        paddingLeft: h.padding[3],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: h.label.gap }}>
        <LiveDot size={h.label.dot} />
        <Text style={[v46FontStyle(h.label.font), { color: h.label.color, flexShrink: 1 }]}>
          {label}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: h.row.gap,
          marginTop: h.row.marginTop,
        }}
      >
        <VenueThumb kind={thumb} />
        <View style={{ flex: 1, minWidth: 0, gap: h.middle.gap }}>
          <Text style={[v46FontStyle(h.name.font, h.name.letterSpacing), { color: h.name.color }]}>
            {name}
          </Text>
          <Text style={[v46FontStyle(h.sub.font, h.sub.letterSpacing), { color: h.sub.color }]}>
            {sub}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: h.button.marginTop }}>
        <Button look="yumusak-beyaz" label={action} onPress={onPress} block />
      </View>
    </View>
  );
}
