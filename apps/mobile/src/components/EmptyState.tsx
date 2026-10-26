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
import { BRAND } from '@/theme/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { Button, type IconName } from './Button';
import { Card } from './Card';
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
// skall tuvali (skall.css → `.card.state`): empty, loading and error are the same card, the state's
// disc on the left (the moving mark, or an icon) and the title and note beside it; with an action the
// card stacks (`.state.col`) and the button takes the width.
const DISC_MARK = SPACING[10];

export function EmptyState({ kind, icon, title, body, action }: Props) {
  const { colors, shape } = useTheme();
  const [shown, setShown] = useState(kind !== 'loading');
  useEffect(() => {
    if (kind !== 'loading') return undefined;
    const id = setTimeout(() => setShown(true), LOADER_SHOW_AFTER_MS);
    return () => clearTimeout(id);
  }, [kind]);
  const disc = (
    <View
      className="items-center justify-center"
      style={{
        width: SPACING[12],
        height: SPACING[12],
        borderRadius: shape.radius.pill,
        backgroundColor: colors.surface2,
      }}
    >
      {kind ? (
        <StateMark kind={kind} size={DISC_MARK} />
      ) : (
        <Ionicons name={icon ?? 'ellipsis-horizontal'} size={ICON.md} color={BRAND.purple} />
      )}
    </View>
  );
  return (
    <View
      style={{ opacity: shown || kind !== 'loading' ? 1 : 0 }}
      accessibilityRole={kind === 'loading' ? 'progressbar' : undefined}
      accessibilityLabel={kind === 'loading' ? body : undefined}
    >
      <Card>
        <View
          className={action ? 'items-start' : 'flex-row items-center'}
          style={{ gap: action ? SPACING[3] : SPACING[3] + SPACING[0.5] }}
        >
          {disc}
          <View className={action ? 'self-stretch' : 'flex-1'} style={{ gap: SPACING[0.5] }}>
            {title ? <Text variant="heading">{title}</Text> : null}
            <Text variant={title ? 'fine' : 'bodyStrong'}>{body}</Text>
          </View>
          {action ? (
            <View className="self-stretch">
              <Button
                variant="secondary"
                label={action.label}
                onPress={action.onPress}
                loading={action.loading}
              />
            </View>
          ) : null}
        </View>
      </Card>
    </View>
  );
}
