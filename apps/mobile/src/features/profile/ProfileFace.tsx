import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { avatarGround } from '@/aura/kit';
import { photoCacheKey } from '@/lib/usePhoto';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { PROFILE_PAGE } from '@/theme/profileCover';

// A face on a profile page (docs/design/iskelet.md → 2.4, 5.6, 5.7): the photo, or the name's first
// letter on its colour, `side` across; no shadow and no second ring.
export function ProfileFace({
  side,
  name,
  photoUrl,
}: {
  side: number;
  name: string;
  photoUrl: string | null;
}) {
  return (
    <View
      style={[
        {
          width: side,
          height: side,
          borderRadius: side / 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        photoUrl ? null : gradientStyle(avatarGround(name)),
      ]}
    >
      {photoUrl ? (
        <Image
          // Under the photo's own path, not its signed address (as Av): no blink on a new signature.
          source={{ uri: photoUrl, cacheKey: photoCacheKey(photoUrl) }}
          cachePolicy="memory-disk"
          transition={0}
          style={{ width: side, height: side }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text
          maxFontSizeMultiplier={1}
          style={[
            side >= KIT.size.av.xl
              ? KIT_TYPE.av.big
              : side >= KIT.size.av.md
                ? KIT_TYPE.av.lg
                : KIT_TYPE.av.sm,
            { color: KIT.white },
          ]}
        >
          {upperTr(name.trim().charAt(0)) || '?'}
        </Text>
      )}
    </View>
  );
}

// The page's photo over the cover's foot: the face in its white ring (124, 4 px; iskelet.md → 2.4;
// `side` the ring's own across where a board gives one: tuval Profil 132, Duzenle 116).
export function RingedFace({
  name,
  photoUrl,
  side = PROFILE_PAGE.face,
}: {
  name: string;
  photoUrl: string | null;
  side?: number;
}) {
  const P = PROFILE_PAGE;
  return (
    <View
      style={{
        width: side,
        height: side,
        borderRadius: side / 2,
        backgroundColor: P.ringColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ProfileFace side={side - 2 * P.ring} name={name} photoUrl={photoUrl} />
    </View>
  );
}
