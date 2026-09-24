// Single source of truth for the canonical origin. Used by head tags, JSON-LD
// and the prerender script so they can never drift apart.
export const SITE_URL = 'https://robbesaelens.github.io'
export const SITE_NAME = 'Robbe Saelens'
export const SITE_TAGLINE = 'Full-Stack Web Developer'

/**
 * Base URL of the private status worker that backs /status, without a
 * trailing slash. Baked in at build time from VITE_STATUS_API_URL (the GitHub
 * repository variable STATUS_API_URL in CI). It is a public URL, not a secret:
 * every request to it is authenticated. Empty when unset, in which case the
 * /status page shows a "not configured" message.
 */
export const STATUS_API_URL: string = (import.meta.env.VITE_STATUS_API_URL ?? '')
  .trim()
  .replace(/\/+$/, '')

export function absoluteUrl(path: string): string {
  if (path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
