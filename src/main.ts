// main.ts
import { createApp, App as VueApp } from 'vue'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import '@unocss/reset/tailwind.css'
import 'uno.css'
import './assets/terminal-theme.css'
import './assets/project-page.css'
import { createWebHistory } from 'vue-router'
import { createAppRouter } from './bootstrap/router'
import i18n, { localeLinks } from './i18n'
import { initAnalytics } from './analytics'
import { initSentry } from './sentry'
import TerminalCommand from './components/TerminalCommand.vue'

const app: VueApp = createApp(App)
initSentry(app)
// The "$ …" line under the page titles, global so the pages need no import (also in entry-server.ts)
app.component('TerminalCommand', TerminalCommand)
const head = createHead()
const router = createAppRouter(createWebHistory())

app.use(head)
app.use(i18n)
app.use(localeLinks)
app.use(router)
// Mount once the route's code has loaded: mounting replaces the prerendered page, and
// mounting earlier left it blank until the lazy route chunk arrived (about 1.6 s on a
// slow connection).
router.isReady().then(() => app.mount('#app'))
initAnalytics()
