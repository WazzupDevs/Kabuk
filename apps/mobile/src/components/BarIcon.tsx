import { useId } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import {
  BAR,
  BAR_ICON_COLORS,
  BAR_ICONS,
  type BarIconKind,
  barRect,
  type BarState,
  BELL,
  BELL_BADGE,
  SLOT,
} from '@/theme/barIcons';
import { ON_GAME } from '@/theme/gameColors';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

import { Text } from './Text';

function Bar({ p, thickness, fill }: { p: BarState; thickness: number; fill: string }) {
  const r = barRect(p, thickness);
  return (
    <Rect
      x={r.x}
      y={r.y}
      width={r.width}
      height={r.height}
      rx={r.rx}
      fill={fill}
      transform={`rotate(${r.rotate.join(' ')})`}
    />
  );
}

type Props = {
  kind: BarIconKind;
  size?: number;
  // The lobby icon's bar and slot (the label's colour); the others carry their own colours.
  color?: string;
};

// An icon from the bar family (src/theme/barIcons.ts): plus, cross and check in two colours with a
// dark crossing; the lobby icon (a bar and a dashed slot) and its open "minus" in the label's
// colour. Decorative: the button around it carries the label.
export function BarIcon({ kind, size = ICON.md, color }: Props) {
  const { colors } = useTheme();
  const clip = `bar${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const ink = color ?? colors.text;
  let body;
  if (kind === 'lobby' || kind === 'minus') {
    const d = BAR_ICONS[kind];
    const s = barRect(d.s, BAR.thick);
    body = (
      <>
        <Bar p={d.a} thickness={BAR.thick} fill={ink} />
        <Rect
          x={s.x}
          y={s.y}
          width={s.width}
          height={s.height}
          rx={s.rx}
          fill="none"
          stroke={ink}
          strokeWidth={SLOT.stroke}
          strokeDasharray={SLOT.dash.join(' ')}
          opacity={d.s.o}
          transform={`rotate(${s.rotate.join(' ')})`}
        />
      </>
    );
  } else {
    const d = BAR_ICONS[kind];
    const c = BAR_ICON_COLORS[kind];
    const a = barRect(d.a, BAR.thin);
    body = (
      <>
        <Defs>
          <ClipPath id={clip}>
            <Rect
              x={a.x}
              y={a.y}
              width={a.width}
              height={a.height}
              rx={a.rx}
              transform={`rotate(${a.rotate.join(' ')})`}
            />
          </ClipPath>
        </Defs>
        <Bar p={d.a} thickness={BAR.thin} fill={c.a} />
        <Bar p={d.b} thickness={BAR.thin} fill={c.b} />
        <G clipPath={`url(#${clip})`}>
          <Bar p={d.b} thickness={BAR.thin} fill={c.x} />
        </G>
      </>
    );
  }
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {body}
      </Svg>
    </View>
  );
}

type BellProps = {
  // Unread notifications; none shows no badge.
  unread?: number;
  size?: number;
};

// The Mesajlar bell from the bar family (src/theme/barIcons.ts) with its unread badge (v43:
// .nbell, .nb-bdg). The button around it carries the label and the count ("Bildirimler, 3 yeni").
export function BellIcon({ unread = 0, size = ICON.lg }: BellProps) {
  const { colors } = useTheme();
  const clip = `bell${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const b = BELL.bar;
  const c = BELL.clapper;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Defs>
          <ClipPath id={clip}>
            <Path d={BELL.dome} />
          </ClipPath>
        </Defs>
        <Path d={BELL.dome} fill={BELL.colors.dome} />
        <Rect x={b.x} y={b.y} width={b.width} height={b.height} rx={b.rx} fill={BELL.colors.bar} />
        <G clipPath={`url(#${clip})`}>
          <Rect
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            rx={b.rx}
            fill={BELL.colors.overlap}
          />
        </G>
        <Rect
          x={c.x}
          y={c.y}
          width={c.width}
          height={c.height}
          rx={c.rx}
          fill={BELL.colors.clapper}
        />
      </Svg>
      {unread > 0 ? (
        <View
          className="absolute items-center justify-center"
          style={{
            top: -BELL_BADGE.lift,
            right: -BELL_BADGE.lift,
            minWidth: BELL_BADGE.minWidth,
            height: BELL_BADGE.height,
            paddingHorizontal: BELL_BADGE.lift + BELL_BADGE.ring,
            borderRadius: BELL_BADGE.height / 2,
            backgroundColor: BELL_BADGE.color,
            borderWidth: BELL_BADGE.ring,
            borderColor: colors.canvas,
          }}
        >
          <Text variant="caption" color={ON_GAME} tabular>
            {unread > 99 ? '99+' : String(unread)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
