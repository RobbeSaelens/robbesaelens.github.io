/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the chatbot's AI worker (status-worker), no trailing slash. Public. */
  readonly VITE_CHAT_API_URL?: string
  /** Cloudflare Web Analytics beacon token. Public: it ends up in the page anyway. */
  readonly VITE_CF_ANALYTICS_TOKEN?: string
  /** Sentry release, the commit being deployed (set by the deploy workflow). */
  readonly VITE_SENTRY_RELEASE?: string
  /** Turns Sentry on outside the live site, under this environment name (e.g. "local"). */
  readonly VITE_SENTRY_ENVIRONMENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
