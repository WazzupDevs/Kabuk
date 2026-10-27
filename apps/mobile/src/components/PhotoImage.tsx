import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

import { photoCacheKey } from '@/lib/usePhoto';

// A profile photo (expo-image): kept in memory and on the phone's disk under the photo's own path,
// not its signed address, so a new signature never downloads or blinks it again; no fade-in (the
// owner's report, 27 Ekim: photos went white on a refresh and on opening a chat).
export function PhotoImage({
  url,
  onError,
  style,
}: {
  url: string;
  onError: () => void;
  style: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={{ uri: url, cacheKey: photoCacheKey(url) }}
      cachePolicy="memory-disk"
      transition={0}
      contentFit="cover"
      onError={onError}
      accessibilityIgnoresInvertColors
      style={style}
    />
  );
}
