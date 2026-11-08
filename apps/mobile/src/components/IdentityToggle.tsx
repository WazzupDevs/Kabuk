import { upperTr } from '@shared/trText.ts';
import type { VenueChatMode } from '@shared/venueChat.ts';
import { Image as PhotoView } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { avatarGround, useKit } from '@/aura/kit';
import { useOwnLook } from '@/features/profile/useOwnLook';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { tr } from '@/i18n/tr';
import { photoCacheKey } from '@/lib/usePhoto';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';

import { LookAvatar } from './LookAvatar';

const S = KIT.identityToggle;
const FACE = S.slot - S.ring * 2;

// Who the viewer writes as, in the venue and the semt chat's top bar (the owner's call, 8 Kasım):
// the own capsule (anonymous) and the own photo (profiled), the chosen one raised. Tapping the other
// asks for the change (`onPick`: the screen's own flow, its sheets included); a spent change locks
// it, and a tap says so (`onLocked`). A radio group for a screen reader.
export function IdentityToggle({
  mode,
  locked,
  busy = false,
  onPick,
  onLocked,
  testID,
}: {
  mode: VenueChatMode;
  locked: boolean;
  busy?: boolean;
  onPick: (mode: VenueChatMode) => void;
  onLocked: () => void;
  testID?: string;
}) {
  const { c } = useKit();
  const photo = useOwnPhoto();
  const look = useOwnLook();
  const capsule = look ? (
    <LookAvatar look={look} size={FACE} />
  ) : (
    <View style={{ width: FACE, height: FACE, borderRadius: FACE / 2, backgroundColor: c.hair }} />
  );
  const face = photo.url ? (
    <PhotoView
      source={{ uri: photo.url, cacheKey: photoCacheKey(photo.url) }}
      cachePolicy="memory-disk"
      transition={0}
      style={{ width: FACE, height: FACE, borderRadius: FACE / 2 }}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View
      style={[
        {
          width: FACE,
          height: FACE,
          borderRadius: FACE / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        gradientStyle(avatarGround(photo.name)),
      ]}
    >
      <Text maxFontSizeMultiplier={1} style={[KIT_TYPE.av.sm, { color: KIT.white }]}>
        {upperTr(photo.name.trim().charAt(0)) || '?'}
      </Text>
    </View>
  );
  const slot = (value: VenueChatMode, label: string, body: ReactNode, id: string) => {
    const on = value === mode;
    return (
      <Pressable
        key={value}
        testID={testID ? `${testID}-${id}` : undefined}
        accessibilityRole="radio"
        accessibilityLabel={label}
        accessibilityState={{ checked: on, disabled: busy || (!on && locked) }}
        onPress={() => {
          if (on || busy) return;
          if (locked) onLocked();
          else onPick(value);
        }}
        hitSlop={S.pad + S.gap}
      >
        <View
          style={{
            width: S.slot,
            height: S.slot,
            borderRadius: S.slot / 2,
            alignItems: 'center',
            justifyContent: 'center',
            ...(on
              ? {
                  backgroundColor: KIT.white,
                  borderWidth: S.ring,
                  borderColor: KIT.primary,
                  boxShadow: c.raisedShadow,
                }
              : { opacity: S.dim }),
          }}
        >
          {body}
        </View>
        {!on && locked ? (
          <View
            style={{
              position: 'absolute',
              right: -S.pad,
              bottom: -S.pad,
              width: S.lock,
              height: S.lock,
              borderRadius: S.lock / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: KIT.white,
            }}
          >
            <CapIcon name="lock" color={c.muted} size={S.lockIcon} />
          </View>
        ) : null}
      </Pressable>
    );
  };
  return (
    <View
      testID={testID}
      accessibilityRole="radiogroup"
      accessibilityLabel={tr.district.room.identityLabel}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: S.gap,
        padding: S.pad,
        borderRadius: S.slot / 2 + S.pad,
        backgroundColor: c.hair,
        opacity: busy ? S.busy : 1,
      }}
    >
      {slot('anonymous', tr.district.room.anonymous, capsule, 'anonymous')}
      {slot('profiled', tr.district.room.profiled, face, 'profiled')}
    </View>
  );
}
