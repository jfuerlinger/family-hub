import { createRouter, createWebHistory } from 'vue-router';
import { getStoredAuthenticatedUser, hasValidAccessToken } from '../auth/tokenStorage';
const routes = [
    { path: '/', redirect: '/auth' },
    {
        path: '/auth',
        name: 'auth',
        component: () => import('../../views/AuthView.vue'),
        meta: { requiresAuth: false },
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('../../views/DashboardView.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('../../views/SettingsView.vue'),
        meta: { requiresAuth: true },
    },
    { path: '/family', redirect: '/settings' },
    {
        path: '/todos',
        name: 'todos',
        component: () => import('../../views/TodosView.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/calendar',
        name: 'calendar',
        component: () => import('../../views/CalendarView.vue'),
        meta: { requiresAuth: true },
    },
];
export const router = createRouter({
    history: createWebHistory(),
    routes,
});
router.beforeEach((to) => {
    const authenticated = hasValidAccessToken();
    const requiresAuth = to.meta.requiresAuth === true;
    const storedUser = getStoredAuthenticatedUser();
    const passwordChangeRequired = storedUser?.requiresPasswordChange === true;
    if (requiresAuth && !authenticated)
        return { name: 'auth' };
    if (to.name === 'auth' && authenticated)
        return passwordChangeRequired ? { name: 'settings' } : { name: 'dashboard' };
    if (passwordChangeRequired && to.name !== 'settings')
        return { name: 'settings' };
    return true;
});
const dynamicImportFetchError = 'Failed to fetch dynamically imported module';
const dynamicImportReloadKey = 'familyhub:dynamic-import-reloads';
const fallbackRetriedPaths = new Set();
router.onError((err, to) => {
    if (!import.meta.env.DEV)
        return;
    if (err instanceof TypeError && err.message.includes(dynamicImportFetchError)) {
        let retriedPaths = fallbackRetriedPaths;
        try {
            const storedRetriedPaths = new Set();
            const storedPaths = JSON.parse(window.sessionStorage.getItem(dynamicImportReloadKey) ?? '[]');
            if (Array.isArray(storedPaths)) {
                storedPaths.forEach((path) => { if (typeof path === 'string')
                    storedRetriedPaths.add(path); });
            }
            retriedPaths = storedRetriedPaths;
        }
        catch {
            console.warn('[router] sessionStorage unavailable. Proceeding without loop protection.');
        }
        if (retriedPaths.has(to.fullPath)) {
            console.warn(`[router] Dynamic import failed again for "${to.fullPath}". Skipping reload.`);
            return;
        }
        retriedPaths.add(to.fullPath);
        try {
            window.sessionStorage.setItem(dynamicImportReloadKey, JSON.stringify([...retriedPaths]));
        }
        catch {
            fallbackRetriedPaths.add(to.fullPath);
        }
        window.location.href = to.fullPath;
    }
});
