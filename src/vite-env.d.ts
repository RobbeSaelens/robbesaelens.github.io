/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the chatbot's AI worker (status-worker), no trailing slash. Public. */
  readonly VITE_CHAT_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
