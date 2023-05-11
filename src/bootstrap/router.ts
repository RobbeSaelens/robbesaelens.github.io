import { createRouter, createWebHistory, Router, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../components/holders/AppHolder.vue'),
    children: [
      {
        path: '/',
        component: () => import('../screens/Index.vue'),
      },

      {
        path: 'contact',
        component: () => import('../screens/Contact.vue'),
      },
      {
        path: 'projects',
        component: () => import('../screens/Projects.vue'),
      },
      {
        path: 'azuredetail',
        name: 'AzureDetail',
        component: () => import('../screens/details/Azure.vue'),
      },
      {
        path: 'vitaldetail',
        name: 'VitalDetail',
        component: () => import('../screens/details/Vital.vue'),
      },
      {
        path: 'binancedetail',
        name: 'BinanceDetail',
        component: () => import('../screens/details/Binance.vue'),
      },
      {
        path: 'bikerentaldetail',
        name: 'BikeRentalDetail',
        component: () => import('../screens/details/BikeRental.vue'),
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'ClientError',
    component: () => import('../screens/generic/ClientError.vue'),
  },
]

const router: Router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
