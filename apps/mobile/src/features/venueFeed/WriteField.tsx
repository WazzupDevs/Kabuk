import { View } from 'react-native';

import { Av, T, useKit } from '@/aura/kit';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { Tap } from '@/motion';
import { VENUE_FEED_LOOK } from '@/theme/venueFeed';

// The field to write in (yeni arayüz tuvali, MekanAkis `.cmp`): the person's own face, the words
// "Mekana bir şey yaz…"; a press opens the page to write (it is not a text field itself).
export function WriteField({
  testID,
  label,
  placeholder,
  onPress,
}: {
  testID: string;
  label: string;
  placeholder: string;
  onPress: () => void;
}) {
  const { c } = useKit();
  const photo = useOwnPhoto();
  const L = VENUE_FEED_LOOK.field;
  return (
    <Tap
      testID={testID}
      sink={false}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        marginTop: L.top,
        height: L.height,
        flexDirection: 'row',
        alignItems: 'center',
        gap: L.gap,
        paddingLeft: L.padLeft,
        paddingRight: L.padRight,
        borderRadius: L.height / 2,
        borderWidth: L.edge,
        borderColor: c.glassEdge,
        backgroundColor: c.field,
      }}
    >
      <Av name={photo.name} photoUrl={photo.url} size="list" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="body">{placeholder}</T>
      </View>
    </Tap>
  );
}
