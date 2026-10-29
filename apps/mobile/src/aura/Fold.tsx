import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Reanimated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

// A part of a head that folds away (useCollapseOnScroll): its height goes to nothing and it fades,
// on the UI thread, as `progress` goes from 0 to 1. Without a progress it is a plain view.
export function Fold({
  progress,
  style,
  children,
}: {
  progress?: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  if (!progress) return <View style={style}>{children}</View>;
  return (
    <Folding progress={progress} style={style}>
      {children}
    </Folding>
  );
}

function Folding({
  progress,
  style,
  children,
}: {
  progress: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  // Its own height, measured unfolded inside the folding box.
  const height = useSharedValue(0);
  const fold = useAnimatedStyle(() => {
    const open = 1 - progress.value;
    return height.value > 0 ? { height: height.value * open, opacity: open } : { opacity: open };
  });
  return (
    <Reanimated.View style={[{ overflow: 'hidden' }, fold]}>
      <View
        style={style}
        onLayout={(e) => {
          height.value = e.nativeEvent.layout.height;
        }}
      >
        {children}
      </View>
    </Reanimated.View>
  );
}
