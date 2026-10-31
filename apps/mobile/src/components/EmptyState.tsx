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
import { EmptyMark } from '@/aura/EmptyMark';
import { T } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';

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
  // The lobby's smaller empty state (docs/design/aura → Mekan: 18 / 14, 18 above).
  small?: boolean;
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

export function EmptyState({ kind, icon, title, body, action, small }: Props) {
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
  if (kind === 'empty') return <Empty title={title} body={body} action={action} small={small} />;
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

// The empty state (docs/design/aura, aura 31): the still sign, the title and the note centred,
// on the screen without a card; at most one action under them.
function Empty({ title, body, action, small }: Pick<Props, 'title' | 'body' | 'action' | 'small'>) {
  return (
    <View
      style={{
        alignItems: 'center',
        gap: KIT.size.emptyGap,
        paddingTop: small ? KIT.size.emptyTopSm : KIT.size.emptyTop,
        paddingHorizontal: KIT.size.emptyPadX,
      }}
    >
      <EmptyMark />
      {title ? (
        <T
          v={small ? 'sec' : 'secLg'}
          center
          accessibilityRole="header"
          style={{ marginTop: KIT.size.emptyTitleTop }}
        >
          {title}
        </T>
      ) : null}
      <T
        v={small ? 'note' : 'emptyNote'}
        strong={!title}
        center
        style={title ? null : { marginTop: KIT.size.emptyTitleTop }}
      >
        {body}
      </T>
      {action ? (
        <View style={{ marginTop: SPACING[3] }}>
          <Button
            variant="secondary"
            label={action.label}
            onPress={action.onPress}
            loading={action.loading}
          />
        </View>
      ) : null}
    </View>
  );
}
