import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry(): void {
  // Skip if no DSN configured (local dev or itch.io build)
  if (!SENTRY_DSN) {
    console.log('[Sentry] No DSN configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Performance monitoring - sample 10% of transactions
    tracesSampleRate: 0.1,

    // Session replay - capture 10% normally, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter out known non-actionable errors
    beforeSend(event) {
      // Ignore network errors from Firebase (handled by retry logic)
      if (event.exception?.values?.[0]?.value?.includes('network')) {
        return null;
      }
      return event;
    },
  });

  console.log('[Sentry] Initialized for environment:', import.meta.env.MODE);
}

/**
 * Capture an error with optional context
 * Use this instead of console.error for important errors
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>
): void {
  const err = typeof error === 'string' ? new Error(error) : error;

  console.error('[Error]', err.message, context);

  if (SENTRY_DSN) {
    Sentry.captureException(err, {
      extra: context,
    });
  }
}

/**
 * Set user context for error reports
 */
export function setUserContext(userId: string, nickname?: string): void {
  if (SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      username: nickname,
    });
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }
}
