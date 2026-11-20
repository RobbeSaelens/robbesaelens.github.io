/**
 * What each page's share image shows (src/seo/share.ts): the build draws one per page and
 * language from these cards (scripts/og.mjs, through the SSR bundle), so they follow the
 * site's own data:
 * - the pages: every page of the router, in both languages, also one added later
 * - the title and "$ …" line: as the page shows them under its header (for a page not
 *   listed in PAGES: its title, lowercase, and `cat ./<page>.md`)
 * - the text: a project's tagline, else a short line of the page, else its description
 * - the pictures: real ones, from public/ (a project's screenshots, the tools' captures,
 *   Robbe's photos)
 *
 * How they look is scripts/og.mjs's.
 */
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createI18n, type Composer } from 'vue-i18n'
import type { RouteRecordRaw } from 'vue-router'
import en from '../locales/en.json'
import nl from '../locales/nl.json'
import { routes } from '../bootstrap/router'
import { PROJECT_PAGES } from '../projects'
import { PROJECT_DATA } from '../screens/details/data'
import { tools } from '../tools'
import { stripLocale, type Locale } from '../localePath'
import { SITE_URL } from '../site'
import BrandLogo from '../components/BrandLogo.vue'
import { shareImagePath, shareKind, shareProject, type ShareKind } from './share'

export interface ShareCard {
  /** The page: '/nl/tools' */
  path: string
  lang: Locale
  /** The PNG, relative to dist/: 'og/nl/tools.png' */
  file: string
  /** The page's address, beside the logo: 'robbesaelens.github.io/nl/tools' */
  address: string
  /** The terminal title, as the page's header shows it ("> projects") */
  title: string
  /** The "$ …" line under it */
  command: string
  /** Under them: a project's tagline, a short line of the page, or its description */
  text: string
  kind: ShareKind
  /** Real pictures, JPGs in public/, with what names them on the card */
  pictures: { src: string; label?: string }[]
  /** A project's status, as its page's badge says it, and what the badge doesn't say */
  status?: { label: string; live: boolean; note?: string }
  /** The address in a project's browser bar: 'exulta.be' */
  site?: string
}

const MESSAGES = { en, nl }

const composers = Object.fromEntries(
  (['en', 'nl'] as const).map((lang) => [
    lang,
    createI18n({ legacy: false, locale: lang, fallbackLocale: 'en', messages: MESSAGES }).global as unknown as Composer,
  ]),
) as Record<Locale, Composer>

/** The text of `key` in `lang`, as the pages show it; a missing key fails the build. */
function translator(lang: Locale) {
  const composer = composers[lang]
  return (key: string, named: Record<string, unknown> = {}): string => {
    if (!composer.te(key, lang)) throw new Error(`[share] no ${lang} text for "${key}"`)
    return composer.t(key, named)
  }
}

type Translate = ReturnType<typeof translator>
type Meta = { title: string; description: string; locale: Locale }

/**
 * The pages with a header of their own, by route name: their title (a locale key, shown
 * lowercase) and "$ …" line, as in their template, and the line under it when it isn't
 * the description. The home page and the project pages say theirs below, from the same
 * places their templates do. The smoke tests check that the pages still say the same.
 */
const PAGES: Record<string, { title: string; command: string; text?: (t: Translate) => string }> = {
  Contact: { title: 'about.title', command: 'cat ./about-me.md' },
  Drupal: { title: 'drupal.title', command: 'cat ./drupal-contributions.md' },
  Privacy: { title: 'privacy.title', command: 'cat ./privacy.md' },
  Projects: { title: 'nav.projects', command: 'ls ./projects', text: (t) => t('projects.intro') },
  Tools: { title: 'tools.title', command: 'cat ./tools.md', text: (t) => t('tools.tagline') },
}

/** The pictures of a page's card, by kind. */
function pictures(kind: ShareKind, t: Translate, routeName: string): ShareCard['pictures'] {
  switch (kind) {
    case 'photo':
      return [{ src: '/pf2.jpg' }]
    case 'photos':
      // The about page's two photos (Contact.vue): teaching, and riding
      return [{ src: '/about.jpg' }, { src: '/horse.jpg' }]
    case 'project': {
      const data = PROJECT_DATA[shareProject(routeName)!.id](t)
      return [{ src: data.desktop.src }, { src: data.phone.src }]
    }
    case 'projects':
      return PROJECT_PAGES.map((project) => ({ src: project.screenshot, label: project.name }))
    case 'tools':
      return tools(t).map((tool) => ({ src: tool.shots[0].src, label: tool.name }))
    default:
      return []
  }
}

function card(route: RouteRecordRaw & { meta: Meta }): ShareCard {
  const path = route.path.startsWith('/') ? route.path : `/${route.path}`
  const lang = route.meta.locale
  const t = translator(lang)
  const routeName = String(route.name)
  const baseName = routeName.replace(/-nl$/, '')
  const kind = shareKind(path, routeName)
  const project = shareProject(routeName)
  const page = PAGES[baseName]

  let title: string
  let command: string
  let text = route.meta.description
  let status: ShareCard['status']
  let site: string | undefined

  if (project) {
    // As the project page's header (ProjectPage.vue): name, "$ cat ./…", tagline, status
    const data = PROJECT_DATA[project.id](t)
    title = data.name
    command = `cat ./${data.file}`
    text = t(`projects.items.${project.id}.tagline`)
    status = {
      label: data.status.label,
      live: data.status.kind === 'live',
      ...(data.status.note ? { note: data.status.note } : {}),
    }
    site = data.url
  } else if (baseName === 'Home') {
    // As the home page's hero (Profile.vue): the name, the role as the "$" line, the bio
    title = 'robbe saelens'
    command = t('home.role').toLowerCase()
    text = t('home.bio', { place: 'Geluwe' })
  } else if (page) {
    title = t(page.title).toLowerCase()
    command = page.command
    if (page.text) text = page.text(t)
  } else {
    // A page added later, before it has an entry above
    title = route.meta.title.toLowerCase()
    command = `cat ./${stripLocale(path).slice(1).replace(/\//g, '-')}.md`
  }

  const address = `${SITE_URL.replace(/^https:\/\//, '')}${path === '/' ? '' : path}`
  return {
    path,
    lang,
    file: shareImagePath(path).slice(1),
    address,
    title,
    command,
    text,
    kind,
    pictures: pictures(kind, t, routeName),
    ...(status ? { status } : {}),
    ...(site ? { site } : {}),
  }
}

/** Every page's card, in both languages, in the router's order. */
export function shareCards(): ShareCard[] {
  return routes
    .flatMap((route) => route.children ?? [route])
    .filter((route): route is RouteRecordRaw & { meta: Meta } => !!route.meta?.locale && !route.path.includes(':'))
    .map(card)
}

/** The header's logo, "robbe saelens." (BrandLogo.vue), as SVG: the cards draw it in their own colours. */
export function shareLogo(): Promise<string> {
  return renderToString(createSSRApp(BrandLogo))
}
