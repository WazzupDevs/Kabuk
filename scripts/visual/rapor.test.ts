import { describe, expect, it } from 'vitest';

import { type KapsamSatiri } from './kapsam.ts';
import { buildRapor } from './rapor.ts';

function satir(pano: string, tema: 'acik' | 'koyu', more: Partial<KapsamSatiri>): KapsamSatiri {
  return {
    pano,
    baslik: `Pano ${pano}`,
    dosya: `project/${pano}.dc.html`,
    aile: 'Mesajlar',
    kod: ['apps/mobile/x.tsx'],
    acilis: '',
    tema,
    durum: null,
    hal: 'eski',
    ...more,
  };
}

const rows: KapsamSatiri[] = [
  satir('02', 'acik', {
    hal: 'goruntuyle-dogrulandi',
    durum: 'ekran-dm',
    kanit: 740,
    acilis: 'Mesajlar → bir sohbete bas',
  }),
  satir('02', 'koyu', { hal: 'yazildi', acilis: 'Mesajlar → bir sohbete bas' }),
  satir('15', 'acik', { hal: 'yazildi', aile: 'Semt' }),
  satir('15', 'koyu', { hal: 'yazildi', aile: 'Semt' }),
  satir('01', 'acik', {}),
  satir('01', 'koyu', {}),
  satir('40', 'acik', { aile: 'Oyun lobisi' }),
  satir('153', 'acik', { hal: 'cizilmeyecek', sebep: 'gelmeyecek' }),
];

describe('buildRapor', () => {
  const onceki = rows.map((r) => (r.pano === '02' ? { ...r, hal: 'yazildi' as const } : r));
  const text = buildRapor({ surum: 'a1b2c3d4', rows, onceki });

  it('has its sections in order', () => {
    const heads = text.split('\n').filter((l) => l.startsWith('#'));
    expect(heads).toEqual([
      '# Sürüm raporu: a1b2c3d4',
      '## Bu sürümde durumu değişen ekranlar',
      '## Görüntüyle doğrulandı',
      '## Yazıldı ama görüntüyle bakılmadı',
      '## Hâlâ eski (2 pano)',
      '### Mesajlar',
      '### Oyun lobisi',
      '## Telefonda özellikle bak',
    ]);
  });

  it('names what changed, what is checked, what is written and where to look', () => {
    expect(text).toContain('- 02 Pano 02 (açık): yazıldı → görüntüyle doğrulandı');
    expect(text).toContain('## Görüntüyle doğrulandı\n\n- 02 Pano 02: açık\n');
    expect(text).toContain('- 02 Pano 02: koyu\n- 15 Pano 15: açık, koyu');
    expect(text).toContain('### Mesajlar\n\n- 01 Pano 01: açık, koyu');
    expect(text).toContain('- 02 Pano 02 (açık, koyu): Mesajlar → bir sohbete bas');
    expect(text).toContain('- 15 Pano 15 (açık, koyu): açılış yolu kayıtlı değil');
    expect(text).not.toContain('153');
  });

  it('says so when there is nothing to compare with', () => {
    expect(buildRapor({ surum: 'x', rows })).toContain('Önceki sürümle karşılaştırılmadı.');
    expect(buildRapor({ surum: 'x', rows, onceki: rows })).toContain(
      'Bu sürümde durumu değişen ekran yok.',
    );
  });
});
