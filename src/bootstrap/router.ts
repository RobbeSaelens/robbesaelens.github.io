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
            'Projects by Robbe Saelens: Exulta, a stretch tent rental website; Stal Manager, a horse stable finance dashboard; and Scan2Talk, a student wellbeing PWA.',
          image: '/ExultaTeaser.png',
        },
      },
      {
        path: 'exultadetail',
        name: 'ExultaDetail',
        component: () => import('../screens/details/Exulta.vue'),
        meta: {
          title: 'Exulta - Stretch tent rental website',
          description:
            'Stretch tent rental site by Robbe Saelens: product catalog, Filament admin panel, Leaflet maps, Playwright E2E tests. Laravel, React, Inertia.js.',
          image: '/ExultaTeaser.png',
        },
      },
      {
        path: 'stalmanagerdetail',
        name: 'StalManagerDetail',
        component: () => import('../screens/details/StalManager.vue'),
        meta: {
          title: 'Stal Manager - Stable finance dashboard',
          description:
            'Horse stable finance dashboard by Robbe Saelens: per-horse income, expenses and interactive reports. Next.js App Router, TypeScript, Prisma, Auth0.',
          image: '/stalDashboard.png',
        },
      },
      {
        path: 'scan2talkdetail',
        name: 'Scan2TalkDetail',
        component: () => import('../screens/details/Scan2Talk.vue'),
        meta: {
          title: 'Scan2Talk - Student wellbeing check-in PWA',
          description:
            'PWA by Robbe Saelens where students check in on their wellbeing via QR codes, plus a staff dashboard of class trends. Laravel, Vue.js, Inertia.js.',
          image: '/Fav.png',
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
