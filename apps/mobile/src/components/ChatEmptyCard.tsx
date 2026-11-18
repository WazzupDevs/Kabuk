import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { T, useKit } from '@/aura/kit';
import { useSinglePress } from '@/lib/useSinglePress';
import { CHAT_LOOK } from '@/theme/chatLook';
import { KIT } from '@/theme/auraKit';
import { DM } from '@/theme/dm';
import { OPACITY } from '@/theme/tokens';

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
        <T v="chatEmptyTitle" center accessibilityRole="header">
          {title}
        </T>
        <T v="fine" center>
          {body}
        </T>
      </View>
    </View>
  );
}

// The first message's suggestions under the card (yeni arayüz tuvali, SemtSohbet and MasaSohbet
// `.sug`): a row of plain chips from 12 at the left to the screen's right edge, scrolled sideways
// when they do not fit. A tap sends its words as a message, the same way the message bar does
// (`onSend`: the screen's own send, its text check included).
export function ChatSuggestions({
  items,
  label,
  onSend,
  testID,
}: {
  items: readonly string[];
  label: string;
  onSend: (text: string) => void;
  testID?: string;
}) {
  const S = CHAT_LOOK.suggest;
  return (
    <ScrollView
      horizontal
      testID={testID}
      accessibilityLabel={label}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      // The stream's 12 at the left; at the right out to the screen's edge.
      style={{ flexGrow: 0, marginRight: -DM.side }}
      contentContainerStyle={{ gap: S.gap, paddingRight: DM.side }}
    >
      {items.map((text, i) => (
        <Suggestion
          key={text}
          text={text}
          testID={testID ? `${testID}-${i}` : undefined}
          onSend={onSend}
        />
      ))}
    </ScrollView>
  );
}

function Suggestion({
  text,
  testID,
  onSend,
}: {
  text: string;
  testID?: string;
  onSend: (text: string) => void;
}) {
  const { scheme } = useKit();
  const look = CHAT_LOOK[scheme].suggest;
  const S = CHAT_LOOK.suggest;
  const press = useSinglePress(() => onSend(text));
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={text} onPress={press}>
      {({ pressed }) => (
        <View
          style={{
            height: S.height,
            borderRadius: S.height / 2,
            paddingHorizontal: S.padX,
            justifyContent: 'center',
            backgroundColor: look.fill,
            boxShadow: look.shadow || undefined,
            borderWidth: look.edge ? KIT.size.edge : 0,
            borderColor: look.edge || undefined,
            opacity: pressed ? OPACITY.pressed : 1,
          }}
        >
          <T v="chatSuggest" ink>
            {text}
          </T>
        </View>
      )}
    </Pressable>
  );
}
