import { ref } from 'vue'

/**
 * Google Analytics, loaded only after the visitor accepts it (GDPR / ePrivacy).
 * Until then nothing is requested from Google and no cookie is set. The choice
 * is kept in localStorage and can be changed any time from the footer or the
 * privacy page (openConsent()).
 */

const GA_ID = 'G-KTMQFBG1N2'
const STORAGE_KEY = 'cookie-consent'

export type Consent = 'granted' | 'denied'

/** The stored choice; null = not asked yet. */
export const consent = ref<Consent | null>(null)
/** Whether the banner is showing. */
export const consentOpen = ref(false)

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let loaded = false

function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

function loadAnalytics(): void {
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = false
  if (loaded) return
  loaded = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js expects the arguments object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.append(script)
}

/** Stops measuring and removes the cookies Google Analytics set. */
function disableAnalytics(): void {
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true
  const host = location.hostname
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0]!.trim())) {
    if (name !== '_ga' && !name.startsWith('_ga_')) continue
    for (const domain of ['', `; domain=${host}`, `; domain=.${host}`]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`
    }
  }
}

/** Call once on the client: loads analytics if accepted earlier, else asks. */
export function initConsent(): void {
  consent.value = readConsent()
  consentOpen.value = consent.value === null
  if (consent.value === 'granted') loadAnalytics()
}

export function setConsent(value: Consent): void {
  consent.value = value
  consentOpen.value = false
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // not remembered: the banner asks again next visit
  }
  if (value === 'granted') loadAnalytics()
  else disableAnalytics()
}

/** Shows the banner again, to change the choice. */
export function openConsent(): void {
  consentOpen.value = true
}
