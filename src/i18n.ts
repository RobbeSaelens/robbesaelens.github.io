import { createI18n } from 'vue-i18n'
import type { Composer } from 'vue-i18n'
import en from './locales/en.json'
import nl from './locales/nl.json'

export type MessageSchema = typeof en
export type SupportedLocale = 'en' | 'nl'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'nl']
const LOCALE_STORAGE_KEY = 'app-locale'

function getInitialLocale(): SupportedLocale {
  // Runs during prerendering too, where there is no browser environment.
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale
  }
  const browserLocale = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLocale as SupportedLocale)) {
    return browserLocale as SupportedLocale
  }
  return 'en'
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

// setLocale() keeps <html lang> in sync on every switch, but the *initial*
// locale can also come from storage or the browser, so sync it once on load.
// Without this the document claims lang="en" while showing Dutch content.
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', composer.locale.value as string)
}

export function getLocale(): SupportedLocale {
  return composer.locale.value as SupportedLocale
}

export function setLocale(locale: SupportedLocale): void {
  composer.locale.value = locale
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.querySelector('html')?.setAttribute('lang', locale)
}

export default i18n
