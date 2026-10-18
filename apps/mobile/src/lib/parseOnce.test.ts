import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CAPSULE_KEYS, capsuleSvg, FRIEND_DARK_INK } from '../theme/capsules';
import { parseOnce } from './parseOnce';

// react-native-svg's own parser, as on the phone. The element table and the fetch helper it loads
// pull in React Native, and parsing needs neither. Loaded by a name the type checker leaves alone:
// the package's TypeScript sources do not pass this project's stricter settings.
vi.mock('react-native-svg/src/xmlTags', () => ({ tags: {} }));
vi.mock('react-native-svg/src/utils/fetchData', () => ({ fetchText: async () => null }));
const XML_PARSER = 'react-native-svg/src/xml';
let parse: (source: string) => unknown;
beforeAll(async () => {
  ({ parse } = (await import(/* @vite-ignore */ XML_PARSER)) as {
    parse: (source: string) => unknown;
  });
});

describe('parseOnce', () => {
  it('parses a key once and hands back the same tree', () => {
    const cache = new Map<string, object | null>();
    const build = vi.fn(() => ({ tree: 1 }));
    const first = parseOnce(cache, 'a', build, () => undefined);
    expect(parseOnce(cache, 'a', build, () => undefined)).toBe(first);
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('keeps a drawing that does not parse as null, reporting it once', () => {
    const cache = new Map<string, object | null>();
    const onError = vi.fn();
    const broken = () => parse('<svg><g></svg>');
    expect(parseOnce(cache, 'x', broken, onError)).toBeNull();
    expect(parseOnce(cache, 'x', broken, onError)).toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe('the capsule drawings', () => {
  it('every look parses, on its disc and standing alone, in both inks and every eye', () => {
    const looks = [...CAPSULE_KEYS, 'ghost' as const];
    for (const look of looks) {
      expect(parse(capsuleSvg(look))).not.toBeNull();
      for (const eyes of [{}, { dx: 1.5, dy: -1 }, { open: 0.1 }]) {
        expect(parse(capsuleSvg(look, false, eyes))).not.toBeNull();
        expect(parse(capsuleSvg(look, false, eyes, FRIEND_DARK_INK))).not.toBeNull();
      }
    }
  });
});
