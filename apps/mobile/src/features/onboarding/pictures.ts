import type { ImageSourcePropType } from 'react-native';

// The sign-up steps' riso pictures (yeni arayüz tuvali, `.vg`: 360 × 294, drawn 120 × 98; packed,
// never drawn by the app). 18 yaş altı uses the birth date's.
export const SIGNUP_PICTURES = {
  consents: require('../../../assets/riso/kayit/onay.webp'),
  phone: require('../../../assets/riso/kayit/telefon.webp'),
  code: require('../../../assets/riso/kayit/kod.webp'),
  name: require('../../../assets/riso/kayit/ad.webp'),
  birth: require('../../../assets/riso/kayit/dogum.webp'),
  gender: require('../../../assets/riso/kayit/cinsiyet.webp'),
  photo: require('../../../assets/riso/kayit/foto.webp'),
  reconsent: require('../../../assets/riso/kayit/metinler.webp'),
} as const satisfies Record<string, ImageSourcePropType>;

export type SignupPicture = keyof typeof SIGNUP_PICTURES;
