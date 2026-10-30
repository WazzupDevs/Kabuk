// Dynamic Expo config on top of app.json.
// - EAS_PROJECT_ID: the Expo project (@wazzupdevs/masa), fixed here rather than read from the
//   environment (push token registration and OTA updates use it).
// - GOOGLE_SERVICES_JSON: path to Firebase's google-services.json (default ./google-services.json);
//   added to the Android build only when the file exists.
// - runtimeVersion follows app.json's `version` (appVersion policy): an OTA update reaches only builds
//   of the same version. A change to native code (native dependency, config plugin, native field in
//   app.json) therefore bumps `version` and ships as a new build. The native fingerprint was dropped:
//   computed on Windows (where builds and updates start) and on the Linux build server it differed
//   (docs/arsiv/DECISIONS.md, "runtimeVersion").
// - Android's GWP-ASan is off for this app (withGwpAsanOff below).
// - Android draws the app at the screen's highest refresh rate (withHighRefreshRate below).
// - Android draws no shade of its own behind the navigation buttons (withClearNavigationBar).
// This file imports no other .ts file: Node before 22.18 cannot load one (the Expo CLI and the EAS
// build server read this config with plain Node). The app name therefore lives in app.json;
// scripts/app-name.test.ts keeps it equal to APP_NAME (supabase/functions/_shared/pure/brand.ts).
// For the same reason the one config plugin of our own is written here, not in a file of its own.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
  withAndroidStyles,
  withMainActivity,
} from 'expo/config-plugins';

const EAS_PROJECT_ID = '9692ae9b-7826-4f6b-a41e-a0506d5992c2';

// <application android:gwpAsanMode="never">. Android 14's GWP-ASan samples allocations; when it
// records a backtrace on a free inside Hermes, its frame-pointer walk runs off Hermes's fiber stack
// and the app dies at launch now and then (facebook/hermes#1873; the fix is not in the Hermes
// React Native ships). docs/arsiv/DECISIONS.md → "Hermes çökmesi".
export const withGwpAsanOff: ConfigPlugin = (config) =>
  withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) throw new Error('AndroidManifest.xml has no <application>');
    application.$['android:gwpAsanMode'] = 'never';
    return mod;
  });

// The screen's highest refresh rate at its current resolution (90, 120 Hz panels). Some phones keep
// an app at 60 Hz until it asks for more, and every scroll and animation then looks heavy (the
// owner's report, 27 Ekim). MainActivity asks for that display mode once it is created; the system
// still lowers it in battery saver.
const REFRESH_MARK = 'skall: highest refresh rate';
export const withHighRefreshRate: ConfigPlugin = (config) =>
  withMainActivity(config, (mod) => {
    if (mod.modResults.language !== 'kt') throw new Error('MainActivity is not Kotlin');
    let src = mod.modResults.contents;
    if (src.includes(REFRESH_MARK)) return mod;
    const onCreate = /super\.onCreate\([^)]*\)/;
    if (!onCreate.test(src)) throw new Error('MainActivity has no super.onCreate');
    src = src.replace(
      onCreate,
      (call) => `${call}\n    preferHighRefreshRate() // ${REFRESH_MARK}`,
    );
    const end = src.lastIndexOf('}');
    src =
      src.slice(0, end) +
      `
  // ${REFRESH_MARK}: the mode with the most Hz at the current resolution.
  private fun preferHighRefreshRate() {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.M) return
    @Suppress("DEPRECATION")
    val screen = (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) display else windowManager.defaultDisplay) ?: return
    val current = screen.mode
    val best = screen.supportedModes
      .filter { it.physicalWidth == current.physicalWidth && it.physicalHeight == current.physicalHeight }
      .maxByOrNull { it.refreshRate } ?: return
    if (best.refreshRate <= current.refreshRate && best.modeId == current.modeId) return
    val attrs = window.attributes
    attrs.preferredDisplayModeId = best.modeId
    window.attributes = attrs
  }
` +
      src.slice(end);
    mod.modResults.contents = src;
    return mod;
  });

// <item name="android:enforceNavigationBarContrast">false</item> in the app's theme. Edge to edge,
// Android shades the navigation buttons' strip unless the theme says not to, and React Native
// reads the theme: every screen ended in a dark band at the bottom (the owner's report, 30 Ekim).
// The buttons' colour follows the app's theme instead (SkallGlass → setLightNavigationBar).
export const withClearNavigationBar: ConfigPlugin = (config) =>
  withAndroidStyles(config, (mod) => {
    mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
      add: true,
      name: 'android:enforceNavigationBarContrast',
      value: 'false',
      targetApi: '29',
      parent: AndroidConfig.Styles.getAppThemeGroup(),
    });
    return mod;
  });

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
  const hasGoogleServices = existsSync(resolve(__dirname, googleServicesFile));
  if (!config.name) throw new Error('app.json: expo.name is missing');

  return withClearNavigationBar(
    withHighRefreshRate(
      withGwpAsanOff({
        ...config,
        name: config.name,
        slug: config.slug ?? 'masa',
        android: {
          ...config.android,
          ...(hasGoogleServices ? { googleServicesFile } : {}),
        },
        extra: {
          ...config.extra,
          eas: { projectId: EAS_PROJECT_ID },
        },
        runtimeVersion: { policy: 'appVersion' },
        updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}`, enabled: true },
      }),
    ),
  );
};
