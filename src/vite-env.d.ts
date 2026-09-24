/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the private status worker used by /status, no trailing slash
   * (e.g. https://status-worker.<account>.workers.dev). Public, not a secret.
   * Unset or empty means the status page shows a "not configured" message.
   */
  readonly VITE_STATUS_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
