import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  arriveAt,
  bandReachAt,
  fadeAt,
  ramp,
  stickyFadeAt,
  stickyLift,
  tabRowShift,
  tabShrinks,
} from '../motion/scrollMath';
import { AURA, barBandCss, barEdgeCss, MOTION } from './aura';

const mobile = join(import.meta.dirname, '..', '..');
const code = (file: string) => readFileSync(join(mobile, file), 'utf8');

// docs/design/iskelet.md → 3.1 to 3.3, 4.1 and 4.4: the screen's skeleton.
describe('scroll-driven motion is linear and clamped (4.1)', () => {
  it('ramps from 0 to 1 between its ends and holds outside them', () => {
    expect([0, 5, 27.5, 50, 80].map((y) => ramp(y, 5, 50))).toEqual([0, 0, 0.5, 1, 1]);
    // Linear: equal steps give equal changes.
    const d1 = ramp(20, 5, 50) - ramp(10, 5, 50);
    const d2 = ramp(40, 5, 50) - ramp(30, 5, 50);
    expect(d1).toBeCloseTo(d2);
  });

  it('runs on the UI thread: the scroll writes shared values only, no render on a frame', () => {
    const scroll = code('src/motion/ScrollScreen.tsx');
    expect(scroll).toMatch(
      /useAnimatedScrollHandler\(\(e\) => \{\s*y\.set\(e\.contentOffset\.y\);/,
    );
    for (const file of [
      'src/motion/ScrollScreen.tsx',
      'src/motion/TopBar.tsx',
      'src/motion/StickyField.tsx',
      'src/motion/scrollMath.ts',
    ]) {
      expect(code(file), file).not.toMatch(/withSpring|withTiming|Easing/);
    }
  });
});

describe('the top bar (3.1)', () => {
  it('a tab’s large title fades over 5 to 100 and shrinks to 0.94', () => {
    const [from, to] = MOTION.scroll.titleFade;
    expect([from, to]).toEqual([5, 100]);
    expect(fadeAt(0, from, to, AURA.topBar.largeTitleScale)).toEqual({ opacity: 1, scale: 1 });
    const end = fadeAt(100, from, to, AURA.topBar.largeTitleScale);
    expect(end.opacity).toBe(0);
    expect(end.scale).toBeCloseTo(0.94);
    expect(code('src/motion/TopBar.tsx')).toMatch(/transformOrigin: 'left bottom'/);
  });

  it('a page’s title fades over 5 to 50, the band comes in with it, its small title over 40 to 70', () => {
    expect(AURA.topBar.pageTitleFade).toEqual([5, 50]);
    expect(AURA.topBar.pageBarTitle).toEqual([40, 70]);
    expect(fadeAt(50, 5, 50).opacity).toBe(0);
    expect(arriveAt(39, 40, 70)).toBe(0);
    expect(arriveAt(70, 40, 70)).toBe(1);
  });

  it('the band: 118 high, the ground at 84 %, its last 28 % fading out', () => {
    expect(AURA.topBar.bandHeight).toBe(118);
    expect(AURA.light.bar.band).toBe('rgba(239, 247, 241, 0.84)');
    expect(AURA.light.ground).toBe('#EFF7F1');
    expect(barBandCss('light', 118)).toBe(
      'linear-gradient(180deg, rgba(239, 247, 241, 0.84) 0%, rgba(239, 247, 241, 0.84) 72%, rgba(239, 247, 241, 0) 100%)',
    );
    // Taller under a pinned field, the fade stays 28 % of 118 at its foot.
    expect(barBandCss('dark', 200)).toContain('rgba(0, 0, 0, 0.84) 83.5%');
  });

  it('PageTop is the `sayfa` bar: the 46 glass back button, the large title 34/800', () => {
    const page = code('src/components/PageTop.tsx');
    expect(page).toMatch(/<TopBarRow kind="sayfa"/);
    expect(page).toMatch(/<LargeTitle kind="sayfa"/);
    expect(code('src/motion/TopBar.tsx')).toMatch(/side=\{KIT\.size\.topBtn\}/);
    expect(code('src/theme/auraKit.ts')).toMatch(/\n {4}topBtn: 46,/);
    expect(code('src/theme/tokens.ts')).toMatch(
      /largeTitle: \{ font: 'display', size: 34, lineHeight: 42/,
    );
    // Screen finds it in `top` and draws its parts where they go.
    const screen = code('src/components/Screen.tsx');
    expect(screen).toMatch(/isValidElement\(top\) && top\.type === PageTop/);
    expect(screen).toMatch(/<ScrollScreen y=\{fixed \? null : y\}>/);
  });
});

describe('the sticky field (3.2)', () => {
  it('scrolls with the content until it pins, then stays', () => {
    expect(stickyLift(0, 120)).toBe(0);
    expect(stickyLift(120, 120)).toBe(0);
    expect(stickyLift(200, 120)).toBe(80);
    // Not measured yet: in place.
    expect(stickyLift(200, -1)).toBe(0);
  });

  it('what is above it fades and shrinks to 0.95 over the last 80 px', () => {
    const fade = MOTION.scroll.stickyFadePx;
    expect(fade).toBe(80);
    expect(stickyFadeAt(40, 120, fade, AURA.topBar.stickyScale)).toEqual({ opacity: 1, scale: 1 });
    const mid = stickyFadeAt(80, 120, fade, AURA.topBar.stickyScale);
    expect(mid.opacity).toBeCloseTo(0.5);
    expect(mid.scale).toBeCloseTo(0.975);
    const end = stickyFadeAt(120, 120, fade, AURA.topBar.stickyScale);
    expect(end.opacity).toBe(0);
    expect(end.scale).toBeCloseTo(0.95);
  });

  it('the band reaches below it as it pins', () => {
    expect(bandReachAt(0, 120, 30)).toBe(-30);
    expect(bandReachAt(105, 120, 30)).toBe(-15);
    expect(bandReachAt(120, 120, 30)).toBe(-0);
    expect(bandReachAt(500, -1, 30)).toBe(0);
  });
});

describe('the tab bar (3.3)', () => {
  const t = MOTION.tabMin;
  const step = (shrunk: boolean, y: number, dy: number) =>
    tabShrinks(shrunk, y, dy, t.thresholdPx, t.speedPx, t.openPx);

  it('shrinks past 120 when scrolled down faster than 3 px a frame', () => {
    expect(step(false, 200, 4)).toBe(true);
    expect(step(false, 200, 3)).toBe(false);
    expect(step(false, 110, 10)).toBe(false);
    // A slow scroll down keeps it as it is.
    expect(step(true, 300, 1)).toBe(true);
  });

  it('opens scrolled up or under 50', () => {
    expect(step(true, 300, -1)).toBe(false);
    expect(step(true, 49, 5)).toBe(false);
  });

  it('shrinks from 350 to 76 around the chosen tab', () => {
    expect(t.widths).toEqual([350, 76]);
    const tab = (350 - 2 * AURA.tabBar.padding) / 5;
    expect(tabRowShift(0, 3, tab, AURA.tabBar.padding, 76)).toBe(AURA.tabBar.padding);
    // Shrunk, the chosen tab's centre is the bar's.
    const x = tabRowShift(1, 3, tab, AURA.tabBar.padding, 76);
    expect(x + 3.5 * tab).toBeCloseTo(38);
  });

  it('labelled: icon 22, label 10.5, the chosen one green in its 12 % pill, on springs.tabLead', () => {
    expect(AURA.tabBar.iconLabelled).toBe(22);
    expect(code('src/theme/tokens.ts')).toMatch(/tabLabel: \{ font: 'display', size: 10\.5,/);
    expect(AURA.light.tab.pill).toBe('rgba(14, 135, 69, 0.12)');
    expect(AURA.light.tab.onInk).toBe('#0E8745');
    expect(code('src/motion/TabBar.tsx')).toMatch(/const spring = MOTION\.springs\.tabLead;/);
    expect(MOTION.springs.tabLead).toEqual({ stiffness: 420, damping: 30, mass: 1 });
  });

  it('its bottom edge: 160 high, from clear to the ground at 92 %', () => {
    expect(AURA.tabBar.edgeHeight).toBe(160);
    expect(barEdgeCss('light')).toBe(
      'linear-gradient(180deg, rgba(239, 247, 241, 0) 0%, rgba(239, 247, 241, 0.92) 100%)',
    );
  });
});

describe('page transitions (4.4)', () => {
  it('every stack slides in as iOS does and goes back with a swipe from the edge', () => {
    const stack = code('src/lib/stackOptions.ts');
    expect(stack).toMatch(/animation: 'ios_from_right'/);
    expect(stack).toMatch(/gestureEnabled: true/);
    expect(stack).toMatch(/fullScreenGestureEnabled: true/);
  });
});
