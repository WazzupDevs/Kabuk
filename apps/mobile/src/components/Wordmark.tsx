import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';

import { APP_NAME } from '@shared/brand.ts';

import { BRAND } from '@/theme/brand';
import { useTheme } from '@/theme/ThemeProvider';

// The "ska" of the wordmark as outlines (Poppins ExtraBold, 1000 units per em) and the box the
// whole wordmark sits in; the two l are capsules, the second 130 units right of the first.
const SKA =
  'M295 1007Q219 1007 159.5 981.5Q100 956 65.5 911.5Q31 867 27 811L27 811L217 811' +
  'Q221 838 242 853Q263 868 294 868L294 868Q318 868 332 858Q346 848 346 832L346 832' +
  'Q346 811 323 801Q300 791 247 779L247 779Q187 767 147 752Q107 737 77.5 703' +
  'Q48 669 48 611L48 611Q48 561 75 520.5Q102 480 154.5 456Q207 432 281 432L281 432' +
  'Q391 432 454 486Q517 540 527 628L527 628L350 628Q345 601 326.5 586.5' +
  'Q308 572 277 572L277 572Q253 572 240.5 581Q228 590 228 606L228 606Q228 626 251 636.5' +
  'Q274 647 325 658L325 658Q386 671 426.5 687Q467 703 497.5 738.5Q528 774 528 835L528 835' +
  'Q528 884 499.5 923Q471 962 418.5 984.5' +
  'Q366 1007 295 1007L295 1007ZM1214 1000L975 1000L820 770L820 1000L624 1000L624 260L820 26' +
  '0L820 659L975 439L1210 439L989 721L1214 1000ZM1239 719Q1239 632 1270.5 567' +
  'Q1302 502 1356.5 467Q1411 432 1478 432L1478 432Q1536 432 1578 455' +
  'Q1620 478 1643 517L1643 517L1643 439L1839 439L1839 1000L1643 1000L1643 922' +
  'Q1620 961 1577.5 984Q1535 1007 1478 1007L1478 1007Q1411 1007 1356.5 972' +
  'Q1302 937 1270.5 871.5Q1239 806 1239 719L1239 719ZM1643 719Q1643 665 1613.5 634' +
  'Q1584 603 1541 603L1541 603Q1497 603 1468 633.5Q1439 664 1439 719L1439 719' +
  'Q1439 773 1468 804.5Q1497 836 1541 836L1541 836Q1584 836 1613.5 805' +
  'Q1643 774 1643 719L1643 719Z';
const BOX = { x: 27, y: 250, w: 2254, h: 757 } as const;
const L = { x: 1951, y: 250, w: 200, h: 757, offset: 130 } as const;
// Smallest height; below it the l pills lose their overlap.
export const WORDMARK_MIN_HEIGHT = 20;

type Props = {
  // In px: login screens 24, "Güncelleme gerekli" 32, Profil → Hakkında 20.
  height: number;
  // On ink or a featured card: letters and overlap white.
  onInk?: boolean;
};

// The in-app wordmark (the skall design system → Wordmark): its colours, proportions and
// capsules never change. Keep at least one l width (26 % of the height) clear around it.
export function Wordmark({ height, onInk }: Props) {
  const { colors } = useTheme();
  const h = Math.max(height, WORDMARK_MIN_HEIGHT);
  const ink = onInk ? BRAND.white : colors.text;
  const overlap = onInk ? BRAND.white : colors.overlap;
  const second = { ...L, x: L.x + L.offset };
  return (
    <Svg
      width={(h * BOX.w) / BOX.h}
      height={h}
      viewBox={`${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={APP_NAME}
    >
      <Defs>
        <ClipPath id="first-l">
          <Rect x={L.x} y={L.y} width={L.w} height={L.h} rx={L.w / 2} />
        </ClipPath>
      </Defs>
      <Path d={SKA} fill={ink} />
      <Rect x={L.x} y={L.y} width={L.w} height={L.h} rx={L.w / 2} fill={BRAND.purple} />
      <Rect x={second.x} y={second.y} width={L.w} height={L.h} rx={L.w / 2} fill={BRAND.pink} />
      <Rect
        x={second.x}
        y={second.y}
        width={L.w}
        height={L.h}
        rx={L.w / 2}
        fill={overlap}
        clipPath="url(#first-l)"
      />
    </Svg>
  );
}
