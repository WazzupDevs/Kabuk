import type { VampirRole } from '@shared/vampir.ts';
import type { ImageSourcePropType } from 'react-native';

import type { ScenePhase } from '@/theme/vampirScene';

// The role pictures (the owner's file: one scene a role, and the back every card shares).
export const ROLE_ART: Record<VampirRole | 'arka', ImageSourcePropType> = {
  arka: require('../../../../assets/vampir/arka.webp'),
  vampir: require('../../../../assets/vampir/vampir.webp'),
  doktor: require('../../../../assets/vampir/doktor.webp'),
  gozcu: require('../../../../assets/vampir/gozcu.webp'),
  koylu: require('../../../../assets/vampir/koylu.webp'),
  soytari: require('../../../../assets/vampir/soytari.webp'),
};

// The small poster on the pre-game page (84 × 56, as the other games' pages; the logo alone,
// Aura VampirKucukPoster).
export const VAMPIR_POSTER: ImageSourcePropType = require('../../../../assets/vampir/poster.webp');

// The capsule table's room and table for each phase (theme/vampirScene.ts; scripts/art/
// vampirScene.ts): pictures the phone only shows.
export const ROOM_PICTURE: Record<ScenePhase, ImageSourcePropType> = {
  night: require('../../../../assets/vampir/scene/room-night.webp'),
  dawn: require('../../../../assets/vampir/scene/room-dawn.webp'),
  day: require('../../../../assets/vampir/scene/room-day.webp'),
  end: require('../../../../assets/vampir/scene/room-end.webp'),
};
export const TABLE_PICTURE: Record<ScenePhase, ImageSourcePropType> = {
  night: require('../../../../assets/vampir/scene/table-night.webp'),
  dawn: require('../../../../assets/vampir/scene/table-dawn.webp'),
  day: require('../../../../assets/vampir/scene/table-day.webp'),
  end: require('../../../../assets/vampir/scene/table-end.webp'),
};
