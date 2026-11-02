import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * English lives at the root, Dutch under /nl: /contact and /nl/contact are the
 * same page in two languages. The URL decides the language.
 */
export type Locale = 'en' | 'nl'

const NL = '/nl'

export function localeOfPath(path: string): Locale {
  return path === NL || path.startsWith(`${NL}/`) ? 'nl' : 'en'
}

/** '/nl/contact' → '/contact', '/nl' → '/'. English paths stay as they are. */
export function stripLocale(path: string): string {
  if (localeOfPath(path) === 'en') return path
  return path.slice(NL.length) || '/'
}

/** The same page in `locale`: '/contact' → '/nl/contact', '/' → '/nl'. */
export function localizedPath(path: string, locale: Locale): string {
  const base = stripLocale(path)
  if (locale === 'en') return base
  return base === '/' ? NL : `${NL}${base}`
}

/** Route names: Dutch routes carry a "-nl" suffix. */
export function localizedName(name: string, locale: Locale): string {
  return locale === 'nl' ? `${name}-nl` : name
}

/** For templates: lp('/projects') links to the projects page in the current language. */
export function useLocalePath() {
  const { locale } = useI18n({ useScope: 'global' })
  const current = computed(() => (locale.value === 'nl' ? 'nl' : 'en') as Locale)
  return {
    lp: (path: string) => localizedPath(path, current.value),
    ln: (name: string) => localizedName(name, current.value),
    locale: current,
  }
}
