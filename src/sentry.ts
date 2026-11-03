import * as Sentry from '@sentry/vue'
import type { App } from 'vue'

/**
 * Error monitoring with Sentry (project "portfolio", EU region). Errors only: no
 * tracing, no session replay, no cookies, and nothing about the visitor (no IP,
 * headers, query strings or local variables). See the privacy page.
 *
 * Reports only from the live site, so local development, previews and the tests
 * never send anything. VITE_SENTRY_ENVIRONMENT (e.g. "local") turns it on for a
 * local build, to check that reports arrive.
 */
const DSN = 'https://72d14c33210b9e6a144bd0a99d307b2c@o4512140490506240.ingest.de.sentry.io/4512366847787088'
const LIVE_HOST = 'robbesaelens.github.io'

export function initSentry(app: App): void {
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT
  if (location.hostname !== LIVE_HOST && !environment) return

  Sentry.init({
    app,
    dsn: DSN,
    environment: environment || 'production',
    release: import.meta.env.VITE_SENTRY_RELEASE,
    // Only errors: no "session" ping on every page view (release health).
    integrations: (defaults) => defaults.filter((integration) => integration.name !== 'BrowserSession'),
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    },
  })
}
