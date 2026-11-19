/**
 * Every public page. Keep in sync with the router: the smoke test's sitemap
 * check fails when a page is added without being listed here.
 */
export const ROUTES = [
  '/',
  '/projects',
  '/contact',
  '/exultadetail',
  '/scan2talkdetail',
  '/stablemanagerdetail',
  '/vhsdetail',
  '/drupal',
  '/tools',
  '/privacy',
]

/**
 * A page in another state than it opens in: its URL's hash picks what it shows (the tools
 * page's switch). Not in the sitemap; the accessibility and responsive checks take them too.
 */
export const STATES = ['/tools#sift']

/** The Dutch version of a page: /nl, /nl/contact, ... */
export const nl = (route: string) => (route === '/' ? '/nl' : `/nl${route}`)

/** Pages with route meta `fit`: exactly one screen tall, no vertical scroll. */
export const FIT_ROUTES = ['/projects', '/contact']

/** Old URLs of pages that moved, old → new (REDIRECTS in the router). Never in the sitemap. */
export const MOVED: [from: string, to: string][] = [['/stalmanagerdetail', '/stablemanagerdetail']]
