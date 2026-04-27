import type { App } from 'vue';
import type { Pinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { useAuthStore } from '@/store/auth';

const LoginPage = () => import('@/pages/login/LoginPage.vue');
const DashboardPage = () => import('@/pages/dashboard/DashboardPage.vue');
const AccountsPage = () => import('@/pages/accounts/AccountsPage.vue');

export function createAppRouter(pinia: Pinia) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/login',
        component: AuthLayout,
        meta: { guestOnly: true },
        children: [
          {
            path: '',
            name: 'login',
            component: LoginPage,
          },
        ],
      },
      {
        path: '/',
        component: AppLayout,
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            redirect: '/dashboard',
          },
          {
            path: 'dashboard',
            name: 'dashboard',
            component: DashboardPage,
          },
          {
            path: 'cvm',
            redirect: '/dashboard',
          },
          {
            path: 'database',
            redirect: '/dashboard',
          },
          {
            path: 'accounts',
            name: 'accounts',
            component: AccountsPage,
          },
        ],
      },
    ],
  });

  router.beforeEach((to) => {
    const authStore = useAuthStore(pinia);

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return '/login';
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return '/dashboard';
    }

    return true;
  });

  return router;
}

export function installRouter(app: App, pinia: Pinia) {
  app.use(createAppRouter(pinia));
}
