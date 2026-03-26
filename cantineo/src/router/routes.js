const routes = [
  {
    path: '/',
    component: () => import('layouts/EmptyLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') }
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'employes', component: () => import('pages/EmployesPage.vue') },
      { path: 'paiements', component: () => import('pages/PaiementsPage.vue') },
      { path: 'repas', component: () => import('pages/RepasPage.vue') },
      { path: 'admin', component: () => import('pages/AdminPage.vue') }
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
