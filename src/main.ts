// main.ts
import { createApp, App as VueApp } from 'vue'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import '@unocss/reset/tailwind.css'
import 'uno.css'
import './assets/terminal-theme.css'
import { createWebHistory } from 'vue-router'
import { createAppRouter } from './bootstrap/router'
import i18n, { localeLinks } from './i18n'
import { initAnalytics } from './analytics'
import { initSentry } from './sentry'

const app: VueApp = createApp(App)
initSentry(app)
const head = createHead()
const router = createAppRouter(createWebHistory())

app.use(head)
app.use(i18n)
app.use(localeLinks)
app.use(router)
app.mount('#app')
initAnalytics()
