// The production OTA (canlı öncesi denetim C2): `eas update` puts every EXPO_PUBLIC_* value it finds
// in a local env file into the bundle, over the EAS production environment's (a developer's
// EXPO_PUBLIC_APP_ENV=e2e or the dev project's address would reach every pilot phone). The
// production update therefore refuses to start while any such file is in apps/mobile; the example
// file is not read by Expo.

// The env files Expo loads (@expo/env: .env, .env.local, .env.<mode>, .env.<mode>.local).
export function blockingEnvFiles(names: readonly string[]): string[] {
  return names.filter((n) => /^\.env(\..+)?$/.test(n) && n !== '.env.example').sort();
}

// The update's message: required, so the release history says what each update was.
export function updateArgs(message: string | undefined): string[] {
  const text = message?.trim();
  if (!text) throw new Error('Kullanım: pnpm ota:production "<açıklama>"');
  return [
    'eas-cli',
    'update',
    '--channel',
    'production',
    '--environment',
    'production',
    '--message',
    text,
  ];
}
