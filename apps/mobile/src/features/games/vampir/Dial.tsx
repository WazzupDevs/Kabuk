import { useEffect, useState } from 'react';
import { Text } from 'react-native';

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

// The whole seconds left, again at each second's turn.
function useSecondsLeft(endsAt: number): number {
  const read = () => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  const [left, setLeft] = useState(read);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(now);
      if (now > 0) timer = setTimeout(tick, ((endsAt - Date.now()) % 1000) + 5);
    };
    tick();
    return () => clearTimeout(timer);
  }, [endsAt]);
  return left;
}
