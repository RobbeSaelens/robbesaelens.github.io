import { createRouter, Router, RouterHistory, RouteRecordRaw } from 'vue-router'
import { applyLocale, preferredLocale } from '../i18n'
import { localeOfPath, localizedPath, type Locale } from '../localePath'

/**
 * Every page, once. Each is served in English at its path and in Dutch under
 * /nl (see localized() below); meta.nl holds the Dutch title and description.
 */
const pages: RouteRecordRaw[] = [
  {
    path: '',
    name: 'Home',
    component: () => import('../screens/Index.vue'),
    meta: {
      title: 'Full-Stack Web Developer',
      description:
        'Robbe Saelens is a full-stack web developer from Geluwe, Belgium, working at Dynamate. Portfolio of work in Vue, TypeScript, React, Next.js, Laravel and Drupal.',
      image: '/pf2.jpg',
      nl: {
        title: 'Full-stack webontwikkelaar',
        description:
          'Robbe Saelens is full-stack webontwikkelaar uit Geluwe en werkt bij Dynamate. Portfolio met werk in Vue, TypeScript, React, Next.js, Laravel en Drupal.',
      },
    },
  },
  {
    path: 'contact',
    name: 'Contact',
    component: () => import('../screens/Contact.vue'),
    meta: {
      title: 'About me',
      description:
        'About Robbe Saelens: education in Multimedia & Creative Technology, experience as PHP, Magento and Drupal backend developer, and how to get in touch.',
      image: '/pf2.jpg',
      nl: {
        title: 'Over mij',
        description:
          'Over Robbe Saelens: opleiding Multimedia en Creatieve Technologie, ervaring als PHP-, Magento- en Drupal-backendontwikkelaar, en hoe je hem bereikt.',
      },
      fit: true,
    },
  },
  {
    path: 'privacy',
    name: 'Privacy',
    component: () => import('../screens/Privacy.vue'),
    meta: {
      title: 'Privacy',
      description:
        'How robbesaelens.github.io handles personal data: hosting, cookieless statistics, the AI chatbot, and your rights under the GDPR. No cookies, no tracking.',
      image: '/pf2.jpg',
      nl: {
        title: 'Privacy',
        description:
          'Hoe robbesaelens.github.io met persoonsgegevens omgaat: hosting, statistieken zonder cookies, de AI-chatbot en je rechten onder de AVG. Geen tracking.',
      },
    },
  },
  {
    path: 'projects',
    name: 'Projects',
    component: () => import('../screens/Projects.vue'),
    meta: {
      title: 'Projects',
      description:
        'Projects by Robbe Saelens: Exulta tent rental, Scan2Talk student check-ins, Stal Manager horse costs and VHS Service arenas. Laravel, React, Vue, Next.js.',
      image: '/exulta-home.jpg',
      nl: {
        title: 'Projecten',
        description:
          'Projecten van Robbe Saelens: Exulta tentverhuur, Scan2Talk check-ins voor leerlingen, Stal Manager paardenkosten en VHS Service. Laravel, React, Vue, Next.js.',
      },
      fit: true,
    },
  },
  {
    path: 'exultadetail',
    name: 'ExultaDetail',
    component: () => import('../screens/details/Exulta.vue'),
    meta: {
      title: 'Exulta - Stretch tent rental website',
      description:
        'Exulta v2 by Robbe Saelens, live at exulta.be: stretch tent rental site with catalog, tent calculator and blog. Laravel 13, React 19, Filament 5.',
      image: '/exulta-home.jpg',
      nl: {
        title: 'Exulta - Website voor tentverhuur',
        description:
          'Exulta v2 door Robbe Saelens, live op exulta.be: website voor stretchtentverhuur met catalogus, tentcalculator en blog. Laravel 13, React 19, Filament 5.',
      },
    },
  },
  {
    path: 'stalmanagerdetail',
    name: 'StalManagerDetail',
    component: () => import('../screens/details/StalManager.vue'),
    meta: {
      title: 'Stal Manager - Horse cost tracker',
      description:
        'Stal Manager by Robbe Saelens: private app tracking horse costs, split per horse, with a dashboard and an offline mobile app. Next.js 16, Prisma, PostgreSQL.',
      image: '/stal-manager-home.jpg',
      nl: {
        title: 'Stal Manager - Paardenkosten bijhouden',
        description:
          'Stal Manager door Robbe Saelens: privé-app die paardenkosten per paard bijhoudt, met dashboard en offline mobiele app. Next.js 16, Prisma, PostgreSQL.',
      },
    },
  },
  {
    path: 'vhsdetail',
    name: 'VHSDetail',
    component: () => import('../screens/details/VHS.vue'),
    meta: {
      title: 'VHS Service - Equestrian arena website',
      description:
        'VHS Service by Robbe Saelens: trilingual Next.js 16 site for a riding arena builder in Geluwe, photo-led with GSAP motion and local SEO. In rebranding.',
      image: '/vhs-home.jpg',
      nl: {
        title: 'VHS Service - Website voor paardenpistes',
        description:
          "VHS Service door Robbe Saelens: drietalige Next.js 16-site voor een bouwer van paardenpistes in Geluwe, met grote foto's, GSAP en lokale SEO. In rebranding.",
      },
    },
  },
  {
    path: 'scan2talkdetail',
    name: 'Scan2TalkDetail',
    component: () => import('../screens/details/Scan2Talk.vue'),
    meta: {
      title: 'Scan2Talk - Student wellbeing check-in PWA',
      description:
        'Scan2Talk by Robbe Saelens, live at scan2talk.be: students scan a QR poster to share how they feel; educators get trends and an anonymous chat.',
      image: '/scan2talk-home.jpg',
      nl: {
        title: 'Scan2Talk - Welzijnscheck-in voor leerlingen',
        description:
          'Scan2Talk door Robbe Saelens, live op scan2talk.be: leerlingen scannen een QR-poster en delen hoe ze zich voelen; begeleiders zien trends en een anonieme chat.',
      },
    },
  },
]

/** The pages for one language: Dutch paths and names get /nl and "-nl". */
function localized(locale: 'en' | 'nl'): RouteRecordRaw[] {
  return pages.map((page) => {
    const { nl, ...meta } = (page.meta ?? {}) as Record<string, unknown> & { nl?: { title: string; description: string } }
    if (locale === 'en') return { ...page, meta: { ...meta, locale } } as RouteRecordRaw
    return {
      ...page,
      path: page.path ? `nl/${page.path}` : 'nl',
      name: `${String(page.name)}-nl`,
      meta: { ...meta, ...nl, locale },
    } as RouteRecordRaw
  })
}

export const routes: RouteRecordRaw[] = [
  {
    // One layout for both languages, so switching language doesn't remount it.
    path: '/',
    component: () => import('../components/holders/AppHolder.vue'),
    children: [...localized('en'), ...localized('nl')],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'ClientError',
    component: () => import('../screens/generic/ClientError.vue'),
    meta: {
      title: 'Page Not Found',
      description: 'The page you are looking for does not exist.',
      errorCode: '404',
      noindex: true,
    },
  },
]

/**
 * Shared factory so the client entry and the prerenderer stay in sync. The
 * history is injected because the prerenderer must not touch `window`.
 */
export function createAppRouter(history: RouterHistory): Router {
  const router = createRouter({
    history,
    routes,
    scrollBehavior() {
      return { top: 0 }
    },
  })

  let firstVisit = typeof window !== 'undefined'
  router.beforeEach((to) => {
    const locale = (to.meta.locale as Locale | undefined) ?? localeOfPath(to.path)
    // The first page of a visit opens in the visitor's language: always after an
    // explicit choice in the switcher, and by browser language only on the plain
    // root "/" (a /nl/... URL or a shared deep link keeps its language). Crawlers
    // report English and never store a choice, so each URL keeps its own language.
    if (firstVisit) {
      firstVisit = false
      const preferred = preferredLocale()
      const applies = preferred && (preferred.explicit || to.path === '/')
      if (applies && preferred.locale !== locale && to.meta.locale) {
        return { path: localizedPath(to.path, preferred.locale), query: to.query, hash: to.hash, replace: true }
      }
    }
    applyLocale(locale)
  })
  return router
}
