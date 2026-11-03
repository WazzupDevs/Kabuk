import type { Concept } from '@shared/rooms.ts';

import type { GameGlyph } from '@/components/Glyph';

// Each game's icon and colour pair (canvas: Aşama 6 · Oyunlar → Oyun ikonları).
export const GAME_GLYPH: Record<Concept, GameGlyph> = {
  tabu: 'tabu',
  sohbet: 'sohbet',
  sahtekar: 'impostor',
  harf: 'letters',
  sarki: 'song',
  ibre: 'needle',
};
