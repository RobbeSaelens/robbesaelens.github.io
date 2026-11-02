// Single source of truth for the canonical origin. Used by head tags, JSON-LD
// and the prerender script so they can never drift apart.
export const SITE_URL = 'https://robbesaelens.github.io'
export const SITE_NAME = 'Robbe Saelens'
export const SITE_TAGLINE = 'Full-Stack Web Developer'

export function absoluteUrl(path: string): string {
  if (path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
