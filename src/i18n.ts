import { createI18n } from 'vue-i18n'
import type { Composer } from 'vue-i18n'
import en from './locales/en.json'
import nl from './locales/nl.json'

export type MessageSchema = typeof en
export type SupportedLocale = 'en' | 'nl'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'nl']
const LOCALE_STORAGE_KEY = 'app-locale'

function getInitialLocale(): SupportedLocale {
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

export function getLocale(): SupportedLocale {
  return composer.locale.value as SupportedLocale
}

export function setLocale(locale: SupportedLocale): void {
  composer.locale.value = locale
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.querySelector('html')?.setAttribute('lang', locale)
}

export default i18n
