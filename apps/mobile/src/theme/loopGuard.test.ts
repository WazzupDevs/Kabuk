import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const mobile = join(import.meta.dirname, '..', '..');

// A motion that goes on by itself (a loader, the live dot, the steam, the typing dots, a timer's
// pulse) runs on React Native's native driver, not on Reanimated: on Android every frame of a
// Reanimated loop commits the whole UI tree (its native flag ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS
// is off), which kept the main thread busy on every frame on a long screen (WazzupDevs/Kabuk#201:
// the v46 gallery, Keşfet's list). Reanimated stays for motions that end by themselves (a press, a
// row coming in, a field's ring).
const SOURCES = ['app', 'src'];

// Where a Reanimated frame loop stays, and why.
const FRAME_LOOPS: Record<string, string> = {
  // The old Şarkıda Geçsin's record and equaliser: the game goes in step 4.5 (owner, 21 October:
  // not to be touched).
  'src/components/game/Vinyl.tsx': 'old game, goes in 4.5',
  // Only while the launch curtain plays; its clock stops when the curtain goes.
  'src/features/launch/LaunchCurtain.tsx': 'launch only',
  // Çizim ölçümü's frame counter: only while the lab is open, in test builds.
  'src/features/design/DrawLabPanel.tsx': 'draw lab only',
};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const sources = SOURCES.flatMap((d) => files(join(mobile, d))).map((path) => ({
  file: relative(mobile, path).split('\\').join('/'),
  text: readFileSync(path, 'utf8'),
}));

describe('motions that go on by themselves', () => {
  it('do not loop on Reanimated (withRepeat, useFrameCallback), but where listed', () => {
    const found = sources
      .filter((s) => /\bwithRepeat\b|\buseFrameCallback\b/.test(s.text))
      .map((s) => s.file);
    expect(found.sort()).toEqual(Object.keys(FRAME_LOOPS).sort());
  });

  it('loop on the native driver (Animated.loop with useNativeDriver: true only)', () => {
    const loops = sources.filter((s) => /\bAnimated\.loop\(/.test(s.text));
    expect(loops.length).toBeGreaterThan(0);
    for (const s of loops) {
      expect(s.text, s.file).toMatch(/useNativeDriver: true/);
      expect(s.text, s.file).not.toMatch(/useNativeDriver: false/);
    }
  });

  it('the loaders: the mark loops on the native driver', () => {
    const mark = sources.find((s) => s.file === 'src/components/Mark.tsx')?.text ?? '';
    expect(mark).toMatch(/Animated\.loop\(run\)/);
    expect(mark).toMatch(/useNativeDriver: true/);
    expect(mark).not.toMatch(/react-native-reanimated/);
  });
});
