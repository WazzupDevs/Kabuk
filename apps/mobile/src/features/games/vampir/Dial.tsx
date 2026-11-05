import { Text } from 'react-native';

import { useSecondsLeft } from '@/features/games/useSecondsLeft';
import { tr } from '@/i18n/tr';
import { TABLE, TABLE_INK as INK, TABLE_MOTION as M, TABLE_TYPE } from '@/theme/vampirTable';

// The time's number in the brass dial at the table's middle (the panels' .num, .num.sm, .num.low;
// the dial itself is drawn with the candles, theme/vampirScene.ts → candlesSvg). Only the number:
// no minute marks, no ring of the time left (the owner's choice). Its last seconds in pink.
export function DialNumber({ endsAt, y, r }: { endsAt: number; y: number; r: number }) {
  const left = useSecondsLeft(endsAt);
  const small = r < BIG_DIAL;
  const style = small ? TABLE_TYPE.dialSmall : TABLE_TYPE.dial;
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
          left: TABLE.frame.cx - WIDTH / 2,
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
