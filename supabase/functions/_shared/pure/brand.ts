// The app's name, in one place: the store and launcher name (apps/mobile/app.config.ts), the brand
// text in tr.ts, push notification titles and the public legal pages (scripts/build-site.ts) all
// read it. Code names (the repo, `masa` slug and scheme) and the package id (app.kabuk.mobile) are
// separate (docs/store/PACKAGE_ID_MIGRATION.md).
export const APP_NAME = 'skall';

// The games' names as the user sees them, in one place (docs/SPEC_V4.md §4.C, step 4.3): tr.ts and
// the store texts read them. The word "Tabu" is never shown (K-5); code, tables, content files and
// the concept key (`tabu`) keep their names.
export const GAME_NAMES = {
  tabu: 'Kapsül Anlat',
  sohbet: 'Sohbet kartları',
  sahtekar: 'Sahtekar',
  harf: 'Harf Kapmaca',
  sarki: 'Şarkıda Geçsin',
  ibre: 'İbre',
} as const;
