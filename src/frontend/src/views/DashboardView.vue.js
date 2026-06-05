/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted } from 'vue';
import { useFamilyStore } from '../app/stores/familyStore';
import { useTodoStore } from '../app/stores/todoStore';
import { useAuthStore } from '../app/stores/authStore';
const authStore = useAuthStore();
const familyStore = useFamilyStore();
const todoStore = useTodoStore();
onMounted(async () => {
    await familyStore.loadFamilies();
    const fam = familyStore.selectedFamily;
    if (fam)
        await todoStore.loadTodos(fam.id);
});
const family = computed(() => familyStore.selectedFamily);
const pendingTodos = computed(() => todoStore.todos.filter(t => !t.isDone));
const doneTodos = computed(() => todoStore.todos.filter(t => t.isDone));
const displayName = computed(() => authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}`.trim() : '');
async function toggle(todoId, isDone) {
    const fam = family.value;
    if (!fam)
        return;
    await todoStore.toggleDone(fam.id, todoId, isDone);
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
(__VLS_ctx.displayName);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-grid" },
});
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card-header" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card-icon" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "9",
    cy: "7",
    r: "4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M23 21v-2a4 4 0 0 0-3-3.87",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M16 3.13a4 4 0 0 1 0 7.75",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-card-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-value']} */ ;
(__VLS_ctx.family?.name ?? '—');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "summary-card-sub" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-sub']} */ ;
(__VLS_ctx.family?.members.length ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card-header" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card-icon" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
    points: "9 11 12 14 22 4",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-card-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-value']} */ ;
(__VLS_ctx.pendingTodos.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "summary-card-sub" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-sub']} */ ;
(__VLS_ctx.doneTodos.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card" },
});
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card-header" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card-icon" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
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
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "summary-card-label" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-card-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-value']} */ ;
(__VLS_ctx.family?.members.length ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "summary-card-sub" },
});
/** @type {__VLS_StyleScopedClasses['summary-card-sub']} */ ;
(__VLS_ctx.familyStore.families.length);
if (__VLS_ctx.pendingTodos.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "upcoming-list" },
    });
    /** @type {__VLS_StyleScopedClasses['upcoming-list']} */ ;
    for (const [todo] of __VLS_vFor((__VLS_ctx.pendingTodos.slice(0, 5)))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (todo.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "todo-status-control" },
        });
        /** @type {__VLS_StyleScopedClasses['todo-status-control']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (...[$event]) => {
                    if (!(__VLS_ctx.pendingTodos.length > 0))
                        return;
                    __VLS_ctx.toggle(todo.id, todo.isDone);
                    // @ts-ignore
                    [displayName, family, family, family, pendingTodos, pendingTodos, pendingTodos, doneTodos, familyStore, toggle,];
                } },
            type: "checkbox",
            ...{ class: "todo-checkbox" },
            checked: (todo.isDone),
            'aria-label': (`Aufgabe ${todo.title} als erledigt markieren`),
        });
        /** @type {__VLS_StyleScopedClasses['todo-checkbox']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (todo.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "muted" },
        });
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
        (todo.dueDateUtc ? new Date(todo.dueDateUtc).toLocaleDateString('de-AT') : '');
        // @ts-ignore
        [];
    }
}
if (!__VLS_ctx.family) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        to: "/settings",
    }));
    const __VLS_2 = __VLS_1({
        to: "/settings",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    // @ts-ignore
    [family,];
    var __VLS_3;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
