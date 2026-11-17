import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';

import { SIGNUP_FONT_SCALE, useSignupLook } from './look';

type Props = {
  terms: boolean;
  kvkk: boolean;
  onTerms: () => void;
  onKvkk: () => void;
};

// The two consents (yeni arayüz tuvali, KayitOnay `.cr.big`): rows on the ground with a hairline
// between them, each a 24 box with its check, its line and "Oku".
export function ConsentBoxes({ terms, kvkk, onTerms, onKvkk }: Props) {
  return (
    <View style={{ marginTop: SIGNUP.row.listTop }}>
      <ConsentBox label={tr.consents.terms} checked={terms} onToggle={onTerms} href="/terms" />
      <ConsentBox label={tr.consents.kvkk} checked={kvkk} onToggle={onKvkk} href="/kvkk" first />
    </View>
  );
}

function ConsentBox({
  label,
  checked,
  onToggle,
  href,
  first = false,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  href: '/terms' | '/kvkk';
  // The second row: the hairline over it.
  first?: boolean;
}) {
  const look = useSignupLook();
  const R = SIGNUP.row;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: R.gap,
        minHeight: R.big,
      }}
    >
      {first ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: R.hairIn,
            right: 0,
            borderTopWidth: 1,
            borderTopColor: look.hair,
          }}
        />
      ) : null}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => {
          haptic('selection');
          onToggle();
        }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: R.gap,
          minHeight: R.big,
        }}
      >
        <View
          style={{
            width: R.mark,
            height: R.mark,
            borderRadius: R.boxRadius,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: checked ? look.markOn : undefined,
            boxShadow: checked ? undefined : `inset 0px 0px 0px 2px ${look.markLine}`,
          }}
        >
          {checked ? <CapIcon name="check" color={look.onMarkOn} size={R.check} /> : null}
        </View>
        <Text
          maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
          style={[SIGNUP_TYPE.rowTitle, { color: look.ink, flex: 1 }]}
        >
          {label}
        </Text>
      </Pressable>
      <Link href={href} asChild>
        <Pressable accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text
            maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
            style={[
              SIGNUP_TYPE.read,
              { color: look.ink, textDecorationLine: 'underline', textDecorationColor: look.link },
            ]}
          >
            {tr.consents.read}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
