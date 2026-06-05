/// <reference types="../../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../app/stores/authStore';
const mainNav = [
    { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { to: '/todos', label: 'Aufgaben', icon: 'check' },
    { to: '/calendar', label: 'Kalender', icon: 'calendar' },
];
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isMobileMenuOpen = ref(false);
const mobileNavigationId = 'primary-navigation';
const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
const closeMobileMenu = () => { isMobileMenuOpen.value = false; };
const handleGlobalKeydown = (event) => {
    if (event.key === 'Escape' && isMobileMenuOpen.value)
        closeMobileMenu();
};
onMounted(() => { window.addEventListener('keydown', handleGlobalKeydown); });
onBeforeUnmount(() => { window.removeEventListener('keydown', handleGlobalKeydown); });
watch(() => route.fullPath, () => { closeMobileMenu(); });
const displayName = computed(() => {
    if (!authStore.user)
        return 'Mein Profil';
    return `${authStore.user.firstName} ${authStore.user.lastName}`.trim();
});
const userInitials = computed(() => {
    if (!authStore.user)
        return '?';
    return `${authStore.user.firstName[0] ?? ''}${authStore.user.lastName[0] ?? ''}`.toUpperCase();
});
function logout() {
    authStore.logout();
    closeMobileMenu();
    void router.push({ name: 'auth' });
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "app-shell" },
    ...{ class: ({ 'app-shell--menu-open': __VLS_ctx.isMobileMenuOpen }) },
});
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['app-shell--menu-open']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.closeMobileMenu) },
    type: "button",
    ...{ class: "mobile-nav-backdrop" },
    ...{ class: ({ 'mobile-nav-backdrop--visible': __VLS_ctx.isMobileMenuOpen }) },
    'aria-label': "Menü schließen",
});
/** @type {__VLS_StyleScopedClasses['mobile-nav-backdrop']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-backdrop--visible']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "sidebar" },
    ...{ class: ({ 'sidebar--open': __VLS_ctx.isMobileMenuOpen }) },
    id: (__VLS_ctx.mobileNavigationId),
});
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar--open']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-brand" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-brand']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-brand-icon" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-brand-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-brand-text" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-brand-text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-section-label" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-section-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "nav" },
});
/** @type {__VLS_StyleScopedClasses['nav']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.mainNav))) {
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        key: (item.to),
        to: (item.to),
        ...{ class: "nav-link" },
        activeClass: "nav-link-active",
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        key: (item.to),
        to: (item.to),
        ...{ class: "nav-link" },
        activeClass: "nav-link-active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ click: {} },
        { onClick: (__VLS_ctx.closeMobileMenu) });
    /** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
    const { default: __VLS_7 } = __VLS_3.slots;
    if (item.icon === 'grid') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
            x: "3",
            y: "3",
            width: "7",
            height: "7",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
            x: "14",
            y: "3",
            width: "7",
            height: "7",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
            x: "14",
            y: "14",
            width: "7",
            height: "7",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
            x: "3",
            y: "14",
            width: "7",
            height: "7",
        });
    }
    else if (item.icon === 'check') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
            points: "9 11 12 14 22 4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
        });
    }
    else if (item.icon === 'calendar') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
            x: "3",
            y: "4",
            width: "18",
            height: "18",
            rx: "2",
            ry: "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "16",
            y1: "2",
            x2: "16",
            y2: "6",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "8",
            y1: "2",
            x2: "8",
            y2: "6",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
            x1: "3",
            y1: "10",
            x2: "21",
            y2: "10",
        });
    }
    (item.label);
    // @ts-ignore
    [isMobileMenuOpen, isMobileMenuOpen, isMobileMenuOpen, closeMobileMenu, closeMobileMenu, mobileNavigationId, mainNav,];
    var __VLS_3;
    var __VLS_4;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: "sidebar-spacer" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-spacer']} */ ;
let __VLS_8;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    to: "/settings",
    ...{ class: "sidebar-user" },
    activeClass: "sidebar-user--active",
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    to: "/settings",
    ...{ class: "sidebar-user" },
    activeClass: "sidebar-user--active",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_13;
const __VLS_14 = ({ click: {} },
    { onClick: (__VLS_ctx.closeMobileMenu) });
/** @type {__VLS_StyleScopedClasses['sidebar-user']} */ ;
const { default: __VLS_15 } = __VLS_11.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-user-avatar" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-user-avatar']} */ ;
(__VLS_ctx.userInitials);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-user-info" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-user-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-user-name" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-user-name']} */ ;
(__VLS_ctx.displayName);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-user-plan" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-user-plan']} */ ;
// @ts-ignore
[closeMobileMenu, userInitials, displayName,];
var __VLS_11;
var __VLS_12;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.logout) },
    ...{ class: "sidebar-promo-btn" },
    type: "button",
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['sidebar-promo-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "content" },
});
/** @type {__VLS_StyleScopedClasses['content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "mobile-topbar" },
});
/** @type {__VLS_StyleScopedClasses['mobile-topbar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggleMobileMenu) },
    type: "button",
    ...{ class: "mobile-menu-btn" },
    'aria-expanded': (__VLS_ctx.isMobileMenuOpen),
    'aria-controls': (__VLS_ctx.mobileNavigationId),
    'aria-label': (__VLS_ctx.isMobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'),
});
/** @type {__VLS_StyleScopedClasses['mobile-menu-btn']} */ ;
if (!__VLS_ctx.isMobileMenuOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "3",
        y1: "6",
        x2: "21",
        y2: "6",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "3",
        y1: "12",
        x2: "21",
        y2: "12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "3",
        y1: "18",
        x2: "21",
        y2: "18",
    });
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "18",
        y1: "6",
        x2: "6",
        y2: "18",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "6",
        y1: "6",
        x2: "18",
        y2: "18",
    });
}
let __VLS_16;
/** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    ...{ class: "mobile-topbar-brand" },
    to: "/dashboard",
}));
const __VLS_18 = __VLS_17({
    ...{ class: "mobile-topbar-brand" },
    to: "/dashboard",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
/** @type {__VLS_StyleScopedClasses['mobile-topbar-brand']} */ ;
const { default: __VLS_21 } = __VLS_19.slots;
// @ts-ignore
[isMobileMenuOpen, isMobileMenuOpen, isMobileMenuOpen, mobileNavigationId, logout, toggleMobileMenu,];
var __VLS_19;
var __VLS_22 = {};
// @ts-ignore
var __VLS_23 = __VLS_22;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({});
const __VLS_export = {};
export default {};
