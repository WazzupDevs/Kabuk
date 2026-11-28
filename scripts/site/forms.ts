// skall.world's forms (docs/decisions/skall-world-formlar.md): the campus vote, the school
// application and the pilot venue application. Pure, so the worker (worker.ts) stays thin and
// the rules are tested (forms.test.ts).

// Per IP (as a salted hash) per UTC day. A campus network puts many students behind one address,
// so the vote's limit is the widest.
export const DAILY_LIMITS = { vote: 20, school: 5, venue: 5 } as const;
export type LimitKind = keyof typeof DAILY_LIMITS;

// The KVKK section shown next to the venue form (docs/legal/kvkk-aydinlatma-metni.md → 8).
// Raised when that section's meaning changes; each application keeps the one it was shown.
export const VENUE_NOTICE_VERSION = '2026-11-28';

// The venue applications' inbox (legalEntity.ts → contactEmail).
export const VENUE_MAIL_TO = 'support@skall.world';

// How long a venue application and an IP counter are kept (the worker's daily job deletes older).
export const VENUE_KEEP_DAYS = 365;
export const RATE_KEEP_DAYS = 2;

export const LIMITS = {
  schoolName: 120,
  venueName: 120,
  district: 80,
  contactName: 80,
  email: 254,
  token: 2048,
} as const;

export type Parsed<T> = { ok: true; value: T } | { ok: false; code: string; message: string };

const fail = (code: string, message: string): { ok: false; code: string; message: string } => ({
  ok: false,
  code,
  message,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Spaces collapsed, control characters dropped; null when empty or longer than max.
export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const visible = [...value.normalize('NFC')]
    .map((c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? ' ' : c))
    .join('');
  const text = visible.replace(/\s+/g, ' ');
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

// The key two spellings of one school share: Turkish lower case, letters and digits only, the
// dotless ı and the circumflexes folded (people type "Isparta" and "isparta" for one school).
// "İstanbul Teknik Üniversitesi" and "istanbul teknik  üniversitesi." are the same school.
export function schoolKey(name: string): string {
  return name
    .normalize('NFC')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/[^a-z0-9çğöşü]+/g, ' ')
    .trim();
}

// The id the browser made for itself (crypto.randomUUID) and keeps in localStorage.
export function isDeviceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

function readToken(body: Record<string, unknown>): string | null {
  const token = body.token;
  return typeof token === 'string' && token.length > 0 && token.length <= LIMITS.token
    ? token
    : null;
}

export type VoteInput = { schoolId: number; device: string; token: string };

export function parseVote(body: unknown): Parsed<VoteInput> {
  if (!isRecord(body)) return fail('bad_request', 'Geçersiz istek.');
  const schoolId = body.schoolId;
  if (typeof schoolId !== 'number' || !Number.isInteger(schoolId) || schoolId <= 0) {
    return fail('bad_request', 'Okul seçilmedi.');
  }
  if (!isDeviceId(body.device)) return fail('bad_request', 'Geçersiz istek.');
  const token = readToken(body);
  if (!token) return fail('verification_failed', 'Doğrulama tamamlanmadı.');
  return { ok: true, value: { schoolId, device: body.device, token } };
}

export type SchoolInput = { name: string; key: string; device: string; token: string };

export function parseSchoolApplication(body: unknown): Parsed<SchoolInput> {
  if (!isRecord(body)) return fail('bad_request', 'Geçersiz istek.');
  const name = cleanText(body.name, LIMITS.schoolName);
  if (!name || schoolKey(name).length < 3) return fail('bad_name', 'Üniversitenin adını yaz.');
  if (body.adult !== true) {
    return fail('adult_required', 'Devam etmek için 18 yaşından büyük olduğunu onayla.');
  }
  if (!isDeviceId(body.device)) return fail('bad_request', 'Geçersiz istek.');
  const token = readToken(body);
  if (!token) return fail('verification_failed', 'Doğrulama tamamlanmadı.');
  return { ok: true, value: { name, key: schoolKey(name), device: body.device, token } };
}

// A Turkish phone number as +90 and ten digits (mobile 5xx or landline 2xx–4xx), else null.
export function normalizeTrPhone(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 32) return null;
  if (/[^0-9+()\s.-]/.test(value)) return null;
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (!/^[2-5]\d{9}$/.test(digits)) return null;
  return `+90${digits}`;
}

export function normalizeEmail(value: unknown): string | null {
  const text = cleanText(value, LIMITS.email);
  if (!text || /\s/.test(text)) return null;
  if (!/^[^@]+@[^@]+\.[^@.]{2,}$/.test(text)) return null;
  return text.toLowerCase();
}

export type VenueInput = {
  venueName: string;
  district: string;
  contactName: string;
  phone: string;
  email: string;
  token: string;
};

export type VenueField = 'venueName' | 'district' | 'contactName' | 'phone' | 'email' | 'notice';

// Every wrong field at once, so the form can mark them together.
export function parseVenueApplication(
  body: unknown,
):
  | { ok: true; value: VenueInput }
  | { ok: false; code: string; message: string; fields: VenueField[] } {
  if (!isRecord(body)) return { ...fail('bad_request', 'Geçersiz istek.'), fields: [] };
  const venueName = cleanText(body.venueName, LIMITS.venueName);
  const district = cleanText(body.district, LIMITS.district);
  const contactName = cleanText(body.contactName, LIMITS.contactName);
  const phone = normalizeTrPhone(body.phone);
  const email = normalizeEmail(body.email);
  const fields: VenueField[] = [];
  if (!venueName) fields.push('venueName');
  if (!district) fields.push('district');
  if (!contactName) fields.push('contactName');
  if (!phone) fields.push('phone');
  if (!email) fields.push('email');
  if (body.noticeRead !== true) fields.push('notice');
  if (!venueName || !district || !contactName || !phone || !email || fields.length > 0) {
    return { ...fail('bad_fields', 'Eksik ya da hatalı alanlar var.'), fields };
  }
  const token = readToken(body);
  if (!token) return { ...fail('verification_failed', 'Doğrulama tamamlanmadı.'), fields: [] };
  return { ok: true, value: { venueName, district, contactName, phone, email, token } };
}

// The notification to support@skall.world: plain text, one line per field.
export function venueMail(
  app: Omit<VenueInput, 'token'>,
  receivedAt: Date,
): { subject: string; text: string } {
  return {
    subject: `Pilot mekan başvurusu: ${app.venueName}`.slice(0, 160),
    text: [
      'skall.world/mekanlar üzerinden yeni bir pilot mekan başvurusu geldi.',
      '',
      `Mekan: ${app.venueName}`,
      `İlçe: ${app.district}`,
      `Yetkili: ${app.contactName}`,
      `Telefon: ${app.phone}`,
      `E-posta: ${app.email}`,
      `Zaman: ${receivedAt.toISOString()}`,
      '',
      `Başvuru ${VENUE_KEEP_DAYS} gün sonra kendiliğinden silinir.`,
    ].join('\n'),
  };
}

// The UTC day an IP counter belongs to.
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// The cut-off for the daily cleanup: rows created before it go.
export function cutoff(now: Date, days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}
