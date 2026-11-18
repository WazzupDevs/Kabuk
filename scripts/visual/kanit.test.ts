import { describe, expect, it } from 'vitest';

import { type KapsamSatiri } from './kapsam.ts';
import { kanitDenetle, ortakDosyalar } from './kanit.ts';

function satir(pano: string, kod: string[], more: Partial<KapsamSatiri> = {}): KapsamSatiri {
  return {
    pano,
    baslik: `Pano ${pano}`,
    dosya: `project/${pano}.dc.html`,
    aile: 'Deneme',
    kod,
    acilis: '',
    tema: 'acik',
    durum: null,
    hal: 'yazildi',
    ...more,
  };
}

const KIT = 'apps/mobile/src/aura/kit.tsx';
const AYAR = 'apps/mobile/app/(app)/settings.tsx';
// Three boards name the kit: with a threshold of 2 it is shared.
const rows = [
  satir('03i', [AYAR, KIT]),
  satir('03i', [AYAR, KIT], { tema: 'koyu' }),
  satir('02', ['apps/mobile/dm.tsx', KIT]),
  satir('153', ['apps/mobile/ibre.tsx', KIT], { hal: 'cizilmeyecek', sebep: 'gelmeyecek' }),
];

describe('kanitDenetle', () => {
  it('asks nothing of a change that touches no row', () => {
    const r = kanitDenetle(rows, ['scripts/visual/kanit.ts', 'CLAUDE.md'], 10, 2);
    expect(r.dokunan).toEqual([]);
    expect(r.gecti).toBe(true);
  });

  it('fails a touched row without evidence, in both themes', () => {
    const r = kanitDenetle(rows, [AYAR], 10, 2);
    expect(r.gecti).toBe(false);
    expect(r.kanitsiz.map((d) => `${d.satir.pano}/${d.satir.tema}`)).toEqual([
      '03i/acik',
      '03i/koyu',
    ]);
  });

  it('passes a row checked with this PR as its evidence, not another PR', () => {
    const checked = rows.map((x) =>
      x.pano === '03i' ? { ...x, hal: 'goruntuyle-dogrulandi' as const, kanit: 10 } : x,
    );
    expect(kanitDenetle(checked, [AYAR], 10, 2).gecti).toBe(true);
    expect(kanitDenetle(checked, [AYAR], 11, 2).gecti).toBe(false);
    expect(kanitDenetle(checked, [AYAR], null, 2).gecti).toBe(false);
    const phone = rows.map((x) =>
      x.pano === '03i' ? { ...x, hal: 'telefonda-dogrulandi' as const, kanit: 10 } : x,
    );
    expect(kanitDenetle(phone, [AYAR], 10, 2).gecti).toBe(true);
  });

  it('passes an excused row only for that PR and only with a reason', () => {
    const excused = rows.map((x) =>
      x.pano === '03i' ? { ...x, muaf: [{ pr: 10, sebep: 'ortak bileşen değişikliği' }] } : x,
    );
    const r = kanitDenetle(excused, [AYAR], 10, 2);
    expect(r.gecti).toBe(true);
    expect(r.dokunan.map((d) => d.sonuc)).toEqual(['muaf', 'muaf']);
    expect(kanitDenetle(excused, [AYAR], 12, 2).gecti).toBe(false);
    const bare = rows.map((x) => (x.pano === '03i' ? { ...x, muaf: [{ pr: 10, sebep: ' ' }] } : x));
    expect(kanitDenetle(bare, [AYAR], 10, 2).gecti).toBe(false);
  });

  it('lets a row never to be drawn pass', () => {
    const r = kanitDenetle(rows, ['apps/mobile/ibre.tsx'], 10, 2);
    expect(r.dokunan.map((d) => d.sonuc)).toEqual(['cizilmeyecek']);
    expect(r.gecti).toBe(true);
  });

  it('asks nothing of a shared file on its own, but still of the other files', () => {
    expect([...ortakDosyalar(rows, 2).keys()]).toEqual([KIT]);
    const alone = kanitDenetle(rows, [KIT], 10, 2);
    expect(alone.gecti).toBe(true);
    expect(alone.ortak).toEqual([KIT]);
    const both = kanitDenetle(rows, [KIT, 'apps/mobile/dm.tsx'], 10, 2);
    expect(both.kanitsiz.map((d) => d.satir.pano)).toEqual(['02']);
    expect(both.kanitsiz[0]?.dosyalar).toEqual(['apps/mobile/dm.tsx']);
  });
});
