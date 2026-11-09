// The production OTA (canlı öncesi denetim C2): `eas update` puts every EXPO_PUBLIC_* value it finds
// in a local env file into the bundle, over the EAS production environment's (a developer's
// EXPO_PUBLIC_APP_ENV=e2e or the dev project's address would reach every pilot phone). The
// production update therefore refuses to start while any such file is in apps/mobile; the example
// file is not read by Expo.

// The env files Expo loads (@expo/env: .env, .env.local, .env.<mode>, .env.<mode>.local).
export function blockingEnvFiles(names: readonly string[]): string[] {
  // Case-blind: Windows reads `.ENV` as `.env`.
  return names
    .filter((n) => /^\.env(\..+)?$/i.test(n) && n.toLowerCase() !== '.env.example')
    .sort();
}

// EXPO_PUBLIC_* set in the developer's shell win over every file and would go into the bundle too.
export function blockingShellVars(env: Readonly<Record<string, string | undefined>>): string[] {
  return Object.keys(env)
    .filter((k) => k.startsWith('EXPO_PUBLIC_'))
    .sort();
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
