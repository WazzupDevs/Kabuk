// Sample Geçit questions for the dev project only (pure/devProject.ts → testQuestionsAllowed). They
// are not the real pool: real questions never enter the repo (docs/SPEC_V4.md §4.V); the owner loads
// those with `pnpm admin:gecit-import`.
export type GecitSample = { prompt: string; options: [string, string, string, string]; answer: number };

export const GECIT_SAMPLES: readonly GecitSample[] = [
  {
    prompt: 'Bir koşuda ikinciyi geçtin. Şimdi kaçıncısın?',
    options: ['Birinci', 'İkinci', 'Üçüncü', 'Sonuncu'],
    answer: 1,
  },
  {
    prompt: 'Bir sepette 5 elma var. 3 tanesini aldın. Sende kaç elma var?',
    options: ['2', '3', '5', '8'],
    answer: 1,
  },
  {
    prompt: 'Hangi ayda 28 gün vardır?',
    options: ['Yalnız şubatta', 'Hiçbirinde', 'Her ayda', 'Artık yılda'],
    answer: 2,
  },
  {
    prompt: '2, 4, 8, 16… Sıradaki sayı kaç?',
    options: ['18', '24', '32', '30'],
    answer: 2,
  },
  {
    prompt: 'Ali, Ayşe’den uzun; Ayşe, Can’dan uzun. En kısa kim?',
    options: ['Ali', 'Ayşe', 'Can', 'Bilinemez'],
    answer: 2,
  },
  {
    prompt: 'Bir saat 3’ü gösteriyor. Akrep ile yelkovan arasındaki açı kaç derece?',
    options: ['45', '60', '90', '120'],
    answer: 2,
  },
  {
    prompt: 'Bir mum 10 dakikada yanıp bitiyor. 3 mumu aynı anda yakarsan kaç dakikada biterler?',
    options: ['10', '20', '30', '3'],
    answer: 0,
  },
];

// The day's sample: the same for everyone on a day, the next one the day after.
export function sampleFor(day: string): GecitSample {
  const n = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  return GECIT_SAMPLES[((n % GECIT_SAMPLES.length) + GECIT_SAMPLES.length) % GECIT_SAMPLES.length] as GecitSample;
}
