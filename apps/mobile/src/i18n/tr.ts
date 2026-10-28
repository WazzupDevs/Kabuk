import type { CalendarDate } from '@shared/age.ts';
import { APP_NAME, GAME_NAMES } from '@shared/brand.ts';
import { headcountLabel } from '@shared/checkin.ts';
import type { InboxStamp } from '@shared/dmInbox.ts';
import type { Reaction } from '@shared/reactions.ts';
import type { HistoryDay, HistoryResult } from '@shared/activities.ts';
import type { EventTime } from '@shared/explore.ts';
import { ENCOUNTER_MIN_MINUTES } from '@shared/friends.ts';
import { TABU } from '@shared/tabu.ts';
import { SAHTEKAR } from '@shared/sahtekar.ts';
import { IBRE_AUTO_LOCK_SECONDS, IBRE_CONFIG } from '@shared/ibre.ts';
import { formatTrMobile } from '@shared/phone.ts';
import { BIO_MAX } from '@shared/profile.ts';
import { SAY_CONFIG } from '@shared/sayChallenge.ts';
import { capitalizeTr, inflectTr } from '@shared/trText.ts';
import type { VenueKind } from '@shared/venueKind.ts';

// Address (hitap): a person is "sen", a table "siz"; a sentence never mixes the two. What a phone
// chooses for itself (a room's intent and participation, "Arkadaş ekle") is a person's: in Faz 2
// everyone chooses for themselves (canvas: Faz 2 · 22.5 → Metinler).
// Numbers in the texts come from the game settings, never typed by hand.
const NUMBER_WORDS = [
  'sıfır',
  'bir',
  'iki',
  'üç',
  'dört',
  'beş',
  'altı',
  'yedi',
  'sekiz',
  'dokuz',
  'on',
];
const ORDINALS = [
  'sıfırıncı',
  'birinci',
  'ikinci',
  'üçüncü',
  'dördüncü',
  'beşinci',
  'altıncı',
  'yedinci',
  'sekizinci',
  'dokuzuncu',
  'onuncu',
];
const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);
const ordinal = (n: number) => ORDINALS[n] ?? `${n}.`;

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
// "12 Eylül'de": the locative suffix follows the month's last vowel and consonant.
const MONTH_SUFFIX = [
  "'ta",
  "'ta",
  "'ta",
  "'da",
  "'ta",
  "'da",
  "'da",
  "'ta",
  "'de",
  "'de",
  "'da",
  "'ta",
];

function dayMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()] ?? ''}`;
}

function dayMonthAt(iso: string): string {
  return `${dayMonth(iso)}${MONTH_SUFFIX[new Date(iso).getMonth()] ?? ''}`;
}

// play_history.concept: the last game played in the room, or 'chat' (docs/SPEC_V3.md §5.5).
export type HistoryConcept = 'tabu' | 'sohbet' | 'sahtekar' | 'harf' | 'sarki' | 'ibre' | 'chat';
const HISTORY_CONCEPTS: Record<HistoryConcept, string> = { ...GAME_NAMES, chat: 'Sohbet' };

// A record's concept (play_history.concept): one of the games, otherwise the chat.
export function historyConcept(concept: string): HistoryConcept {
  return concept in HISTORY_CONCEPTS ? (concept as HistoryConcept) : 'chat';
}

// The Sohbet card themes (content/sohbet-cards.json), each its own name.
const SOHBET_THEMES = {
  isinma: 'Isınma',
  'film-dizi-muzik': 'Film, dizi, müzik',
  'hic-yaptin-mi': 'Hiç … yaptın mı?',
  derin: 'Derin',
} as const;

// "… oynadığınız" in a friend request: the room's last game, or the chat.
const PLAYED_WITH: Record<HistoryConcept, string> = {
  tabu: `${GAME_NAMES.tabu} oynadığınız`,
  sohbet: 'Sohbet kartlarıyla oynadığınız',
  sahtekar: `${GAME_NAMES.sahtekar} oynadığınız`,
  harf: `${GAME_NAMES.harf} oynadığınız`,
  sarki: `${GAME_NAMES.sarki} oynadığınız`,
  ibre: `${GAME_NAMES.ibre} oynadığınız`,
  chat: 'sohbet ettiğiniz',
};

// The voice games' names in "… · yüz yüze".
const VOICE_NAMES = {
  tabu: GAME_NAMES.tabu,
  sahtekar: GAME_NAMES.sahtekar,
  harf: GAME_NAMES.harf,
  sarki: GAME_NAMES.sarki,
  ibre: GAME_NAMES.ibre,
} as const;

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const WEEKDAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Turkish suffixes after a seat label ("A2'ye", "A3'te", "A2'yim"), by how its last digit is read
// (bir, iki, üç …). Seats are A1–A4 and B1–B4; the table covers 0–9.
const SEAT_SUFFIX: Record<string, { dative: string; locative: string; copula: string }> = {
  '0': { dative: 'a', locative: 'da', copula: 'um' },
  '1': { dative: 'e', locative: 'de', copula: 'im' },
  '2': { dative: 'ye', locative: 'de', copula: 'yim' },
  '3': { dative: 'e', locative: 'te', copula: 'üm' },
  '4': { dative: 'e', locative: 'te', copula: 'üm' },
  '5': { dative: 'e', locative: 'te', copula: 'im' },
  '6': { dative: 'ya', locative: 'da', copula: 'yım' },
  '7': { dative: 'ye', locative: 'de', copula: 'yim' },
  '8': { dative: 'e', locative: 'de', copula: 'im' },
  '9': { dative: 'a', locative: 'da', copula: 'um' },
};
const seatTo = (seat: string, kind: 'dative' | 'locative' | 'copula') =>
  `${seat}'${SEAT_SUFFIX[seat.slice(-1)]?.[kind] ?? ''}`;

export const tr = {
  app: {
    name: APP_NAME,
  },
  update: {
    title: 'Güncelleme gerekli',
    body: 'Uygulamanın bu sürümü artık çalışmıyor. Devam etmek için yeni sürümü yükle.',
    action: 'Güncelle',
    build: (b: string) => `Yüklü sürüm: ${b}`,
  },
  errorScreen: {
    title: 'Bir şeyler ters gitti',
    body: 'Bu ekran açılamadı. Tekrar deneyebilir ya da ana ekrana dönebilirsin.',
    retry: 'Tekrar dene',
    home: 'Ana ekrana dön',
  },
  common: {
    continue: 'Devam',
    cancel: 'Vazgeç',
    retry: 'Tekrar dene',
    loading: 'Yükleniyor…',
    genericError: 'Bir şeyler ters gitti. Tekrar dener misin?',
    close: 'Kapat',
    back: 'Geri',
    // How long ago (skall tuvali, Bildirimler): "Şimdi", "5 dk", "2 sa", "Dün", then the date.
    ago: (iso: string, now: number) => {
      const minutes = Math.floor((now - Date.parse(iso)) / 60000);
      if (minutes < 1) return 'Şimdi';
      if (minutes < 60) return `${minutes} dk`;
      if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} sa`;
      if (minutes < 48 * 60) return 'Dün';
      return dayMonth(iso);
    },
    // Between two short facts on one line ("2 kişi · Lobide değil").
    separator: '·',
  },
  auth: {
    phoneTitle: 'Telefon numaran',
    phoneHint: 'Giriş için sana SMS ile kod göndereceğiz. Numaran kimseye görünmez.',
    phonePrefix: '+90',
    phonePlaceholder: '5xx xxx xx xx',
    sendCode: 'Kod gönder',
    otpTitle: 'Kodu gir',
    otpHint: (phone: string) => `${formatTrMobile(phone)} numarasına 6 haneli bir kod gönderdik.`,
    verify: 'Doğrula',
    resend: 'Yeniden gönder',
    resendIn: (seconds: number) => `Yeniden gönder (${seconds} sn)`,
    changeNumber: 'Numarayı değiştir',
    errors: {
      invalidPhone: 'Geçerli bir cep telefonu numarası gir (5xx xxx xx xx).',
      signupNotAllowed: 'Bu numarayla devam edilemiyor.',
      tooManyRequests: 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.',
      invalidCode: 'Kod hatalı ya da süresi dolmuş.',
    },
  },
  consents: {
    title: 'Başlamadan önce',
    body: 'İkisini de okuyup onaylaman gerekir.',
    terms: 'Kullanım Koşulları’nı okudum ve kabul ediyorum.',
    kvkk: 'KVKK Aydınlatma Metni’ni okudum.',
    read: 'Oku',
    accept: 'Onayla ve devam et',
    outdated: 'Metinler güncellendi. Lütfen tekrar onayla.',
  },
  // Sign-up (docs/SPEC_V3.md §3; docs/SPEC_V4.md §4.C, the v45 report §1): the first screen, then
  // seven steps, the consents first (K-19, K-33).
  signup: {
    welcomeTitle: 'Aynı mekanda, aynı masada.',
    // The title in two halves: the second comes in when everyone has sat down (v45 §2).
    welcomeHalves: ['Aynı mekanda,', 'aynı masada.'],
    // Skips the first screen's scene to its end.
    skip: 'Geç',
    welcomeBody:
      'Girdiğin mekandaki masaları gör, birine katıl ya da kendi masanı kur. Oyunu herkes kendi telefonundan oynar.',
    // K-26: the first screen's button opens "Başlamadan önce".
    start: 'Başla',
    adultsOnly: `${APP_NAME} 18 yaş ve üzeri içindir.`,
    step: (n: number, total: number) => `${n}/${total}`,
    stepLabel: (n: number, total: number) => `Adım ${n}/${total}`,
    nameTitle: 'Adın',
    nameBody:
      'Bu adı arkadaşların görür; profilinle göründüğün masalarda ve mekan sohbetinde orada bulunanlar da görür.',
    nameLabel: 'Görünen ad',
    namePlaceholder: 'Adın',
    nameHint: '2–24 karakter.',
    // The name step's friend (v45 §3): "Selam Elif!", or "Selam!" for a long name.
    hello: (name: string) => `Selam ${name}!`,
    helloPlain: 'Selam!',
    birthTitle: 'Doğum tarihin',
    birthBody: `${APP_NAME} 18 yaş ve üzeri içindir. Doğum tarihin kimseye görünmez, profilinde yalnızca yaşın görünür. Sonra değiştiremezsin.`,
    day: 'Gün',
    month: 'Ay',
    year: 'Yıl',
    birthInvalid: 'Geçerli bir tarih gir.',
    // The confirmation after "Devam" (K-55, K-63; v46 §6).
    birthConfirmTitle: (age: number) => `${age} yaşındasın`,
    birthConfirmBody: (d: CalendarDate) =>
      `Doğum tarihin ${d.day} ${MONTHS[d.month - 1] ?? ''} ${d.year}. Sonra değiştiremezsin.`,
    birthConfirm: 'Onayla',
    birthFix: 'Düzelt',
    // The gender (docs/SPEC_V3.md §23.D; canvas: Faz 3 · 23.2): asked at sign-up, and once on a
    // separate screen for an account from before the step. Shown to nobody (rule 12).
    genderLabel: 'Cinsiyetin',
    genders: { female: 'Kadın', male: 'Erkek', unspecified: 'Belirtmek istemiyorum' },
    genderHint:
      'Kimseye gösterilmez ve sonradan değiştirilemez. Masalara katılırken kadınlar anonim ya da profille katılabilir; erkekler ve belirtmek istemeyenler profilleriyle katılır.',
    genderGateTitle: 'Cinsiyetini seç',
    genderGateBody: 'Masalara nasıl katılacağın buna bağlı. Bir kez sorulur.',
    genderSave: 'Kaydet',
    // Beside gender_required in the game flow: opens the one-time question in place.
    chooseGender: 'Cinsiyetini seç',
    continue: 'Devam',
    photoTitle: 'Profil fotoğrafın',
    photoBody:
      'Profilinle göründüğün yerlerde adınla birlikte görünür. Yüzünün görünmesi gerekmez.',
    // Only for a man and "Belirtmek istemiyorum", who always join with the profile; every account
    // sends the same events from this step (docs/SPEC_V3.md §23.L).
    photoNeededNote:
      'Fotoğrafın yoksa masalara katılamazsın, masanı da lobiye açamazsın. Fotoğrafı sonra Profil’den de ekleyebilirsin.',
    // K-29: the last step's button.
    finish: 'Bitir',
    finishNoPhoto: 'Fotoğrafsız bitir',
  },
  underAge: {
    title: `${APP_NAME} 18 yaş ve üzeri içindir`,
    body: 'Hesabın açılmadı ve bilgilerin saklanmadı.',
  },
  legal: {
    termsTitle: 'Kullanım Koşulları',
    kvkkTitle: 'KVKK Aydınlatma Metni',
    // Placeholder texts (version draft-0). The real texts arrive with legal review before the pilot.
    draftNotice: 'Bu metin taslaktır ve pilot öncesinde güncellenecektir.',
    termsBody: `${APP_NAME}, aynı mekandaki masaların birlikte oyun oynayıp sohbet etmesi için bir uygulamadır. Diğer kullanıcılara saygılı davranmayı, taciz, hakaret ve uygunsuz içerik paylaşmamayı kabul edersin.`,
    kvkkBody:
      'Hesabını oluşturmak için telefon numaran, görünen adın, doğum tarihin ve cinsiyetin işlenir. Numaran ve doğum tarihin diğer kullanıcılarla paylaşılmaz; profilinde yalnızca yaşın görünür. Cinsiyetin hiçbir kullanıcıya gösterilmez ve kullanım istatistiğine gitmez; yalnızca masalara anonim mi profilinle mi katılabileceğini belirler. Masalara anonim katılım yalnızca kadın beyanıyla mümkün olduğundan, anonim görünmek cinsiyetin hakkında dolaylı bilgi verir. 18 yaşından küçüksen hesap açılmaz ve bilgilerin saklanmaz. Hesabını istediğin zaman uygulama içinden silebilirsin.',
  },
  tabs: {
    explore: 'Keşfet',
    activities: 'Aktiviteler',
    venue: 'Mekan',
    messages: 'Mesajlar',
    profile: 'Profil',
    // The Mesajlar tab read out with its dot: unread DMs and waiting requests (the bell's).
    messagesWith: (unread: number, requests: number) =>
      [
        'Mesajlar',
        unread > 0 ? `${unread} okunmamış` : null,
        requests > 0 ? `${requests} yeni bildirim` : null,
      ]
        .filter((part) => part !== null)
        .join(', '),
  },
  // Mesajlar (docs/SPEC_V3.md §18.3).
  messages: {
    empty: 'Henüz mesajın yok.',
    emptyHint: 'Arkadaş olduğun kişilerle burada yazışırsın.',
    noMessage: 'Henüz mesaj yok',
    // With the dots beside it (v45).
    typing: 'yazıyor',
    yesterday: 'Dün',
    stamp: (iso: string, stamp: InboxStamp) =>
      stamp.kind === 'time'
        ? clock(iso)
        : stamp.kind === 'yesterday'
          ? 'Dün'
          : stamp.kind === 'weekday'
            ? (WEEKDAYS_SHORT[stamp.weekday] ?? '')
            : dayMonth(iso),
    unread: (n: number) => `${n} okunmamış mesaj`,
    row: (name: string, preview: string, unread: number) =>
      unread > 0 ? `${name}, ${preview}, ${unread} okunmamış` : `${name}, ${preview}`,
    // The two tabs (v45: Sohbet, İstekler (2)).
    tabs: 'Mesajlar ve istekler',
    chats: 'Sohbet',
    requests: (n: number) => (n > 0 ? `İstekler (${n})` : 'İstekler'),
    // The tabs of docs/design/aura → Mesajlar; the count is the badge.
    chatsTab: 'Sohbetler',
    requestsTab: 'İstekler',
    // The scene above the chats while friend requests wait (docs/design/aura → Mesajlar); a press
    // opens İstekler.
    incomingTitle: 'Gelen istekler',
    incomingBody: (n: number) =>
      n === 1
        ? 'Biri sana arkadaşlık isteği gönderdi'
        : `${n} kişi sana arkadaşlık isteği gönderdi`,
    requestKind: 'Arkadaşlık isteği',
    noRequests: 'Bekleyen istek yok',
    noRequestsHint: 'Biri seni arkadaş olarak eklemek isterse burada görürsün.',
    decline: (name: string) => `${name} isteğini reddet`,
    accept: (name: string) => `${name} isteğini kabul et`,
  },
  // Aktiviteler: the game hub (docs/SPEC_V3.md §18.3). Same games and rules as the room.
  // Aktiviteler (docs/SPEC_V4.md K-15; v44: .acts): today's events and Geçmiş. Each game's rules
  // below are its intro's and, from the table's games (4.3), its page's.
  activities: {
    // skall tuvali (AktivitelerGecmisKayit): "Sahtekar · bugün 19:30"; approved 27 Ekim.
    sheetLine: (game: string, when: string) => `${game} · ${when}`,
    tabs: 'Aktiviteler ve geçmiş',
    events: 'Aktiviteler',
    history: 'Geçmiş',
    fromVenues: (city: string) => `${inflectTr(city, 'locative')}ki mekanlardan`,
    eventKind: 'Etkinlik',
    eventLabel: (title: string, venue: string, when: string) => `${title}, ${venue}, ${when}`,
    noEvents: 'Bugün etkinlik yok',
    noEventsHint: 'Mekanların bugünkü etkinlikleri burada görünür; haftanın geri kalanı Keşfet’te.',
    days: {
      today: 'Bugün',
      yesterday: 'Dün',
      week: 'Bu hafta',
      earlier: 'Daha önce',
    } satisfies Record<HistoryDay, string>,
    // Under the heading the time of day; this week the weekday, before it the date.
    when: (iso: string, day: HistoryDay) =>
      day === 'today' || day === 'yesterday'
        ? clock(iso)
        : day === 'week'
          ? (WEEKDAYS_SHORT[new Date(iso).getDay()] ?? '')
          : dayMonth(iso),
    game: (concept: HistoryConcept) => HISTORY_CONCEPTS[concept],
    withTable: (alias: string) => `${alias} masasıyla`,
    results: { won: 'Kazandın', lost: 'Kaybettin', done: 'Bitti' } satisfies Record<
      HistoryResult,
      string
    >,
    rowLabel: (game: string, alias: string, when: string, result: string | null) =>
      [game, `${alias} masasıyla`, when, result].filter(Boolean).join(', '),
    tabu: {
      body: 'Masalar takım olur: anlatan masa kartı anlatır, diğer masa yasaklı kelimeleri dinler.',
      steps: [
        `İki masa yüz yüze oynar, sırayla anlatır. Her tur ${TABU.turnSeconds} saniye, oyun ${TABU.totalTurns} tur.`,
        'Anlatan karttaki kelimeyi yasaklı kelimeleri söylemeden anlatır; kendi masası tahmin eder.',
        `Doğru: kelime bilindi, iki masa da basabilir. Pas: kart geçilir, yalnızca anlatan basar, turda en çok ${TABU.maxPasses}. Yasak!: yasaklı kelime söylendi, yalnızca dinleyen masa basar.`,
        'Masalardan biri tek kişiyse iş birliği modu: tek takım, süreye karşı; üç düğmeye yalnızca anlatan basar.',
        `Kendi masanızla oynarken masanızı iki takıma ayırın; anlatan telefonu tutar, takımı tahmin eder. Her takım ${TABU.localRoundsPerTeam} kez anlatır.`,
      ],
    },
    sahtekar: {
      body: 'Herkes aynı kelimeyi görür, biri hariç: sahtekar yalnızca kategoriyi bilir. Onu bulun.',
      steps: [
        `En az ${SAHTEKAR.minPlayers} kişi. Telefon elden ele dolaşır; herkes kendi kartını basılı tutarak görür.`,
        `Kartına ${SAHTEKAR.viewSeconds / 60} dakikada bakmayan oyundan çıkar.`,
        `${capitalizeTr(numberWord(SAHTEKAR.clueRounds))} tur boyunca sırayla tek kelimelik ipucu verin; her ipucu ${SAHTEKAR.clueSeconds} saniye.`,
        'Sonra herkes gizlice sahtekar sandığı kişiye oy verir; kendine oy verilmez.',
        `Sahtekar yakalanırsa kelimeyi ${numberWord(SAHTEKAR.options)} seçenek arasından tahmin eder. Bilirse ya da yakalanmazsa sahtekar kazanır.`,
      ],
    },
    harf: {
      body: 'Kategoriye uyan bir kelime söyleyin, baş harfini kapın. Diğer masa itiraz edebilir.',
      steps: [
        `Masalar sırayla oynar; her sıra ${SAY_CONFIG.harf.turnSeconds} saniye.`,
        'Kategoriye uyan, tahtada açık bir harfle başlayan bir kelime söyleyin ve o harfe dokunun.',
        `Diğer masa ${SAY_CONFIG.harf.objectionSeconds} saniye içinde itiraz edebilir; itiraz alan ya da süresi dolan masa turu kaybeder, rakip 1 puan alır. Her masanın ${SAY_CONFIG.harf.objections} itiraz hakkı var.`,
        `Bütün harfler kapanırsa tur son harfi kapatanın. ${SAY_CONFIG.harf.totalRounds} kategori oynanır.`,
        'Kendi masanızla oynarken iki takıma ayrılın; telefon ortada durur.',
      ],
    },
    sarki: {
      body: 'Kelimenin geçtiği bir şarkıdan bir dize söyleyin. Söyleyemeyen kaybeder.',
      steps: [
        `Masalar sırayla, ${SAY_CONFIG.sarki.turnSeconds} saniye içinde kelimenin geçtiği bir dize söyler ve "Söyledik"e basar.`,
        'Kelimenin çekimli hâli de sayılır: "göz" için "gözlerin" geçen bir dize de olur.',
        `Diğer masa ${SAY_CONFIG.sarki.objectionSeconds} saniye içinde itiraz edebilir; itiraz alan ya da söyleyemeyen masanın rakibi 1 puan alır. Her masanın ${SAY_CONFIG.sarki.objections} itiraz hakkı var.`,
        `Bir kelimede en çok ${SAY_CONFIG.sarki.maxSteps} dize; ${ordinal(SAY_CONFIG.sarki.maxSteps)} de geçerse kelime puansız biter.`,
        `${SAY_CONFIG.sarki.totalRounds} kelime oynanır; son ${numberWord(SAY_CONFIG.sarki.shortRounds)} kelimede süre ${SAY_CONFIG.sarki.shortSeconds} saniye.`,
        'Uygulama müzik çalmaz, şarkı göstermez; dizeyi siz söylersiniz.',
      ],
    },
    ibre: {
      body: 'Anlatıcı gizli hedefi görür, tek ipucu verir; masası ibreyi hedefe getirmeye çalışır.',
      steps: [
        'Telefon iki uçlu bir ölçek gösterir (ör. Ucuz ile Pahalı). Masalar sırayla anlatır.',
        `Anlatıcı hedefi basılı tutarak görür, sesli tek ipucu verir. Masası ibreyi ayarlayıp onaylar; ${IBRE_CONFIG.clueSeconds} saniye.`,
        `Diğer masa ${IBRE_CONFIG.sideSeconds} saniye içinde hedefin ibrenin solunda mı sağında mı olduğunu söyler; doğruysa 1 puan.`,
        `Hedefe yakınlığa göre 4, 3 ya da 2 puan. ${IBRE_CONFIG.totalRounds} tur oynanır.`,
        'Kendi masanızla oynarken iki takıma ayrılın; anlatıcı hedefi takımından saklar.',
      ],
    },
    sohbet: {
      body: 'Sırayla kart çekin, soruyu masanızda konuşun.',
      steps: [
        `Bir tema seçin: ${Object.values(SOHBET_THEMES)
          .map((t) => `"${t}"`)
          .join(', ')
          .replace(/, ([^,]*)$/, ' ya da $1')}.`,
        'Sırayla kart çekin; karttaki soruyu masanızda konuşun.',
        'Başka bir masayla oynarken iki masa aynı kartı görür; sohbet masa sohbetinde de sürer.',
      ],
    },
  },
  explore: {
    // "Şu an buradasın" (v44: .vhere): the own check-in, kept on this phone only.
    here: 'Şu an buradasın',
    hereAt: (spot: string | null) => (spot ? `${spot} · giriş yaptın` : 'Giriş yaptın'),
    backToVenue: 'Mekana dön',
    views: { list: 'Liste', map: 'Harita' },
    // The bucket of a venue's active tables (K-16, K-41): never a count.
    buckets: { calm: 'Sessiz', lively: 'Birkaç açık masa', buzzing: 'Kalabalık' },
    // Search and kind (v44: .dsearch, .vcats).
    search: 'Mekan ara',
    kinds: { all: 'Tümü', campus: 'Kampüs', cafe: 'Kafe ve mekan' },
    kindsLabel: 'Mekan türü',
    // A venue's type in words (v46's `data-vtype`; lib/venueType.ts).
    typeLabel: { kampus: 'Kampüs', kafe: 'Kafe', cay: 'Çay bahçesi', yemek: 'Restoran' },
    venueSub: (kind: string, district: string) => `${kind} · ${district}`,
    // City and district (v44: .vloc; K-38): chosen, never the phone's position (rule 6).
    place: (city: string, district: string | null) => `${city} · ${district ?? 'Tüm semtler'}`,
    placeLabel: (city: string, district: string | null) =>
      `Şehir ve semt: ${city}, ${district ?? 'tüm semtler'}`,
    placeTitle: 'Şehir ve semt',
    placeNote:
      'Mekanlar konumuna göre değil, seçtiğin şehir ve semte göre listelenir. Bugün etkinliği olanlar önce, sonra ada göre.',
    city: 'Şehir',
    district: 'Semt',
    allDistricts: 'Tüm semtler',
    showPlace: 'Göster',
    // The count line (K-42).
    countLine: (n: number, eventsFirst: boolean) =>
      `${n} mekan · ${eventsFirst ? 'bugün etkinliği olanlar önce' : 'ada göre'}`,
    noMatch: 'Mekan bulunamadı',
    noMatchHint: 'Başka bir ad dene.',
    noPlace: 'Bu semtte mekan yok',
    noPlaceHint: 'Başka bir semt ya da şehir seç.',
    eventShort: 'Etkinlik',
    eventTag: (when: string, title: string) => `${when} · ${title}`,
    eventTime: (when: EventTime): string => {
      switch (when.kind) {
        case 'now':
          return 'Şimdi';
        case 'today':
          return `Bugün ${when.time}`;
        case 'tomorrow':
          return `Yarın ${when.time}`;
        case 'weekday':
          return `${WEEKDAYS[when.weekday] ?? ''} ${when.time}`;
      }
    },
    empty: 'Şu an listede mekan yok.',
    viewSwitch: 'Görünüm',
    mapLabel: 'Mekan haritası. Bir mekana dokununca altta kartı açılır.',
    goToVenue: 'Mekana git',
    notFound: 'Bu mekan artık listede değil.',
    back: 'Geri dön',
    checkInHint:
      'Mekanı sen seçtin; konumun yalnızca mekanda olduğunu doğrulamak için bir kez alınır.',
    checkInHere: 'Buraya giriş yap',
    // Keşfet's question (docs/design/aura → Keşfet).
    question: 'Bu akşam\nnerede oturuyorsun?',
    eventTagShort: 'Etkinlik',
    cityDistrict: (city: string, district: string) => `${city} · ${district}`,
    spotCount: (n: number) => `${n} nokta`,
    districtCity: (district: string, city: string) => `${district}, ${city}`,
    weekNote: 'Bu hafta',
    eventsTitle: 'Etkinlikler',
    noEvents: 'Bu hafta planlı etkinlik yok.',
    comingSoon: 'Yeni mekanlar yakında.',
  },
  friends: {
    empty: "Henüz arkadaşın yok. Birlikte oynadığın masaları Bildirimler'de bulabilirsin.",
    requestsAndHistory: 'Geçmiş ve istekler',
    message: (name: string) => `${name} ile mesajlaş`,
    // The friend row's button (v45: .fmsg).
    messageShort: 'Mesaj',
    // skall tuvali (AktivitelerGecmisEklendi); approved 27 Ekim.
    addedNote: (name: string) =>
      `${name} bunu görmez. O da seni eklerse arkadaş olursunuz. Yeniden basarsan geri alırsın.`,
    newRequests: (n: number) => `${n} yeni arkadaşlık isteği`,
    unread: 'Yeni mesaj',
    noMessagesYet: 'Henüz mesaj yok. İlk mesajı sen yaz.',
    // Ablative: the locative suffix plus "n" (Eylül'den, Ocak'tan).
    since: (iso: string) => `${dayMonthAt(iso)}n beri arkadaşsınız`,
    incomingTitle: 'Gelen istekler',
    noIncoming: 'Yeni istek yok.',
    incoming: (playedAt: string, concept: HistoryConcept, alias: string) =>
      `${dayMonthAt(playedAt)} ${PLAYED_WITH[concept]} ${alias} masası arkadaşın olmak istiyor`,
    accept: 'Kabul et',
    decline: 'Reddet',
    declineNote: 'Reddedersen karşı tarafa bildirilmez.',
    sentTitle: 'Gönderilen istekler',
    sent: (alias: string) => `İstek gönderildi: ${alias} masası`,
    sentAccepted: (alias: string) => `${alias} masası isteğini kabul etti`,
    historyTitle: 'Oyun geçmişi',
    noHistory: `Başka bir masayla en az ${ENCOUNTER_MIN_MINUTES} dakika oynadığınızda burada görünür.`,
    // The last game played in the room, or the chat (docs/SPEC_V3.md §5.5).
    historyRow: (alias: string, concept: HistoryConcept, playedAt: string) =>
      `${alias} masasıyla ${HISTORY_CONCEPTS[concept]} · ${dayMonth(playedAt)}`,
    people: (n: number) => `${headcountLabel(n)} kişi`,
    sendRequest: 'İstek gönder',
    addFriend: 'Arkadaş ekle',
    actionDone: 'Gönderildi',
    addFriendHint: 'İkiniz de basarsanız arkadaş olursunuz. O basmazsa hiçbir şey olmaz.',
    more: 'Diğer',
    moreTitle: 'Bu kişi',
    report: 'Şikayet et',
    block: 'Engelle',
    alsoReport: 'Şikayet de et',
    blockConfirm: 'Engelle',
    blockHint:
      'Birbirinizi lobide, isteklerde ve arkadaş listesinde bir daha görmezsiniz. Karşı tarafa bildirilmez.',
    removeFriend: 'Arkadaşlıktan çıkar',
    removeConfirm: 'Çıkar',
    removeHint: 'Konuşmanız silinir. Karşı tarafa bildirilmez.',
    friendMenuTitle: 'Arkadaşlık',
    done: 'Tamam',
    back: 'Geri',
  },
  notifications: {
    title: 'Bildirimler',
    withCount: (n: number) => `Bildirimler, ${n} yeni`,
    empty: 'Henüz bildirim yok',
    emptyHint: 'Arkadaşlık istekleri ve arkadaşlarının masa davetleri burada görünür.',
    // skall tuvali (Bildirimler, BildirimlerKabul): the name in bold, then the rest.
    fresh: 'Yeni',
    earlier: 'Önceki',
    requestRest: 'sana arkadaşlık isteği gönderdi',
    friendsNow: 'ile artık arkadaşsınız',
    acceptedRest: 'arkadaşlık isteğini kabul etti',
    acceptedMeta: 'Artık mesajlaşabilirsiniz',
    matchRest: 'ile arkadaş oldunuz',
    matchMeta: 'Masa sonunda ikiniz de eklediniz',
    inviteRest: 'seni masasına çağırıyor',
    invitePastRest: 'seni masasına çağırmıştı',
    inviteMeta: (table: string, people: number, clock: string) =>
      `${table} · ${headcountLabel(people)} kişi · ${clock} kaldı`,
    inviteJoined: (table: string) => `Kabul edildi, ${table} masasının yanına git.`,
    inviteGone: 'Davet artık geçerli değil',
    inviteDeclined: 'Reddettin',
    join: 'Katıl',
    writeMessage: 'Mesaj yaz',
    // One short line under the name, the same height for every kind (the owner's call, 28 Ekim).
    short: {
      request: 'Arkadaşlık isteği',
      friends: 'Arkadaşsınız',
      accepted: 'Kabul edildi',
      match: 'Arkadaş oldunuz',
      invite: (clock: string) => `Masa daveti · ${clock}`,
      joined: 'Katıldın',
      declined: 'Reddettin',
      gone: 'Süresi doldu',
    },
  },
  dm: {
    placeholder: 'Mesaj yaz…',
    send: 'Gönder',
    report: 'Konuşmayı şikayet et',
    olderMessages: 'Daha eski mesajlar',
    delivery: { sent: 'Gönderildi', delivered: 'İletildi', read: 'Okundu' },
    typing: 'yazıyor',
  },
  // skall tuvali (KapsulSusle…, KapsulGaleri; docs/SPEC_V4.md §4.D, K-46, K-61).
  capsule: {
    edit: 'Kapsülünü süsle',
    title: 'Kapsülün',
    shuffle: 'Karıştır',
    tapHead: 'Kafama dokun',
    worn: 'Takılı',
    remove: (name: string) => `${name} çıkar`,
    empty: (slot: string) => `${slot} boş`,
    pack: (name: string) => `${name} paketi`,
    packSlots: (n: number) => `${n} yuvaya parça`,
    wearPack: 'Paketi tak',
    clearAll: 'Hepsini çıkar',
    save: 'Kaydet',
    unsavedTitle: 'Değişiklikler kaydedilmedi',
    unsavedBody: 'Kaydetmeden çıkarsan kapsülün eski hâline döner.',
    saveAndLeave: 'Kaydet ve çık',
    leaveUnsaved: 'Kaydetmeden çık',
    saved: 'Kapsülün kaydedildi.',
    galleryTitle: 'Kapsül karakterler',
    gallerySub: (n: number) => `${n} anonim karakter`,
    galleryBody:
      'Anonim katılan kişi masada bu karakterlerden biriyle ve kapsul-xx55 biçiminde bir adla görünür. Kapsülün ölçüsü hep aynı; renk ve aksesuar değişir.',
    threeStates: 'Üç durum',
    statePhoto: 'Fotoğraflı profil',
    stateHidden: 'Fotoğrafı kaldırılmış profil',
    stateAnon: 'Anonim',
    anonCapsules: 'Anonim kapsüller',
    renewNames: 'İsimleri yenile',
    sampleNames: ['Ece', 'Selin'] as const,
  },
  profile: {
    photoOpen: 'Fotoğrafı büyüt',
    // skall tuvali (Profil, ProfilNick*): the photo and the capsule side by side, the nick card.
    ownPhoto: 'Profilin',
    ownPhotoNote: 'Masada görünen',
    ownCapsule: 'Kapsülün',
    ownCapsuleNote: 'Anonimken',
    // docs/design/aura → Profil.
    nickLabel: 'Anonim adın',
    friendsPeople: (n: number) => `${n} kişi`,
    whenProfiled: 'Profilliyken',
    leaveTitle: 'Kaydetmeden çıkılsın mı?',
    leaveBody: 'Yaptığın değişiklikler silinir.',
    leaveConfirm: 'Kaydetmeden çık',
    leaveBack: 'Düzenlemeye dön',
    seenAs: 'olarak görünürsün',
    seenAsLead: 'Masada',
    nickNote: 'Anonim adın. Yenilersen yeni bir ad alırsın; kapsülün aynı kalır.',
    nickNoteWait: 'Anonim adın. 30 günde bir yenileyebilirsin; kapsülün aynı kalır.',
    nickRefresh: "Nick'i yenile",
    nickRenew: 'Yenile',
    nickWait: (days: number) => `${days} gün sonra yenileyebilirsin.`,
    // A friend's profile (skall tuvali, ProfilBaskasi): the status beside "Mesaj".
    friendsStatus: 'Arkadaşsınız',
    noName: 'Henüz bir adın yok',
    nameWithAge: (name: string, age: number) => `${name}, ${age}`,
    // After the name on a profile's head, in the quiet colour (v45: .page-age).
    ageAfterName: (age: number) => `, ${age}`,
    addName: 'Ad ekle',
    edit: 'Profili düzenle',
    editShort: 'Düzenle',
    birthDateNote: 'Doğum tarihin değiştirilemez; profilinde yalnızca yaşın görünür.',
    friends: 'Arkadaşlar',
    friendsCount: (n: number) => `Arkadaşlar, ${n}`,
    friendsSub: (n: number) => `${n} arkadaş`,
    editTitle: 'Profili düzenle',
    nameLabel: 'Görünen ad',
    nameHint:
      '2–24 karakter. Bu adı arkadaşların görür; profilinle göründüğün masalarda ve mekan sohbetinde orada bulunanlar da görür.',
    bioLabel: 'Tanıtım',
    bioHint: (n: number, max: number) => `${n}/${max}`,
    bioTooLong: (max: number) =>
      `Tanıtım en fazla ${max} karakter olabilir; kaydetmek için kısalt.`,
    save: 'Kaydet',
    photo: 'Fotoğraf',
    photoChange: 'Fotoğrafı değiştir',
    photoAdd: 'Fotoğraf ekle',
    photoFromLibrary: 'Galeriden seç',
    photoFromCamera: 'Fotoğraf çek',
    photoRemove: 'Fotoğrafı kaldır',
    photoNeedsName: 'Fotoğraf eklemek için önce bir ad seç.',
    photoHidden:
      'Fotoğrafın şikayetler nedeniyle gizlendi; kimse göremiyor. Yeni bir fotoğraf yükleyebilirsin.',
    photoPermission: 'Fotoğraf seçmek için izin gerekiyor. İzni ayarlardan verebilirsin.',
    photoInvalid: 'Bu fotoğraf kullanılamadı. Başka bir fotoğraf dene.',
    photoPrivacy:
      'Fotoğrafın konum ve cihaz bilgisi gibi bütün ek bilgilerden arındırılarak yüklenir.',
    badgesTitle: 'Rozetler',
    noBadges: 'Oynadıkça rozet kazanırsın.',
    badgeCount: (earned: number, all: number) => `${earned} / ${all}`,
    badgeLocked: (name: string) => `${name}, henüz kazanılmadı`,
    badges: {
      first_game: 'İlk oyun',
      ten_games: '10 oyun',
      voice_tabu_five_wins: `${GAME_NAMES.tabu} ustası`,
      five_tables: '5 farklı masa',
    },
    notVisible: 'Bu profil artık görüntülenemiyor.',
    report: 'Profili şikayet et',
    // Another person's profile: the menu at the top right (v45: .pmore).
    more: 'Seçenekler',
    moreTitle: 'Bu profil',
    back: 'Geri dön',
  },
  // Anonymous or with the profile, chosen for each table in the lobby (docs/SPEC_V3.md §5.4).
  participation: {
    title: 'Bu masada nasıl görüneceksin?',
    anonymous: 'Anonim',
    anonymousHint: 'Diğer masalar yalnızca masa adını ve kişi sayını görür.',
    profile: 'Profilimle',
    profileHint: 'Lobide yalnızca masa adın görünür. Masadakiler, masa sürerken profilini görür.',
    profileNeedsName: 'Profilinle katılmak için önce Profil sekmesinden bir ad seç.',
    // "Bu masadayım" (canvas: Faz 2 · 22.5 → Bu masadayım: seçim): the table's phones see this one.
    memberAnonymousHint: (alias: string) => `Masadakiler yalnızca takma adını görür: ${alias}.`,
    memberProfileHint: 'Masadakiler, masa sürerken profilini görür.',
    // "Profilimle" needs a profile photo others can see (docs/SPEC_V3.md §22.G, decision 8).
    photoNeeded: 'Profilinle görünmek için profil fotoğrafı gerekiyor.',
    // A man and "Belirtmek istemiyorum" always join with the profile (docs/SPEC_V3.md §23.D): no
    // choice, the profile that goes (canvas: Faz 3 · 23.2 → profil önizlemesi).
    previewTitle: 'Masada böyle görüneceksin',
    previewJoinTitle: 'İsteğinle birlikte gider',
    previewTag: 'Profilinle',
    previewLobby: 'Lobide yalnızca masa adın görünür. Masadakiler, masa sürerken profilini görür.',
    previewJoin:
      'Masanın lideri isteğinde adını, yaşını ve fotoğrafını görür. Kabul ederse masadakiler, masa sürerken profilini görür.',
    previewMember: 'Masadakiler, masa sürerken profilini görür.',
    previewName: (name: string, age: number | null) => (age === null ? name : `${name}, ${age}`),
    photoNeededLobby: 'Masanı lobiye açmak için profil fotoğrafı gerekiyor.',
    photoNeededJoin: 'Katılma isteği göndermek için profil fotoğrafı gerekiyor.',
    photoNeededMember: 'Bu tarafa katılmak için profil fotoğrafı gerekiyor.',
  },
  home: {
    title: 'Hoş geldin',
    hint: 'Bir mekandaysan masanı açıp diğer masalarla oynayabilirsin.',
    checkIn: 'Mekana giriş yap',
    settings: 'Ayarlar',
  },
  checkin: {
    locationTitle: 'Konumun',
    locationBody:
      'Mekanda olduğunu doğrulamak için konumunu bir kez kullanıyoruz. Konumun saklanmaz.',
    locationConsent: 'Konumumun bu amaçla kullanılmasına açık rıza veriyorum.',
    useLocation: 'Konumumu kullan',
    // skall tuvali (KesfetKonumIzin, KesfetMekan); approved 27 Ekim.
    deniedTitle: 'Konum izni yok',
    replaces: (venue: string) => `${venue} girişin biter; bulunduğun masadan ayrılırsın.`,
    locating: 'Konum alınıyor…',
    permissionDenied:
      'Konum izni olmadan mekanda olduğunu doğrulayamıyoruz. İzni ayarlardan verebilirsin.',
    openSettings: 'Ayarları aç',
    locationFailed: 'Konum alınamadı. Açık bir alanda tekrar dene.',
    venuesTitle: 'Yakındaki mekanlar',
    noVenues: 'Yakınında kayıtlı bir mekan yok.',
    retry: 'Tekrar dene',
    distance: (meters: number) => `${meters} m`,
    osmAttribution: '© OpenStreetMap katkıda bulunanlar',
    outsideBoundary: (kind: VenueKind) =>
      kind === 'campus'
        ? 'Kampüsün içinde görünmüyorsun. Kampüse girince tekrar dene.'
        : 'Mekanın içinde görünmüyorsun. Mekana girince tekrar dene.',
    spotTitle: 'Neredesin?',
    spotHint: 'Aynı noktadaki masalarla oynarsın. Noktanı sonra da değiştirebilirsin.',
    venueAtSpot: (venue: string, spot: string) => `${venue} · ${spot}`,
    headcountTitle: 'Masada kaç kişisiniz?',
    headcountOption: (n: number) => headcountLabel(n),
    headcountHint: 'Kendinizi de sayın. Dört ya da daha fazlaysanız 4+ seçin.',
    open: 'Masayı aç',
    doneTitle: 'Masan hazır',
    doneBody: 'Bu mekanda diğer masalar sizi bu adla görecek:',
    continue: 'Devam',
  },
  // The games (docs/SPEC_V3.md §5.1). "Sohbet" alone is the intent label, never a game.
  concepts: GAME_NAMES,
  // How a game is shown with its type (docs/SPEC_V2.md §8.1): only voice games are marked, since
  // they need the tables to come together.
  conceptWithMode: (concept: 'tabu' | 'sohbet' | 'sahtekar' | 'harf' | 'sarki' | 'ibre') =>
    concept === 'sohbet' ? 'Sohbet kartları' : `${VOICE_NAMES[concept]} · yüz yüze`,
  // The room's optional intent label (§5.2).
  intents: { game: 'Oyun', chat: 'Sohbet' },
  voiceNote:
    'Bu oyun yüz yüze oynanır: başka bir masa katılırsa masalar bir araya gelip sesli oynar.',
  rooms: {
    // Faz 3 (docs/SPEC_V3.md §23.C; canvas: Aşama 2 · Ekranlar → Faz 3 · 23.1 Masa ve lobi): the
    // word "oda" is never shown; the server's rooms stay.
    create: 'Masanı lobiye aç',
    playWithTable: 'Masanla oyna',
    // The empty lobby (v45: .empty-card): the title, then what this table can do.
    lobbyEmptyTitle: 'Açık masa yok',
    playWithTableHint: 'Masanı lobiye açabilir ya da kendi masanla oynayabilirsin.',
    // The empty lobby while this table is in it.
    lobbyEmptyOpen: 'Biri katılmak isterse burada görürsün.',
    lobbyLoading: 'Lobi yükleniyor…',
    lobbyError: 'Lobi yüklenemedi.',
    lobbyTitle: 'Açık masalar',
    roomCount: (n: number) => `${n} masa`,
    profiled: 'profilli',
    people: (n: number) => `${headcountLabel(n)} kişi`,
    requestJoin: 'Katıl',
    // Faz 2 (docs/SPEC_V3.md §22.C; canvas: Faz 2 · 22.5 Takımlar): a member of a side.
    requestMember: 'Bu masadayım',
    phones: (n: number) => `${n} telefon`,
    peopleAndPhones: (people: number, phones: number) =>
      `${headcountLabel(people)} kişi · ${phones} telefon`,
    phonesAndPeople: (phones: number, people: number) =>
      `${phones} telefon · ${headcountLabel(people)} kişi`,
    runningTitle: 'Süren masalar',
    runningHint: 'Masandakiler bunlardan birinde oynuyorsa onların tarafına katılabilirsin.',
    // Between the two sides of a running room.
    versus: 'ile',
    memberBody: (leader: string) =>
      `${inflectTr(leader, 'genitive')} tarafına katılırsın. Kabul ederse oyun ve sohbet senin telefonunda da açılır.`,
    tellLeader: 'Liderine bu adı söyle',
    tellLeaderBody: (leader: string) =>
      `${leader} bu adı istek kartında görür. Kabul ederse masaya katılırsın.`,
    incomingMemberTitle: 'Masana katılmak istiyor',
    incomingMemberBody:
      'Bu adı söyleyen arkadaşınsa kabul et. Kabul edersen senin tarafına katılır.',
    declineMemberNote: 'Reddedersen o yalnızca "Masa şu an müsait değil" görür.',
    peopleTitle: 'Masadakiler',
    mySide: (phones: number) => `Senin tarafın · ${phones} telefon`,
    otherSide: (phones: number) => `Karşı taraf · ${phones} telefon`,
    leaderTag: 'Lider',
    youTag: 'Sen',
    peopleNote: 'Profilli olanların profili masa sürerken açılır.',
    leave: 'Masadan çık',
    leaveHandover: (next: string) =>
      `Çıkarsan liderlik ${inflectTr(next, 'dative')} geçer, masa sürer.`,
    leaveConfirmTitle: 'Masadan çıkıyor musun?',
    leaveConfirmLeader: (next: string) =>
      `Liderlik ${inflectTr(next, 'dative')} geçer, masa sürer. Yeniden yalnızca bu tarafa katılabilirsin.`,
    leaveConfirmMember: 'Yeniden yalnızca bu tarafa katılabilirsin.',
    // The new leader's note at the top of the chat (canvas: Liderlik devri notu).
    newLeader: (previous: string) =>
      `Artık lider sensin. ${previous} masadan çıktı; katılma istekleri sana gelir, masayı sen bitirebilirsin.`,
    mySpot: (name: string) => `Senin noktan · ${name}`,
    noSpot: 'Noktasız',
    spotHere: 'Bu noktadayım',
    otherSpot: 'Bu masa başka bir noktada.',
    requestPending: (seconds: number) => `İsteğin gönderildi. Yanıt bekleniyor (${seconds} sn).`,
    requestUnavailable: 'Masa şu an müsait değil.',
    // In place of the pending note for a few seconds once the request is accepted.
    newTitle: 'Masanı lobiye aç',
    newHint:
      'Mekandaki masalar seni lobide görür ve katılmak isteyebilir. Oyunu birleşince birlikte seçersiniz.',
    intentLabel: 'Niyetin (isteğe bağlı)',
    intentNone: 'Etiket yok',
    intentHint: {
      game: 'Oyun oynamak istiyorsun.',
      chat: 'Sohbet etmek istiyorsun. Oyun yine önerilebilir.',
    },
    // The optional game tag (docs/SPEC_V3.md §23.C): only seen in the lobby.
    gameTagLabel: 'Oyun (isteğe bağlı)',
    gameTagNone: 'Fark etmez',
    gameTagHint: 'Yalnızca lobide görünür; oyunu başlatmaz.',
    createConfirm: 'Lobiye aç',
    // The room's eyebrow: the running game, else the chat; voice games say they are played face to
    // face (docs/SPEC_V2.md §8.1).
    roomEyebrow: (concept: 'tabu' | 'sohbet' | 'sahtekar' | 'harf' | 'sarki' | 'ibre' | null) =>
      concept === null
        ? 'Masan'
        : concept === 'sohbet'
          ? 'Sohbet kartları'
          : `${VOICE_NAMES[concept]} · yüz yüze`,
    withGuest: (owner: string, guest: string) => `${owner} ve ${guest}`,
    // A two-table room's top bar: only the other table's name.
    withOther: (alias: string) => `${alias} ile`,
    waitingForGuest: 'Başka bir masa katılmak isteyebilir. Bu arada kendi masanla oynayabilirsin.',
    end: 'Masayı bitir',
    endHint:
      'Masayı bitirirsen masa herkes için kapanır. Karşı taraftakileri sonra da arkadaş ekleyebilirsin.',
    // The merged table (docs/SPEC_V3.md §23.F; canvas: Faz 3 · 23.3).
    tabsLabel: 'Oyun ve sohbet',
    tabGames: 'Oyun Seç',
    tabChat: 'Masa Sohbeti',
    unreadChat: 'okunmamış mesaj',
    peopleStrip: (n: number) => `Masadakiler · ${n}`,
    peopleAll: 'Tümü',
    requestTitle: 'Katılma isteği',
    sendRequest: 'İsteği gönder',
    incomingTitle: 'Katılma isteği',
    incomingBody: (alias: string, headcount: number) =>
      `${alias} (${headcountLabel(headcount)} kişi) masana katılmak istiyor.`,
    accept: 'Kabul et',
    decline: 'Reddet',
    declineNote: 'Reddedersen karşı masa yalnızca "Masa şu an müsait değil" görür.',
    // The profiled requester's card (docs/SPEC_V3.md §23.E) while its profile loads.
    requestProfileLoading: 'Profil yükleniyor',
    // The leader's "Kabul" came too late: the requester's table merged with another meanwhile
    // (room_not_available) or the request ended (docs/SPEC_V3.md §23.C).
    requestGone: 'Bu masa artık müsait değil.',
    // skall tuvali (MasaIstek… panoları).
    wantsToJoin: (who: string) => `${who} katılmak istiyor`,
    withProfile: 'Profiliyle',
    anonymous: 'Anonim',
    memberAsk: 'Bu masadayım diyor',
    askedBy: (who: string) => `isteyen ${who}`,
    askedByAnonymous: 'isteyen anonim',
    tooMany: 'Birlikte 12 kişiyi geçersiniz. Masada en çok 12 kişi olur.',
    comingTitle: (alias: string, people: number) => `${alias} geliyor, ${people} kişi`,
    comingBody: 'Masanın yanına geliyorlar.',
    viewPeople: 'Masadakileri gör',
    secondsLeft: (s: number) => `${s} sn`,
  },
  chat: {
    title: 'Sohbet',
    show: 'Sohbeti aç',
    hide: 'Sohbeti kapat',
    placeholder: 'Mesaj yaz…',
    send: 'Gönder',
    empty: 'Henüz mesaj yok.',
    counter: (n: number, max: number) => `${n}/${max}`,
    sending: 'Gönderiliyor…',
    notSent: 'Gönderilemedi.',
    retry: 'Tekrar dene',
    discard: 'Sil',
    // Chat screens: a day line over each day's first message, the time under a run (Aşama 4).
    today: 'Bugün',
    day: (iso: string) => dayMonth(iso),
    time: (iso: string) => {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },
    // Aşama 8 · Saha: following the newest message, replies and reactions.
    newMessages: (n: number) => (n > 1 ? `Yeni mesaj · ${n}` : 'Yeni mesaj'),
    newMessagesLabel: (n: number) =>
      n > 1 ? `${n} yeni mesaj, en alta in` : 'Yeni mesaj, en alta in',
    reply: 'Yanıtla',
    copy: 'Kopyala',
    react: 'Tepki ver',
    replyingTo: (name: string) => `Yanıtlanan: ${name}`,
    cancelReply: 'Yanıtı kaldır',
    // A reply whose message was deleted or cannot be seen (docs/SPEC_V3.md §21.1).
    quoteGone: 'Mesaj artık yok',
    goToQuote: 'Yanıtlanan mesaja git',
    // The quoted message is the reader's own.
    you: 'Sen',
    quoteLabel: (name: string, text: string) => `${name} mesajına yanıt: ${text}`,
    reactionChip: (emoji: string, n: number, mine: boolean) =>
      `${emoji} ${n}${mine ? ', senin tepkin' : ''}`,
    reactWith: (face: string) => `${face} ile tepki ver`,
    // The six capsule faces (docs/SPEC_V4.md §4.C; skall tuvali, uretec/veri/emotes.json).
    reactions: {
      begen: 'Beğendim',
      ask: 'Bayıldım',
      kahkaha: 'Kahkaha',
      saskin: 'Şaşırdım',
      uzgun: 'Üzüldüm',
      kizgin: 'Kızdım',
    } satisfies Record<Reaction, string>,
    report: 'Bildir',
    delete: 'Sil',
    // Over the first message that came while the chat was closed (skall tuvali: `.day.new`).
    newLine: 'Yeni mesajlar',
    jumpDown: 'En alta in',
    openProfile: (name: string) => `${name}, profili aç`,
  },
  // Mekan sohbeti (docs/SPEC_V3.md §7).
  venueChat: {
    open: 'Mekan sohbeti',
    title: (venue: string) => `${venue} sohbeti`,
    hint: 'Mekanda masası olan herkes okur ve yazar. Mesajlar 24 saat sonra silinir.',
    empty: 'Henüz mesaj yok. İlk mesajı sen yaz.',
    placeholder: 'Mekana yaz…',
    send: 'Gönder',
    asProfile: 'Profilimle yaz',
    asProfileOn: 'Adınla görünür; masa adın görünmez.',
    asProfileOff: 'Masa adınla görünür.',
    // One choice per check-in, asked at the first "Gönder" (§22.G, decision 7); the line over the
    // message bar says which one it is.
    modeTitle: 'Bu mekanda kaldığın sürece mekan sohbetinde nasıl görüneceksin?',
    modeAnonymousHint: (alias: string) => `Mesajların masa adınla görünür: ${alias}.`,
    modeProfileHint: 'Mesajların adın ve fotoğrafınla görünür; masa adın görünmez.',
    writingAnonymous: 'Anonim yazıyorsun',
    writingProfile: 'Profilinle yazıyorsun',
    you: 'Sen',
    messageMenu: 'Mesaj',
    // skall tuvali (Mekan sohbeti panoları, docs/SPEC_V4.md §4.D).
    options: 'Mekan sohbeti seçenekleri',
    writingAs: 'olarak yazıyorsun',
    change: 'Değiştir',
    changeLabel: 'Kimliğini değiştir',
    changed: 'Bu girişte değişti',
    emptyTitle: 'Mekandaki herkes okur',
    emptyProfiled: 'Mesajların adınla ve fotoğrafınla görünür. 24 saat sonra silinir.',
    emptyAnonymous: (nick: string) =>
      `Mesajların ${nick} adıyla, kapsül karakterinle görünür. 24 saat sonra silinir.`,
    mutedTitle: 'Sessize aldıkların',
    mutedNone: 'Sessize aldığın kimse yok.',
    unmute: 'Sesi aç',
    done: 'Tamam',
    mute: 'Sessize al',
    mutedToast: (name: string) => `${name} sessize alındı. Mesajları sana görünmez.`,
    anonymousPerson: 'Anonim katılıyor',
    profiledPerson: 'Profilli katılıyor',
    anonymousNote: 'Anonim kişinin profili görünmez.',
    seeProfile: 'Profili gör',
    deleted: 'Mesaj silindi.',
    sendRequest: 'Arkadaşlık isteği gönder',
    requestConfirmTitle: 'İstek gönderilsin mi?',
    requestConfirmBody: 'İstek gönderirsen profilin ona görünür: adın, yaşın ve fotoğrafın.',
    requestConfirm: 'İsteği gönder',
    requestSent: 'İstek gönderildi.',
    blockConfirmTitle: 'Bu kişiyi engellemek istiyor musun?',
    blockConfirmBody:
      'Birbirinizin mesajlarını artık görmezsiniz. Karşı tarafa bildirilmez. Engeli ayarlardan kaldırabilirsin.',
    noTable: 'Mekan sohbeti yalnızca mekanda masan varken açılır.',
    // A request from the venue chat (§7.5): the sender's name and age.
    incoming: (venue: string, name: string, age: number | null) =>
      `${venue} sohbetinden ${age !== null ? `${name} (${age})` : name} arkadaşın olmak istiyor`,
    sent: (name: string) => `İstek gönderildi: ${name}`,
    sentAccepted: (name: string) => `${name} isteğini kabul etti`,
  },
  safety: {
    report: 'Şikayet et',
    reportTitle: 'Neden şikayet ediyorsun?',
    reasons: {
      harassment: 'Taciz',
      inappropriate: 'Uygunsuz içerik',
      spam: 'Spam',
      other: 'Diğer',
      // Only for a person met in the game flow: a phone at the table and a history row (§23.D).
      wrong_gender: 'Yanlış cinsiyet beyanı',
    },
    reportSent: 'Şikayetin alındı. Teşekkürler.',
    block: 'Engelle',
    blockConfirmTitle: 'Bu kişiyi engellemek istiyor musun?',
    blockConfirm: 'Engelle',
    // Faz 2 (canvas: Engelle / Şikayet et: kişi seçimi): the person first.
    blockWho: 'Kimi engelliyorsun?',
    reportWho: 'Kimi şikayet ediyorsun?',
    blockOwnMember: (alias: string) =>
      `${alias} masadan çıkar, sen masada kalırsın. Birbirinizin masalarını artık görmezsiniz.`,
    blockLeaves: 'Sen masadan çıkarsın. Birbirinizin masalarını artık görmezsiniz.',
    reportNote: 'Şikayetin, şikayet ettiğin kişiye bildirilmez.',
    blockedTitle: 'Engellenenler',
    blockedEmpty: 'Engellediğin kimse yok.',
    blockedSince: (date: string) => `${date} tarihinde engellendi`,
    unblock: 'Engeli kaldır',
    otherOffline: 'Diğer masanın bağlantısı koptu.',
  },
  games: {
    sohbetFirst: 'İlk kartı aç',
    sohbetNext: 'Sonraki',
    sohbetWait: (s: number) => `Sonraki (${s} sn)`,
    themes: SOHBET_THEMES,
    localIntro: 'Masanızı iki takıma ayırın. Anlatan telefonu tutar, takımı tahmin eder.',
    team: (t: string) => `Takım ${t}`,
    round: (n: number, total: number) => `Tur ${n}/${total}`,
    startTurn: (t: string) => `Takım ${t} başlasın`,
    forbiddenLabel: 'Yasaklı kelimeler',
    correct: 'Doğru',
    pass: 'Pas',
    taboo: 'Yasak!',
    scores: (a: number, b: number) => `A ${a} – ${b} B`,
    winner: (t: string) => `Takım ${t} kazandı!`,
    draw: 'Berabere!',
    playAgain: 'Yeniden oyna',
    // Proposals (docs/SPEC_V3.md §5.3): a game starts only when the other table accepts.
    proposeTitle: 'Oyun öner',
    proposeHint: 'Diğer masa kabul edince oyun başlar.',
    propose: (game: string) => `${game} öner`,
    proposalMine: (game: string, s: number) => `${game} önerdin. Yanıt bekleniyor (${s} sn).`,
    proposalTheirs: (game: string) => `Diğer masa ${game} öneriyor.`,
    acceptProposal: 'Oynayalım',
    declineProposal: 'Şimdi değil',
    notAccepted: 'Öneri kabul edilmedi.',
    // One table: the games start at once.
    soloTitle: 'Masanla oyna',
    soloHint: (n: number) => `Tek telefonla, masada elden ele. ${n} kişisiniz.`,
    minPlayers: (n: number) => `En az ${n} kişi`,
    start: (game: string) => `${game} başlat`,
    endGame: 'Oyunu bitir',
    lastGameTabu: (owner: string, ownerScore: number, guest: string, guestScore: number) =>
      `Son oyun: ${owner} ${ownerScore} – ${guestScore} ${guest}`,
    lastGameOther: (game: string) => `${game} bitti.`,
    turn: (n: number, total: number) => `Tur ${n}/${total}`,
    turnEyebrow: (n: number, total: number) => `${GAME_NAMES.tabu} · Tur ${n}/${total}`,
    passesLeft: (n: number) => `${n} pas hakkı`,
    passDetail: (n: number) => `${n} hak`,
    secondsLeft: (s: number) => `${s} sn`,
    // The turn clock, "0:37".
    clock: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
    clockLabel: (s: number) => `${s} saniye kaldı`,
    correctPoints: '+1',
    tabooPoints: '−1',
    turnOverWait: 'Tur bitiyor…',
    voiceIntro: `Yüz yüze oynanır: masalar sırayla anlatır, diğer masa kartı görür ve hakemlik yapar. ${TABU.totalTurns} tur, her tur ${TABU.turnSeconds} saniye.`,
    sohbetIntro: 'Sohbet kartları: her kart bir soru; iki masa da sonraki kartı açabilir.',
    voiceDescribe:
      'Sıra sizde: kartı masanıza anlatın. Diğer masa kartı görüyor, yasaklı kelime geçerse "Yasak!" der.',
    tapToReveal: 'Kartı görmek için dokun',
    hideFromTeam: 'Önce telefonu takım arkadaşlarından sakla.',
    cardsLoading: 'Kartlar geliyor…',
    voiceJudge: (alias: string) => `${alias} anlatıyor. Hakem sizsiniz.`,
    judgeCorrect: 'Doğru +1',
    judgeTaboo: 'Yasak! −1',
    // The score label of this phone's side (canvas: Faz 2 · 22.5).
    you: 'tarafın',
    // The describer's teammate (docs/SPEC_V3.md §22.E; canvas: Sesli Tabu: takım arkadaşı).
    teammateNote: (alias: string) => `${alias} anlatıyor.`,
    cardWithDescriber: 'Kart anlatanda',
    cardWithDescriberHint:
      "Kartı yalnızca anlatan ve hakem taraf görür. Sen tahmin et, bilince Doğru'ya bas.",
    describing: 'anlatıyor',
    voiceWinner: (alias: string) => `${alias} kazandı!`,
    voiceDraw: 'Berabere!',
    cardOnlyHere: 'Kartı yalnızca bu masadakiler görür.',
    // Cooperative mode (docs/SPEC_V3.md §6.3): one team, the guessing table never sees the card.
    coopIntro: 'Masalardan biri tek kişi: iki masa tek takım, ortak skor süreye karşı.',
    coopDescribe:
      'Sıra sizde: kartı diğer masaya anlatın. Doğru, Pas ve Yasak! düğmelerine siz basarsınız.',
    coopGuess: (alias: string) => `${alias} size anlatıyor. Anlatanı dinleyin ve tahmin edin.`,
    coopCardHidden: 'Kartı yalnızca anlatan görür.',
    teamScore: 'Ortak skor',
    lastGameTeam: (score: number) => `${GAME_NAMES.tabu} bitti. Ortak skor: ${score}`,
    // Stage 6 (canvas: Aşama 6 · Oyunlar): full-screen game, turn ready, feedback, end, intro.
    scoreUp: (n: number) => `+${n}`,
    scoreDown: (n: number) => `−${n}`,
    chatButton: (unread: number) => (unread > 0 ? `Sohbet, ${unread} okunmamış` : 'Sohbet'),
    endGameConfirmTitle: 'Oyunu bitirelim mi?',
    endGameConfirmBody:
      'Skor şimdiki hâliyle kaydedilir ve iki masa sohbete döner. Diğer masa da bunu görür.',
    endGameConfirmSolo: 'Skor şimdiki hâliyle kalır ve masanız sohbete döner.',
    endGameConfirm: 'Bitir',
    keepPlaying: 'Devam et',
    turnDone: (n: number) => `${n}. tur bitti`,
    turnReadyStart: 'Başla',
    turnReadyStartLabel: 'Turu başlat',
    turnReadyYou: 'Sıra tarafında',
    turnReadyHint: "Başla'ya kim basarsa o anlatır; kart yalnızca onun telefonunda açılır.",
    turnReadyWaiting: (alias: string) => `${alias} hazırlanıyor`,
    turnReadyWaitingHint: 'Onlar başlayınca ya da süre dolunca tur başlar.',
    turnReadySeconds: (s: number) => `${s} saniye`,
    statCorrect: 'Doğru',
    statTaboo: 'Yasak',
    statPass: 'Pas',
    timeUp: 'Süre bitti!',
    rematch: 'Rövanş',
    introEyebrow: 'İlk oyun',
    introSkip: 'Geç',
    introTitle: `${GAME_NAMES.tabu} nasıl oynanır?`,
    introStep: (n: number) => `${n}. adım`,
    introSteps: [
      {
        title: 'Anlatan masa',
        body: 'Kartı yalnızca anlatan görür. Kelimeyi yasaklı kelimeleri söylemeden kendi takımına anlatır.',
      },
      {
        title: 'Hakem masa',
        body: 'Karşı masa dinler. Yasaklı kelime geçerse "Yasak!" düğmesine basar.',
      },
      {
        title: 'Düğmeler',
        body: `Bilinince "Doğru" (+1), geçmek için "Pas" (turda ${TABU.maxPasses} hak). Tur ${TABU.turnSeconds} sn sürer.`,
      },
    ],
    introDone: 'Anladım, başlayalım',
    // Step 7 A2 (docs/SPEC_V3.md §19.2): the ready screen's summary and the time-up line.
    turnSummaryTitle: (alias: string) => `${alias} anlattı`,
    signedPoints: (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0'),
    turnPointsLine: (alias: string, n: number) =>
      `${alias} bu turda ${n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0'}`,
    gameBrand: (game: string) => `${APP_NAME} · ${game}`,
  },
  // Harf Kapmaca and Şarkıda Geçsin (docs/SPEC_V3.md §20.3–20.4): say, then the other table may
  // object within the window; a few objections per table (SAY_CONFIG).
  say: {
    category: 'Kategori',
    word: 'Kelime',
    letterClosed: (l: string) => `${l}, kapandı`,
    said: 'Söyledik',
    object: 'İtiraz',
    objected: 'İtiraz!',
    objectionsShort: (n: number) => `${n} hak`,
    objectionsLeft: (n: number) => `${n} itiraz hakkı kaldı`,
    window: (s: number) => `İtiraz penceresi · ${s} sn`,
    windowLabel: (s: number) => `İtiraz için ${s} saniye`,
    sayLine: 'Geçtiği bir şarkıdan bir dize söyleyin',
    // The game screens (docs/SPEC_V3.md §20.3–20.4).
    round: (n: number, total: number) => `Tur ${n} / ${total}`,
    yourTurn: 'Sıra sizde',
    theirTurn: (alias: string) => `Sıra ${alias} masasında`,
    teamTurn: (team: string) => `Sıra: Takım ${team}`,
    team: (team: string) => `Takım ${team}`,
    // The last round's winner over the next round; the points stand beside it ("+1").
    roundWon: (alias: string, reason: 'objection' | 'timeout' | 'board' | 'lines') =>
      reason === 'objection'
        ? `İtiraz! ${alias}`
        : reason === 'board'
          ? `Tahta doldu. ${alias}`
          : `Süre doldu. ${alias}`,
    // Under "İtiraz!": who took the point.
    objectionPoint: (alias: string) => `${alias} +1`,
    roundEnd: { objection: 'İtiraz!', timeout: 'Süre doldu, tur bitti.', board: 'Tahta doldu.' },
    roundNoPoint: `${capitalizeTr(numberWord(SAY_CONFIG.sarki.maxSteps))} dize söylendi; puan yok.`,
    readyHint: (s: number) => `Başlayınca her sıra ${s} saniye.`,
    readyWaitingHint: 'Onlar başlayınca ya da süre dolunca tur başlar.',
    pickLetter: 'Kelimeyi söyleyin, baş harfine dokunun.',
  },
  // İbre (docs/SPEC_V3.md §20.5): a two-ended scale, values 0–100.
  ibre: {
    scale: (l: string, r: string) => `${l} ile ${r} arasında ölçek`,
    hold: 'Basılı tut, hedefi gör',
    holdLabel: 'Hedefi görmek için basılı tut',
    holdHint: 'Bırakınca hedef kapanır. Takımın görmesin.',
    loading: 'Hedef geliyor…',
    target: (v: number) => `Hedef: ${v}`,
    targetLabel: (v: number, l: string, r: string) => `Hedef ${v}; ${l} 0, ${r} 100`,
    needleLabel: (v: number, l: string, r: string) => `İbre ${v}; ${l} 0, ${r} 100`,
    left: 'İbreyi sola al',
    right: 'İbreyi sağa al',
    moreLeft: '← Solunda',
    moreRight: 'Sağında →',
    revealLabel: (t: number, n: number | null) =>
      n === null ? `Hedef ${t}, ibre onaylanmadı` : `Hedef ${t}, ibre ${n}`,
    points: (n: number) => `+${n}`,
    pointsWord: 'puan',
    // The game screens (docs/SPEC_V3.md §20.5).
    round: (n: number, total: number) => `Tur ${n} / ${total}`,
    readyHint: `Başla'ya basınca ${IBRE_CONFIG.clueSeconds} saniye: hedefe bakın, tek ipucu verin, ibreyi onaylayın.`,
    readyWaitingHint: 'Karşı masa hedefe bakıp tek ipucu verecek. Dinleyin.',
    clueHint: `Anlatıcı hedefe baksın, sesli tek ipucu versin. Masası ibreyi ayarlayıp onaylasın; son ${IBRE_AUTO_LOCK_SECONDS} saniyede ibre olduğu yerde onaylanır.`,
    lock: 'İbreyi onayla',
    // Faz 2 (docs/SPEC_V3.md §22.E; canvas: İbre: anlatıcı / takım arkadaşı).
    teamLocks: 'Takım arkadaşın "İbreyi onayla"ya basınca ibre kilitlenir.',
    teamClue: (alias: string) => `${alias} ipucu veriyor. İbreyi ipucuna göre getir.`,
    otherClue: (alias: string) => `${alias} ipucu veriyor. İbre onaylanınca taraf seçeceksiniz.`,
    sideTitle: 'Hedef ibrenin solunda mı, sağında mı?',
    sideHint: (s: number) => `${s} sn içinde seçin; doğruysa 1 puan.`,
    sideWaiting: (alias: string) => `${alias} taraf seçiyor.`,
    describerTurn: (team: string) => `${team} anlatıyor. Telefonu anlatıcıya verin.`,
    sideTurn: (team: string) => `${team}: hedef ibrenin solunda mı, sağında mı?`,
    roundTitle: (alias: string, band: number) => `${alias} bu turda +${band}`,
    revealDetail: (
      target: number,
      needle: number | null,
      guesser: string,
      side: 'left' | 'right' | null,
      point: boolean,
    ) =>
      needle === null
        ? `Hedef ${target} · ibre onaylanmadı`
        : side === null
          ? `Hedef ${target} · ibre ${needle} · ${guesser} taraf seçmedi`
          : `Hedef ${target} · ibre ${needle} · ${guesser}: ${side === 'left' ? 'solunda' : 'sağında'}, ${point ? '+1' : 'puan yok'}`,
  },
  // Sahtekar (docs/SPEC_V3.md §20.2): seats are game labels, never identities.
  sahtekar: {
    seatDone: (seat: string) => `${seat}, baktı`,
    viewedCount: (seen: number, total: number) => `${seen} / ${total} baktı`,
    passTo: (seat: string) => `Telefonu ${seatTo(seat, 'dative')} ver`,
    passHint: 'Başkası ekrana bakmasın.',
    ready: (seat: string) => `Ben ${seatTo(seat, 'copula')}, kartımı göster`,
    hold: 'Basılı tut',
    holdHint: 'Parmağını kaldırınca kart kapanır.',
    holdLabel: (seat: string) => `${seat}, kartını görmek için basılı tut`,
    loading: 'Kart geliyor…',
    category: (c: string) => `Kategori: ${c}`,
    notImposter: 'Sahtekar değilsin',
    youAreImposter: 'Sahtekarsın',
    imposterHint: 'Kelimeyi bilmiyorsun. Dinle, belli etme.',
    seen: 'Gördüm, telefonu ver',
    clueRound: (n: number, total: number) => `İpucu turu ${n} / ${total}`,
    turnOf: (seat: string) => `Sıra ${seatTo(seat, 'locative')}`,
    clueHint: `Tek kelime, ${SAHTEKAR.clueSeconds} sn. Söyleyince bu masa "Söyledi"ye basar.`,
    speaking: (seat: string) => `${seat} söylüyor`,
    said: (seat: string) => `${seat} söyledi`,
    saidButton: 'Söyledi',
    otherSpeaking: 'Sıra diğer masada. Dinleyin.',
    votesCast: (n: number, total: number) => `Oylama · ${n} / ${total} oy`,
    whoIsImposter: (seat: string) => `${seat}, sahtekar kim?`,
    voteHint: 'Gizli oy: kimse göremez. Oy verince telefonu sıradakine ver.',
    selfVote: (seat: string) => `${seat}, kendine oy veremezsin`,
    you: 'sen',
    voteFor: (seat: string) => `${seatTo(seat, 'dative')} oy ver`,
    pickSeat: 'Bir koltuk seç',
    lastChance: (seat: string) => `Son şans · ${seat}`,
    guessTitle: 'Yakalandın. Kelime neydi?',
    guessHint: (c: string) => `Bilirsen sahtekar yine kazanır. Kategori: ${c}`,
    guessSubmit: (w: string) => `${w}, tahminim bu`,
    pickWord: 'Bir kelime seç',
    caught: (seat: string) => `${seat} yakalandı`,
    guessingNow: 'Şimdi kelimeyi tahmin ediyor. Bilirse sahtekar kazanır.',
    imposterWas: 'Sahtekar',
    tablesWon: 'Masalar kazandı!',
    imposterWon: 'Sahtekar kazandı!',
    word: (w: string) => `Kelime: ${w}`,
    wordAndGuess: (w: string, g: string) => `Kelime: ${w} · tahmin: ${g}`,
    votesLabel: 'Oylar',
    voteLine: (voter: string, target: string) => `${voter}, ${seatTo(target, 'dative')} oy verdi`,
    // The game screens (docs/SPEC_V3.md §20.2).
    ownTable: 'Sizin masanız',
    // A member's phone (docs/SPEC_V3.md §22.E; canvas: Sahtekar: üye izler).
    memberTitle: 'Koltuklar liderinin telefonunda',
    memberBody: (leader: string) =>
      `${inflectTr(leader, 'genitive')} telefonunu izle; kartlar, ipucu sırası ve oylar orada.`,
    otherTable: 'Diğer masa',
    ownDone: 'Masanızda herkes baktı. Diğer masa bekleniyor.',
    redealt:
      'Sahtekar kartına bakmadı ve oyundan çıktı. Yeni kelime dağıtıldı; herkes yeniden baksın.',
    dealing: 'Yeni kelime geliyor…',
    votesDone: 'Masanızın oyları verildi. Diğer masa bekleniyor.',
    notEnough: `Kartına bakmayanlar oyundan çıktı; ${SAHTEKAR.minPlayers} kişi kalmadı. Oyun bitti.`,
  },
  identity: {
    // Mekan's anonymous switch and its sheets (skall tuvali: MekanAnonimGecis, …Erkek,
    // MekanProfilGecis, …Fotosuz, MekanGecisKullanildi; docs/SPEC_V4.md §4.D).
    switchOn: 'Anonim görünüyorsun',
    switchOff: 'Profilinle görünüyorsun',
    anonTitle: 'Anonim görün?',
    anonBody: (nick: string) =>
      `Adın ve fotoğrafın görünmez. Mekan sohbetinde ve masada ${nick} adıyla, kapsül karakterinle görünürsün.`,
    anonConfirm: 'Anonim görün',
    chatAnonTitle: 'Mekan sohbetinde anonim yaz?',
    chatAnonBody: (nick: string) =>
      `Mekan sohbetinde adın ve fotoğrafın görünmez; ${nick} adıyla, kapsül karakterinle yazarsın. Masada ve oyunlarda her zaman profilinle görünürsün.`,
    chatAnonConfirm: 'Anonim yaz',
    profileTitle: 'Profilinle görün?',
    profileBody: 'Mekan sohbetinde ve masada adın ve fotoğrafın görünür.',
    profileConfirm: 'Profilimle görün',
    photoNeeded: 'Profilinle görünmek için önce fotoğraf eklemelisin.',
    addPhoto: 'Fotoğraf ekle',
    onceTitle: 'Bu girişte tek değişiklik hakkın var.',
    onceBody:
      'Değiştirince bu girişte geri dönemezsin. Yeni mesajların yeni kimlikle görünür, öncekiler eski kimlikte kalır; mekan sohbetini o an izleyen biri iki kimliği eşleştirebilir.',
    onceTable: ' Masadaki kimliğin bu masa bitene kadar değişmez.',
    used: 'Bu girişteki değişiklik hakkını kullandın',
  },
  venue: {
    here: 'Mekandasın',
    // The round button at the top right of Mekan (docs/design/aura → Mekan) and its sheet.
    more: 'Seçenekler',
    yourTable: 'Masanın adı',
    people: (n: number) => `${headcountLabel(n)} kişi`,
    remaining: (h: number, m: number) => (h > 0 ? `${h} sa ${m} dk kaldı` : `${m} dk kaldı`),
    leave: 'Mekandan ayrıl',
    leaveConfirmTitle: 'Mekandan ayrılıyor musun?',
    leaveConfirmBody: 'Masan kapanır. Sonra yeniden giriş yapabilirsin.',
    leaveConfirm: 'Ayrıl',
    spot: (name: string) => `Noktan: ${name}`,
    noSpot: 'Henüz nokta seçmedin.',
    changeSpot: 'Değiştir',
    chooseSpot: 'Noktanı seç',
    changeSpotTitle: 'Neredesin?',
    changeSpotHint:
      'Aynı noktadaki masalarla oynarsın. Masan lobideyken, oyundayken ya da bir isteğin beklerken değiştiremezsin.',
    changeSpotSave: 'Bu noktadayım',
    // The table's name (docs/SPEC_V4.md §4.E): the owner renews it 3 times a table (v46: "Başka ad").
    rerollName: 'Başka ad',
    rerollsLeft: (n: number) =>
      n > 0 ? `${n} yenileme hakkın var` : 'Bu masada adı yenileme hakkın bitti',
    // The card's lobby state (v46: .mine-head small).
    lobbyOff: 'Lobide değil',
    lobbyOpen: 'Lobide açık',
    // No table yet (v46: .nomasa).
    noTable: 'Henüz masan yok',
    noTableHint: 'Masa kur, arkadaşlarını çağır. Ya da açık bir masaya katıl.',
    createTable: 'Masa kur',
    withdraw: 'Lobiden çek',
    // The top row (v45: .top): the own photo opens Profil.
    openProfile: 'Profilini aç',
    // The venue chat card (v45: .linkcard.chat); its dot only with a message in the last 10
    // minutes (K-12).
    chatCard: 'Mekana giriş yapan herkes okur ve yazar.',
    // docs/design/aura → Mekan sohbeti: under its name in the bar.
    chatReaders: 'Mekandaki herkes okur',
    chatEmpty: 'Henüz kimse yazmadı. İlk mesajı sen yaz.',
    chatNew: 'Yeni mesaj',
    chatActive: 'şu an aktif',
    // The card's head opens the table. A screen reader hears the name, the people and the state,
    // then what the head does.
    openTable: 'Masanı aç',
    tableHead: (alias: string, people: number, state: string) =>
      `${alias}, ${headcountLabel(people)} kişi, ${state}, Masanı aç`,
    openLobby: 'Lobiye aç',
    invite: 'Davet et',
  },
  // The table screen (v46 "masa"; docs/SPEC_V4.md §4.E, §4.F).
  table: {
    back: 'Mekana dön',
    whoLabel: (n: number) => `Masadakileri gör, ${headcountLabel(n)} kişi`,
    // The people the table's scene has no seat for (docs/design/aura → Masa).
    more: (n: number) => `+${n}`,
    end: 'Bitir',
    leave: 'Masadan ayrıl',
    leaveShort: 'Ayrıl',
    tabGames: (n: number) => `Oyun Seç (${n})`,
    // Masa's two tabs (docs/design/aura → Masa).
    games: 'Oyunlar',
    chat: 'Sohbet',
    peopleTag: 'Masadakiler',
    // Masa sohbeti on its own screen, from the bar's button (the owner's call, 28 Ekim).
    chatTitle: 'Masa sohbeti',
    chatOpen: (unread: number) =>
      unread > 0 ? `Masa sohbeti, ${unread} yeni mesaj` : 'Masa sohbeti',
    status: (people: string, lobby: string) => `${people} · ${lobby}`,
    tabChat: (n: number) => `Masa Sohbeti (${n})`,
    categoryAll: (n: number) => `Tümü ${n}`,
    category: (name: string, n: number) => `${name} ${n}`,
    // A game before its step (4.6): its poster is faded and not pressed.
    soon: 'Yakında',
    // skall tuvali (MasaBitir, MasaKisiSecenekler); approved 27 Ekim.
    leaveNote: 'Ayrılırsan masa sürer; sahiplik masaya en erken katılana geçer.',
    blockOwnerNote: 'Masadan çıkarılır. Karşı tarafa bildirilmez.',
    blockMemberNote: 'Masadan çıkarsın. Karşı tarafa bildirilmez.',
    // The posters (skall tuvali, Masa): the least headcount and a game's line.
    minPeople: (n: number) => `${n}+ kişi`,
    allGames: 'Tümü',
    // The games' cards (the owner's file skall-oyun-kartlari, 27 Ekim): name, line, headcount.
    gameCards: {
      vampir: { name: 'Vampir Köylü', sub: 'Vampirleri bul', people: '5-12' },
      signum: { name: 'Signum', sub: 'Kodu çöz', people: '4+' },
      kinshi: { name: 'Kinshi', sub: 'Yasaklıyı söyleme', people: '4+' },
      krot: { name: 'Krot', sub: 'Aramızdaki kim?', people: '3+' },
      sprengja: { name: 'Sprengja', sub: 'Bombayı çabuk at', people: '3+' },
      kaupholl: { name: 'Kaupholl', sub: 'En yakına yatır', people: '3+' },
    },
    gameCardLabel: (name: string, sub: string, people: string) =>
      `${name}, ${sub}, ${people} kişi, Yakında`,
    gameCategories: { teams: 'Takımlı', multi: 'Çok oyunculu' },
    taglines: {
      tabu: 'Yasak kelimeyi söyleme',
      ibre: 'Frekansı tuttur',
      sahtekar: 'Aramızdaki kim?',
      harf: 'Harfi ilk sen kap',
      sarki: 'Dizeyi yakala',
      sohbet: 'Masada muhabbet',
    } as Record<string, string>,
    soloTitle: 'Masada yalnızca sensin',
    soloBody:
      'Arkadaşlarını davet et ya da masanı lobiye aç. Oyunların çoğu en az 2 kişiyle başlar.',
    endTitle: 'Masayı bitir?',
    endBody: 'Masa herkes için kapanır. Oyun ve sohbet biter.',
    endConfirm: 'Masayı bitir',
    leaveTitle: 'Masadan ayrıl?',
    leaveBody: 'Mekana dönersin. Masa diğerleri için sürer.',
    // Masadakiler (v46 data-msheet).
    people: (n: number) => `Masadakiler · ${headcountLabel(n)} kişi`,
    peopleNote: 'Herkes kendi telefonuyla katılır. Masada en çok 12 kişi olur.',
    you: (alias: string) => `${alias} (sen)`,
    ownerTag: 'Masa sahibi',
    peopleTitle: 'Masadakiler',
    youTag: 'Sen',
    nameLabel: 'Masanın adı',
    viewProfile: 'Profili gör',
  },
  // "Masa kur" (v46 data-kur; docs/SPEC_V4.md §4.E).
  createTable: {
    title: 'Masa kur',
    hint: 'Masaya herkes kendi telefonuyla katılır. Masada en çok 12 kişi olur.',
    iconLabel: 'Masa simgesi',
    nameLabel: 'Masanın adı',
    iconChange: 'Simgeyi değiştir',
    iconDone: 'Tamam',
    iconNote: 'Soluk olanlar mekandaki başka bir masada.',
    iconTaken: (name: string) => `${name}, başka bir masada`,
    lobby: 'Lobide görünsün',
    lobbyHint: 'Mekandakiler masanı görür ve katılmak isteyebilir. Sonra da değiştirebilirsin.',
    youAre: (name: string) => `Masada ${name} olarak görünürsün.`,
    confirm: 'Masayı kur',
    failed: 'Masa kurulamadı. Bağlantını kontrol edip yeniden dene.',
  },
  // Mekan's lobby (v46 "mekan"; docs/SPEC_V4.md §4.E).
  lobby: {
    openTitle: 'Açık masalar',
    runningTitle: 'Süren masalar',
    tables: (n: number) => `${n} masa`,
    loading: 'Açık masalar yükleniyor',
    emptyTitle: 'Açık masa yok',
    emptyBody: 'Masa kurup lobiye açarsan mekandakiler katılmak isteyebilir.',
    join: 'Katıl',
    here: 'Bu masadayım',
    runningNote:
      'Lobide değiller. Oturduğun masa buysa "Bu masadayım"a bas, masa sahibi onaylasın.',
    runningNoteShort: 'Lobide değiller.',
    leaveFirst: 'Başka bir masaya geçmek için önce masandan ayrıl.',
    needsPhoto: 'Masalara katılmak için profil fotoğrafı ekle.',
    bringsTable: (n: number) => `Katılırsan masandaki ${n} kişi de seninle gelir.`,
    waiting: (seconds: number) => `İsteğin gönderildi. Yanıt bekleniyor (${seconds} sn).`,
    // A refusal and a time-out look the same (rule 5).
    unavailable: 'Masa şu an müsait değil.',
    accepted: (table: string) => `Kabul edildi, ${table} masasının yanına git.`,
  },
  // "Masana davet et" (v46 data-sheet; docs/SPEC_V4.md §4.G): every sent invite looks the same.
  invite: {
    title: 'Masana davet et',
    how: 'Davet yalnızca şu an bu mekanda olan arkadaşına ulaşır. Kimin burada olduğu görünmez; her davette "Davet gönderildi" yazar. Davet 2 dakika geçerli.',
    send: 'Davet et',
    sent: 'Davet gönderildi',
    valid: (seconds: number) =>
      `Geçerli · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    clock: (seconds: number) =>
      `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    full: 'Masa dolu. Masada en çok 12 kişi olur.',
    failed: 'Arkadaşların yüklenemedi',
    failedHint: 'Bağlantını kontrol edip yeniden dene.',
    empty: 'Henüz arkadaşın yok',
    emptyHint:
      'Masa bitince oynadığın kişileri arkadaş olarak ekleyebilirsin. Masanı lobiye açarsan mekandakiler katılmak isteyebilir.',
    done: 'Tamam',
  },
  // The table's end (docs/SPEC_V3.md §23.G; canvas: Faz 3 · 23.3 → masa sonu): the other side's
  // phones and each pair's own "Arkadaş ekle".
  // Masa bitti (v46 "masa-bitti"; docs/SPEC_V4.md §4.E, K-56, K-64, K-67, K-68).
  tableEnd: {
    title: 'Masa bitti',
    leftTitle: 'Masadan ayrıldın',
    subtitle: (table: string, people: number) =>
      `${table} · ${headcountLabel(people)} kişi. Beğendiğin kişileri ekle.`,
    addFriend: 'Arkadaş ekle',
    added: 'Eklendi',
    friends: 'Arkadaş oldunuz',
    message: 'Mesaj',
    anonymous: 'Anonim katıldı',
    note: 'Eklediğin kişi bunu görmez. O da seni eklerse ikinize de haber gelir ve arkadaş olursunuz.',
    anonymousNote:
      'Arkadaş olursanız anonim adının sen olduğunu görür. İstersen Profil’den adını yenileyebilirsin.',
    back: 'Mekana dön',
  },
  design: {
    title: 'Tasarım (test)',
    hint: 'Yalnızca test sürümünde görünür.',
    previewTitle: 'Bileşen önizleme',
    previewOpen: 'Bileşen önizlemesini aç',
    // v46 native, step 2: the app's v46 gallery, next to v46's own (docs/design/v46/).
    galleryOpen: 'v46 galerisini aç',
    gallery: {
      title: 'v46 galeri',
      light: 'Açık',
      dark: 'Koyu',
      colors: 'Renkler',
      type: 'Yazı',
      components: 'Bileşenler',
      sample: 'Masa sohbeti 21:00',
      missing: 'Henüz yok',
      measured: (id: string, width: number, height: number) => `${id} · v46: ${width} × ${height}`,
      typeLine: (key: string, lineHeight: number) => `${key} · satır ${lineHeight}`,
      normal: 'Normal',
      pressed: 'Basılı',
      ready: 'Hazır',
      narrow: '320 dp',
      // v46's own sample texts for each component (its gallery copies them from its screens).
      samples: {
        start: 'Telefonla devam et',
        sendCode: 'Kod gönder',
        setUp: 'Masayı kur',
        save: 'Kaydet',
        newTable: 'Masa kur',
        invite: 'Davet et',
        backToVenue: 'Mekana dön',
        cancel: 'Vazgeç',
        unblock: 'Engeli kaldır',
        endTable: 'Masayı bitir',
        end: 'Bitir',
        friends: 'Arkadaşsınız',
        editProfile: 'Profili düzenle',
        read: 'Oku',
        back: 'Geri',
        notifications: 'Bildirimler',
        badge: '2',
        send: 'Gönder',
        privacy: 'Gizlilik',
        friendsTitle: 'Arkadaşlar',
        friendsCount: '4',
        views: { list: 'Liste', map: 'Harita' },
        // Keşfet (v46's sample data: the list as it shows it, in its order).
        searchWord: 'Kahve',
        place: 'Sakarya · Tüm semtler',
        venueCount: '5 mekan · ada göre',
        venues: [
          { name: 'Çınar Altı Çay Bahçesi', sub: 'Çay bahçesi · Serdivan', status: '1 açık masa' },
          { name: 'Hush Coffee', sub: 'Kafe · Serdivan', status: '2 açık masa' },
          { name: 'Kampüs Kafe', sub: 'Kafe · Serdivan', status: '3 açık masa' },
          { name: 'Köşe Kahve', sub: 'Kafe · Adapazarı', status: 'Sessiz' },
          { name: 'Yedegör Dürüm', sub: 'Restoran · Serdivan', status: 'Sessiz' },
        ],
        hereName: 'Sakarya Üniversitesi Esentepe Kampüsü',
        hereSub: 'Kantin · giriş yaptın',
        // Form (v46's sample data in its sign-up, profile and venue screens).
        form: {
          nameLabel: 'Görünen ad',
          namePlaceholder: 'Adın',
          name: 'Elif',
          phonePrefix: '+90',
          phonePlaceholder: '5xx xxx xx xx',
          phone: '532 123 45 67',
          phoneLabel: 'Telefon numarası',
          code: 'Doğrulama kodu',
          codeTyped: '482',
          error: 'Kod gönderilemedi. Bağlantını kontrol edip yeniden dene.',
          warning:
            'Fotoğrafın yoksa masa kuramaz ve masalara katılamazsın. Fotoğrafı sonra Profil’den de ekleyebilirsin.',
          choose: 'Seç',
          day: 'Gün',
          bio: 'Kapsül Anlat’ta anlatıcı benim.',
          bioPlaceholder: 'Kendinden kısaca bahset',
          bioLabel: 'Biyografi',
          lobby: 'Lobide görünsün',
          anonOff: 'Anonim katılım kapalı',
          anonOn: 'Anonim katılım açık',
          anonUsed: 'Anonimsin. Bu girişteki değişiklik hakkını kullandın',
        },
      },
    },
    previewIncoming: 'Mesaj gelsin',
    // The visual gate's route (CLAUDE.md → Görsel kapı), test builds only.
    gate: {
      unknown: (key: string) => `Görsel kapıda böyle bir durum yok: ${key}`,
      pageCount: (listed: number, needed: number) =>
        `Bu durum ${needed} sayfa, listede ${listed}: e2e/visual/states.json'da sayfa sayısını ${needed} yap.`,
    },
    // Bileşen önizleme → Renkler (step 4.2, K-25): the game colours in the run's scheme.
    tokens: {
      set: 'Renkler',
      grounds: 'Oyun zeminleri',
      buttonsAndThemes: 'Düğmeler ve temalar',
      logo: 'Logo',
      chip: 'Tur 2/4',
      teamPurple: 'Mor takım',
      teamPink: 'Pembe takım',
      sahtekar: 'Sahtekar',
      letters: 'Harf Kapmaca',
      song: 'Şarkıda Geçsin',
      chat: 'Sohbet kartları',
      pass: 'Pas',
      correct: 'Doğru',
      forbidden: 'Yasak!',
      warmUp: 'Isınma',
      campus: 'Kampüs',
      deep: 'Derin',
      either: 'Ya da',
      zones: 'İbre bölgeleri',
      badge: 'Rozet',
      bellBadge: 'Zil rozeti',
      notice: 'Bildirim yazısı (Roboto)',
      noticeSample: 'Kapsülün kaydedildi',
    },
    // Bileşen önizleme → Kaydırma: 20 gölgeli kart, telefonda elle kaydırmak için.
    scroll: {
      set: 'Kaydırma',
      card: (n: number) => `Kart ${n}`,
      body: 'Gölgeli kartlar arasında yukarı aşağı kaydır.',
    },
    // Bileşen önizleme → Eski oyun: today's games' grounds, buttons, themes and parts, outside the
    // visual gate.
    legacy: {
      set: 'Eski oyun',
    },
    // Bileşen önizleme → Eski oyun → the game parts (step 4.2b): the game screens' parts on a ground.
    parts: {
      set: 'Oyun parçaları',
      buttons: 'Oyun düğmeleri',
      main: 'Başlat',
      side: 'Masaya dön',
      grab: 'Kaptım',
      busy: 'Gönderiliyor',
      disabledPass: 'Pas',
      timer: 'Süre çubuğu',
      ring: 'Halka sayaç',
      moments: 'Kısa bildirim, 3-2-1, konfeti',
      showToast: 'Bildirim göster',
      toast: 'Yasak! Kart geçildi',
      countIn: '3-2-1',
      confetti: 'Konfeti',
    },
    // Bileşen önizleme → Kapsül ve ikonlar (step 4.2b): the capsule avatars, the bar icons, the bell
    // and the chat wallpaper.
    identity: {
      set: 'Kapsül ve ikonlar',
      capsules: 'Kapsül avatarlar',
      icons: 'Çubuk ikonlar ve zil',
      wallpaper: 'Sohbet duvar kağıdı',
      // Aktiviteler's event card on each cover (K-44): one running now, one later today.
      covers: 'Etkinlik kapakları',
      sampleCafe: 'Hush Coffee',
      sampleCampus: 'Gelişim Üniversitesi Kamp Kulübü',
      sampleNow: 'Canlı müzik',
      sampleLater: 'Kapsül Anlat gecesi: ikinci çay bizden, kazanan masaya tatlı',
      sampleName: 'kapsul-ab12',
      sampleTheirs: 'Masa kurduk, gelir misiniz?',
      sampleMine: 'Geliyoruz, iki kişiyiz',
    },
    // Bileşen önizleme → Hareketler (step 4.2c): the game motions, each on a press.
    motion: {
      set: 'Hareketler',
      deck: 'Kart destesi',
      deckHint: 'Karta basılı tutup parmağını gezdir.',
      words: ['Kapsül', 'Masa', 'Lamba'],
      forbidden: ['Kabuk', 'Hap', 'Çubuk'],
      correct: 'Doğru',
      pass: 'Pas',
      forbiddenButton: 'Yasak!',
      role: 'Rol kartı',
      roleBack: 'Basılı tut, rolünü gör',
      roleWord: 'Kütüphane',
      roleCategory: 'Mekan',
      // What a screen reader says while the card is held: the face's words.
      roleFace: (category: string, word: string) => `${category}: ${word}`,
      wheel: 'Harf çarkı',
      spin: 'Çevir',
      vinyl: 'Plak ve ekolayzer',
      cover: 'İbre örtüsü',
      openCover: 'Örtüyü aç',
      closeCover: 'Örtüyü kapat',
      icons: 'İkon yayları',
      press: 'Bas',
      lobbyOpen: 'Lobiye aç',
      lobbyClose: 'Lobiden çek',
      bell: 'Zil',
      ring: 'Zili çal',
    },
    // Ölçüm (docs/SPEC_V4.md §4.M, 4.3): scrolling capsule avatars on the phone.
    measure: {
      set: 'Ölçüm',
      cached: 'Önbellekli',
      parsed: 'Her seferinde ayrıştır',
      stats: (frames: number, stalls: number, worstMs: number, fps: number) =>
        `${frames} kare · ${stalls} takılma · en uzun ${worstMs} ms · ${fps} fps`,
      reset: 'Sıfırla',
      hint: 'Listeyi kaydır. Takılma: 25 ms’den uzun kare. Sayı yalnızca kaydırırken toplanır.',
      chat: 'Mekan sohbeti, 100 mesaj',
      table: 'Masa, 12 kişi',
      name: (i: number) =>
        `kapsul-${String.fromCharCode(97 + (i % 19))}${String.fromCharCode(98 + ((i * 3) % 19))}${String(10 + (i % 90))}`,
      message: (i: number) =>
        i % 3 === 0
          ? 'Masa kurduk, gelir misiniz?'
          : i % 3 === 1
            ? 'Geliyoruz, iki kişiyiz'
            : 'Sıradaki oyun ne olsun?',
      person: 'Masada',
    },
  },
  // The game screens' parts (src/components/game/).
  gameParts: {
    secondsLeft: (s: number) => `${s} saniye kaldı`,
    go: 'Başla',
    // The bell's badge: the count, and over 99 "99+".
    badge: (n: number) => (n > 99 ? '99+' : String(n)),
  },
  settings: {
    nickTitle: 'Anonim adın',
    title: 'Ayarlar',
    accountSection: 'Hesap',
    birthDate: 'Doğum tarihin',
    // "2000-01-15" → "15.01.2000"
    birthDateValue: (iso: string) => iso.split('-').reverse().join('.'),
    birthDateHint: 'Yalnızca sen görürsün. Yanlışsa düzeltmek için bize yaz.',
    // Görünüm (K-54; v46 §5): kept only on the phone.
    appearance: {
      title: 'Görünüm',
      options: { system: 'Sistem', light: 'Açık', dark: 'Koyu' },
      notes: {
        system: 'Telefonunun ayarına uyar.',
        light: 'Her zaman açık tema.',
        dark: 'Her zaman koyu tema.',
      },
    },
    notificationsSection: 'Bildirimler',
    notifyDm: 'Mesajlar',
    notifyFriendRequests: 'Arkadaşlık istekleri',
    legalSection: 'Yasal',
    signOut: 'Çıkış yap',
    deleteAccount: 'Hesabımı sil',
    deleteConfirmTitle: 'Hesabın silinsin mi?',
    deleteConfirmBody: 'Tüm verilerin kalıcı olarak silinir. Bu işlem geri alınamaz.',
    deleteConfirm: 'Sil',
    privacy: 'Gizlilik politikası',
    kvkk: 'KVKK Aydınlatma Metni',
    terms: 'Kullanım Koşulları',
    contact: 'İletişim',
    about: 'Hakkında',
    version: (v: string) => `Sürüm ${v}`,
    osm: 'Mekan verileri © OpenStreetMap katkıda bulunanlar (ODbL).',
    // skall tuvali (ProfilAyarlar, BildirimAyarlari, BildirimIzinKapali, Gizlilik, Hesap, HesapSil,
    // Engellenenler, SessizeAlinanlar).
    participation: {
      title: 'Oyunlara katılım',
      sub: 'Her girişte bununla başlarsın.',
      profile: 'Profilli',
      anonymous: 'Anonim',
      nowProfiled:
        'Bu girişte profilinle görünüyorsun. Değiştirmek için mekan ekranındaki anahtarı kullan; hakkın bir kez.',
      nowAnonymous:
        'Bu girişte anonim görünüyorsun. Değiştirmek için mekan ekranındaki anahtarı kullan; hakkın bir kez.',
      photoNeeded: 'Profilli başlamak için profil fotoğrafı gerekiyor.',
    },
    notificationSettings: 'Bildirim ayarları',
    privacyTitle: 'Gizlilik',
    accountTitle: 'Hesap',
    done: 'Tamam',
    phone: {
      title: 'Telefon bildirimleri',
      on: 'Açık. Kapatırsan telefonun ayarlarından yeniden açabilirsin.',
      onTag: 'Açık',
      off: 'Kapalı. Masa davetleri 2 dakika geçerli olduğu için kaçırabilirsin.',
      open: 'Telefon ayarlarını aç',
    },
    friendsSection: 'Arkadaşlar',
    requestsNote: 'Biri seni arkadaş olarak eklemek istediğinde',
    invitesTitle: 'Masa davetleri',
    invitesNote: 'Davetler 2 dakika geçerli; kapatırsan kaçırabilirsin',
    messagesSection: 'Mesajlar',
    dmTitle: 'Birebir mesajlar',
    dmNote: 'Arkadaşlarından gelen mesajlar',
    notifyFootnote:
      'Masa davetinin bildiriminde ad, masa adı ve mekan yazmaz: "Bir arkadaşın seni masasına çağırıyor". Mekan sohbeti bildirim göndermez.',
    blocked: 'Engellenenler',
    muted: 'Sessize alınanlar',
    capsules: 'Kapsül karakterler',
    nickPrivacy:
      'Anonim adın hesabına sabittir: anonimken ziyaretler arasında aynı adla tanınabilirsin. Adın, fotoğrafın ve profil kimliğin yalnızca profilinle göründüğünde ya da arkadaş olduğunda açılır.',
    phoneLabel: 'Telefon numaran',
    fixedNote:
      "Doğum tarihin ve cinsiyetin uygulamadan değiştirilemez ve kimseye gösterilmez. Yanlış girdiysen İletişim'den bize yaz.",
    deleteBody:
      'Profilin, fotoğrafların, arkadaşlıkların, mesajların ve oyun geçmişin silinir. Masadaysan masadan çıkarsın. Bu geri alınamaz.',
    deleteBackups: 'Yedeklerden de 7 gün içinde silinir.',
    blockedNote: 'Engellediğin kişi bunu görmez.',
    mutedNote:
      'Sessize aldığın kişi bunu görmez. Sessize alma o kimliğe bağlıdır: bir kişinin anonim adını sessize almak profilli mesajlarını gizlemez.',
    mutedEmpty: 'Sessize aldığın kimse yok.',
    mutedAnonymous: 'Anonim',
    mutedProfiled: 'Profiliyle',
  },
  // skall tuvali (Haller): no connection, over any screen.
  connection: {
    offlineTitle: 'Bağlantı yok',
    offlineBody: 'Tekrar bağlanınca liste kendiliğinden güncellenir.',
  },
  errors: {
    bad_request: 'İstek geçersiz.',
    unauthorized: 'Oturumun sona ermiş. Tekrar giriş yap.',
    consent_outdated: 'Metinler güncellendi. Lütfen tekrar onayla.',
    onboarding_required: 'Önce kaydını tamamlaman gerekiyor.',
    profile_required: 'Önce profilini tamamlaman gerekiyor.',
    under_age: `${APP_NAME} 18 yaş ve üzeri içindir.`,
    birth_date_invalid: 'Geçerli bir doğum tarihi gir. Kayıtlı doğum tarihi değiştirilemez.',
    venue_not_found: 'Bu mekan artık listede değil.',
    too_far: 'Bu mekana çok uzaktasın. Mekandayken tekrar dene.',
    location_mocked: 'Konumun sahte bir uygulamadan geliyor. Onu kapatıp tekrar dene.',
    alias_exhausted: 'Şu an bu mekanda masa açılamıyor. Biraz sonra tekrar dene.',
    spot_required: 'Önce nerede olduğunu seç.',
    spot_invalid: 'Bu nokta artık seçilemiyor. Listeden başka bir nokta seç.',
    different_spot: 'Bu masa başka bir noktada. Önce "Bu noktadayım"a dokun.',
    in_room: 'Masan lobideyken, oyundayken ya da bir isteğin beklerken bunu yapamazsın.',
    reroll_limit: 'Bu masada adı değiştirme hakkın bitti.',
    proposal_pending: 'Zaten bekleyen bir öneri var.',
    no_proposal: 'Bu öneri artık geçerli değil.',
    no_active_table: 'Önce mekana giriş yapman gerekiyor.',
    already_in_room: 'Masan zaten lobide ya da oyunda.',
    room_not_available: 'Masa şu an müsait değil.',
    request_pending: 'Yanıt bekleyen bir isteğin var.',
    rate_limited: 'Çok fazla istek gönderdin. Biraz sonra tekrar dene.',
    request_expired: 'Bu isteğin süresi doldu.',
    request_not_found: 'İstek bulunamadı.',
    not_in_room: 'Bu masada değilsin.',
    nothing_to_block: 'Engellemek istediğin kişi masada değil.',
    message_invalid: 'Mesaj 1-200 karakter olmalı.',
    profanity_rejected: 'Mesajın uygun olmayan bir ifade içeriyor.',
    wrong_concept: 'Bu masa başka bir oyun için.',
    two_tables: 'Masana başka bir masa katıldı.',
    not_owner: 'Bunu masanın sahibi yapar.',
    needs_two_tables: 'Bu oyun için ikinci masa gerekiyor.',
    game_in_progress: 'Oyun zaten sürüyor.',
    no_game: 'Şu an oyun yok.',
    not_describer: 'Bu turda anlatan siz değilsiniz.',
    turn_over: 'Tur bitti.',
    turn_not_started: 'Tur henüz başlamadı.',
    not_your_seat: 'Bu sıra masanızın değil.',
    not_player: 'Bu oyunda oynamıyorsun.',
    not_enough_players: 'Bu oyun için yeterli oyuncu yok.',
    too_many_players: 'Bu oyun için oyuncu sayısı fazla.',
    no_objections_left: 'İtiraz hakkınız kalmadı.',
    no_passes_left: 'Pas hakkınız kalmadı.',
    too_soon: 'Biraz bekle.',
    no_cards: 'Kart kalmadı.',
    not_found: 'Bulunamadı.',
    reply_unavailable: 'Yanıtladığın mesaj artık yok.',
    photo_required: 'Profilinle görünmek için önce profil fotoğrafı ekle.',
    anonymous_not_allowed: 'Bu hesapla masalara yalnızca profilinle katılabilirsin.',
    gender_required: 'Devam etmek için önce cinsiyetini seçmen gerekiyor.',
    venue_chat_mode_locked:
      'Mekan sohbetinde nasıl görüneceğini bu girişte zaten seçtin. Değiştirmek için mekandan ayrılıp yeniden giriş yap.',
    identity_mismatch: 'Anonim ya da profilli görünüşün değişti. Mesajını tekrar gönder.',
    identity_switch_used:
      'Anonim ile profilli arasında bu girişte bir kez geçebilirsin; hakkını kullandın.',
    nick_refresh_too_soon: 'Anonim adını 30 günde bir yenileyebilirsin.',
    icon_taken: 'Bu simge mekandaki başka bir masada. Başka bir simge seç.',
    already_in_table: 'Zaten bir masadasın.',
    table_full: 'Masa dolu.',
    invite_unavailable: 'Davet artık geçerli değil.',
    wrong_side: 'Bu masaya yalnızca daha önce bulunduğun taraftan katılabilirsin.',
    not_leader: 'Bunu yalnızca masanın lideri yapabilir.',
    already_friends: 'Zaten arkadaşsınız.',
    not_friends: 'Artık arkadaş değilsiniz.',
    not_judge: 'Bu turda hakem diğer masa.',
    display_name_required: 'Önce profilinde bir ad seç.',
    display_name_invalid: 'Ad 2–24 karakter olmalı ve uygun olmayan ifade içermemeli.',
    bio_invalid: `Tanıtım en fazla ${BIO_MAX} karakter olmalı ve uygun olmayan ifade içermemeli.`,
    contact_not_allowed: 'Telefon, e-posta, kullanıcı adı ya da bağlantı ekleyemezsin.',
    photo_invalid: 'Fotoğraf yüklenemedi. Başka bir fotoğraf dene.',
    method_not_allowed: 'İstek geçersiz.',
    update_required: 'Uygulamanın yeni sürümünü yüklemen gerekiyor.',
    internal: 'Bir şeyler ters gitti. Tekrar dener misin?',
  },
} as const;
