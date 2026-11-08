import { APP_BUILD_HEADER, APP_PLATFORM_HEADER, storeUrl } from '@shared/appVersion.ts';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

// The native build number (Android versionCode, iOS CFBundleVersion) of the installed binary. It
// comes from the native side, so an over-the-air update cannot change it: this is what the forced
// update gate compares, against its platform's own minimum (EAS counts the two separately).
export const appBuild: string | null = Application.nativeBuildVersion;

const platform = Platform.OS === 'ios' ? 'ios' : 'android';

export const appBuildHeaders: Record<string, string> = appBuild
  ? { [APP_BUILD_HEADER]: appBuild, [APP_PLATFORM_HEADER]: platform }
  : {};

// Where "Güncelle" leads: on Android EXPO_PUBLIC_UPDATE_URL while testers install APKs from a link,
// else the Play page; on iOS EXPO_PUBLIC_IOS_UPDATE_URL (the App Store page), else TestFlight.
export function updateUrl(): string {
  return storeUrl(platform, Application.applicationId ?? 'app.kabuk.mobile', {
    android: process.env.EXPO_PUBLIC_UPDATE_URL,
    ios: process.env.EXPO_PUBLIC_IOS_UPDATE_URL,
  });
}
