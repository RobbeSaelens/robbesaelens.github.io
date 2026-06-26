import { createRouter, createWebHistory, Router, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../components/holders/AppHolder.vue'),
    children: [
      {
        path: '/',
        name: 'Home',
        component: () => import('../screens/Index.vue'),
        meta: {
          title: 'Robbe Saelens - Full-Stack Web Developer',
          description:
            'Full-stack web developer portfolio showcasing projects in Vue, TypeScript, React, and modern web technologies.',
        },
      },
      {
        path: 'contact',
        name: 'Contact',
        component: () => import('../screens/Contact.vue'),
        meta: {
          title: 'About Me | Robbe Saelens',
          description:
            'Learn about Robbe Saelens: education, work experience, and background in full-stack web development.',
        },
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('../screens/Projects.vue'),
        meta: {
          title: 'Projects | Robbe Saelens',
          description:
            'Browse projects by Robbe Saelens including Azure search, Vital Cities, Binance clone, and BikeRental app.',
        },
      },
      {
        path: 'azuredetail',
        name: 'AzureDetail',
        component: () => import('../screens/details/Azure.vue'),
        meta: {
          title: 'Azure Search Project | Robbe Saelens',
          description:
            'A Netflix-style search application built with Azure Cognitive Search, Vue.js, and modern web technologies.',
        },
      },
      {
        path: 'vitaldetail',
        name: 'VitalDetail',
        component: () => import('../screens/details/Vital.vue'),
        meta: {
          title: 'Vital Cities Project | Robbe Saelens',
          description:
            'A city vitality dashboard built with React and data visualization for urban planning insights.',
        },
      },
      {
        path: 'binancedetail',
        name: 'BinanceDetail',
        component: () => import('../screens/details/Binance.vue'),
        meta: {
          title: 'Binance Clone Project | Robbe Saelens',
          description:
            'A Binance cryptocurrency exchange clone built with React, featuring real-time market data and trading UI.',
        },
      },
      {
        path: 'bikerentaldetail',
        name: 'BikeRentalDetail',
        component: () => import('../screens/details/BikeRental.vue'),
        meta: {
          title: 'BikeRental Project | Robbe Saelens',
          description:
            'A bike rental management application built with Vue.js, featuring booking, inventory, and customer management.',
        },
      },
      {
        path: 'exultadetail',
        name: 'ExultaDetail',
        component: () => import('../screens/details/Exulta.vue'),
        meta: {
          title: 'Exulta Project | Robbe Saelens',
          description:
            'A modern stretch tent rental website with product catalog, built with Laravel, React, and Inertia.js.',
        },
      },
      {
        path: 'stalmanagerdetail',
        name: 'StalManagerDetail',
        component: () => import('../screens/details/StalManager.vue'),
        meta: {
          title: 'Stal Manager Project | Robbe Saelens',
          description:
            'A horse stable financial management dashboard built with Next.js, TypeScript, and Prisma.',
        },
      },
      {
        path: 'scan2talkdetail',
        name: 'Scan2TalkDetail',
        component: () => import('../screens/details/Scan2Talk.vue'),
        meta: {
          title: 'Scan2Talk Project | Robbe Saelens',
          description:
            'A QR-code based student emotional wellbeing check-in system built with Laravel and Vue.js.',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'ClientError',
    component: () => import('../screens/generic/ClientError.vue'),
    meta: {
      title: 'Page Not Found | Robbe Saelens',
      description: 'The page you are looking for does not exist.',
      errorCode: '404',
    },
  },
]

const router: Router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
