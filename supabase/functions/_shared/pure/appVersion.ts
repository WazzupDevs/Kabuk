// Forced update gate. Every call from the app carries its native build number (Android
// versionCode, iOS CFBundleVersion) and its platform in these headers; the server refuses calls
// from builds older than that platform's minimum with `update_required`. EAS counts the two
// platforms' builds separately (eas.json → appVersionSource remote), so each has its own minimum:
// MIN_APP_BUILD for Android (the name from before iOS), MIN_APP_BUILD_IOS for iOS. 0 or unset keeps
// that platform's gate open, and then a missing header is fine too. A call without the platform
// header is Android's: every app from before the header is an Android build. The gate only steers
// old apps to the store; it guards nothing, so a client naming the wrong platform gains nothing.
export const APP_BUILD_HEADER = 'x-app-build';
export const APP_PLATFORM_HEADER = 'x-app-platform';

export type AppPlatform = 'android' | 'ios';

export function platformFrom(value: string | null | undefined): AppPlatform {
  return value?.trim().toLowerCase() === 'ios' ? 'ios' : 'android';
}

export function minBuildFor(
  platform: AppPlatform,
  minimums: { android: string | null | undefined; ios: string | null | undefined },
): number {
  return minBuildFrom(platform === 'ios' ? minimums.ios : minimums.android);
}

// Where "Güncelle" leads. Android: the override (an APK link while testers install from one), else
// the Play page of this app. iOS: the override (the App Store page once the app is listed), else
// the TestFlight app, which is how every iPhone has the app until then.
export function storeUrl(
  platform: AppPlatform,
  appId: string,
  overrides: { android?: string; ios?: string },
): string {
  if (platform === 'ios') return overrides.ios || 'itms-beta://';
  return (
    overrides.android ||
    `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}`
  );
}

// A positive whole number, or null for anything else (missing, empty, "1.2", "abc").
export function parseBuild(value: string | null | undefined): number | null {
  if (!value || !/^\d{1,9}$/.test(value.trim())) return null;
  const n = Number(value.trim());
  return n > 0 ? n : null;
}

export function minBuildFrom(value: string | null | undefined): number {
  return parseBuild(value) ?? 0;
}

export function needsUpdate(header: string | null | undefined, minBuild: number): boolean {
  if (minBuild <= 0) return false;
  const build = parseBuild(header);
  return build === null || build < minBuild;
}
