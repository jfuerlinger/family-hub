import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
const STORAGE_KEY = 'familyhub-theme';
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function getStoredThemeMode(value) {
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}
function applyTheme(mode) {
    const resolved = mode === 'system' ? getSystemTheme() : mode;
    document.documentElement.setAttribute('data-theme', resolved);
}
export const useThemeStore = defineStore('theme', () => {
    const theme = ref(getStoredThemeMode(localStorage.getItem(STORAGE_KEY)));
    applyTheme(theme.value);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
        if (theme.value === 'system')
            applyTheme('system');
    });
    watch(theme, (newMode) => {
        localStorage.setItem(STORAGE_KEY, newMode);
        applyTheme(newMode);
    });
    function setTheme(mode) {
        theme.value = mode;
    }
    return { theme, setTheme };
});
