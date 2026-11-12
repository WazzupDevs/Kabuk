import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MAX_TABLE_PHONES } from '../../../../supabase/functions/_shared/pure/tables.ts';

import { AURA } from './aura';
import { KIT } from './auraKit';
import { AA_TEXT, contrastRatio } from './contrast';

// The acceptance items K1 to K17 of docs/design/aura/aktarim-v76-2kasim.md §11, measured on the
// values in the code. Where a value sits inside a component (which imports React Native and cannot
// load in vitest) the source is read and checked (as styleGuard.test.ts does).
// K12 (the friend's profile, "Arkadaşlıktan çıkar" at 390 dp and the largest text) and K14 (each
// empty state shows its own riso picture) are judged on the screen, not here.

const mobile = join(import.meta.dirname, '..', '..');

// A source with its comments dropped, so a word in a comment never counts as code.
function code(path: string): string {
  return readFileSync(join(mobile, path), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/ .*$/gm, '');
}

describe('K1: the size scale', () => {
  // The main button 52 since the glass buttons (docs/design/iskelet.md → 2.1: 50 to 56).
  it('main 52, small 36, round 44, chip 36, field 48', () => {
    expect(KIT.size.btn).toBe(52);
    expect(KIT.size.btnSm).toBe(36);
    expect(KIT.size.round).toBe(44);
    expect(KIT.size.chip).toBe(36);
    expect(KIT.size.chipLg).toBe(36);
    expect(KIT.light.field).toBeDefined();
    // The form field's height: the many-line field's 22 round and the single-line 48 are the kit's.
    expect(KIT.size.btnRow).toBe(48);
  });
});

describe('K2: the chat top bar', () => {
  const bar = code('src/components/ChatTopBar.tsx');
  it('back, name pill and menu are 44; the pill avatar is 36', () => {
    expect(KIT.size.dmPill).toBe(44);
    expect(KIT.size.roundLg).toBe(44);
    expect(KIT.size.av.member).toBe(36);
    expect(bar).toMatch(/SPLIT_PILL\s*=\s*KIT\.size\.dmPill/);
    expect(bar).toMatch(/ROUND\s*=\s*KIT\.size\.roundLg/);
    expect(bar).toMatch(/PILL_INSET\s*=\s*\(PILL - KIT\.size\.av\.member\)\s*\/\s*2/);
  });
});

describe('K3: the message field and send button', () => {
  const composer = code('src/components/Composer.tsx');
  it('44 high, 22 round', () => {
    expect(KIT.size.composerField).toBe(44);
    expect(KIT.size.composerSend).toBe(44);
    expect(composer).toMatch(/const SIZE = KIT\.size\.composerField/);
    expect(composer).toMatch(/const SEND = KIT\.size\.composerSend/);
    expect(composer).toMatch(/borderRadius: SIZE \/ 2/);
    expect(composer).toMatch(/borderRadius: SEND \/ 2/);
  });
  it('the field is not frosted', () => {
    expect(composer).not.toMatch(/\bFrost\b|LiquidGlass|\bfrost\b|<Glass\b/);
  });
});

describe('K4: the primary button in the dark', () => {
  it('a black 35 % shadow, no green glow', () => {
    expect(KIT.dark.primaryShadow).toBe('0px 10px 22px rgba(0, 0, 0, 0.35)');
    expect(KIT.dark.primaryShadow).not.toMatch(/14, 135, 69|4, 73, 35/);
    expect(KIT.dark.glassShadow).toBe('');
    expect(KIT.dark.raisedShadow).toBe('');
  });
});

describe('K5: a card and a secondary button inside a sheet', () => {
  it('light #FFFFFF, dark #1B211F, a 1 px line', () => {
    expect(KIT.light.glassInSheet).toBe('linear-gradient(180deg, #FFFFFF, #FFFFFF)');
    expect(KIT.light.raisedInSheet).toBe('#FFFFFF');
    expect(KIT.dark.glassInSheet).toBe('#1B211F');
    expect(KIT.dark.raisedInSheet).toBe('#1B211F');
    expect(KIT.light.glassInSheetEdge).not.toBe('');
    expect(KIT.dark.glassInSheetEdge).not.toBe('');
    expect(KIT.size.edge).toBe(1);
    expect(KIT.size.hair).toBe(1);
  });
});

describe('K6: the veil over a profile photo', () => {
  it('rgba(0,0,0,.82) in both schemes (one value, not per scheme)', () => {
    expect(KIT.photoScrim).toBe('rgba(0, 0, 0, 0.82)');
    expect('photoScrim' in KIT.light).toBe(false);
    expect('photoScrim' in KIT.dark).toBe(false);
  });
});

describe('K7: the venue logo', () => {
  it('is 28 high', () => {
    expect(code('src/features/venue/VenueHead.tsx')).toMatch(/const WORDMARK_HEIGHT = 28;/);
  });
});

describe('K8: the table card bars', () => {
  it('twelve people, twelve different colours', () => {
    const p = AURA.pips;
    expect(p.max).toBe(MAX_TABLE_PHONES);
    const twelve = Array.from({ length: p.max }, (_, i) => p.colors[i % p.colors.length]);
    expect(new Set(twelve).size).toBe(12);
  });
});

describe('K9: Profili düzenle', () => {
  const edit = code('app/(app)/(tabs)/profile/edit.tsx');
  it('has no written "Fotoğrafı değiştir" button', () => {
    // The text may only be the camera badge's accessibility label, never a label or a text node.
    const uses = edit.match(/.*photoChange.*/g) ?? [];
    expect(uses.length).toBeGreaterThan(0);
    for (const line of uses) expect(line).toMatch(/const label = /);
    expect(edit).not.toMatch(/<(?:Button|Btn|T|Text)\b[^>]*>\s*\{label\}/);
    expect(edit).not.toMatch(/label=\{label\}/);
  });
  it('hides the tab bar', () => {
    expect(edit).toMatch(/useHideTabBar\(\);/);
  });
  it('Kaydet is on the bar, clear, at least 96 wide (iskelet.md → 2.1, 5.8)', () => {
    expect(edit).not.toMatch(/footer=\{/);
    expect(edit).toMatch(/<PageTop\b/);
    expect(edit).toMatch(/variant="glassy"\s+bar=\{KIT\.size\.topBtn\}\s+testID="profile-save"/);
    expect(edit).toMatch(/tint=\{changed \|\| save\.isSuccess \? KIT\.primary : KIT\.saveIdle\}/);
    expect(edit).toMatch(/style=\{\{ minWidth: KIT\.saveMinWidth \}\}/);
    const kit = code('src/theme/auraKit.ts');
    expect(kit).toMatch(/saveIdle: '#9AAEA1',/);
    expect(kit).toMatch(/saveMinWidth: 96,/);
    expect(kit).toMatch(/primaryHalo: 'rgba\(14, 135, 69, 0\.18\)',/);
    expect(kit).toMatch(/focusHalo: 3,/);
  });
});

describe('K10: Kapsül and Kapsül karakterler', () => {
  it.each(['capsule.tsx', 'capsules.tsx'])('%s hides the tab bar', (file) => {
    expect(code(`app/(app)/(tabs)/profile/${file}`)).toMatch(/useHideTabBar\(\);/);
  });
});

describe('K11: Lobiye aç', () => {
  it('has no "Etiket yok" and no "Fark etmez"', () => {
    const text = readFileSync(join(mobile, 'src/i18n/tr.ts'), 'utf8');
    expect(text).not.toMatch(/Etiket yok/);
    expect(text).not.toMatch(/Fark etmez/);
    const choices = code('src/features/rooms/LobbyChoices.tsx');
    expect(choices).not.toMatch(/Etiket yok|Fark etmez/);
    // Only the two intents, no "none" chip.
    expect(text).toMatch(/intents: \{\s*game: '[^']+',\s*chat: '[^']+',?\s*\}/);
  });
  it('the game row shows only while Oyun is chosen', () => {
    const choices = code('src/features/rooms/LobbyChoices.tsx');
    expect(choices).toMatch(/\{intent === 'game' \? \(\s*<ScrollView/);
    expect(choices).toMatch(/if \(next !== 'game'\) onTag\(null\)/);
  });
});

// K12 and K14 are judged on the screen.

describe('K13: a disabled button draws no icon', () => {
  it('the kit button', () => {
    expect(code('src/aura/kit.tsx')).toMatch(/icon && !off \?/);
  });
  it('the Button component', () => {
    const button = code('src/components/Button.tsx');
    // Every icon the button draws sits behind a not-disabled check.
    expect(button).toMatch(/icon && !disabled/);
  });
});

describe('K15: the live dot in the dark', () => {
  it('has no ring', () => {
    const kit = code('src/aura/kit.tsx');
    expect(kit).toMatch(/scheme === 'dark'\s*\? undefined\s*:\s*`0px 0px \$\{size\}px \$\{ring\}/);
  });
});

describe('K16: no new haptic moment', () => {
  it('the moments are the ones of today', () => {
    // Read from the source: the module imports @shared, which the root typecheck does not map.
    const union = code('src/lib/hapticMoments.ts').split('export type HapticCall')[0] ?? '';
    const moments = [...union.matchAll(/\| '(\w+)'/g)].map((m) => m[1]);
    expect(moments.sort()).toEqual(
      [
        'selection',
        'tabChanged',
        'tableOpened',
        'requestAccepted',
        'proposalAccepted',
        'incomingRequest',
        'tabuCorrect',
        'tabuTaboo',
        'tabuPass',
        'timeUp',
        'grabbed',
        // Sprengja's blast (Aura v99; the owner's decision of 5 Kasım: one strong touch, only to
        // the one the bomb went off with).
        'blast',
        'lastSeconds',
        'replyThreshold',
        'failed',
        'friendsMade',
        'accountReady',
        'sent',
      ].sort(),
    );
  });
});

describe('K17: a full table', () => {
  it('the limit is 12 and the note is written', () => {
    expect(MAX_TABLE_PHONES).toBe(12);
    const text = readFileSync(join(mobile, 'src/i18n/tr.ts'), 'utf8');
    expect(text).toMatch(/full: 'Masa dolu\. Masada en çok 12 kişi olur\.'/);
  });
  it('Davet et is off when the table is full, and the note shows under it', () => {
    const card = code('src/features/rooms/TableCard.tsx');
    expect(card).toMatch(/const full = room\.phones >= MAX_TABLE_PHONES;/);
    expect(card).toMatch(/testID="invite-open"[\s\S]*?disabled=\{full\}/);
    // iskelet.md → 5.11 and 6.2: "Lobiye aç" is off too, and the sentence under the faces says so.
    expect(card).toMatch(/testID="lobby-open"[\s\S]*?disabled=\{full\}/);
    expect(card).toMatch(
      /testID=\{full \? 'table-full' : undefined\}>\s*\{full\s*\? tr\.venue\.seatsFull/,
    );
    const sheet = code('src/features/rooms/InviteSheet.tsx');
    expect(sheet).toMatch(/const full = phones >= MAX_TABLE_PHONES;/);
  });
});

// Another's bubble in the DM, the venue chat and the table chat: its white words at 4.5:1 in both
// schemes (the DM blue deepened from #2F7CF6, 3.9:1; the owner's call, 4 Kasım).
describe('chat bubbles read at 4.5:1', () => {
  it.each(['light', 'dark'] as const)('white words on every chat colour (%s)', (scheme) => {
    const b = KIT.bubble[scheme];
    for (const ground of [b.dm, b.mekan, b.masa]) {
      expect(contrastRatio(b.themInk, ground)).toBeGreaterThanOrEqual(AA_TEXT);
    }
    expect(contrastRatio(b.mineInk, b.mine)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
