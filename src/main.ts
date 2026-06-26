// main.ts
import { createApp, App as VueApp } from 'vue'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import '@unocss/reset/tailwind.css'
import 'uno.css'
import './assets/terminal-theme.css'
import router from './bootstrap/router'
import i18n from './i18n'

const app: VueApp = createApp(App)
const head = createHead()

app.use(head)
app.use(i18n)
app.use(router)
app.mount('#app')
