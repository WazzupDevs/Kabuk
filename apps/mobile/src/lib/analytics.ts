import {
  type AnalyticsEvent,
  type AnalyticsEventProps,
  analyticsProperties,
} from '@shared/analytics.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHog from 'posthog-react-native';

// PostHog (MVP_SPEC §12). Without EXPO_PUBLIC_POSTHOG_KEY every call does nothing. The distinct id
// is the user id and nothing else about the person is sent: no phone, no alias, no location, no
// GeoIP, no session replay.
const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

// Usage statistics can be turned off (Ayarlar → Gizlilik; KVKK m. 11, the right to object). The
// choice stays on the phone. Until it is read nothing is sent: every call waits for it.
const PREF_KEY = 'skall.analytics.off';
let enabled = true;
// The signed-in account, kept so that turning statistics back on names the person again.
let userId: string | null = null;
const ready: Promise<void> = AsyncStorage.getItem(PREF_KEY)
  .then((stored) => {
    enabled = stored !== '1';
  })
  .catch(() => undefined);

let client: PostHog | null = null;

function posthog(): PostHog | null {
  if (!apiKey) return null;
  client ??= new PostHog(apiKey, {
    host,
    disableGeoip: true,
    personProfiles: 'identified_only',
    captureAppLifecycleEvents: false,
    enableSessionReplay: false,
    // No feature flags are used, so nothing is asked of the server when the client is made; and a
    // client made while statistics are off (to forget the last account, resetAnalytics) sends
    // nothing.
    preloadFeatureFlags: false,
    defaultOptIn: enabled,
  });
  return client;
}

function whenOn(send: (client: PostHog) => void): void {
  void ready.then(() => {
    if (!enabled) return;
    const on = posthog();
    if (on) send(on);
  });
}

export function analyticsEnabled(): Promise<boolean> {
  return ready.then(() => enabled);
}

export function setAnalyticsEnabled(on: boolean): void {
  enabled = on;
  void (on ? AsyncStorage.removeItem(PREF_KEY) : AsyncStorage.setItem(PREF_KEY, '1')).catch(
    () => undefined,
  );
  if (on) {
    const live = posthog();
    // The person is named again only once the client sends again.
    void live?.optIn().then(() => {
      if (enabled && userId) live.identify(userId);
    });
  } else {
    void client?.optOut();
  }
}

export function track<E extends AnalyticsEvent>(event: E, props: AnalyticsEventProps[E]): void {
  whenOn((on) => on.capture(event, analyticsProperties(event, props)));
}

export function identify(id: string): void {
  userId = id;
  whenOn((on) => on.identify(id));
}

// Forgets the account on the phone too, also while statistics are off and also when the client was
// not made in this run: the next account must never be tied to the last one's id.
export function resetAnalytics(): void {
  userId = null;
  void ready.then(() => posthog()?.reset());
}

// For events derived from state the screen may see more than once (a status change, a result
// screen): sends each key once per app run.
const sent = new Set<string>();

export function trackOnce<E extends AnalyticsEvent>(
  key: string,
  event: E,
  props: AnalyticsEventProps[E],
): void {
  if (sent.has(key)) return;
  sent.add(key);
  track(event, props);
}
