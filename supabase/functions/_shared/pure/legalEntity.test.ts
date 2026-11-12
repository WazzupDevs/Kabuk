import { describe, expect, it } from 'vitest';

import {
  applicationChannels,
  contactChannels,
  fillLegalText,
  LEGAL_ENTITY,
  type LegalEntity,
  legalReady,
} from './legalEntity.ts';

const filled: LegalEntity = {
  controllerName: 'Deniz Örnek',
  kep: 'deniz.ornek@hs01.kep.tr',
  postalAddress: '',
  contactEmail: 'destek@ornek.app',
  developerName: 'Örnek Labs',
  effectiveDate: '1 Ocak 2027',
};

describe('legal entity', () => {
  it('is ready once the data controller is named', () => {
    expect(legalReady(filled)).toBe(true);
    expect(legalReady({ ...filled, controllerName: '  ' })).toBe(false);
  });

  it('lists only the channels that are set', () => {
    expect(contactChannels(filled)).toBe(
      '- E-posta: destek@ornek.app\n- KEP: deniz.ornek@hs01.kep.tr',
    );
    expect(applicationChannels({ ...filled, kep: '', postalAddress: 'Örnek Sk. 1' })).toContain(
      'Örnek Sk. 1 adresine, imzalı dilekçeyle',
    );
    expect(applicationChannels({ ...filled, kep: '' }).split('\n')).toHaveLength(1);
  });

  it('fills every placeholder and leaves an unknown one', () => {
    const text = fillLegalText(
      '{{APP_NAME}} / {{CONTROLLER_NAME}} / {{CONTACT_EMAIL}} / {{DEVELOPER_NAME}} / {{EFFECTIVE_DATE}} / {{NOPE}}',
      'Deneme',
      filled,
    );
    expect(text).toBe(
      'Deneme / Deniz Örnek / destek@ornek.app / Örnek Labs / 1 Ocak 2027 / {{NOPE}}',
    );
  });

  it('says the name is missing while it is', () => {
    expect(fillLegalText('{{CONTROLLER_NAME}}', 'X', { ...filled, controllerName: '' })).toContain(
      'eklenecek',
    );
  });

  it('has a contact address and a date', () => {
    expect(LEGAL_ENTITY.contactEmail).toContain('@');
    expect(LEGAL_ENTITY.effectiveDate).not.toBe('');
  });
});
