/**
 * The share images (Open Graph): what a link to a page shows on LinkedIn, Teams, WhatsApp,
 * Slack and the like. Every page has its own, in each language: a 1200 × 630 PNG in the
 * site's terminal style, drawn at build time (scripts/og.mjs, after the prerender) from
 * what src/seo/shareCards.ts puts on it. The head of each page points at it (App.vue).
 *
 * This file holds what the head needs, so it stays small (App.vue is in every page's
 * bundle): where a page's image is, and what its alt text says.
 */
import { PROJECT_PAGES } from '../projects'
import { localeOfPath, stripLocale } from '../localePath'

export const SHARE_IMAGE = { width: 1200, height: 630, type: 'image/png' } as const

/**
 * Where a page's share image is, in dist/: '/' → '/og/index.png', '/projects' →
 * '/og/projects.png', '/nl/projects' → '/og/nl/projects.png'.
 */
export function shareImagePath(path: string): string {
  const name = stripLocale(path).replace(/^\/+|\/+$/g, '') || 'index'
  return `/og/${localeOfPath(path) === 'nl' ? 'nl/' : ''}${name}.png`
}

/**
 * What a page's share image shows beside its title: Robbe's photo (home), the two photos
 * of the about page, a project's screenshots, all projects', the tools' captures, or
 * nothing but the text (any other page, also a new one).
 */
export type ShareKind = 'photo' | 'photos' | 'project' | 'projects' | 'tools' | 'text'

const KINDS: Record<string, ShareKind> = {
  '/': 'photo',
  '/contact': 'photos',
  '/projects': 'projects',
  '/tools': 'tools',
}

/** The project a page is about (src/projects.ts), by its route name ("-nl" for Dutch). */
export function shareProject(routeName: string) {
  return PROJECT_PAGES.find((project) => project.route === routeName.replace(/-nl$/, ''))
}

export function shareKind(path: string, routeName: string): ShareKind {
  if (shareProject(routeName)) return 'project'
  return KINDS[stripLocale(path)] ?? 'text'
}

/**
 * The image's alt text, in the page's language: the page's title, and what the picture
 * shows (`share.*` in the locale files).
 */
export function shareImageAlt(
  t: (key: string, named: Record<string, unknown>) => string,
  path: string,
  routeName: string,
  title: string,
): string {
  const kind = shareKind(path, routeName)
  if (kind === 'text') return title
  return `${title}. ${t(`share.${kind}`, { name: shareProject(routeName)?.name ?? '' })}`
}
