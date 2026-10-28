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
import { ICON, SPACING } from '@/theme/tokens';

import { Button, type IconName } from './Button';
import { useLoopActive } from './Loader';
import { MotionMark } from './Mark';
import { Text } from './Text';
import { AppIcon } from './AppIcon';

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
// Empty, loading and error look alike: the state's disc (the moving mark, or an icon), the title and
// the note under it, centred, and the action under them; no card around it.
const DISC_MARK = SPACING[10];

export function EmptyState({ kind, icon, title, body, action }: Props) {
  const [shown, setShown] = useState(kind !== 'loading');
  useEffect(() => {
    if (kind !== 'loading') return undefined;
    const id = setTimeout(() => setShown(true), LOADER_SHOW_AFTER_MS);
    return () => clearTimeout(id);
  }, [kind]);
  const disc = (
    <View
      className="items-center justify-center"
      // The mark or icon on its own, no disc behind it (the owner's call, 28 Ekim).
      style={{ width: SPACING[16], height: SPACING[16] }}
    >
      {kind ? (
        <StateMark kind={kind} size={DISC_MARK} />
      ) : (
        <AppIcon name={icon ?? 'ellipsis-horizontal'} size={ICON.md} color={BRAND.purple} />
      )}
    </View>
  );
  return (
    <View
      style={{ opacity: shown || kind !== 'loading' ? 1 : 0 }}
      accessibilityRole={kind === 'loading' ? 'progressbar' : undefined}
      accessibilityLabel={kind === 'loading' ? body : undefined}
    >
      {/* No frame, centred (the owner's call, 27 Ekim: an empty or warning note sits on the screen,
          not in a card). */}
      <View
        className="items-center"
        style={{ gap: SPACING[3], paddingVertical: SPACING[6], paddingHorizontal: SPACING[4] }}
      >
        {disc}
        <View className="items-center self-stretch" style={{ gap: SPACING[1] }}>
          {title ? (
            <Text variant="heading" align="center">
              {title}
            </Text>
          ) : null}
          <Text variant={title ? 'fine' : 'bodyStrong'} align="center">
            {body}
          </Text>
        </View>
        {action ? (
          <View className="mt-1 self-center">
            <Button
              variant="secondary"
              label={action.label}
              onPress={action.onPress}
              loading={action.loading}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
