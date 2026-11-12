// Who answers for the app in the legal texts (docs/legal/*.md): the one place the owner fills in.
// The texts read these through their placeholders ({{CONTROLLER_NAME}}, {{CONTACT_CHANNELS}} …),
// on the site (scripts/site/render.ts) and in the app (apps/mobile/src/components/LegalText.tsx).
export type LegalEntity = {
  // The data controller (KVKK m. 3/1-ı): the owner's legal first and last name, since the store
  // accounts are personal. While empty the texts are shown as drafts (legalReady).
  controllerName: string;
  // Where a written application goes (Veri Sorumlusuna Başvuru Tebliği m. 5): a KEP address and/or
  // a postal address. Either may stay empty; neither is the owner's home address by default.
  kep: string;
  postalAddress: string;
  contactEmail: string;
  // The developer name on the store listings (Google Play wants it on the child safety page).
  developerName: string;
  // "Yürürlük tarihi" on every text. Changes with the texts; so do the consent versions
  // (consent.ts).
  effectiveDate: string;
};

export const LEGAL_ENTITY: LegalEntity = {
  controllerName: '',
  kep: '',
  postalAddress: '',
  contactEmail: 'support@skall.world',
  developerName: 'Skall Labs',
  effectiveDate: '12 Kasım 2026',
};

// The texts are final once they name the data controller; until then every page says "taslak".
export function legalReady(entity: LegalEntity): boolean {
  return entity.controllerName.trim() !== '';
}

const MISSING_NAME = '[veri sorumlusunun adı ve soyadı eklenecek]';

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

// How to reach the controller: the e-mail always, the KEP and postal addresses when they are set.
export function contactChannels(entity: LegalEntity): string {
  const lines = [`E-posta: ${entity.contactEmail}`];
  if (entity.kep) lines.push(`KEP: ${entity.kep}`);
  if (entity.postalAddress) lines.push(`Posta adresi: ${entity.postalAddress}`);
  return bullets(lines);
}

// The ways of a KVKK m. 13 application (Tebliğ m. 5).
export function applicationChannels(entity: LegalEntity): string {
  const lines = [
    `${entity.contactEmail} adresine, hesabınıza kayıtlı telefon numarasını belirterek e-postayla`,
  ];
  if (entity.kep) {
    lines.push(`${entity.kep} kayıtlı elektronik posta (KEP) adresine, KEP adresinizden`);
  }
  if (entity.postalAddress) {
    lines.push(`${entity.postalAddress} adresine, imzalı dilekçeyle yazılı olarak`);
  }
  return bullets(lines);
}

// A legal text with its placeholders filled. An unknown placeholder is left as it is, so a test
// can find it.
export function fillLegalText(text: string, appName: string, entity: LegalEntity): string {
  const values: Record<string, string> = {
    APP_NAME: appName,
    CONTROLLER_NAME: entity.controllerName.trim() || MISSING_NAME,
    CONTACT_EMAIL: entity.contactEmail,
    DEVELOPER_NAME: entity.developerName,
    EFFECTIVE_DATE: entity.effectiveDate,
    CONTACT_CHANNELS: contactChannels(entity),
    APPLICATION_CHANNELS: applicationChannels(entity),
  };
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (whole, key: string) => values[key] ?? whole);
}
