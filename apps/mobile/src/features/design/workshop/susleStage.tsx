import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Btn, T, useKit } from '@/aura/kit';
import { CachedSvg } from '@/components/CachedSvg';
import { tr } from '@/i18n/tr';
import { CAPSULE_EDIT } from '@/theme/capsuleEdit';
import { stillSvg } from '@/theme/capsuleFx';
import { lookGround, lookStage } from '@/theme/capsuleLook';
import { gradientStyle } from '@/theme/gradient';
import { SUSLE_STAGE } from '@/theme/susleStage';
import { SPACING } from '@/theme/tokens';

// Atölye draft `susleStage` (the owner's ask, 22 Kasım): Süsle's scene with three grounds behind
// the large capsule. A today (the page's ground), B a night card with a light behind the capsule
// and a few still stars, C a soft purple light round the circle only. A sample look wearing Ay
// diademi (white and silver, the hardest to see); drawn still, nothing reads the server.

export type StageGround = 'today' | 'night' | 'glow';

const LOOK = 'c:mor e:klasik x:aydiademi';
// The stage drawing's box (lookStage: 60 × 75 units, the circle 48), at most 176 across, smaller in
// a narrow column (Yan yana).
const CIRCLE_MAX = 176;
const noop = () => {};

export function SusleStageDraft({ ground, width }: { ground: StageGround; width: number }) {
  const { c } = useKit();
  const S = SUSLE_STAGE;
  const xml = stillSvg(lookStage(LOOK));
  const CIRCLE = Math.min(CIRCLE_MAX, (width - SPACING[6]) * 0.62);
  const UNIT = CIRCLE / 48;
  const HEIGHT = Math.round(CIRCLE * 1.7);
  const each = Math.min(CAPSULE_EDIT.actions.each, (width - CAPSULE_EDIT.actions.gap) / 2);
  const figure = { width: 60 * UNIT, height: 75 * UNIT };
  const night = ground === 'night';
  const t = tr.design.workshop.susleStage;
  return (
    <View style={{ width, gap: SPACING[3] }}>
      <View
        style={{
          height: HEIGHT,
          marginHorizontal: night ? SPACING[3] : 0,
          borderRadius: night ? S.night.radius : 0,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: SPACING[3],
          ...(night
            ? { ...gradientStyle(S.night.ground), borderWidth: 1, borderColor: S.night.edge }
            : null),
        }}
      >
        {night ? <Stars width={width - SPACING[3] * 2} height={HEIGHT} /> : null}
        {ground === 'glow' ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: CIRCLE * 1.7,
              height: CIRCLE * 1.7,
              bottom: SPACING[3] + CIRCLE / 2 - (CIRCLE * 1.7) / 2,
              ...gradientStyle(S.glow.ground),
            }}
          />
        ) : null}
        <View style={{ width: figure.width, height: figure.height }}>
          {/* The circle's ground, drawn under the figure as the stage draws it. */}
          <View
            style={{
              position: 'absolute',
              left: 6 * UNIT,
              top: 26 * UNIT,
              width: CIRCLE,
              height: CIRCLE,
              borderRadius: CIRCLE / 2,
              backgroundColor: lookGround(LOOK),
            }}
          />
          <CachedSvg xml={xml} width={figure.width} height={figure.height} />
        </View>
      </View>
      <View
        style={{ flexDirection: 'row', justifyContent: 'center', gap: CAPSULE_EDIT.actions.gap }}
      >
        <View style={{ width: each }}>
          <Btn sm block variant="glassy" icon="reply" label={tr.capsule.clearAll} onPress={noop} />
        </View>
        <View style={{ width: each }}>
          <Btn
            sm
            block
            variant="glassy"
            icon="shuffle"
            label={tr.capsule.shuffleShort}
            onPress={noop}
          />
        </View>
      </View>
      <T v="fine" color={c.muted}>
        {ground === 'today' ? t.noteA : ground === 'night' ? t.noteB : t.noteC}
      </T>
    </View>
  );
}

function Stars({ width, height }: { width: number; height: number }) {
  const S = SUSLE_STAGE;
  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0 }}
      importantForAccessibility="no-hide-descendants"
    >
      {S.stars.map(([x, y, r, soft]) => (
        <Circle
          key={`${x}-${y}`}
          cx={x * width}
          cy={y * height}
          r={r}
          fill={soft ? S.night.starSoft : S.night.star}
        />
      ))}
    </Svg>
  );
}
