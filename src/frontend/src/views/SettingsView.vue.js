/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useAuthStore } from '../app/stores/authStore';
import { useFamilyStore } from '../app/stores/familyStore';
const authStore = useAuthStore();
const familyStore = useFamilyStore();
const familyName = ref('');
const passwordError = ref(null);
const addMemberForm = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    isAdmin: false,
});
const editMemberId = ref(null);
const editMemberForm = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    isAdmin: false,
});
const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
});
const selectedFamily = computed(() => familyStore.selectedFamily);
const currentUserId = computed(() => authStore.user?.id ?? null);
const currentMembership = computed(() => selectedFamily.value?.members.find(member => member.userId === currentUserId.value) ?? null);
const isCurrentUserAdmin = computed(() => currentMembership.value?.isAdmin === true);
async function loadFamiliesForCurrentUser() {
    await familyStore.loadFamilies();
    familyName.value = selectedFamily.value?.name ?? '';
}
onMounted(async () => {
    if (authStore.requiresPasswordChange) {
        familyName.value = selectedFamily.value?.name ?? '';
        return;
    }
    await loadFamiliesForCurrentUser();
});
watch(selectedFamily, (family) => {
    familyName.value = family?.name ?? '';
    editMemberId.value = null;
});
async function saveFamily() {
    if (!familyName.value.trim())
        return;
    if (selectedFamily.value) {
        await familyStore.renameFamily(selectedFamily.value.id, familyName.value.trim());
        return;
    }
    await familyStore.createNewFamily(familyName.value.trim());
}
async function addMember() {
    if (!selectedFamily.value)
        return;
    await familyStore.addMember(selectedFamily.value.id, {
        firstName: addMemberForm.firstName.trim(),
        lastName: addMemberForm.lastName.trim(),
        email: addMemberForm.email.trim(),
        phoneNumber: addMemberForm.phoneNumber.trim() || null,
        isAdmin: addMemberForm.isAdmin,
    });
    if (!familyStore.error) {
        addMemberForm.firstName = '';
        addMemberForm.lastName = '';
        addMemberForm.email = '';
        addMemberForm.phoneNumber = '';
        addMemberForm.isAdmin = false;
    }
}
function beginEditMember(member) {
    editMemberId.value = member.id;
    editMemberForm.firstName = member.firstName;
    editMemberForm.lastName = member.lastName;
    editMemberForm.email = member.email;
    editMemberForm.phoneNumber = member.phoneNumber ?? '';
    editMemberForm.isAdmin = member.isAdmin;
}
function cancelEditMember() {
    editMemberId.value = null;
}
async function saveMember(memberId) {
    if (!selectedFamily.value)
        return;
    await familyStore.editMember(selectedFamily.value.id, memberId, {
        firstName: editMemberForm.firstName.trim(),
        lastName: editMemberForm.lastName.trim(),
        email: editMemberForm.email.trim(),
        phoneNumber: editMemberForm.phoneNumber.trim() || null,
        isAdmin: editMemberForm.isAdmin,
    });
    if (!familyStore.error) {
        editMemberId.value = null;
    }
}
async function changePassword() {
    passwordError.value = null;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        passwordError.value = 'Die neuen Passwoerter stimmen nicht ueberein.';
        return;
    }
    await authStore.changeUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (authStore.authError) {
        passwordError.value = authStore.authError;
        return;
    }
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    await loadFamiliesForCurrentUser();
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "view" },
});
/** @type {__VLS_StyleScopedClasses['view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "view-header" },
});
/** @type {__VLS_StyleScopedClasses['view-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
if (__VLS_ctx.authStore.requiresPasswordChange) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.changePassword) },
        ...{ class: "form" },
    });
    /** @type {__VLS_StyleScopedClasses['form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "password",
        placeholder: "Aktuelles Passwort",
        required: true,
        minlength: "8",
    });
    (__VLS_ctx.passwordForm.currentPassword);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "password",
        placeholder: "Neues Passwort",
        required: true,
        minlength: "8",
    });
    (__VLS_ctx.passwordForm.newPassword);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "password",
        placeholder: "Neues Passwort bestaetigen",
        required: true,
        minlength: "8",
    });
    (__VLS_ctx.passwordForm.confirmPassword);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.authStore.loading),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    if (__VLS_ctx.passwordError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "error" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['error']} */ ;
        (__VLS_ctx.passwordError);
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.saveFamily) },
    ...{ class: "form" },
});
/** @type {__VLS_StyleScopedClasses['form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.familyName),
    type: "text",
    placeholder: "Name der Familie",
    required: true,
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: "submit",
    ...{ class: "btn-primary" },
    disabled: (__VLS_ctx.familyStore.loading),
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
(__VLS_ctx.selectedFamily ? 'Familienname speichern' : 'Familie erstellen');
if (__VLS_ctx.familyStore.families.length > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
    for (const [family] of __VLS_vFor((__VLS_ctx.familyStore.families))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.familyStore.families.length > 1))
                        return;
                    __VLS_ctx.familyStore.selectFamily(family.id);
                    // @ts-ignore
                    [authStore, authStore, changePassword, passwordForm, passwordForm, passwordForm, passwordError, passwordError, saveFamily, familyName, familyStore, familyStore, familyStore, familyStore, selectedFamily,];
                } },
            key: (family.id),
            type: "button",
            ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.familyStore.selectedFamilyId === family.id }]) },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
        /** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
        (family.name);
        // @ts-ignore
        [familyStore,];
    }
}
if (__VLS_ctx.selectedFamily) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-container" },
    });
    /** @type {__VLS_StyleScopedClasses['table-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "table" },
    });
    /** @type {__VLS_StyleScopedClasses['table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    if (__VLS_ctx.isCurrentUserAdmin) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [member] of __VLS_vFor((__VLS_ctx.selectedFamily.members))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (member.id),
        });
        if (__VLS_ctx.editMemberId === member.id) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                value: (__VLS_ctx.editMemberForm.firstName),
                type: "text",
                required: true,
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                value: (__VLS_ctx.editMemberForm.lastName),
                type: "text",
                required: true,
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "email",
                required: true,
            });
            (__VLS_ctx.editMemberForm.email);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "tel",
            });
            (__VLS_ctx.editMemberForm.phoneNumber);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "checkbox",
            });
            (__VLS_ctx.editMemberForm.isAdmin);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.selectedFamily))
                            return;
                        if (!(__VLS_ctx.editMemberId === member.id))
                            return;
                        __VLS_ctx.saveMember(member.id);
                        // @ts-ignore
                        [selectedFamily, selectedFamily, isCurrentUserAdmin, editMemberId, editMemberForm, editMemberForm, editMemberForm, editMemberForm, editMemberForm, saveMember,];
                    } },
                type: "button",
                ...{ class: "filter-select" },
            });
            /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.cancelEditMember) },
                type: "button",
                ...{ class: "filter-select" },
            });
            /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (member.firstName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (member.lastName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (member.email);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (member.phoneNumber || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (member.isAdmin ? 'Admin' : 'Mitglied');
            if (__VLS_ctx.isCurrentUserAdmin) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.selectedFamily))
                                return;
                            if (!!(__VLS_ctx.editMemberId === member.id))
                                return;
                            if (!(__VLS_ctx.isCurrentUserAdmin))
                                return;
                            __VLS_ctx.beginEditMember(member);
                            // @ts-ignore
                            [isCurrentUserAdmin, cancelEditMember, beginEditMember,];
                        } },
                    type: "button",
                    ...{ class: "filter-select" },
                });
                /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
            }
        }
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.selectedFamily.members.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: (__VLS_ctx.isCurrentUserAdmin ? 6 : 5),
            ...{ class: "table-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['table-empty']} */ ;
    }
    if (__VLS_ctx.isCurrentUserAdmin) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (__VLS_ctx.addMember) },
            ...{ class: "form" },
        });
        /** @type {__VLS_StyleScopedClasses['form']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_ctx.addMemberForm.firstName),
            type: "text",
            placeholder: "Vorname",
            required: true,
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_ctx.addMemberForm.lastName),
            type: "text",
            placeholder: "Nachname",
            required: true,
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "email",
            placeholder: "E-Mail-Adresse",
            required: true,
        });
        (__VLS_ctx.addMemberForm.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "tel",
            placeholder: "Telefonnummer (optional)",
        });
        (__VLS_ctx.addMemberForm.phoneNumber);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (__VLS_ctx.addMemberForm.isAdmin);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "submit",
            ...{ class: "btn-primary" },
            disabled: (__VLS_ctx.familyStore.loading),
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "table-empty" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['table-empty']} */ ;
    }
}
if (__VLS_ctx.familyStore.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.familyStore.error);
}
// @ts-ignore
[familyStore, familyStore, familyStore, selectedFamily, isCurrentUserAdmin, isCurrentUserAdmin, addMember, addMemberForm, addMemberForm, addMemberForm, addMemberForm, addMemberForm,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
