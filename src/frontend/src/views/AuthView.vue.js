/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../app/stores/authStore';
const authStore = useAuthStore();
const router = useRouter();
const mode = ref('login');
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
async function submit() {
    if (mode.value === 'register') {
        await authStore.registerUser({ firstName: firstName.value, lastName: lastName.value, email: email.value, password: password.value });
    }
    else {
        await authStore.loginUser({ email: email.value, password: password.value });
    }
    if (authStore.isAuthenticated) {
        await router.push({ name: authStore.requiresPasswordChange ? 'settings' : 'dashboard' });
    }
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form']} */ ;
/** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "auth-page" },
});
/** @type {__VLS_StyleScopedClasses['auth-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "auth-card" },
});
/** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
(__VLS_ctx.mode === 'register' ? 'Neues Konto erstellen' : 'Mit E-Mail anmelden');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "auth-switch" },
});
/** @type {__VLS_StyleScopedClasses['auth-switch']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mode = 'login';
            // @ts-ignore
            [mode, mode,];
        } },
    type: "button",
    ...{ class: ({ active: __VLS_ctx.mode === 'login' }) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mode = 'register';
            // @ts-ignore
            [mode, mode,];
        } },
    type: "button",
    ...{ class: ({ active: __VLS_ctx.mode === 'register' }) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.submit) },
    ...{ class: "auth-form" },
});
/** @type {__VLS_StyleScopedClasses['auth-form']} */ ;
if (__VLS_ctx.mode === 'register') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.firstName),
        type: "text",
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.lastName),
        type: "text",
        required: true,
    });
}
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "email",
    required: true,
});
(__VLS_ctx.email);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "password",
    minlength: "8",
    required: true,
});
(__VLS_ctx.password);
if (__VLS_ctx.authStore.authError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.authStore.authError);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: "submit",
    ...{ class: "submit-btn" },
    disabled: (__VLS_ctx.authStore.loading),
});
/** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
(__VLS_ctx.mode === 'register' ? 'Registrieren' : 'Anmelden');
// @ts-ignore
[mode, mode, mode, submit, firstName, lastName, email, password, authStore, authStore, authStore,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
