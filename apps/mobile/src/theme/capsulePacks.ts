import type { ColorScheme } from './tokens';

// The ground of a pack's block in Kapsülün (the owner's call, 27 Ekim: each pack in its own block,
// a quiet colour that suits its theme, neighbours told apart). Soft tones for the light theme, deep
// ones for the dark; a pack not named here takes one by its place in the list.
const TONES = {
  peach: { light: '#FFF0E1', dark: '#3A2A20' },
  mint: { light: '#E4F6EA', dark: '#1D3327' },
  rose: { light: '#FFE8F0', dark: '#3A1F2E' },
  lavender: { light: '#EEE9FF', dark: '#2A2448' },
  indigo: { light: '#E6E8FA', dark: '#1D2042' },
  lemon: { light: '#FFF6D6', dark: '#36311A' },
  sky: { light: '#E3F2FD', dark: '#1A2D40' },
  coral: { light: '#FFE6E0', dark: '#3D211E' },
  slate: { light: '#ECEBF2', dark: '#25242E' },
  ice: { light: '#E8F6F9', dark: '#1C3036' },
  teal: { light: '#DFF5F1', dark: '#17332F' },
  coffee: { light: '#F4EAE1', dark: '#33271E' },
} as const;

type Tone = keyof typeof TONES;

const PACK_TONE: Record<string, Tone> = {
  // Şık
  Zarif: 'lavender',
  Çiçek: 'rose',
  Sokak: 'slate',
  Prenses: 'rose',
  Gece: 'indigo',
  Bahar: 'mint',
  Romantik: 'coral',
  // Karakter
  Klasik: 'slate',
  Macera: 'peach',
  Rock: 'indigo',
  Şef: 'lemon',
  İş: 'sky',
  Kral: 'lemon',
  'Vahşi Batı': 'coffee',
  // Tema
  Hayvanlar: 'peach',
  Orman: 'mint',
  Fantastik: 'rose',
  Sihir: 'lavender',
  Uzay: 'indigo',
  Parti: 'lemon',
  Oyuncu: 'sky',
  Yılbaşı: 'coral',
  Korku: 'slate',
  Kış: 'ice',
  Deniz: 'teal',
  Spor: 'lemon',
  Ninja: 'slate',
  Kampüs: 'lavender',
  Kafe: 'coffee',
  Tatlı: 'rose',
  Retro: 'peach',
  Bilim: 'sky',
  Bizden: 'coral',
  Günlük: 'mint',
};

const ORDER = Object.keys(TONES) as Tone[];

export function packTone(pack: string, index: number, scheme: ColorScheme): string {
  const tone = PACK_TONE[pack] ?? ORDER[index % ORDER.length] ?? 'slate';
  return TONES[tone][scheme];
}
