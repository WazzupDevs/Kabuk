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
import { formatTrMobile } from '@shared/phone.ts';
import { BIO_MAX } from '@shared/profile.ts';
import { inflectTr } from '@shared/trText.ts';
import type { VenueKind } from '@shared/venueKind.ts';

// Address (hitap): a person is "sen", a table "siz"; a sentence never mixes the two. What a phone
// chooses for itself (a room's intent and participation, "Arkadaş ekle") is a person's: in Faz 2
// everyone chooses for themselves (canvas: Faz 2 · 22.5 → Metinler).

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
export type HistoryConcept =
  'tabu' | 'sohbet' | 'sahtekar' | 'harf' | 'sarki' | 'ibre' | 'vampir' | 'chat';
const HISTORY_CONCEPTS: Record<HistoryConcept, string> = {
  ...GAME_NAMES,
  vampir: 'Vampir Köylü',
  chat: 'Sohbet',
};

// A record's concept (play_history.concept): one of the games, otherwise the chat.
export function historyConcept(concept: string): HistoryConcept {
  return concept in HISTORY_CONCEPTS ? (concept as HistoryConcept) : 'chat';
}

// "… oynadığınız" in a friend request: the room's last game, or the chat.
const PLAYED_WITH: Record<HistoryConcept, string> = {
  tabu: `${GAME_NAMES.tabu} oynadığınız`,
  sohbet: 'Sohbet kartlarıyla oynadığınız',
  sahtekar: `${GAME_NAMES.sahtekar} oynadığınız`,
  harf: `${GAME_NAMES.harf} oynadığınız`,
  sarki: `${GAME_NAMES.sarki} oynadığınız`,
  ibre: `${GAME_NAMES.ibre} oynadığınız`,
  vampir: 'Vampir Köylü oynadığınız',
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
    privacyTitle: 'Gizlilik Politikası',
    // Placeholder texts (version draft-0). The real texts arrive with legal review before the pilot.
    draftNotice: 'Bu metin taslaktır ve pilot öncesinde güncellenecektir.',
    termsBody: `${APP_NAME}, aynı mekandaki masaların birlikte oyun oynayıp sohbet etmesi için bir uygulamadır. Diğer kullanıcılara saygılı davranmayı, taciz, hakaret ve uygunsuz içerik paylaşmamayı kabul edersin.`,
    kvkkBody:
      'Hesabını oluşturmak için telefon numaran, görünen adın, doğum tarihin ve cinsiyetin işlenir. Numaran ve doğum tarihin diğer kullanıcılarla paylaşılmaz; profilinde yalnızca yaşın görünür. Cinsiyetin hiçbir kullanıcıya gösterilmez ve kullanım istatistiğine gitmez; yalnızca masalara anonim mi profilinle mi katılabileceğini belirler. Masalara anonim katılım yalnızca kadın beyanıyla mümkün olduğundan, anonim görünmek cinsiyetin hakkında dolaylı bilgi verir. 18 yaşından küçüksen hesap açılmaz ve bilgilerin saklanmaz. Hesabını istediğin zaman uygulama içinden silebilirsin.',
    // Draft-0 (ui 6.3, the owner's call, 3 Kasım): shown while no hosted privacy URL is set.
    privacyBody:
      'Konumun yalnızca check-in anında, mekanda olduğunu doğrulamak için bir kez kullanılır ve saklanmaz; yalnızca seçtiğin mekan ve oturduğun nokta saklanır. Konumun, bulunduğun mekan ve masan hiçbir kullanıcıya, arkadaşlarına da gösterilmez. Yüklediğin fotoğraflardan konum dahil bütün ek bilgiler telefonunda silinir. Anonim oturduğunda takma adınla görünürsün; profilin yalnızca profilinle oturduğunda masadakilere açılır. Mesajlarının telefondaki kopyası çıkış yaptığında ve arkadaşlık bittiğinde silinir. Hata raporlarına ve kullanım istatistiğine yalnızca hesap kimliğin gider; telefon numaran, konumun ve yazdıkların gitmez.',
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
    // The "+" and its list of friends (the owner's call, 30 Ekim).
    newMessage: 'Yeni mesaj',
    noMessage: 'Henüz mesaj yok',
    // With the dots beside it (v45).
    typing: 'yazıyor',
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
    tabs: 'Etkinlikler ve geçmiş',
    // Not the page's own name again (the owner's call, 30 Ekim).
    events: 'Etkinlikler',
    history: 'Geçmiş',
    fromVenues: (city: string) => `${inflectTr(city, 'locative')}ki mekanlardan`,
    eventKind: 'Etkinlik',
    eventLabel: (title: string, venue: string, when: string) => `${title}, ${venue}, ${when}`,
    noEvents: 'Bugün etkinlik yok',
    noEventsHint:
      'Mekanların bugünkü etkinlikleri burada görünür; haftanın geri kalanı mekan sayfasında.',
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
    // A game's sheet, under no day heading: the day as well ("Dün 23:00", "1 Kas 23:00"; 5.5).
    whenFull: (iso: string, day: HistoryDay) =>
      day === 'today' || day === 'yesterday'
        ? `${day === 'today' ? 'Bugün' : 'Dün'} ${clock(iso)}`
        : `${day === 'week' ? (WEEKDAYS_SHORT[new Date(iso).getDay()] ?? '') : dayMonth(iso)} ${clock(iso)}`,
    game: (concept: HistoryConcept) => HISTORY_CONCEPTS[concept],
    // A person, not a table (the people's table, docs/SPEC_V4.md §4.E; the owner's report, 30 Ekim).
    withTable: (alias: string) => `${alias} ile`,
    // One game with several people, one row (the owner's call, 30 Ekim).
    withPeople: (n: number) => `${n} kişiyle`,
    results: { won: 'Kazandın', lost: 'Kaybettin', done: 'Bitti' } satisfies Record<
      HistoryResult,
      string
    >,
    rowLabel: (game: string, withWhom: string, when: string, result: string | null) =>
      [game, withWhom, when, result].filter(Boolean).join(', '),
  },
  explore: {
    // "Şu an buradasın" (v44: .vhere): the own check-in, kept on this phone only.
    here: 'Şu an buradasın',
    hereAt: (spot: string) => `${spot} · check-in yaptın`,
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
    // A university with several campuses (docs/SPEC_V4.md §4.Q): a grouping, never a place.
    universitySub: (n: number, districts: string) => `${n} yerleşke · ${districts}`,
    universityLabel: (name: string, n: number) => `${name}, ${n} yerleşke. Yerleşke seç.`,
    campusNote: 'Yerleşkeni seç. Konumun yalnızca girişte, seçtiğin yerleşke için doğrulanır.',
    campusOf: (university: string, district: string) => `${university} · ${district}`,
    // City and district (v44: .vloc; K-38): chosen, never the phone's position (rule 6).
    place: (city: string, district: string | null) => `${city} · ${district ?? 'Tüm semtler'}`,
    placeLabel: (city: string, district: string | null) =>
      `Şehir ve semt: ${city}, ${district ?? 'tüm semtler'}`,
    placeTitle: 'Şehir ve semt',
    placeNote: 'Mekanlar konumuna göre değil, seçtiğin şehir ve semte göre listelenir.',
    city: 'Şehir',
    district: 'Semt',
    allDistricts: 'Tüm semtler',
    showPlace: 'Göster',
    // The count line (K-42).
    countLine: (n: number, eventsFirst: boolean) =>
      `${n} mekan · ${eventsFirst ? 'bugün etkinliği olanlar önce' : 'ada göre sıralı'}`,
    noMatch: 'Mekan bulunamadı',
    noMatchHint: 'Başka bir ad dene.',
    noPlace: 'Bu semtte mekan yok',
    noPlaceHint: 'Başka bir semt ya da şehir seç.',
    // A kind chip that finds nothing here (kabul raporu §9.1).
    noKind: { campus: 'Bu semtte kampüs yok', cafe: 'Bu semtte kafe ve mekan yok' },
    noKindHint: "Tümü'ne dön ya da başka bir semt seç.",
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
    // Venues at one address, one disc on the map (the owner's report, 30 Ekim).
    stackTitle: (n: number) => `Burada ${n} mekan`,
    goToVenue: 'Mekana git',
    notFound: 'Bu mekan artık listede değil.',
    back: 'Geri dön',
    checkInHint:
      'Mekanı sen seçtin; konumun yalnızca mekanda olduğunu doğrulamak için bir kez alınır.',
    checkInHere: 'Buraya giriş yap',
    // Keşfet's question (docs/design/aura → Keşfet), by the part of the day (lib/dayPart.ts; the
    // owner's call, 30 Ekim).
    question: {
      morning: 'Bu sabah\nnerede oturuyorsun?',
      day: 'Bugün\nnerede oturuyorsun?',
      evening: 'Bu akşam\nnerede oturuyorsun?',
    },
    weekNote: 'Bu hafta',
    eventsTitle: 'Etkinlikler',
    noEvents: 'Bu hafta planlı etkinlik yok.',
  },
  friends: {
    empty: "Henüz arkadaşın yok. Birlikte oynadığın masaları Bildirimler'de bulabilirsin.",
    message: (name: string) => `${name} ile mesajlaş`,
    // The friend row's button (v45: .fmsg).
    messageShort: 'Mesaj',
    // skall tuvali (AktivitelerGecmisEklendi); approved 27 Ekim.
    addedNote: (name: string) =>
      `${name} bunu görmez. O da seni eklerse arkadaş olursunuz. Yeniden basarsan geri alırsın.`,
    noMessagesYet: 'Henüz mesaj yok. İlk mesajı sen yaz.',
    // Ablative: the locative suffix plus "n" (Eylül'den, Ocak'tan). One line in the row (the
    // owner's report, 30 Ekim: "arkadaşsınız" wrapped it to two); the whole sentence is read out.
    since: (iso: string) => `${dayMonthAt(iso)}n beri`,
    sinceLabel: (iso: string) => `${dayMonthAt(iso)}n beri arkadaşsınız`,
    incoming: (playedAt: string, concept: HistoryConcept, alias: string) =>
      `${dayMonthAt(playedAt)} ${PLAYED_WITH[concept]} ${alias} masası arkadaşın olmak istiyor`,
    accept: 'Kabul et',
    decline: 'Reddet',
    noHistory: `Başka bir masayla en az ${ENCOUNTER_MIN_MINUTES} dakika oynadığınızda burada görünür.`,
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
  },
  notifications: {
    title: 'Bildirimler',
    withCount: (n: number) => `Bildirimler, ${n} yeni`,
    empty: 'Henüz bildirim yok',
    emptyHint: 'Arkadaşlık istekleri ve arkadaşlarının masa davetleri burada görünür.',
    // skall tuvali (Bildirimler, BildirimlerKabul): the name in bold, then the rest.
    fresh: 'Yeni',
    earlier: 'Önceki',
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
    delivery: {
      sending: 'Gönderiliyor',
      sent: 'Gönderildi',
      delivered: 'İletildi',
      read: 'Okundu',
    },
    typing: 'yazıyor',
  },
  // skall tuvali (KapsulSusle…, KapsulGaleri; docs/SPEC_V4.md §4.D, K-46, K-61).
  capsule: {
    edit: 'Kapsülünü süsle',
    title: 'Kapsülün',
    shuffle: 'Karıştır',
    tapHead: 'Kafama dokun',
    remove: (name: string) => `${name} çıkar`,
    empty: (slot: string) => `${slot} boş`,
    pack: (name: string) => `${name} paketi`,
    // The pack's parts in every slot and the ones of this slot shown under it (11.3).
    packCount: (all: number, here: number) =>
      all === here ? `${here} parça` : `Pakette ${all} parça · burada ${here}`,
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
    badges: {
      first_game: 'İlk oyun',
      ten_games: '10 oyun',
      voice_tabu_five_wins: `${GAME_NAMES.tabu} ustası`,
      five_tables: '5 farklı masa',
    },
    notVisible: 'Bu profil artık görüntülenemiyor.',
    // Another person's profile: the menu at the top right (v45: .pmore).
    more: 'Seçenekler',
    moreTitle: 'Bu profil',
    back: 'Geri dön',
  },
  // Anonymous or with the profile, chosen for each table in the lobby (docs/SPEC_V3.md §5.4).
  participation: {
    previewName: (name: string, age: number | null) => (age === null ? name : `${name}, ${age}`),
  },
  checkin: {
    // The consent itself (location consent draft-1, _shared/pure/consent.ts): pressing the button.
    locationBody:
      '"Konumumu kullan" düğmesine basarak konumunun yalnızca mekanda olduğunu doğrulamak için bir kez kullanılmasına açık rıza verirsin. Konumun saklanmaz.',
    useLocation: 'Konumumu kullan',
    // skall tuvali (KesfetKonumIzin, KesfetMekan); approved 27 Ekim.
    deniedTitle: 'Konum izni yok',
    replaces: (venue: string) => `${venue} girişin biter; bulunduğun masadan ayrılırsın.`,
    locating: 'Konum alınıyor…',
    permissionDenied:
      'Konum izni olmadan mekanda olduğunu doğrulayamıyoruz. İzni ayarlardan verebilirsin.',
    openSettings: 'Ayarları aç',
    locationFailed: 'Konum alınamadı. Açık bir alanda tekrar dene.',
    retry: 'Tekrar dene',
    outsideBoundary: (kind: VenueKind) =>
      kind === 'campus'
        ? 'Kampüsün içinde görünmüyorsun. Kampüse girince tekrar dene.'
        : 'Mekanın içinde görünmüyorsun. Mekana girince tekrar dene.',
    spotTitle: 'Neredesin?',
    spotHint: 'Aynı noktadaki masalarla oynarsın. Noktanı sonra da değiştirebilirsin.',
    open: 'Masayı aç',
  },
  // The games (docs/SPEC_V3.md §5.1). "Sohbet" alone is the intent label, never a game.
  concepts: GAME_NAMES,
  // The room's optional intent label (§5.2).
  intents: { game: 'Oyun', chat: 'Sohbet' },
  rooms: {
    // Faz 3 (docs/SPEC_V3.md §23.C; canvas: Aşama 2 · Ekranlar → Faz 3 · 23.1 Masa ve lobi): the
    // word "oda" is never shown; the server's rooms stay.
    create: 'Masanı lobiye aç',
    declineMemberNote: 'Reddedersen o yalnızca "Masa şu an müsait değil" görür.',
    mySpot: (name: string) => `Senin noktan · ${name}`,
    noSpot: 'Noktasız',
    // In place of the pending note for a few seconds once the request is accepted.
    newTitle: 'Masanı lobiye aç',
    newHint: 'Mekandaki masalar seni lobide görür ve katılmak isteyebilir.',
    intentLabel: 'Niyetin (isteğe bağlı)',
    intentHint: {
      game: 'Oyun oynamak istiyorsun.',
      chat: 'Sohbet etmek istiyorsun. Oyun yine önerilebilir.',
    },
    // The optional game tag (docs/SPEC_V3.md §23.C): only seen in the lobby.
    gameTagLabel: 'Oyun',
    gameTagHint: 'Yalnızca lobide görünür; oyunu başlatmaz.',
    // The room's eyebrow: the running game, else the chat; voice games say they are played face to
    // face (docs/arsiv/SPEC_V2.md §8.1).
    roomEyebrow: (concept: 'tabu' | 'sohbet' | 'sahtekar' | 'harf' | 'sarki' | 'ibre' | null) =>
      concept === null
        ? 'Masan'
        : concept === 'sohbet'
          ? 'Sohbet kartları'
          : `${VOICE_NAMES[concept]} · yüz yüze`,
    end: 'Masayı bitir',
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
    secondsLeft: (s: number) => `${s} sn`,
  },
  chat: {
    placeholder: 'Mesaj yaz…',
    send: 'Gönder',
    empty: 'Henüz mesaj yok.',
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
    // The down arrow with no new message (Telegram Android's chat).
    toLatest: 'En alta in',
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
    deleted: 'Mesaj silindi.',
    // Over the first message that came while the chat was closed (skall tuvali: `.day.new`).
    // Over the first unread message; the chat opens there (the owner's call, 30 Ekim).
    newLine: 'Okunmamış mesajlar',
    openProfile: (name: string) => `${name}, profili aç`,
  },
  // Mekan sohbeti (docs/SPEC_V3.md §7).
  venueChat: {
    open: 'Mekan sohbeti',
    empty: 'Henüz mesaj yok. İlk mesajı sen yaz.',
    placeholder: 'Mekana yaz…',
    send: 'Gönder',
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
    blockedEmpty: 'Engellediğin kimse yok.',
    unblock: 'Engeli kaldır',
  },
  games: {
    minPlayers: (n: number) => `En az ${n} kişi`,
    endGame: 'Oyunu bitir',
    turn: (n: number, total: number) => `Tur ${n}/${total}`,
    // The turn clock, "0:37".
    clock: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
    clockLabel: (s: number) => `${s} saniye kaldı`,
    // Stage 6 (canvas: Aşama 6 · Oyunlar): full-screen game, turn ready, feedback, end, intro.
    scoreUp: (n: number) => `+${n}`,
    scoreDown: (n: number) => `−${n}`,
    endGameConfirmTitle: 'Oyunu bitirelim mi?',
    endGameConfirmBody:
      'Skor şimdiki hâliyle kaydedilir ve iki masa sohbete döner. Diğer masa da bunu görür.',
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
  },
  // Vampir Köylü (docs/SPEC_V4.md §4.F "Adım 4.6.6", the owner's file skall-oyun-vampir-koylu).
  vampir: {
    timeLeft: 'kalan süre',
    timeLeftLabel: (clock: string) => `Kalan süre ${clock}`,
    name: 'Vampir Köylü',
    whoPlays: 'Kimler oynuyor',
    rules: ['5 ile 12 kişi', 'Gizli roller', 'Gece ve gündüz'],
    players: 'Oyuncular',
    watchers: 'Gözlemciler',
    watchersNote: 'İzler, puan almaz.',
    watch: 'Gözlemci ol',
    play: 'Oyuna katıl',
    count: (n: number) => `${n} kişi`,
    how: 'Herkes gizli bir rol alır: vampir, doktor, gözcü ya da köylü; 6 kişiden itibaren bir de soytarı. Gece herkes telefonundan bir seçim yapar: vampirler birini ısırır, doktor birini korur, gözcü birine bakar. Gündüz tartışıp oyla birini elersiniz. Vampirler biterse köylüler, vampirler köylüler kadar kalırsa vampirler kazanır; soytarı elenirse tek başına o kazanır.',
    hintOwner: 'Herkes hazırsa oyunu başlat.',
    hintGuest: 'Oyunu masa sahibi başlatır.',
    needs: (n: number) => `En az ${n} oyuncu gerekir.`,
    start: 'Oyunu başlat',
    closePage: 'Sayfayı kapat',
    // The game's top line.
    seeRole: 'Rolünü gör',
    night: (n: number) => `Gece ${n}`,
    morningTitle: 'Sabah',
    day: (n: number) => `Gündüz ${n}`,
    voting: 'Oylama',
    over: 'Oyun bitti',
    myRole: 'Rolüm',
    myRoleLabel: 'Rolüne bakmak için basılı tut',
    dead: 'Öldün',
    watching: 'İzliyorsun',
    exit: 'Oyundan çık',
    // The round table's line over the card, and a vampire's mates while it is held.
    cardTitle: 'Kartı basılı tut',
    cardNote: 'Rolünü yalnızca sen gör. Kimse görmesin.',
    mates: (names: readonly string[]) =>
      names.length === 1 ? `Diğer vampir: ${names[0]}` : `Diğer vampirler: ${names.join(', ')}`,
    cardLabel: 'Rolünü görmek için basılı tut',
    ready: 'Hazırım',
    waitingOthers: 'Diğerleri bekleniyor',
    readyCount: (n: number, of: number) => `Hazır: ${n}/${of}`,
    beginNight: 'Geceyi başlat',
    dealing: 'Roller dağıtılıyor',
    dealingNote: 'Gözlemcisin; rolleri oyun sonunda görürsün.',
    // Roles.
    roles: {
      vampir: {
        name: 'Vampir',
        about: 'Her gece diğer vampirlerle birini ısırırsın. Gündüz köylü gibi davran.',
        ask: 'Bu gece kimi ısırıyorsunuz?',
        askNote: 'Vampirler birlikte seçer. Çoğunluğun seçtiği ısırılır.',
      },
      doktor: {
        name: 'Doktor',
        about: 'Her gece birini korursun. Aynı kişiyi iki gece üst üste koruyamazsın.',
        ask: 'Bu gece kimi koruyorsun?',
        askNote: 'Kendini de koruyabilirsin.',
      },
      gozcu: {
        name: 'Gözcü',
        about: 'Her gece birinin vampir olup olmadığını öğrenirsin.',
        ask: 'Kimin rolüne bakıyorsun?',
        askNote: 'Yalnızca vampir olup olmadığını görürsün.',
      },
      soytari: {
        name: 'Soytarı',
        about:
          'Gündüz oyla elenirsen tek başına kazanırsın. Gece ölürsen kaybedersin. Şüpheli görün ama belli etme.',
        ask: 'Bu gece kimden şüpheleniyorsun?',
        askNote: 'Seçimin kimseye gösterilmez.',
      },
      koylu: {
        name: 'Köylü',
        about: 'Gücün yok ama oyun senin. Gündüz vampirleri bul ve oyla.',
        ask: 'Bu gece kimden şüpheleniyorsun?',
        askNote: 'Seçimin kimseye gösterilmez.',
      },
    },
    teams: { v: 'Vampir takımı', k: 'Köylü takımı', j: 'Tek başına' },
    // Night.
    choose: 'Seç',
    choiceOf: (name: string) => `Seçimin: ${name}`,
    choiceVampir: 'Diğer vampirler de seçiyor.',
    choiceDoktor: 'Bu gece onu koruyorsun.',
    choiceHidden: 'Seçimin kimseye gösterilmez.',
    seerYes: (name: string) => `${name} vampir`,
    seerNo: (name: string) => `${name} vampir değil`,
    seerYesNote: 'Bunu masaya nasıl söyleyeceğini iyi düşün.',
    seerNoNote: 'Gündüz bunu kullanabilirsin.',
    everyoneChooses: 'Herkes seçimini yapıyor.',
    deadTalk: 'Ölüler konuşmaz',
    deadNight: 'Gece sürüyor. Sabahı bekle; bildiklerini masaya söyleme.',
    nightGoesOn: 'Gece sürüyor',
    // Morning.
    morning: 'Sabah oldu',
    youDied: 'Gece öldün',
    died: (name: string) => `Gece ${name} öldü`,
    youDiedNote: 'Artık oy veremezsin. Ölüler konuşmaz.',
    roleHidden: 'Rolü oyun sonunda açılır.',
    nobodyDied: 'Bu gece kimse ölmedi',
    nobodyDiedNote: 'Doktor birini kurtarmış olabilir.',
    dayStarts: 'Gündüz başlıyor',
    result: 'Sonuç',
    // Day.
    whoIs: 'Vampir kim?',
    talk: 'Tartışın. Süre bitince oylama açılır.',
    toVote: 'Oylamaya geç',
    voteOpensNote: 'Süre bitince ya da masa sahibi başlatınca oylama açılır.',
    deadWatch: 'Ölüler konuşmaz. Tartışmayı izle.',
    watchTalk: 'Tartışmayı izliyorsun.',
    // Vote.
    whoOut: 'Kimi eliyorsunuz?',
    voteNote: 'Oylar herkese görünür. En çok oy alan elenir; eşitlikte kimse elenmez.',
    giveVote: 'Oyumu ver',
    yourVote: (name: string) => `Oyun: ${name}`,
    deadNoVote: 'Ölüler oy vermez',
    voteGoesOn: 'Oylama sürüyor',
    everyoneVotes: 'Herkes oyunu veriyor.',
    votes: (n: number) => `${n} oy`,
    // Verdict.
    voteOver: 'Oylama bitti',
    youOut: 'Elendin',
    out: (name: string) => `${name} elendi`,
    tie: 'Oylar eşit',
    tieNote: 'Bugün kimse elenmedi.',
    nightComes: 'Gece geliyor',
    left: 'Oyundan çıktı',
    // The end.
    won: { k: 'Köylüler kazandı', v: 'Vampirler kazandı', j: 'Soytarı kazandı' },
    mine: (role: string, line: string) => `Rolün ${role}. ${line}`,
    lineFooledAll: 'Herkesi kandırdın, kazandın.',
    lineJesterWon: 'Soytarı herkesi kandırdı.',
    lineJesterLost: 'Oyla elenemedin, kaybettin.',
    lineWon: 'Takımın kazandı.',
    lineLost: 'Takımın kaybetti.',
    gone: 'öldü',
    backToTable: 'Masaya dön',
    again: 'Yeniden oyna',
    // Leaving.
    endTitle: 'Oyunu bitir?',
    endBody: 'Oyun herkes için biter, masaya dönülür.',
    endConfirm: 'Oyunu bitir',
    leaveTitle: 'Oyundan çık?',
    leaveBody: 'Masaya dönersin. Oyun diğerleri için sürer.',
    leaveConfirm: 'Oyundan çık',
    watchTitle: 'Masaya dön?',
    watchBody: 'Oyun sürer; masadan yeniden izleyebilirsin.',
    watchConfirm: 'Masaya dön',
    // On the table while a game runs that the person does not see.
    running: 'Vampir Köylü sürüyor',
    runningPage: 'Vampir Köylü açık',
    rejoin: 'İzle',
    rejoinPage: 'Aç',
    you: 'Sen',
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
    people: (n: number) => `${n} kişi`,
    remaining: (h: number, m: number) => (h > 0 ? `${h} sa ${m} dk kaldı` : `${m} dk kaldı`),
    leave: 'Mekandan ayrıl',
    leaveConfirmTitle: 'Mekandan ayrılıyor musun?',
    leaveConfirmBody: 'Masan kapanır. Sonra yeniden giriş yapabilirsin.',
    leaveConfirm: 'Ayrıl',
    changeSpot: 'Değiştir',
    chooseSpot: 'Noktanı seç',
    changeSpotTitle: 'Neredesin?',
    changeSpotHint:
      'Aynı noktadaki masalarla oynarsın. Masan lobideyken, oyundayken ya da bir isteğin beklerken değiştiremezsin.',
    changeSpotSave: 'Bu noktadayım',
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
    // docs/design/aura → Mekan sohbeti: under its name in the bar.
    chatReaders: 'Mekandaki herkes okur',
    chatEmpty: 'Henüz kimse yazmadı. İlk mesajı sen yaz.',
    chatActive: 'şu an aktif',
    tableHead: (alias: string, people: number, state: string) =>
      `${alias}, ${headcountLabel(people)} kişi, ${state}, Masanı aç`,
    openLobby: 'Lobiye aç',
    invite: 'Davet et',
  },
  // The table screen (v46 "masa"; docs/SPEC_V4.md §4.E, §4.F).
  table: {
    back: 'Mekana dön',
    whoLabel: (n: number) => `Masadakileri gör, ${headcountLabel(n)} kişi`,
    end: 'Bitir',
    leave: 'Masadan ayrıl',
    leaveShort: 'Ayrıl',
    chat: 'Sohbet',
    // Masa sohbeti on its own screen, from the bar's button (the owner's call, 28 Ekim).
    chatTitle: 'Masa sohbeti',
    chatOpen: (unread: number) =>
      unread > 0 ? `Masa sohbeti, ${unread} yeni mesaj` : 'Masa sohbeti',
    status: (people: string, lobby: string) => `${people} · ${lobby}`,
    // A game before its step (4.6): its poster is faded and not pressed.
    soon: 'Yakında',
    // skall tuvali (MasaBitir, MasaKisiSecenekler); approved 27 Ekim.
    leaveNote: 'Ayrılırsan masa sürer; sahiplik masaya en erken katılana geçer.',
    blockOwnerNote: 'Masadan çıkarılır. Karşı tarafa bildirilmez.',
    blockMemberNote: 'Masadan çıkarsın. Karşı tarafa bildirilmez.',
    // The games' cards (the owner's file skall-oyun-kartlari, 27 Ekim): name, line, headcount.
    gameCards: {
      vampir: { name: 'Vampir Köylü', sub: 'Vampirleri bul', people: '5-12' },
      signum: { name: 'Signum', sub: 'Kodu çöz', people: '4+' },
      kinshi: { name: 'Kinshi', sub: 'Yasaklıyı söyleme', people: '4+' },
      krot: { name: 'Krot', sub: 'Aramızdaki kim?', people: '3+' },
      sprengja: { name: 'Sprengja', sub: 'Bombayı çabuk at', people: '3+' },
      kaupholl: { name: 'Kaupholl', sub: 'En yakına yatır', people: '3+' },
    },
    gameCardLabel: (name: string, sub: string, people: string, tag: string) =>
      `${name}, ${sub}, ${people} kişi, ${tag}`,
    // A playable game's poster (docs/SPEC_V4.md §4.F): the owner opens it, the others vote for it.
    posterOpen: 'Aç',
    posterVote: 'Oyla',
    posterVotes: (n: number, mine: boolean) => (mine ? `Oyun · ${n}` : `${n} oy`),
    posterNeeds: (n: number) => `${n}+ kişi`,
    gameCategories: { teams: 'Takımlı', multi: 'Çok oyunculu' },
    taglines: {} as Record<string, string>,
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
    peopleCount: (people: string) =>
      `${people} · Herkes kendi telefonuyla katılır. Masada en çok 12 kişi olur.`,
    you: (alias: string) => `${alias} (sen)`,
    ownerTag: 'Masa sahibi',
    peopleTitle: 'Masadakiler',
    youTag: 'Sen',
    viewProfile: 'Profili gör',
  },
  // "Masa kur" (v46 data-kur; docs/SPEC_V4.md §4.E).
  // Test bots (dev project only): the owner seats bots that play by themselves.
  testBots: {
    title: 'Test botları',
    body: 'Tek telefonla denemek için masaya bot oturt. Botlar oyunda kendiliğinden oynar.',
    seated: (n: number) => `Masada ${n} bot var. Oyunda kendiliğinden oynarlar.`,
    addOne: 'Bot ekle',
    addFour: '4 bot ekle',
    remove: 'Botları kaldır',
  },
  createTable: {
    title: 'Masa kur',
    iconLabel: 'Masa simgesi',
    iconChange: 'Simgeyi değiştir',
    iconDone: 'Tamam',
    iconNote: 'Soluk olanlar mekandaki başka bir masada.',
    iconTaken: (name: string) => `${name}, başka bir masada`,
    lobby: 'Lobide görünsün',
    lobbyHint: 'Mekandakiler masanı görür ve katılmak isteyebilir. Sonra da değiştirebilirsin.',
    youAre: (name: string) => `Masada ${name} olarak görünürsün.`,
    confirm: 'Masayı kur',
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
    // Çizim ölçümü (lib/drawLab.ts): parts of the screen off one by one, each a few seconds, while
    // the phone's frame bars are recorded.
    drawLab: {
      title: 'Çizim ölçümü',
      open: 'Çizim ölçümünü aç',
      hint: 'Geliştirici seçeneklerinde "HWUI oluşturma profili" çubuk olarak açıkken ekranı kaydet, sonra Başlat.',
      start: 'Başlat',
      close: 'Kapat',
      step: (n: number, total: number, name: string) => `${n}/${total} ${name}`,
      // FrameMeter: the last second's frames on the JS thread and on the screen (the UI thread).
      meterJs: (fps: number, worst: number) => `JS ${fps} kare/sn, en uzun ${worst} ms`,
      meterUi: (fps: number, worst: number) => `Ekran ${fps} kare/sn, en uzun ${worst} ms`,
      steps: {
        all: 'Hepsi açık',
        cam: 'Cam kapalı',
        golge: 'Gölgeler kapalı',
        kart: 'Kart zemini düz',
        zemin: 'Arka plan düz',
        four: 'Dördü kapalı',
        hareket: 'Hareket durdu',
        end: 'Hepsi açık',
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
  },
  settings: {
    title: 'Ayarlar',
    birthDate: 'Doğum tarihin',
    // "2000-01-15" → "15.01.2000"
    birthDateValue: (iso: string) => iso.split('-').reverse().join('.'),
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
    notifyFriendRequests: 'Arkadaşlık istekleri',
    signOut: 'Çıkış yap',
    deleteAccount: 'Hesabımı sil',
    deleteConfirmTitle: 'Hesabın silinsin mi?',
    deleteConfirm: 'Sil',
    privacy: 'Gizlilik politikası',
    kvkk: 'KVKK Aydınlatma Metni',
    terms: 'Kullanım Koşulları',
    contact: 'İletişim',
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
    identity_mismatch: 'Anonim ya da profilli görünüşün değişti. Mesajını tekrar gönder.',
    client_id_reused: 'Bu mesaj gönderilemedi. Yeniden yaz.',
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
