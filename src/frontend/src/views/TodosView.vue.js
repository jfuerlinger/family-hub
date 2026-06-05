/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useTodoStore } from '../app/stores/todoStore';
import { useFamilyStore } from '../app/stores/familyStore';
const todoStore = useTodoStore();
const familyStore = useFamilyStore();
const newTitle = ref('');
const newDescription = ref('');
const newDueDate = ref('');
const newAssignedTo = ref('');
const filter = ref('all');
onMounted(async () => {
    await familyStore.loadFamilies();
    const fam = familyStore.selectedFamily;
    if (fam)
        await todoStore.loadTodos(fam.id);
});
const family = computed(() => familyStore.selectedFamily);
const filteredTodos = computed(() => {
    if (filter.value === 'open')
        return todoStore.todos.filter(t => !t.isDone);
    if (filter.value === 'done')
        return todoStore.todos.filter(t => t.isDone);
    return todoStore.todos;
});
async function addTodo() {
    const fam = family.value;
    if (!fam || !newTitle.value.trim())
        return;
    await todoStore.addTodo(fam.id, {
        title: newTitle.value.trim(),
        description: newDescription.value || null,
        dueDateUtc: newDueDate.value ? new Date(newDueDate.value).toISOString() : null,
        assignedToUserId: newAssignedTo.value || null,
    });
    newTitle.value = '';
    newDescription.value = '';
    newDueDate.value = '';
    newAssignedTo.value = '';
}
async function toggle(todoId, isDone) {
    const fam = family.value;
    if (!fam)
        return;
    await todoStore.toggleDone(fam.id, todoId, isDone);
}
function memberName(userId) {
    if (!userId || !family.value)
        return '—';
    const m = family.value.members.find(x => x.userId === userId);
    return m ? `${m.firstName} ${m.lastName}` : '—';
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
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.addTodo) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.newTitle),
        type: "text",
        placeholder: "Titel",
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.newDescription),
        type: "text",
        placeholder: "Beschreibung (optional)",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
    });
    (__VLS_ctx.newDueDate);
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.newAssignedTo),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [m] of __VLS_vFor((__VLS_ctx.family.members))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (m.userId),
            value: (m.userId),
        });
        (m.firstName);
        (m.lastName);
        // @ts-ignore
        [family, addTodo, newTitle, newDescription, newDueDate, newAssignedTo,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.todoStore.loading),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    if (__VLS_ctx.todoStore.error) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "error" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['error']} */ ;
        (__VLS_ctx.todoStore.error);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.family))
                    return;
                __VLS_ctx.filter = 'all';
                // @ts-ignore
                [todoStore, todoStore, todoStore, filter,];
            } },
        type: "button",
        ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.filter === 'all' }]) },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    /** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.family))
                    return;
                __VLS_ctx.filter = 'open';
                // @ts-ignore
                [filter, filter,];
            } },
        type: "button",
        ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.filter === 'open' }]) },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    /** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.family))
                    return;
                __VLS_ctx.filter = 'done';
                // @ts-ignore
                [filter, filter,];
            } },
        type: "button",
        ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.filter === 'done' }]) },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    /** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [todo] of __VLS_vFor((__VLS_ctx.filteredTodos))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (todo.id),
            ...{ style: ({ opacity: todo.isDone ? 0.6 : 1 }) },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "todo-status-control" },
        });
        /** @type {__VLS_StyleScopedClasses['todo-status-control']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (...[$event]) => {
                    if (!!(!__VLS_ctx.family))
                        return;
                    __VLS_ctx.toggle(todo.id, todo.isDone);
                    // @ts-ignore
                    [filter, filteredTodos, toggle,];
                } },
            type: "checkbox",
            ...{ class: "todo-checkbox" },
            checked: (todo.isDone),
            'aria-label': (todo.isDone ? `Aufgabe ${todo.title} als offen markieren` : `Aufgabe ${todo.title} als erledigt markieren`),
        });
        /** @type {__VLS_StyleScopedClasses['todo-checkbox']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (todo.isDone ? 'Erledigt' : 'Offen');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ style: ({ textDecoration: todo.isDone ? 'line-through' : 'none' }) },
        });
        (todo.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.memberName(todo.assignedToUserId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (todo.dueDateUtc ? new Date(todo.dueDateUtc).toLocaleDateString('de-AT') : '—');
        // @ts-ignore
        [memberName,];
    }
    if (__VLS_ctx.filteredTodos.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "4",
            ...{ class: "table-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['table-empty']} */ ;
    }
}
// @ts-ignore
[filteredTodos,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
