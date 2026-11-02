// Single source of truth for the canonical origin. Used by head tags, JSON-LD
// and the prerender script so they can never drift apart.
export const SITE_URL = 'https://robbesaelens.github.io'
export const SITE_NAME = 'Robbe Saelens'
export const SITE_TAGLINE = 'Full-Stack Web Developer'

/**
 * Base URL of the chatbot's AI worker (status-worker), without a trailing
 * slash. Baked in at build time from VITE_CHAT_API_URL (the GitHub repository
 * variable CHAT_API_URL in CI). Public, not a secret. Empty = the chatbot only
 * uses its built-in answers.
 */
export const CHAT_API_URL: string = (import.meta.env.VITE_CHAT_API_URL ?? '').trim().replace(/\/+$/, '')

export function absoluteUrl(path: string): string {
  if (path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
