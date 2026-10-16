import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ADAPTIVE,
  ADAPTIVE_SAFE_RADIUS,
  adaptiveBackgroundSvg,
  adaptiveForegroundSvg,
  adaptiveMonochromeSvg,
  COLORS,
  ICON,
  MAIN,
  notificationSvg,
  placed,
  reach,
  SMALL,
  SPLASH,
  SPLASH_CIRCLE_RADIUS,
  splashSvg,
  storeIconSvg,
} from './mark.ts';

// Numbers from the logo system's drawings (Android, 108 dp; Sistem açılış ekranı, 288 dp; the status
// bar, 24 dp), to two decimals.
const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.03);

describe('skall mark', () => {
  it('is two 80 × 240 capsules, the second 52 right and 60 down, crossing on 35 % of a width', () => {
    expect([MAIN.w, MAIN.h, MAIN.dx, MAIN.dy]).toEqual([80, 240, 52, 60]);
    expect((MAIN.x + MAIN.w - (MAIN.x + MAIN.dx)) / MAIN.w).toBe(0.35);
  });

  it('sits in the middle of its canvas, the small drawing too', () => {
    for (const d of [MAIN, SMALL]) {
      expect(d.x + (d.w + d.dx) / 2).toBe(ICON / 2);
      expect(d.y + (d.h + d.dy) / 2).toBe(ICON / 2);
    }
    expect(reach(MAIN)).toBeLessThan(ICON / 2);
  });

  it('reaches 26 dp from the centre on the adaptive icon, inside the 66 dp safe circle', () => {
    const { capsules, reach: far } = placed('adaptive');
    near(far, 26);
    expect(far).toBeLessThanOrEqual(ADAPTIVE_SAFE_RADIUS);
    near(capsules[0].x, 42.79);
    near(capsules[0].y, 28.51);
    near(capsules[0].w, 13.59);
    near(capsules[0].h, 40.78);
    near(capsules[1].x, 51.62);
    near(capsules[1].y, 38.71);
  });

  it('fits the splash circle: 137 dp tall, its farthest point 70 dp from the centre', () => {
    const { capsules, reach: far } = placed('splash');
    near(far, 70);
    expect(far).toBeLessThanOrEqual(SPLASH_CIRCLE_RADIUS);
    near(capsules[0].x, 113.81);
    near(capsules[0].y, 75.39);
    near(capsules[0].w, 36.59);
    expect(Math.round(capsules[1].y + capsules[1].h - capsules[0].y)).toBe(137);
  });

  it('draws the notification icon with the small drawing, 2 dp from the top and the bottom', () => {
    const { capsules } = placed('notification');
    near(capsules[0].x, 6.76);
    near(capsules[0].y, 2);
    near(capsules[0].w, 6.62);
    near(capsules[0].h, 16.28);
    near(capsules[1].x, 10.62);
    near(capsules[1].y + capsules[1].h, 22);
  });

  it('draws the layers on the 108 dp canvas; only the background has one', () => {
    for (const svg of [
      adaptiveForegroundSvg(1024),
      adaptiveBackgroundSvg(1024),
      adaptiveMonochromeSvg(1024),
    ]) {
      expect(svg).toContain(`width="1024" height="1024" viewBox="0 0 ${ADAPTIVE} ${ADAPTIVE}"`);
    }
    expect(adaptiveBackgroundSvg(108)).toContain(`fill="${COLORS.night}"`);
    for (const svg of [
      adaptiveForegroundSvg(108),
      adaptiveMonochromeSvg(108),
      notificationSvg(96),
      splashSvg(1152),
    ]) {
      expect(svg).not.toContain(COLORS.night);
    }
  });

  it('colours the flat drawing purple, pink and a white intersection on the night ground', () => {
    for (const svg of [adaptiveForegroundSvg(108), splashSvg(288)]) {
      for (const c of [COLORS.purple, COLORS.pink, COLORS.crossDark]) expect(svg).toContain(c);
    }
  });

  it('draws the themed and notification icons in one colour, the first capsule cut with a gap', () => {
    for (const svg of [adaptiveMonochromeSvg(108), notificationSvg(96)]) {
      expect(svg).not.toContain(COLORS.purple);
      expect(svg).not.toContain(COLORS.pink);
      expect(svg).toContain('mask="url(#g)"');
    }
  });

  it('fills the whole store icon square', () => {
    expect(storeIconSvg(512)).toContain(`<rect width="${ICON}" height="${ICON}" fill="url(#bg)"/>`);
  });

  it('matches app.json: night splash in both modes on the 288 dp canvas, purple notification', () => {
    const appJson = JSON.parse(
      readFileSync(resolve(import.meta.dirname, '../../apps/mobile/app.json'), 'utf8'),
    ) as { expo: { plugins: (string | [string, Record<string, unknown>])[] } };
    const plugin = (name: string) =>
      appJson.expo.plugins.find((p): p is [string, Record<string, unknown>] => p[0] === name)?.[1];
    const splash = plugin('expo-splash-screen');
    expect(splash?.imageWidth).toBe(SPLASH);
    expect(splash?.backgroundColor).toBe(COLORS.night);
    expect((splash?.dark as Record<string, unknown> | undefined)?.backgroundColor).toBe(
      COLORS.night,
    );
    expect(plugin('expo-notifications')?.color).toBe(COLORS.purple);
  });
});
