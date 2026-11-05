import { Text } from 'react-native';

import { useSecondsLeft } from '@/features/games/useSecondsLeft';
import { tr } from '@/i18n/tr';
import {
  scaleType,
  TABLE,
  TABLE_INK as INK,
  TABLE_MOTION as M,
  TABLE_TYPE,
} from '@/theme/vampirTable';

import { type DialAt } from './RoundTable';

// The time's number in the brass dial at the table's middle (the panels' .num, .num.sm, .num.low;
// the dial itself is drawn with the candles, theme/vampirScene.ts → candlesSvg). Only the number:
// no minute marks, no ring of the time left (the owner's choice). Its last seconds in pink. `big`
// the large type's scale (.ph.big .num.sm: 19 on a 26 line).
export function DialNumber({ endsAt, at, big }: { endsAt: number; at: DialAt; big?: number }) {
  const left = useSecondsLeft(endsAt);
  const { y, r } = at;
  const small = r < BIG_DIAL;
  const style = big
    ? scaleType(TABLE_TYPE.bigDial, big)
    : small
      ? TABLE_TYPE.dialSmall
      : TABLE_TYPE.dial;
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <Text
      accessible
      accessibilityRole="timer"
      accessibilityLabel={tr.vampir.timeLeftLabel(clock)}
      maxFontSizeMultiplier={1}
      style={[
        style,
        {
          position: 'absolute',
          left: (at.x ?? TABLE.frame.cx) - WIDTH / 2,
          width: WIDTH,
          top: y - (style.lineHeight ?? 0) / 2,
          textAlign: 'center',
          color: left <= M.lowSeconds ? INK.dialLow : INK.dial,
        },
      ]}
    >
      {clock}
    </Text>
  );
}
const WIDTH = 60;
const BIG_DIAL = 30;
