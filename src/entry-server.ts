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

export const prerenderRoutes: string[] = routes
  .flatMap((route) => route.children ?? [route])
  .map((route) => route.path)
  .filter((path) => !path.includes(':'))
  .map((path) => (path.startsWith('/') ? path : `/${path}`))

export async function render(url: string): Promise<{ html: string; head: string; bodyTags: string }> {
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
