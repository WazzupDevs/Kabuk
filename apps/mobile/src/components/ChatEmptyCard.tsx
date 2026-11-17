import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { View } from 'react-native';

import { T, useKit } from '@/aura/kit';
import { CHAT_LOOK } from '@/theme/chatLook';
import { KIT } from '@/theme/auraKit';

// The first message's card (yeni arayüz tuvali, MasaSohbet and SemtSohbet `.emp`): a plain card of
// the surface with a riso standing out over its top edge, the title and the sentence under it.
// `art` is the riso's width, `ratio` its height over its width, `lift` how far it stands above the
// card.
export function ChatEmptyCard({
  source,
  ratio,
  art = CHAT_LOOK.empty.art,
  lift = CHAT_LOOK.empty.artUp,
  title,
  body,
  label,
  testID,
}: {
  source: ImageSourcePropType;
  ratio: number;
  art?: number;
  lift?: number;
  title: string;
  body: string;
  // The riso's description for a screen reader.
  label: string;
  testID?: string;
}) {
  const { scheme } = useKit();
  const look = CHAT_LOOK[scheme].emptyCard;
  const E = CHAT_LOOK.empty;
  return (
    <View
      testID={testID}
      style={{
        alignItems: 'center',
        borderRadius: E.radius,
        paddingTop: E.padTop,
        paddingHorizontal: E.padX,
        paddingBottom: E.padBottom,
        backgroundColor: look.fill,
        boxShadow: look.shadow || undefined,
        borderWidth: look.edge ? KIT.size.edge : 0,
        borderColor: look.edge || undefined,
      }}
    >
      <Image
        source={source}
        contentFit="contain"
        accessibilityLabel={label}
        style={{ width: art, height: art * ratio, marginTop: -lift }}
      />
      <View style={{ marginTop: E.titleTop, gap: E.bodyTop }}>
        <T v="h3" center accessibilityRole="header">
          {title}
        </T>
        <T v="fine" center>
          {body}
        </T>
      </View>
    </View>
  );
}
