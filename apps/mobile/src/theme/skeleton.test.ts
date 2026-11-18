import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  arriveAt,
  bandReachAt,
  barNameX,
  collapseAt,
  coverShift,
  fadeAt,
  flightAt,
  flyFace,
  flyX,
  flyY,
  ramp,
  riseInContent,
  stickyBandAt,
  stickyFadeAt,
  stickyLift,
  stickyShrinkAt,
  tabRowShift,
  tabShrinks,
} from '../motion/scrollMath';
import { AURA, barBandCss, barEdgeCss, MOTION } from './aura';
import { PROFILE_PAGE } from './profileCover';

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

  it('PageTop is the `sayfa` bar: the 44 glass back button, the large title 34/800', () => {
    const page = code('src/components/PageTop.tsx');
    expect(page).toMatch(/<TopBarRow kind="sayfa"/);
    expect(page).toMatch(/<LargeTitle kind="sayfa"/);
    expect(code('src/motion/TopBar.tsx')).toMatch(/side=\{side \?\? KIT\.size\.topBtn\}/);
    expect(code('src/theme/auraKit.ts')).toMatch(/\n {4}topBtn: 44,/);
    expect(code('src/theme/tokens.ts')).toMatch(
      /largeTitle: \{ font: 'display', size: 34, lineHeight: 42/,
    );
    // Screen finds it in `top` and draws its parts where they go.
    const screen = code('src/components/Screen.tsx');
    expect(screen).toMatch(/isValidElement\(top\) && top\.type === PageTop/);
    // A page scrolls its title with its content even where it is otherwise still (PF-63, PF-73).
    expect(screen).toMatch(/const overlay = kind !== null && \(!fixed \|\| page !== null\);/);
    expect(screen).toMatch(/<ScrollScreen y=\{fixed && !overlay \? null : y\}>/);
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

  it("Keşfet's capsule thins from 54 to 48, linearly, over the last 80 px before it pins (5.1)", () => {
    const fade = MOTION.scroll.stickyFadePx;
    // Read from the source: the kit's values bring React Native's types into this program.
    expect(code('src/theme/auraKit.ts')).toMatch(/capsule: 54,\s+capsulePinned: 48,/);
    const [capsule, capsulePinned] = [54, 48];
    expect(stickyShrinkAt(40, 120, fade, capsule, capsulePinned)).toBe(54);
    expect(stickyShrinkAt(80, 120, fade, capsule, capsulePinned)).toBeCloseTo(51);
    expect(stickyShrinkAt(120, 120, fade, capsule, capsulePinned)).toBe(48);
    expect(stickyShrinkAt(400, 120, fade, capsule, capsulePinned)).toBe(48);
    expect(stickyShrinkAt(400, -1, fade, capsule, capsulePinned)).toBe(54);
  });

  it('its band comes in over the last 80 px before it pins; none at rest where it starts pinned', () => {
    const fade = MOTION.scroll.stickyFadePx;
    expect(stickyBandAt(0, -1, fade)).toBe(0);
    expect(stickyBandAt(120 - fade, 120, fade)).toBe(0);
    expect(stickyBandAt(120, 120, fade)).toBe(1);
    // PF-41: a field already at its place (Mesajlar) has no band until the list is scrolled.
    expect(stickyBandAt(0, 0, fade)).toBe(0);
    expect(stickyBandAt(fade, 0, fade)).toBe(1);
  });

  it('a page’s title is drawn once on a scrolling screen (PF-64, PF-71)', () => {
    expect(code('src/components/Screen.tsx')).toMatch(
      /const flowTop = overlay\s+\? top === page\s+\? null/,
    );
  });

  it('the band reaches below it as it pins', () => {
    expect(bandReachAt(0, 120, 30)).toBe(-30);
    expect(bandReachAt(105, 120, 30)).toBe(-15);
    expect(bandReachAt(120, 120, 30)).toBe(-0);
    expect(bandReachAt(500, -1, 30)).toBe(0);
  });
});

describe('the cover (kapak, 5.2)', () => {
  it('moves at 0.45 of the scroll, linearly, and stays when pulled past the top', () => {
    // Read from the source: the kit's values bring React Native's types into this program.
    expect(code('src/theme/auraKit.ts')).toMatch(
      /venueCover: \{\s+height: 330,\s+speed: 0\.45,\s+shadeHeight: 130,/,
    );
    expect(code('src/theme/auraKit.ts')).toMatch(/band: \[240, 280\],\s+barTitle: \[300, 330\],/);
    expect(coverShift(0, 0.45)).toBe(-0);
    expect(coverShift(100, 0.45)).toBeCloseTo(-45);
    expect(coverShift(200, 0.45) - coverShift(100, 0.45)).toBeCloseTo(-45);
    expect(coverShift(-40, 0.45)).toBe(-0);
    expect(code('src/motion/Cover.tsx')).not.toMatch(/withSpring|withTiming|Easing/);
  });
});

describe("another person's profile (kapak, 5.6)", () => {
  const O = PROFILE_PAGE.other;
  const page = code('src/features/profile/FriendPage.tsx');
  const shell = code('src/features/profile/OtherProfile.tsx');
  it('the cover at 0.5, the photo to 0.75 over 60–180 and out over 120–190', () => {
    expect(O.speed).toBe(0.5);
    expect(O.faceShrink).toEqual([60, 180]);
    expect(O.faceScale).toBe(0.75);
    expect(O.faceFade).toEqual([120, 190]);
    expect(PROFILE_PAGE.face).toBe(124);
    expect(PROFILE_PAGE.ring).toBe(4);
    expect(shell).toMatch(/<Cover height=\{coverHeight\} speed=\{O\.speed\}>/);
    expect(shell).toMatch(/<ScrollFade\s+fade=\{O\.faceFade\}\s+shrink=\{O\.faceShrink\}/);
    expect(shell).toMatch(/<BarArrive from=\{O\.bar\[0\]\} to=\{O\.bar\[1\]\}[ >]/);
  });
  it('"Arkadaşlıktan çıkar" in the menu only, the DM menu grown from the three dots', () => {
    expect(page).not.toMatch(/features\/friends\/FriendActions/);
    expect(shell).toMatch(/<Menu anchor=\{anchor\}/);
    expect(page).toMatch(/label=\{tr\.friends\.removeFriend\}/);
    // No capsule and no nick on another person's profile (rule 4).
    expect(page + shell).not.toMatch(/capsuleNick|capsuleLook|LivingLook/);
  });
});

describe('the own profile in one flow (ProfilBen, ProfilBenKaydir)', () => {
  const OWN = PROFILE_PAGE.own;
  const page = code('src/features/profile/OwnProfile.tsx');

  it('the cover 236 with its foot 28 round, the photo 112 over it by 60', () => {
    expect([OWN.cover, OWN.coverRadius, OWN.photo, OWN.photoOver]).toEqual([236, 28, 112, 60]);
    expect(page).toMatch(/marginTop: -OWN\.photoOver/);
  });

  it('the band comes in over 256–316 and the small photo with the name over 296–330', () => {
    expect(OWN.band).toEqual([256, 316]);
    expect(OWN.bar).toEqual([296, 330]);
    expect(OWN.barFace).toBe(36);
    expect(page).toMatch(/<BarBand from=\{OWN\.band\[0\]\} to=\{OWN\.band\[1\]\}/);
    expect(page).toMatch(/<BarArrive from=\{OWN\.bar\[0\]\} to=\{OWN\.bar\[1\]\}/);
  });

  it('no panel, no handle and no flying photo: one photo, one name on the page', () => {
    expect(page).not.toMatch(/RiseLayer|FlyingFace|FlyingName|snapToOffsets/);
    expect(page).not.toMatch(/react-native-reanimated/);
  });
});

// The flight maths (motion/scrollMath), kept with the numbers of the flight that used them (the old
// own profile: arriving at 316, the photo 112 to 30 across): the maths stays exported for a screen
// that flies a face into its bar.
describe('a face flying into the bar (scrollMath)', () => {
  const flyAt = (y: number) => {
    const t = flightAt(y, 316);
    return {
      t,
      face: {
        x: flyX(t, 195, 152),
        y: flyY(y, t, 232, 73, 0.35),
        side: 112 * flyFace(t, 112, 30, 4, 1.5).disc,
      },
    };
  };

  it('by t = clamp(y / 316), linearly', () => {
    const start = flyAt(0);
    expect(start.face).toEqual({ x: 195, y: 232, side: 112 });
    const end = flyAt(316);
    expect(end.face.x).toBeCloseTo(152);
    expect(end.face.y).toBeCloseTo(73);
    expect(end.face.side).toBeCloseTo(30);
    expect(flyAt(500)).toEqual(end);
    const mid = flyAt(158);
    expect(mid.t).toBe(0.5);
    expect(mid.face.y).toBeCloseTo((232 - 0.35 * 158 * 0.5) * 0.5 + 73 * 0.5);
    const k = flyFace(1, 112, 30, 4, 1.5);
    expect(104 * k.face).toBeCloseTo(27);
  });

  it('rises in its content by y less its own 0.35·y', () => {
    expect(riseInContent(100, 0.35) - 100).toBeCloseTo(-35);
    expect(riseInContent(-30, 0.35)).toBe(-30);
  });

  it('in the bar the name keeps clear of the photo and of the button', () => {
    expect(barNameX(214, 30, 175, 316)).toBe(214);
    expect(barNameX(214, 60, 175, 316)).toBe(235);
    expect(barNameX(214, 100, 175, 316)).toBeCloseTo(245.5);
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

  // Yeni arayüz tuvali (Kesfet `.tb`, `.ti`, 16 Kasım) in place of 3.3's green-toned pill.
  it('labelled: bar 60, tab 50, icon 20, label 10, the chosen one white in its ink pill, on springs.tabLead', () => {
    expect([AURA.tabBar.height, AURA.tabBar.pillHeight, AURA.tabBar.padding]).toEqual([60, 50, 5]);
    expect(AURA.tabBar.iconLabelled).toBe(20);
    expect(code('src/theme/tokens.ts')).toMatch(/tabLabel: \{ font: 'display', size: 10,/);
    expect(AURA.light.tab.pill).toBe('#031B0B');
    expect(AURA.light.tab.onInk).toBe('#FFFFFF');
    expect([AURA.light.tab.iconOn, AURA.light.tab.iconOnBody]).toEqual(['#3DDC84', '#FF6FA0']);
    expect(AURA.dark.tab.pill).toBe('rgba(255, 255, 255, 0.94)');
    expect(AURA.dark.tab.onInk).toBe('#0B0E0D');
    expect(code('src/motion/TabBar.tsx')).toMatch(/const spring = MOTION\.springs\.tabLead;/);
    expect(MOTION.springs.tabLead).toEqual({ stiffness: 420, damping: 30, mass: 1 });
  });

  it('its bottom edge: 150 high, from clear to the solid ground 70 % down (yeni tuval `.fade`)', () => {
    expect(AURA.tabBar.edgeHeight).toBe(150);
    expect(barEdgeCss('light')).toBe(
      'linear-gradient(180deg, rgba(239, 247, 241, 0) 0%, #EFF7F1 70%, #EFF7F1 100%)',
    );
    expect(barEdgeCss('dark')).toBe(
      'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 70%, #000000 100%)',
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
  // The owner's call (16 Kasım): Ayarlar is a full page, pushed from the right as every page, its
  // back button and title still on the bar (yeni arayüz tuvali, Ayarlar).
  it('Ayarlar is a page on the stack, not a sheet; its top stays over the content (5.9)', () => {
    const layout = code('app/(app)/_layout.tsx');
    expect(layout).not.toMatch(/name="settings"/);
    const settings = code('app/(app)/settings.tsx');
    expect(settings).not.toMatch(/RouteSheet/);
    expect(settings).toMatch(/<Screen\b/);
    expect(settings).toMatch(/<PageTop[\s\S]*inline=/);
    expect(settings).toMatch(/testID="settings"/);
    // An inline PageTop is drawn as a still top over the content, never inside its scroll.
    expect(code('src/components/Screen.tsx')).toMatch(/top\.type === PageTop && !inlineTop\(top\)/);
    expect(code('src/theme/auraKit.ts')).toMatch(/pageBarTitle: t\(700, 21, 26, -0\.3 \/ 21\)/);
  });
});

describe("Mekan's folding cards (5.11)", () => {
  const v = AURA.venueCollapse;
  const at = (y: number, full = 300) =>
    collapseAt(y, 100, full, v.tableStrip, v.stripFrom, v.stripFadePx);

  it('pins under the bar at 104 into a 72 strip, the chat into 54; the strip from 170 over 70', () => {
    expect(v).toEqual({
      pinTop: 104,
      tableStrip: 72,
      stripPicture: 52,
      chatStrip: 54,
      stripFrom: 170,
      stripFadePx: 70,
    });
  });

  it('scrolls with the content until it pins, then its foot follows the finger one to one', () => {
    expect(at(40)).toEqual({ lift: 0, height: 300, strip: 0 });
    expect(at(150)).toEqual({ lift: 50, height: 250, strip: 0 });
    // Linear: equal steps fold it equally.
    expect(at(160).height - at(170).height).toBe(at(180).height - at(190).height);
    // Folded, it stays a strip and pinned.
    expect(at(1000)).toEqual({ lift: 900, height: 72, strip: 1 });
  });

  it('gives way to the strip between 170 and 100 high, linearly', () => {
    expect(at(230).strip).toBe(0);
    expect(at(265).strip).toBeCloseTo(0.5);
    expect(at(300).strip).toBe(1);
    // A card lower than 170 starts at its own height.
    const low = (y: number) => collapseAt(y, 0, 140, v.chatStrip, v.stripFrom, v.stripFadePx);
    expect(low(0).strip).toBe(0);
    expect(low(70).strip).toBe(1);
  });

  it('stays in place before it is measured', () => {
    expect(collapseAt(500, -1, 300, 72, 170, 70)).toEqual({ lift: 0, height: 300, strip: 0 });
  });
});
