import type { VampirRole } from '@shared/vampir.ts';
import type { ImageSourcePropType } from 'react-native';

import type { SandTone, TableTime } from '@/theme/vampirArt';

// The role pictures (the owner's file: one scene a role, and the back every card shares).
export const ROLE_ART: Record<VampirRole | 'arka', ImageSourcePropType> = {
  arka: require('../../../../assets/vampir/arka.webp'),
  vampir: require('../../../../assets/vampir/vampir.webp'),
  doktor: require('../../../../assets/vampir/doktor.webp'),
  gozcu: require('../../../../assets/vampir/gozcu.webp'),
  koylu: require('../../../../assets/vampir/koylu.webp'),
  soytari: require('../../../../assets/vampir/soytari.webp'),
};

// The table, the medallion and the glass over the sand, drawn once from their SVG text
// (scripts/art/vampirTable.ts; theme/vampirArt.ts): pictures the phone only shows.
export const TABLE_PICTURE: Record<TableTime, ImageSourcePropType> = {
  night: require('../../../../assets/vampir/table/table-night.webp'),
  dawn: require('../../../../assets/vampir/table/table-dawn.webp'),
  day: require('../../../../assets/vampir/table/table-day.webp'),
  dusk: require('../../../../assets/vampir/table/table-dusk.webp'),
};
export const MEDAL_PICTURE: ImageSourcePropType = require('../../../../assets/vampir/table/medal.webp');
export const GLASS_PICTURE: Record<SandTone, ImageSourcePropType> = {
  night: require('../../../../assets/vampir/table/glass-night.webp'),
  day: require('../../../../assets/vampir/table/glass-day.webp'),
  vote: require('../../../../assets/vampir/table/glass-vote.webp'),
};
