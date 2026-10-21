import type { TextStyle, ViewStyle } from 'react-native';

import type { V46FieldBox, V46FieldText } from '@/theme/parts.generated';
import { v46FontStyle } from '@/theme/v46Type';

// A v46 field's box (parts.generated.ts → V46_FORM): its height, padding, corner, ground, and its
// edge and ring at rest or while typing (`:focus`). v46's transitions between the two (none for
// most: the change shows at once) go on the Animated view beside it (motion.ts → transitionStyle).
export function fieldBoxStyle(box: V46FieldBox, focused: boolean, height = true): ViewStyle {
  const look = focused ? box.focus : box.idle;
  return {
    ...(height ? { height: box.height } : null),
    paddingTop: box.padding[0],
    paddingRight: box.padding[1],
    paddingBottom: box.padding[2],
    paddingLeft: box.padding[3],
    borderRadius: box.radius,
    backgroundColor: box.bg,
    borderWidth: look.border.width,
    borderColor: look.border.color,
    boxShadow: look.shadow ?? undefined,
  };
}

// What a field shows: its font, colour and place, its digits each as wide where v46 says so
// (`tabular-nums`). The placeholder's colour and the caret go on the TextInput's own props.
export function fieldTextStyle(text: V46FieldText): TextStyle {
  return {
    ...v46FontStyle(text.font, text.letterSpacing),
    color: text.color,
    textAlign: text.align,
    ...(text.tabular ? { fontVariant: ['tabular-nums'] } : null),
    padding: 0,
  };
}
