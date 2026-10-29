import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Reanimated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

// A part of a head that folds away (useCollapseOnScroll): its height goes to nothing and it fades,
// on the UI thread, as `progress` goes from 0 to 1. Without a progress it is a plain view.
// `onHeight`: told its unfolded height (what folding takes away), whenever that changes.
type FoldProps = {
  progress?: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
  onHeight?: (height: number) => void;
  children: ReactNode;
};

export function Fold({ progress, style, onHeight, children }: FoldProps) {
  if (!progress) return <View style={style}>{children}</View>;
  return (
    <Folding progress={progress} style={style} onHeight={onHeight}>
      {children}
    </Folding>
  );
}

function Folding({
  progress,
  style,
  onHeight,
  children,
}: FoldProps & { progress: SharedValue<number> }) {
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
          onHeight?.(e.nativeEvent.layout.height);
        }}
      >
        {children}
      </View>
    </Reanimated.View>
  );
}
