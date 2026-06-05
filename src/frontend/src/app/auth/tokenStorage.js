const accessTokenKey = 'familyhub:auth:accessToken';
const accessTokenExpiryKey = 'familyhub:auth:accessTokenExpiry';
const authenticatedUserKey = 'familyhub:auth:user';
export function getAccessToken() {
    return hasValidAccessToken() ? window.sessionStorage.getItem(accessTokenKey) : null;
}
export function setAccessToken(token) {
    window.sessionStorage.setItem(accessTokenKey, token);
}
export function clearAccessToken() {
    window.sessionStorage.removeItem(accessTokenKey);
}
export function getAccessTokenExpiry() {
    const value = window.sessionStorage.getItem(accessTokenExpiryKey);
    if (!value)
        return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
export function setAccessTokenExpiry(expiresAtUtc) {
    window.sessionStorage.setItem(accessTokenExpiryKey, expiresAtUtc);
}
export function clearAccessTokenExpiry() {
    window.sessionStorage.removeItem(accessTokenExpiryKey);
}
export function hasValidAccessToken() {
    const token = window.sessionStorage.getItem(accessTokenKey);
    const expiresAt = getAccessTokenExpiry();
    if (!token || !expiresAt) {
        clearAccessToken();
        clearAccessTokenExpiry();
        return false;
    }
    if (expiresAt.getTime() <= Date.now()) {
        clearAccessToken();
        clearAccessTokenExpiry();
        return false;
    }
    return true;
}
export function getStoredAuthenticatedUser() {
    const storedValue = window.localStorage.getItem(authenticatedUserKey);
    if (!storedValue)
        return null;
    try {
        const parsed = JSON.parse(storedValue);
        if (typeof parsed?.id === 'string' &&
            typeof parsed?.firstName === 'string' &&
            typeof parsed?.lastName === 'string' &&
            typeof parsed?.email === 'string') {
            return {
                id: parsed.id,
                firstName: parsed.firstName,
                lastName: parsed.lastName,
                email: parsed.email,
                requiresPasswordChange: typeof parsed?.requiresPasswordChange === 'boolean'
                    ? parsed.requiresPasswordChange
                    : false,
            };
        }
    }
    catch {
        return null;
    }
    return null;
}
export function setStoredAuthenticatedUser(user) {
    window.localStorage.setItem(authenticatedUserKey, JSON.stringify(user));
}
export function clearStoredAuthenticatedUser() {
    window.localStorage.removeItem(authenticatedUserKey);
}
