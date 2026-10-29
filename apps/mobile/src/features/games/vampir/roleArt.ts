import type { VampirRole } from '@shared/vampir.ts';
import type { ImageSourcePropType } from 'react-native';

// The role pictures (the owner's file: one scene a role, and the back every card shares).
export const ROLE_ART: Record<VampirRole | 'arka', ImageSourcePropType> = {
  arka: require('../../../../assets/vampir/arka.webp'),
  vampir: require('../../../../assets/vampir/vampir.webp'),
  doktor: require('../../../../assets/vampir/doktor.webp'),
  gozcu: require('../../../../assets/vampir/gozcu.webp'),
  koylu: require('../../../../assets/vampir/koylu.webp'),
  soytari: require('../../../../assets/vampir/soytari.webp'),
};
