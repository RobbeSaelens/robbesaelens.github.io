import { createI18n } from 'vue-i18n'
import type { Composer } from 'vue-i18n'
import en from './locales/en.json'
import nl from './locales/nl.json'
import type { App } from 'vue'
import { localeOfPath, localizedName, localizedPath } from './localePath'

export type MessageSchema = typeof en
export type SupportedLocale = 'en' | 'nl'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'nl']
const LOCALE_STORAGE_KEY = 'app-locale'

/** The URL decides the language (/nl/... is Dutch); prerendering starts in English. */
function getInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'en'
  return localeOfPath(location.pathname)
}

/**
 * The language a visitor prefers: the one they last picked in the switcher
 * (explicit), else their browser's. Only used to send a first visit to the
 * right URL.
 */
export function preferredLocale(): { locale: SupportedLocale; explicit: boolean } | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      return { locale: stored as SupportedLocale, explicit: true }
    }
  } catch {
    // no storage: fall back to the browser language
  }
  const browser = (navigator.languages?.[0] ?? navigator.language ?? '').split('-')[0]
  return SUPPORTED_LOCALES.includes(browser as SupportedLocale)
    ? { locale: browser as SupportedLocale, explicit: false }
    : null
}

const i18n = createI18n<[MessageSchema], SupportedLocale>({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, nl },
  missingWarn: false,
  fallbackWarn: false,
})

const composer = i18n.global as unknown as Composer

// applyLocale() keeps <html lang> in sync on every navigation; sync it once on
// load too, before the router's first navigation.
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', composer.locale.value as string)
}

export function getLocale(): SupportedLocale {
  return composer.locale.value as SupportedLocale
}

/** Shows the site in `locale` (the router calls this for every page). */
export function applyLocale(locale: SupportedLocale): void {
  composer.locale.value = locale
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('lang', locale)
}

/** Remembers an explicit choice in the language switcher. */
export function rememberLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // only this visit then
  }
}

/**
 * Template helpers for links in the current language:
 * $lp('/projects') → '/nl/projects' on Dutch pages, $ln('ExultaDetail') for named routes.
 */
export const localeLinks = {
  install(app: App) {
    app.config.globalProperties.$lp = (path: string) => localizedPath(path, getLocale())
    app.config.globalProperties.$ln = (name: string) => localizedName(name, getLocale())
  },
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $lp: (path: string) => string
    $ln: (name: string) => string
  }
}

export default i18n
