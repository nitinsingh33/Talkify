import * as Sentry from "@sentry/react"

/**
 * Error tracking — a no-op until VITE_SENTRY_DSN is set at build time.
 * See README > Error Tracking for setup.
 */
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

if (dsn) {
    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    })
}

export { Sentry }
