import { useState } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Loader } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { V46_BUTTON_MOTION, V46_BUTTONS, type V46ButtonId } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { V46_COMPONENTS, V46_PALETTE } from '@/theme/tokens.generated';
import { v46FontStyle } from '@/theme/v46Type';

import { ButtonGlyph } from './glyph';
import { keyframeSequence, transitionStyle, transitionsEnd, usePresence } from './motion';
import { useNarrow } from './narrow';

// v46's text buttons, by their gallery ids (docs/design/v46/skall-masa-deneme-v46-galeri.html
// ?page=galeri#<id>): `.btn.btn-room` in three sizes (the primary; `.btn-primary` is not used),
// `.ntf-chip.main` and `.ghost` (36), `.btn-soft`, `.sheet .close`, `.btn-danger`, `.endbtn`,
// `.pa-friend`, `.hb`, `.pedit`, `.link`.
export type ButtonLook =
  | 'birincil-52'
  | 'birincil-48'
  | 'birincil-48-15'
  | 'birincil-36'
  | 'yumusak-beyaz'
  | 'yumusak-lavanta'
  | 'yumusak-36'
  | 'tehlike'
  | 'tehlike-yumusak'
  | 'basari'
  | 'kenarli-36'
  | 'kenarli-44'
  | 'baglanti';

// Where v46 measures a disabled look of its own (the primary, 52 and 48: `aria-disabled`). Every
// other button takes the one disabled look of the palette (docs/SPEC_V4.md §4.C: "Katıl'a ortak
// pasif görünüm"), without edge or shadow, as `.va .btn[aria-disabled="true"]` draws it. A disabled
// button still answers a press, as v46's do: it shrinks as that look does when pressed (not at all
// in the edit bar: `.ebar .btn[aria-disabled="true"]:active`), shakes where v46's `.nope` reaches
// the look and calls `onDisabledPress` (where v46 says why, in a toast).
const DISABLED: Partial<Record<ButtonLook, V46ButtonId>> = {
  'birincil-52': 'birincil-52-pasif',
  'birincil-48': 'birincil-48-pasif',
};

// The busy look (v46: `.busy`, measured on the primary): the label fades out and lifts, the loader
// fades in at its place. The button keeps its ground, unlike v46, where `.busy` is also
// `aria-disabled` (§4.C: "yüklenirken birincil düğme mor kalır, gösterge görünür"). With the system
// asking for less motion the label does not lift (§4.C: v46's own reduced-motion rule for it is
// overridden by a later rule; its intent is applied).
const BUSY: V46ButtonId = 'birincil-52-yukleniyor';
// The loader's own colours are measured inside the primary (`.va .btn-room .ld .pa`); elsewhere
// it keeps the mark's colours. Its size is the look's own (`.hb .ld.mini` is smaller).
const PRIMARY = new Set<ButtonLook>([
  'birincil-52',
  'birincil-48',
  'birincil-48-15',
  'birincil-36',
]);

// How far a label may shrink to stay on one line (CLAUDE.md → Ekran davranışı), as the app's
// earlier button.
const MIN_FONT_SCALE = 0.5;

type Props = {
  look: ButtonLook;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  // A press while disabled (after the shake): say why, if the screen has a reason to give.
  onDisabledPress?: () => void;
  // Busy: a second press does nothing (CLAUDE.md → Ekran davranışı).
  loading?: boolean;
  // Fills the width it is given (v46's full-width buttons); otherwise as wide as its content.
  block?: boolean;
  // v46's icon for this look, where it draws one (`.bi-plus`, `.bi-close`, `.bi-check`, `.ico`).
  icon?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  // Drawn pressed: the v46 gallery's "Basılı" (test builds only).
  pressedPreview?: boolean;
};

export function Button({
  look,
  label,
  onPress,
  disabled = false,
  onDisabledPress,
  loading = false,
  block = false,
  icon = true,
  accessibilityLabel,
  testID,
  pressedPreview = false,
}: Props) {
  const { scheme } = useTheme();
  const narrow = useNarrow();
  const reduce = useReduceMotion();
  const [pressing, setPressing] = useState(false);

  const id: V46ButtonId = disabled ? (DISABLED[look] ?? look) : look;
  const shared = disabled && DISABLED[look] === undefined;
  const box = V46_COMPONENTS[id][scheme];
  const parts = V46_BUTTONS[id];
  const p = parts[scheme];
  const n = narrow ? parts.narrow : null;
  const busy = V46_BUTTONS[BUSY][scheme];
  const palette = V46_PALETTE[scheme];

  const text = p.label;
  const font = n?.font ??
    text?.font ?? { size: box.fontSize, weight: box.fontWeight, lineHeight: box.lineHeight };
  const color = shared ? palette.onDisabled : (text?.color ?? box.color);
  const glyph = icon && p.icon && (n ? n.iconShown : true) ? p.icon : null;
  const padding = n?.padding ?? p.padding;
  const scale = (pressing || pressedPreview) && !loading ? p.pressedScale : 1;
  const loader = usePresence(loading, transitionsEnd(busy.loader?.transitions ?? []));
  const loaderSize = p.loaderSize ?? busy.loader?.size;
  const out = loading ? (busy.label ?? null) : null;

  const nope = V46_BUTTON_MOTION.nope;
  const shakeX = useSharedValue(nope.channels.translateX?.from ?? 0);
  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const press = () => {
    if (!disabled) {
      onPress();
      return;
    }
    // v46's rule reaches `.btn` and `.ntf-chip`, not every look (`.endbtn`, `.hb`, `.link` stay).
    const next = nope.looks.includes(id) ? keyframeSequence(nope, 'translateX') : null;
    if (next && !(reduce && nope.offWhenReduced)) shakeX.set(next);
    onDisabledPress?.();
  };

  return (
    <Pressable
      onPress={press}
      onPressIn={() => setPressing(true)}
      onPressOut={() => setPressing(false)}
      // A busy button ignores presses (v46: \`if (b.classList.contains('busy')) return\`).
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      style={block ? { alignSelf: 'stretch' } : null}
    >
      <Animated.View style={shake}>
        <Animated.View
          style={[
            {
              height: box.height,
              borderRadius: box.radius,
              backgroundColor: shared ? palette.disabled : (box.bg ?? 'transparent'),
              borderWidth: shared ? 0 : (box.border?.width ?? 0),
              borderColor: box.border?.color,
              boxShadow: shared ? undefined : (box.shadow ?? undefined),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: p.justify as 'center' | 'flex-start',
              gap: n?.gap ?? p.gap,
              paddingTop: padding[0],
              paddingRight: padding[1],
              paddingBottom: padding[2],
              paddingLeft: padding[3],
              transform: [{ scale }],
            },
            transitionStyle(p.transitions),
          ]}
        >
          {glyph ? (
            <Animated.View
              style={[
                {
                  opacity: out ? out.opacity : 1,
                  transform: [{ translateY: out && !reduce ? out.translateY : 0 }],
                },
                transitionStyle(glyph.transitions),
              ]}
            >
              <ButtonGlyph icon={glyph} />
            </Animated.View>
          ) : null}
          <Animated.Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={MIN_FONT_SCALE}
            style={[
              v46FontStyle(font, text?.letterSpacing ?? box.letterSpacing),
              {
                flexShrink: 1,
                color,
                opacity: out ? out.opacity : 1,
                transform: [{ translateY: out && !reduce ? out.translateY : 0 }],
              },
              transitionStyle(text?.transitions ?? []),
            ]}
          >
            {label}
          </Animated.Text>
          {loader.mounted && busy.loader ? (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loader.shown ? 1 : 0,
                },
                transitionStyle(busy.loader.transitions),
              ]}
            >
              <Loader
                kind="meet"
                size={loaderSize?.[0] ?? busy.loader.size[0]}
                fills={PRIMARY.has(look) ? busy.loader.fills : undefined}
                delay={0}
                label={null}
              />
            </Animated.View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
