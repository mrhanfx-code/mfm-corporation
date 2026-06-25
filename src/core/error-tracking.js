// Error tracking with Sentry integration
// Provides centralized error logging and monitoring

let Sentry = null;

// Initialize Sentry if DSN is provided
export function initErrorTracking(env) {
  if (!env.SENTRY_DSN) {
    console.log('[ErrorTracking] Sentry DSN not configured, error tracking disabled');
    return;
  }

  try {
    // Dynamic import for Sentry to avoid bundling if not needed
    import('@sentry/node').then(SentryModule => {
      Sentry = SentryModule;
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.ENVIRONMENT || 'production',
        tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request) {
            delete event.request.cookies;
            delete event.request.headers;
          }
          return event;
        }
      });
      console.log('[ErrorTracking] Sentry initialized');
    }).catch(err => {
      console.error('[ErrorTracking] Failed to initialize Sentry:', err);
    });
  } catch (err) {
    console.error('[ErrorTracking] Sentry import failed:', err);
  }
}

// Capture exception with context
export function captureException(error, context = {}) {
  if (!Sentry) {
    console.error('[ErrorTracking]', error.message, context);
    return;
  }

  Sentry.captureException(error, {
    tags: {
      component: context.component || 'unknown',
      severity: context.severity || 'error'
    },
    extra: {
      ...context
    }
  });
}

// Capture message with level
export function captureMessage(message, level = 'info', context = {}) {
  if (!Sentry) {
    console.log(`[ErrorTracking] [${level}]`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    tags: {
      component: context.component || 'unknown'
    },
    extra: {
      ...context
    }
  });
}

// Set user context
export function setUserContext(userId, email = null) {
  if (!Sentry) return;

  Sentry.setUser({
    id: userId,
    email: email
  });
}

// Clear user context
export function clearUserContext() {
  if (!Sentry) return;

  Sentry.setUser(null);
}

// Add breadcrumb for debugging
export function addBreadcrumb(category, message, level = 'info', data = {}) {
  if (!Sentry) return;

  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data
  });
}

// Start transaction for performance monitoring
export function startTransaction(name, op = 'task') {
  if (!Sentry) return null;

  return Sentry.startTransaction({
    name,
    op
  });
}

// Finish transaction
export function finishTransaction(transaction, status = 'ok') {
  if (!transaction) return;

  transaction.setStatus(status);
  transaction.finish();
}
