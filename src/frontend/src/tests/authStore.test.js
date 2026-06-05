import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../app/stores/authStore';
import * as authApi from '../app/api/authApi';
describe('authStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.restoreAllMocks();
        window.localStorage.clear();
        window.sessionStorage.clear();
    });
    it('logs in and persists token', async () => {
        vi.spyOn(authApi, 'login').mockResolvedValue({
            accessToken: 'jwt-token',
            expiresAtUtc: '2099-05-28T12:00:00Z',
            user: { id: 'user-1', firstName: 'Max', lastName: 'Muster', email: 'max@example.com', requiresPasswordChange: false },
        });
        const store = useAuthStore();
        await store.loginUser({ email: 'max@example.com', password: 'Secure123!' });
        expect(store.isAuthenticated).toBe(true);
        expect(window.sessionStorage.getItem('familyhub:auth:accessToken')).toBe('jwt-token');
    });
    it('clears session on logout', async () => {
        vi.spyOn(authApi, 'register').mockResolvedValue({
            accessToken: 'jwt-token',
            expiresAtUtc: '2099-05-28T12:00:00Z',
            user: { id: 'user-1', firstName: 'Max', lastName: 'Muster', email: 'max@example.com', requiresPasswordChange: false },
        });
        const store = useAuthStore();
        await store.registerUser({ firstName: 'Max', lastName: 'Muster', email: 'max@example.com', password: 'Secure123!' });
        store.logout();
        expect(store.isAuthenticated).toBe(false);
        expect(window.sessionStorage.getItem('familyhub:auth:accessToken')).toBeNull();
    });
    it('sets authError on failed login', async () => {
        vi.spyOn(authApi, 'login').mockRejectedValue(new Error('network error'));
        const store = useAuthStore();
        await store.loginUser({ email: 'bad@example.com', password: 'wrong' });
        expect(store.isAuthenticated).toBe(false);
        expect(store.authError).toBe('network error');
    });
    it('shows validation messages for failed registration', async () => {
        vi.spyOn(authApi, 'register').mockRejectedValue(createAxiosError({
            title: 'One or more validation errors occurred.',
            errors: {
                email: ['E-Mail ist erforderlich.'],
                password: ['Passwort ist erforderlich.'],
            },
        }));
        const store = useAuthStore();
        await store.registerUser({ firstName: 'Max', lastName: 'Muster', email: '', password: '' });
        expect(store.authError).toBe('E-Mail ist erforderlich. Passwort ist erforderlich.');
    });
    it('shows an API unavailable message when registration cannot reach the backend', async () => {
        vi.spyOn(authApi, 'register').mockRejectedValue(createAxiosError(undefined, AxiosError.ERR_NETWORK));
        const store = useAuthStore();
        await store.registerUser({ firstName: 'Max', lastName: 'Muster', email: 'max@example.com', password: 'Secure123!' });
        expect(store.authError).toBe('Die API ist aktuell nicht erreichbar. Bitte pruefe, ob Backend und Datenbank laufen.');
    });
    it('changes password and clears password-change requirement', async () => {
        vi.spyOn(authApi, 'login').mockResolvedValue({
            accessToken: 'temporary-token',
            expiresAtUtc: '2099-05-28T12:00:00Z',
            user: { id: 'user-1', firstName: 'Max', lastName: 'Muster', email: 'max@example.com', requiresPasswordChange: true },
        });
        vi.spyOn(authApi, 'changePassword').mockResolvedValue({
            accessToken: 'final-token',
            expiresAtUtc: '2099-05-28T13:00:00Z',
            user: { id: 'user-1', firstName: 'Max', lastName: 'Muster', email: 'max@example.com', requiresPasswordChange: false },
        });
        const store = useAuthStore();
        await store.loginUser({ email: 'max@example.com', password: 'Temp1234!' });
        await store.changeUserPassword('Temp1234!', 'Secure1234!');
        expect(store.requiresPasswordChange).toBe(false);
        expect(window.sessionStorage.getItem('familyhub:auth:accessToken')).toBe('final-token');
    });
    it('keeps legacy stored users logged in and defaults password-change requirement to false', () => {
        window.sessionStorage.setItem('familyhub:auth:accessToken', 'legacy-token');
        window.sessionStorage.setItem('familyhub:auth:accessTokenExpiry', '2099-05-28T12:00:00Z');
        window.localStorage.setItem('familyhub:auth:user', JSON.stringify({
            id: 'legacy-user',
            firstName: 'Legacy',
            lastName: 'User',
            email: 'legacy@example.com',
        }));
        const store = useAuthStore();
        expect(store.isAuthenticated).toBe(true);
        expect(store.user?.email).toBe('legacy@example.com');
        expect(store.requiresPasswordChange).toBe(false);
    });
});
function createAxiosError(data, code) {
    return new AxiosError('Request failed', code, undefined, undefined, data === undefined
        ? undefined
        : {
            data,
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config: { headers: {} },
        });
}
