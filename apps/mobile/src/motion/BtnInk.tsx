import { createContext, type ReactNode, useContext } from 'react';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

// A button's words and icon fading while its capsule flies (Mekan's fold, the owner's call,
// 25 Kasım: only the button slides into its place, its words never seen on the way). Outside a
// flight there is none and the button draws as ever.
export const BtnInkFade = createContext<SharedValue<number> | null>(null);

export function BtnInk({ gap, children }: { gap: number; children: ReactNode }) {
  const fade = useContext(BtnInkFade);
  if (!fade) return <>{children}</>;
  return (
    <Faded fade={fade} gap={gap}>
      {children}
    </Faded>
  );
}

function Faded({
  fade,
  gap,
  children,
}: {
  fade: SharedValue<number>;
  gap: number;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => ({ opacity: fade.get() }));
  return (
    <Animated.View
      style={[{ flexDirection: 'row', alignItems: 'center', gap, flexShrink: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
}
