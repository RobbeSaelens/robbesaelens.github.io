/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the chatbot's AI worker (status-worker), no trailing slash. Public. */
  readonly VITE_CHAT_API_URL?: string
  /** Cloudflare Web Analytics beacon token. Public: it ends up in the page anyway. */
  readonly VITE_CF_ANALYTICS_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
