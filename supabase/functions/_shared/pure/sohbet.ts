// Sohbet cards (MVP_SPEC §5.3).
export const SOHBET_THEMES = ['isinma', 'film-dizi-muzik', 'hic-yaptin-mi', 'derin'] as const;
export type SohbetTheme = (typeof SOHBET_THEMES)[number];

export type SohbetState = {
  concept: 'sohbet';
  cardId: string;
  theme: SohbetTheme;
  prompt: string;
  nextAllowedAt: string;
};
