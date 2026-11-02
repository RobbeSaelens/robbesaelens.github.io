/**
 * Cloudflare Web Analytics: counts page views without cookies, without storing
 * anything in the browser and without fingerprinting, so no consent banner is
 * needed. The beacon follows route changes of the SPA itself. The token comes
 * from the build (VITE_CF_ANALYTICS_TOKEN); without one nothing is loaded.
 */
const TOKEN = import.meta.env.VITE_CF_ANALYTICS_TOKEN

/**
 * Leftovers of the Google Analytics setup with its consent banner (until
 * November 2026): the stored choice and the _ga cookies of visitors who accepted.
 */
function forgetGoogleAnalytics(): void {
  try {
    localStorage.removeItem('cookie-consent')
  } catch {
    // storage blocked: nothing was stored either
  }
  const host = location.hostname
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0]!.trim())) {
    if (name !== '_ga' && !name.startsWith('_ga_')) continue
    for (const domain of ['', `; domain=${host}`, `; domain=.${host}`]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`
    }
  }
}

/** Call once on the client. */
export function initAnalytics(): void {
  forgetGoogleAnalytics()
  if (!TOKEN) return
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset.cfBeacon = JSON.stringify({ token: TOKEN, spa: true })
  document.body.append(script)
}
