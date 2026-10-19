import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  drawingFor,
  LOADER_SHOW_AFTER_MS,
  loaderMotion,
  type StateKind,
  stateMotion,
  STILL_MOTION,
} from '@/theme/markMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import { Button, type IconName } from './Button';
import { useLoopActive } from './Loader';
import { MotionMark } from './Mark';
import { Text } from './Text';

export type { StateKind };

type Props = {
  // The living mark (the skall design system → StateView): `empty` the missing table waits as a
  // dashed outline, `error` the capsules collide and no overlap forms, `offline` the second
  // capsule flickers out and comes back, `loading` Tahterevalli. Or an icon in a disc.
  kind?: StateKind;
  icon?: IconName;
  title?: string;
  body: string;
  // `loading`: the action is running (a retry reloading); the button waits and takes no second
  // press.
  action?: { label: string; onPress: () => void; loading?: boolean };
};

const MARK_SIZE = SPACING[16] + SPACING[8];

// The living mark alone, `size` across (the lobby's empty card: 64).
export function StateMark({ kind, size = MARK_SIZE }: { kind: StateKind; size?: number }) {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const m = drawingFor(size);
  const state = useMemo(() => {
    if (kind === 'loading') {
      return {
        scene: { m, dx: m.dx, dy: m.dy },
        motions: [reduce ? STILL_MOTION : loaderMotion('seesaw', m)],
        outline: false,
        flare: false,
      };
    }
    return stateMotion(kind, m, reduce);
  }, [kind, reduce, m]);
  return (
    <MotionMark
      key={`${kind}:${reduce ? 'still' : 'move'}`}
      size={size}
      scene={state.scene}
      motions={state.motions}
      active={active}
      outline={state.outline}
      flare={state.flare}
    />
  );
}

// A screen's empty, error, offline or loading state: the living mark (or an icon disc), a short
// explanation and at most one action.
export function EmptyState({ kind, icon, title, body, action }: Props) {
  const { colors, shape } = useTheme();
  // Loading shows 300 ms into the wait, like every loader (a quick answer shows nothing).
  const [shown, setShown] = useState(kind !== 'loading');
  useEffect(() => {
    if (kind !== 'loading') return undefined;
    const id = setTimeout(() => setShown(true), LOADER_SHOW_AFTER_MS);
    return () => clearTimeout(id);
  }, [kind]);
  return (
    <View
      style={{ opacity: shown || kind !== 'loading' ? 1 : 0 }}
      className="items-center gap-3 py-8"
      accessibilityRole={kind === 'loading' ? 'progressbar' : undefined}
      accessibilityLabel={kind === 'loading' ? body : undefined}
    >
      {kind ? (
        <View className="mb-1">
          <StateMark kind={kind} />
        </View>
      ) : null}
      {icon ? (
        <View
          className="items-center justify-center"
          style={{
            width: TOUCH.tab,
            height: TOUCH.tab,
            borderRadius: shape.radius.pill,
            backgroundColor: colors.surface2,
          }}
        >
          <Ionicons name={icon} size={ICON.lg} color={colors.muted} />
        </View>
      ) : null}
      {title ? (
        <Text variant="heading" align="center">
          {title}
        </Text>
      ) : null}
      <Text
        variant={kind === 'loading' ? 'fine' : kind ? 'bodyStrong' : 'body'}
        tone={kind && kind !== 'loading' ? 'text' : 'muted'}
        align="center"
      >
        {body}
      </Text>
      {action ? (
        <View className="mt-2 self-stretch">
          <Button
            variant="neutral"
            label={action.label}
            onPress={action.onPress}
            loading={action.loading}
          />
        </View>
      ) : null}
    </View>
  );
}
