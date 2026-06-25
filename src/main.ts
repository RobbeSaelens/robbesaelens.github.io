// main.ts
import { createApp, App as VueApp } from 'vue'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import '@unocss/reset/tailwind.css'
import 'uno.css'
import router from './bootstrap/router'

const app: VueApp = createApp(App)
const head = createHead()

app.use(head)
app.use(router)
app.mount('#app')
