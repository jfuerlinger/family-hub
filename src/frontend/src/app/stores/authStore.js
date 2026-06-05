import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { AxiosError } from 'axios';
import { changePassword, login, register } from '../api/authApi';
import { clearAccessToken, clearAccessTokenExpiry, clearStoredAuthenticatedUser, getAccessToken, getAccessTokenExpiry, getStoredAuthenticatedUser, hasValidAccessToken, setAccessToken, setAccessTokenExpiry, setStoredAuthenticatedUser, } from '../auth/tokenStorage';
export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref(getAccessToken());
    const expiresAtUtc = ref(getAccessTokenExpiry());
    const user = ref(getStoredAuthenticatedUser());
    const authError = ref(null);
    const loading = ref(false);
    if (!hasValidAccessToken()) {
        accessToken.value = null;
        expiresAtUtc.value = null;
        user.value = null;
        clearStoredAuthenticatedUser();
    }
    const isAuthenticated = computed(() => !!accessToken.value && !!expiresAtUtc.value && expiresAtUtc.value.getTime() > Date.now());
    const requiresPasswordChange = computed(() => !!user.value?.requiresPasswordChange);
    async function registerUser(request) {
        loading.value = true;
        authError.value = null;
        try {
            const response = await register(request);
            setSession(response.accessToken, response.expiresAtUtc, response.user);
        }
        catch (error) {
            authError.value = toErrorMessage(error, 'Registrierung fehlgeschlagen.');
        }
        finally {
            loading.value = false;
        }
    }
    async function loginUser(request) {
        loading.value = true;
        authError.value = null;
        try {
            const response = await login(request);
            setSession(response.accessToken, response.expiresAtUtc, response.user);
        }
        catch (error) {
            authError.value = toErrorMessage(error, 'Anmeldung fehlgeschlagen.');
        }
        finally {
            loading.value = false;
        }
    }
    async function changeUserPassword(currentPassword, newPassword) {
        loading.value = true;
        authError.value = null;
        try {
            const response = await changePassword({ currentPassword, newPassword });
            setSession(response.accessToken, response.expiresAtUtc, response.user);
        }
        catch (error) {
            authError.value = toErrorMessage(error, 'Passwort konnte nicht geaendert werden.');
        }
        finally {
            loading.value = false;
        }
    }
    function logout() {
        accessToken.value = null;
        expiresAtUtc.value = null;
        user.value = null;
        authError.value = null;
        clearAccessToken();
        clearAccessTokenExpiry();
        clearStoredAuthenticatedUser();
    }
    function setSession(token, expiresAt, authenticatedUser) {
        const parsedExpiresAt = new Date(expiresAt);
        if (Number.isNaN(parsedExpiresAt.getTime())) {
            authError.value = 'Ungültiges Ablaufdatum im Login-Token.';
            logout();
            return;
        }
        accessToken.value = token;
        expiresAtUtc.value = parsedExpiresAt;
        user.value = authenticatedUser;
        setAccessToken(token);
        setAccessTokenExpiry(parsedExpiresAt.toISOString());
        setStoredAuthenticatedUser(authenticatedUser);
    }
    return {
        accessToken,
        user,
        authError,
        loading,
        isAuthenticated,
        requiresPasswordChange,
        registerUser,
        loginUser,
        changeUserPassword,
        logout,
    };
});
function toErrorMessage(error, fallback) {
    if (error instanceof AxiosError) {
        const responseData = error.response?.data;
        if (typeof responseData === 'string' && responseData.trim().length > 0) {
            return responseData.trim();
        }
        const detail = responseData?.detail;
        if (typeof detail === 'string' && detail.length > 0)
            return detail;
        const validationMessages = getValidationMessages(responseData?.errors);
        if (validationMessages.length > 0)
            return validationMessages.join(' ');
        const title = responseData?.title;
        if (typeof title === 'string' && title.length > 0)
            return title;
        if (error.code === AxiosError.ERR_NETWORK || !error.response) {
            return 'Die API ist aktuell nicht erreichbar. Bitte pruefe, ob Backend und Datenbank laufen.';
        }
        if (typeof error.message === 'string' && error.message.length > 0) {
            return error.message;
        }
    }
    if (error instanceof Error && error.message.length > 0) {
        return error.message;
    }
    return fallback;
}
function getValidationMessages(errors) {
    if (!errors || typeof errors !== 'object')
        return [];
    return Object.values(errors)
        .flatMap((value) => {
        if (Array.isArray(value)) {
            return value.filter((message) => typeof message === 'string' && message.length > 0);
        }
        return [];
    });
}
