import * as Sentry from '@sentry/nextjs';

export function captureServerError(error, context = {}) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Captured error:', error, context);
  }
}