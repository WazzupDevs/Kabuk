import { scrubBreadcrumb, scrubEvent } from '@shared/errorReporting.ts';
import * as Sentry from '@sentry/react-native';

// Crash reporting (Sentry). Without EXPO_PUBLIC_SENTRY_DSN every call does nothing. The only
// identity sent is the user id; @shared/errorReporting.ts strips phone numbers, coordinates,
// typed text, request bodies and query strings before anything leaves the phone.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initErrorReporting(): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  });
}

export function setReportingUser(userId: string | null): void {
  if (!dsn) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

// Whether reports go anywhere in this build (Ayarlar's test row shows only then).
export const errorReportingOn = !!dsn;

// Ayarlar → Test sürümü → "Hata kaydını gönder": one message, sent as a crash is (the user id,
// the breadcrumbs, the device), through the same filter (beforeSend, beforeBreadcrumb); nothing
// new is gathered. Resolves true once Sentry took it off the phone.
export async function sendErrorLog(): Promise<boolean> {
  if (!dsn) return false;
  Sentry.captureMessage('Error log sent from Ayarlar', {
    level: 'info',
    fingerprint: ['manual-error-log'],
  });
  return Sentry.flush();
}

export function reportError(error: unknown): void {
  if (!dsn) return;
  Sentry.captureException(error);
}

// A 5xx from an Edge Function, tagged with the function (and its action) and the status, grouped by
// both. Nothing from the request or the answer body is sent.
export function reportFunctionFailure(call: string, status: number): void {
  if (!dsn) return;
  Sentry.captureMessage(`Edge Function ${call} answered ${status}`, {
    level: 'error',
    tags: { function: call, status: String(status) },
    fingerprint: ['edge-function-5xx', call, String(status)],
  });
}
