// The hosted dev project (CLAUDE.md, "Barındırılan dev projesi"): the only remote where test-only
// switches work. The pilot and Play project is never listed here.
export const DEV_PROJECT_HOST = 'kphwbpqxhugrpoicmski.supabase.co';

// SUPABASE_URL as Edge Functions see it on the local stack (`functions serve`: http://kong:8000)
// and as scripts see it from the host or the Android emulator.
const LOCAL_HOSTS = new Set(['kong', '127.0.0.1', 'localhost', '10.0.2.2']);

export function isLocalUrl(url: string): boolean {
  return LOCAL_HOSTS.has(hostOf(url) ?? '');
}

export function isDevProjectUrl(url: string): boolean {
  return url.startsWith('https://') && hostOf(url) === DEV_PROJECT_HOST;
}

// No URL global in pure/ (no DOM or Node types): scheme, host, optional port, then the path.
const URL_HOST = /^https?:\/\/([a-z0-9.-]+)(?::\d+)?(?:[/?#]|$)/i;

function hostOf(url: string): string | null {
  return URL_HOST.exec(url)?.[1]?.toLowerCase() ?? null;
}

// CHECKIN_SKIP_LOCATION=1 (a function secret, dev only): check-in skips the boundary and 300 m
// check. It works only when the functions run on the local stack or the dev project; anywhere
// else (the pilot) a set secret is ignored and reported, and the check stays.
export type LocationCheck = 'enforced' | 'skipped' | 'ignored';

export function locationCheck(
  flag: string | undefined,
  supabaseUrl: string | undefined,
): LocationCheck {
  if (flag !== '1') return 'enforced';
  const url = supabaseUrl ?? '';
  return isLocalUrl(url) || isDevProjectUrl(url) ? 'skipped' : 'ignored';
}

// Test bots (rooms/add-bots, the owner's call, 29 Ekim): a table's owner seats bots that play by
// themselves, to try a game with one phone. Only where the functions run on the local stack or the
// dev project; never on the pilot.
export function testBotsAllowed(supabaseUrl: string | undefined): boolean {
  const url = supabaseUrl ?? '';
  return isLocalUrl(url) || isDevProjectUrl(url);
}

// A position the phone reports as coming from a mock location app (Android) is refused at check-in
// (audit SRV-1): with a fake GPS app anyone could sit at any venue. Not when the location check is
// skipped, and not on the local stack, whose emulator (E2E: Maestro's setLocation) reports every
// position as mocked. The flag is the phone's word; a phone that leaves it out is not refused.
export function refusesMockedPosition(
  mocked: boolean | undefined,
  check: LocationCheck,
  supabaseUrl: string | undefined,
): boolean {
  return mocked === true && check !== 'skipped' && !isLocalUrl(supabaseUrl ?? '');
}

// The local stack signs storage URLs on its internal address (SUPABASE_URL in `functions serve` is
// http://kong:8000), which neither the host nor the Android emulator can reach, so a profile photo
// never loads there. LOCAL_DEVICE_URL (a local-only setting; E2E: http://10.0.2.2:54321) is the
// address the device reaches the same stack at: a signed URL's origin becomes it. The signature
// covers the path, not the host. Only between two local addresses; anywhere else (the dev project,
// the pilot) and without the setting the URL stays exactly as signed.
export function deviceReachableUrl(
  signedUrl: string,
  supabaseUrl: string | undefined,
  localDeviceUrl: string | undefined,
): string {
  if (!localDeviceUrl || !supabaseUrl) return signedUrl;
  if (!isLocalUrl(supabaseUrl) || !isLocalUrl(localDeviceUrl)) return signedUrl;
  const from = supabaseUrl.replace(/\/+$/, '');
  if (!signedUrl.startsWith(`${from}/`)) return signedUrl;
  return localDeviceUrl.replace(/\/+$/, '') + signedUrl.slice(from.length);
}
