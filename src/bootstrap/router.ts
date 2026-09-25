import { createRouter, Router, RouterHistory, RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../components/holders/AppHolder.vue'),
    children: [
      {
        path: '/',
        name: 'Home',
        component: () => import('../screens/Index.vue'),
        meta: {
          title: 'Full-Stack Web Developer',
          description:
            'Robbe Saelens is a full-stack web developer from Geluwe, Belgium, working at Dynamate. Portfolio of work in Vue, TypeScript, React, Next.js, Laravel and Drupal.',
          image: '/pf2.jpg',
        },
      },
      {
        path: 'contact',
        name: 'Contact',
        component: () => import('../screens/Contact.vue'),
        meta: {
          title: 'About me',
          description:
            'About Robbe Saelens: education in Multimedia & Communication Technologies, experience as PHP, Magento and Drupal backend developer, and how to get in touch.',
          image: '/pf2.jpg',
        },
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('../screens/Projects.vue'),
        meta: {
          title: 'Projects',
          description:
            'Projects by Robbe Saelens: Exulta stretch tent rental, Scan2Talk student wellbeing check-in and VHS Service arena construction. Laravel, React, Vue, Next.js.',
          image: '/exulta-home.jpg',
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
        },
      },
      {
        path: 'vhsdetail',
        name: 'VHSDetail',
        component: () => import('../screens/details/VHS.vue'),
        meta: {
          title: 'VHS Service - Equestrian arena website',
          description:
            'VHS Service by Robbe Saelens: trilingual Next.js 16 site for a riding-arena builder in Geluwe, with GSAP motion, a WebGL hero and local SEO. In rebranding.',
          image: '/vhs-home.jpg',
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
        },
      },
      {
        // Private project status dashboard. Deliberately not linked from the
        // navigation, footer, llms.txt or JSON-LD. It is still prerendered (an
        // empty shell with a real 200 + noindex), but `sitemap: false` keeps it
        // out of sitemap.xml. No robots.txt Disallow on purpose: that would
        // advertise the path and stop crawlers from ever seeing the noindex.
        path: 'status',
        name: 'Status',
        component: () => import('../screens/Status.vue'),
        meta: {
          title: 'Status',
          description: 'Private project status dashboard.',
          noindex: true,
          sitemap: false,
          // No third-party analytics here: the page keeps a session token in sessionStorage,
          // which any script on the page could read. Stripped by scripts/prerender.mjs.
          analytics: false,
        },
      },
    ],
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
  return createRouter({
    history,
    routes,
    scrollBehavior() {
      return { top: 0 }
    },
  })
}
