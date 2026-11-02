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
  '/stalmanagerdetail',
  '/vhsdetail',
]

/** Pages with route meta `fit`: exactly one screen tall, no vertical scroll. */
export const FIT_ROUTES = ['/projects', '/contact']
