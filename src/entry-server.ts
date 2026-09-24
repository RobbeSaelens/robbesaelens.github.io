// Prerender entry. Renders a route to static HTML at build time so that search
// engines and AI crawlers that do not execute JavaScript still see the full
// content. The client re-mounts a fresh app on top of it (see main.ts).
import { createSSRApp } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/server'
import { renderSSRHead } from '@unhead/vue/server'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { createAppRouter, routes } from './bootstrap/router'
import i18n from './i18n'

const staticRoutes = routes
  .flatMap((route) => route.children ?? [route])
  .filter((route) => !route.path.includes(':'))

const toUrlPath = (path: string): string => (path.startsWith('/') ? path : `/${path}`)

/** Every static route; each one is written to dist/ as real HTML. */
export const prerenderRoutes: string[] = staticRoutes.map((route) => toUrlPath(route.path))

/**
 * The prerendered routes that belong in sitemap.xml. A route opts out with
 * `meta.sitemap: false` (the private /status page). noindex routes are left
 * out as well, because listing a noindex URL in a sitemap is a contradictory
 * signal to search engines.
 */
export const sitemapRoutes: string[] = staticRoutes
  .filter((route) => route.meta?.sitemap !== false && !route.meta?.noindex)
  .map((route) => toUrlPath(route.path))

/** Routes that must ship without the analytics tag (meta.analytics === false). */
export const noAnalyticsRoutes: string[] = routes
  .flatMap((route) => route.children ?? [route])
  .filter((route) => route.meta?.analytics === false)
  .map((route) => (route.path.startsWith('/') ? route.path : `/${route.path}`))

export async function render(
  url: string,
): Promise<{ html: string; head: string; bodyTags: string }> {
  const app = createSSRApp(App)
  const head = createHead()
  const router = createAppRouter(createMemoryHistory())

  app.use(head)
  app.use(i18n)
  app.use(router)

  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  const payload = await renderSSRHead(head)

  return {
    html,
    head: payload.headTags,
    bodyTags: payload.bodyTags,
  }
}
