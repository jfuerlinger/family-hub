/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted, watch } from 'vue';
import { useCalendarStore } from '../app/stores/calendarStore';
import { useFamilyStore } from '../app/stores/familyStore';
import { useTodoStore } from '../app/stores/todoStore';
import { addDays, createMonthDays, createOneDayDays, createThreeDayDays, createWeekDays, eventsForDay, formatMonthLabel, getContrastTextColor, startOfLocalDay, } from '../app/utils/calendarView';
const UNASSIGNED_ID = '__unassigned__';
const UNASSIGNED_COLOR = '#9ca3af';
const calendarStore = useCalendarStore();
const familyStore = useFamilyStore();
const todoStore = useTodoStore();
const tab = ref('calendar');
const calendarView = ref('week');
const focusDate = ref(startOfLocalDay(new Date()));
const maxMonthItems = 3;
const showDoneTodos = ref(false);
const newTitle = ref('');
const newDescription = ref('');
const newStart = ref('');
const newEnd = ref('');
const newAllDay = ref(false);
const newRecurrence = ref('none');
const newRecurrenceInterval = ref(1);
const newRecurrenceUntil = ref('');
const newRecurrenceCount = ref('');
watch(() => familyStore.selectedFamilyId, async (familyId, previousFamilyId) => {
    if (!familyId) {
        return;
    }
    if (previousFamilyId && previousFamilyId !== familyId) {
        hiddenUserIds.value = new Set();
    }
    await Promise.all([
        calendarStore.loadFamilyEvents(familyId),
        todoStore.loadTodos(familyId),
    ]);
}, { immediate: true });
onMounted(async () => {
    await Promise.all([
        familyStore.loadFamilies(),
        calendarStore.loadMyEvents(),
    ]);
});
const family = computed(() => familyStore.selectedFamily);
// ─── Member filter ─────────────────────────────────────────────────────────
const hiddenUserIds = ref(new Set());
const filterMembers = computed(() => {
    const members = (family.value?.members ?? [])
        .map(m => ({
        userId: m.userId,
        name: `${m.firstName} ${m.lastName}`.trim(),
        color: m.color,
    }))
        .sort((a, b) => a.name.localeCompare(b.name, 'de-AT'));
    // Include orphaned assignees not in the family members list
    const knownUserIds = new Set(members.map(m => m.userId));
    const orphans = new Map();
    todoStore.todos.forEach(t => {
        if (t.assignedToUserId && !knownUserIds.has(t.assignedToUserId)) {
            orphans.set(t.assignedToUserId, t.assignedToUserId);
        }
    });
    orphans.forEach((_, userId) => {
        members.push({ userId, name: 'Unbekanntes Mitglied', color: UNASSIGNED_COLOR });
    });
    const hasUnassigned = todoStore.todos.some(t => !t.assignedToUserId && t.dueDateUtc);
    if (hasUnassigned) {
        members.push({ userId: UNASSIGNED_ID, name: 'Nicht zugewiesen', color: UNASSIGNED_COLOR });
    }
    return members;
});
function toggleMember(userId) {
    const next = new Set(hiddenUserIds.value);
    if (next.has(userId)) {
        next.delete(userId);
    }
    else {
        next.add(userId);
    }
    hiddenUserIds.value = next;
}
function isMemberVisible(userId) {
    return !hiddenUserIds.value.has(userId);
}
// ─── Unified calendar items ────────────────────────────────────────────────
const allCalendarItems = computed(() => {
    const events = calendarStore.familyEvents.map(e => ({
        id: `event:${e.id}`,
        type: 'event',
        title: e.title,
        startUtc: e.startUtc,
        endUtc: e.endUtc,
        allDay: e.allDay,
        memberColor: e.memberColor,
        memberName: e.memberName,
        userId: e.userId,
    }));
    const members = family.value?.members ?? [];
    const todos = todoStore.todos
        .filter(t => t.dueDateUtc !== null)
        .map(t => {
        const member = members.find(m => m.userId === t.assignedToUserId);
        const dayStart = startOfLocalDay(new Date(t.dueDateUtc));
        return {
            id: `todo:${t.id}`,
            type: 'todo',
            title: t.title,
            startUtc: dayStart.toISOString(),
            endUtc: addDays(dayStart, 1).toISOString(),
            allDay: true,
            memberColor: member?.color ?? UNASSIGNED_COLOR,
            memberName: member ? `${member.firstName} ${member.lastName}`.trim() : 'Nicht zugewiesen',
            userId: t.assignedToUserId ?? UNASSIGNED_ID,
            isDone: t.isDone,
        };
    });
    return [...events, ...todos];
});
const visibleItems = computed(() => {
    return allCalendarItems.value
        .filter(item => {
        if (hiddenUserIds.value.has(item.userId))
            return false;
        if (item.type === 'todo' && item.isDone && !showDoneTodos.value)
            return false;
        return true;
    })
        .sort((a, b) => {
        // Open todos before done todos
        if (a.type === 'todo' && b.type === 'todo') {
            if (a.isDone !== b.isDone)
                return a.isDone ? 1 : -1;
        }
        return new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime();
    });
});
// ─── Day grids ─────────────────────────────────────────────────────────────
const oneDayDays = computed(() => createOneDayDays(focusDate.value).map(day => ({
    ...day,
    items: eventsForDay(visibleItems.value, day.date),
})));
const threeDayDays = computed(() => createThreeDayDays(focusDate.value).map(day => ({
    ...day,
    items: eventsForDay(visibleItems.value, day.date),
})));
const weekDayItems = computed(() => createWeekDays(focusDate.value).map(day => ({
    ...day,
    items: eventsForDay(visibleItems.value, day.date),
})));
const monthDays = computed(() => createMonthDays(focusDate.value).map(day => ({
    ...day,
    items: eventsForDay(visibleItems.value, day.date),
})));
const currentDayColumns = computed(() => {
    if (calendarView.value === 'day')
        return oneDayDays.value;
    if (calendarView.value === 'three-day')
        return threeDayDays.value;
    return weekDayItems.value;
});
const gridColumns = computed(() => {
    if (calendarView.value === 'day')
        return 1;
    if (calendarView.value === 'three-day')
        return 3;
    return 7;
});
// ─── Navigation ────────────────────────────────────────────────────────────
const periodLabel = computed(() => {
    switch (calendarView.value) {
        case 'day':
            return focusDate.value.toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        case 'three-day': {
            const days = threeDayDays.value;
            if (!days[0] || !days[2])
                return '';
            return `${formatShortDate(days[0].date)} – ${formatShortDate(days[2].date)}`;
        }
        case 'week': {
            const days = weekDayItems.value;
            if (!days[0] || !days[6])
                return '';
            return `${formatShortDate(days[0].date)} – ${formatShortDate(days[6].date)}`;
        }
        case 'month':
            return formatMonthLabel(focusDate.value, 'de-AT');
        default:
            return '';
    }
});
function movePeriod(step) {
    switch (calendarView.value) {
        case 'day':
            focusDate.value = startOfLocalDay(addDays(focusDate.value, step));
            break;
        case 'three-day':
            focusDate.value = startOfLocalDay(addDays(focusDate.value, step * 3));
            break;
        case 'week':
            focusDate.value = startOfLocalDay(addDays(focusDate.value, step * 7));
            break;
        case 'month': {
            const shifted = new Date(focusDate.value);
            shifted.setDate(1);
            shifted.setMonth(shifted.getMonth() + step);
            focusDate.value = startOfLocalDay(shifted);
            break;
        }
    }
}
function goToToday() {
    focusDate.value = startOfLocalDay(new Date());
}
// ─── Personal event form ───────────────────────────────────────────────────
const isRecurring = computed(() => newRecurrence.value !== 'none');
async function addEvent() {
    if (!newTitle.value.trim() || !newStart.value || !newEnd.value)
        return;
    const parsedRecurrenceCount = newRecurrenceCount.value.trim()
        ? Number.parseInt(newRecurrenceCount.value.trim(), 10)
        : null;
    const recurrenceCount = parsedRecurrenceCount && parsedRecurrenceCount > 0
        ? parsedRecurrenceCount
        : null;
    if (isRecurring.value && !newRecurrenceUntil.value && recurrenceCount === null)
        return;
    await calendarStore.addEvent({
        title: newTitle.value.trim(),
        description: newDescription.value || null,
        startUtc: new Date(newStart.value).toISOString(),
        endUtc: new Date(newEnd.value).toISOString(),
        allDay: newAllDay.value,
        recurrence: newRecurrence.value,
        recurrenceInterval: isRecurring.value ? Math.max(1, Math.trunc(newRecurrenceInterval.value || 1)) : 1,
        recurrenceUntilUtc: isRecurring.value && newRecurrenceUntil.value ? new Date(newRecurrenceUntil.value).toISOString() : null,
        recurrenceCount,
    });
    if (!calendarStore.error) {
        newTitle.value = '';
        newDescription.value = '';
        newStart.value = '';
        newEnd.value = '';
        newAllDay.value = false;
        newRecurrence.value = 'none';
        newRecurrenceInterval.value = 1;
        newRecurrenceUntil.value = '';
        newRecurrenceCount.value = '';
    }
}
// ─── Formatters ────────────────────────────────────────────────────────────
function formatDt(iso) {
    return new Date(iso).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' });
}
function formatShortDate(date) {
    return date.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' });
}
function formatWeekDayLabel(date) {
    return date.toLocaleDateString('de-AT', { weekday: 'short' });
}
function formatItemTime(item) {
    if (item.type === 'todo')
        return 'Fällig';
    if (item.allDay)
        return 'Ganztägig';
    const start = new Date(item.startUtc);
    const end = new Date(item.endUtc);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
        return '';
    return `${start.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}`;
}
function formatMonthItemTime(item) {
    if (item.type === 'todo')
        return '✓';
    if (item.allDay)
        return '';
    return new Date(item.startUtc).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
}
function chipStyle(color) {
    return {
        backgroundColor: color,
        borderColor: color,
        color: getContrastTextColor(color),
    };
}
function isToday(date) {
    const today = startOfLocalDay(new Date());
    return date.getFullYear() === today.getFullYear()
        && date.getMonth() === today.getMonth()
        && date.getDate() === today.getDate();
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "view-header-actions" },
});
/** @type {__VLS_StyleScopedClasses['view-header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tab = 'calendar';
            // @ts-ignore
            [tab,];
        } },
    type: "button",
    ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.tab === 'calendar' }]) },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tab = 'personal';
            // @ts-ignore
            [tab, tab,];
        } },
    type: "button",
    ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.tab === 'personal' }]) },
});
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
if (__VLS_ctx.tab === 'personal') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.addEvent) },
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
        type: "datetime-local",
        required: true,
    });
    (__VLS_ctx.newStart);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "datetime-local",
        required: true,
    });
    (__VLS_ctx.newEnd);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.newAllDay);
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.newRecurrence),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "none",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "daily",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "weekly",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "monthly",
    });
    if (__VLS_ctx.isRecurring) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "1",
            step: "1",
            placeholder: "Intervall",
        });
        (__VLS_ctx.newRecurrenceInterval);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "datetime-local",
            placeholder: "Serie bis",
        });
        (__VLS_ctx.newRecurrenceUntil);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "1",
            step: "1",
            placeholder: "Anzahl (optional)",
        });
        (__VLS_ctx.newRecurrenceCount);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.calendarStore.loading),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    if (__VLS_ctx.calendarStore.error) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "error" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['error']} */ ;
        (__VLS_ctx.calendarStore.error);
    }
    if (__VLS_ctx.isRecurring) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "muted" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    }
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [event] of __VLS_vFor((__VLS_ctx.calendarStore.myEvents))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (event.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (event.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatDt(event.startUtc));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatDt(event.endUtc));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (event.allDay ? 'Ja' : 'Nein');
        // @ts-ignore
        [tab, tab, addEvent, newTitle, newDescription, newStart, newEnd, newAllDay, newRecurrence, isRecurring, isRecurring, newRecurrenceInterval, newRecurrenceUntil, newRecurrenceCount, calendarStore, calendarStore, calendarStore, calendarStore, formatDt, formatDt,];
    }
    if (__VLS_ctx.calendarStore.myEvents.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            colspan: "4",
            ...{ class: "table-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['table-empty']} */ ;
    }
}
else {
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
        [calendarStore, family,];
        var __VLS_3;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calendar-filter-header" },
        });
        /** @type {__VLS_StyleScopedClasses['calendar-filter-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "calendar-toggle-label" },
        });
        /** @type {__VLS_StyleScopedClasses['calendar-toggle-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (__VLS_ctx.showDoneTodos);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "filter-bar" },
        });
        /** @type {__VLS_StyleScopedClasses['filter-bar']} */ ;
        for (const [member] of __VLS_vFor((__VLS_ctx.filterMembers))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.tab === 'personal'))
                            return;
                        if (!!(!__VLS_ctx.family))
                            return;
                        __VLS_ctx.toggleMember(member.userId);
                        // @ts-ignore
                        [showDoneTodos, filterMembers, toggleMember,];
                    } },
                key: (member.userId),
                type: "button",
                ...{ class: "calendar-member-pill" },
                ...{ style: ({
                        '--pill-color': member.color,
                        background: __VLS_ctx.isMemberVisible(member.userId) ? member.color : 'transparent',
                        color: __VLS_ctx.isMemberVisible(member.userId) ? __VLS_ctx.getContrastTextColor(member.color) : member.color,
                        borderColor: member.color,
                    }) },
            });
            /** @type {__VLS_StyleScopedClasses['calendar-member-pill']} */ ;
            (member.name);
            // @ts-ignore
            [isMemberVisible, isMemberVisible, getContrastTextColor,];
        }
        if (__VLS_ctx.calendarStore.error || __VLS_ctx.todoStore.error) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "error" },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['error']} */ ;
            (__VLS_ctx.calendarStore.error || __VLS_ctx.todoStore.error);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calendar-toolbar" },
        });
        /** @type {__VLS_StyleScopedClasses['calendar-toolbar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "calendar-view-toggle" },
        });
        /** @type {__VLS_StyleScopedClasses['calendar-view-toggle']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.tab === 'personal'))
                        return;
                    if (!!(!__VLS_ctx.family))
                        return;
                    __VLS_ctx.calendarView = 'list';
                    // @ts-ignore
                    [calendarStore, calendarStore, todoStore, todoStore, calendarView,];
                } },
            type: "button",
            ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.calendarView === 'list' }]) },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
        /** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.tab === 'personal'))
                        return;
                    if (!!(!__VLS_ctx.family))
                        return;
                    __VLS_ctx.calendarView = 'day';
                    // @ts-ignore
                    [calendarView, calendarView,];
                } },
            type: "button",
            ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.calendarView === 'day' }]) },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
        /** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.tab === 'personal'))
                        return;
                    if (!!(!__VLS_ctx.family))
                        return;
                    __VLS_ctx.calendarView = 'three-day';
                    // @ts-ignore
                    [calendarView, calendarView,];
                } },
            type: "button",
            ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.calendarView === 'three-day' }]) },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
        /** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.tab === 'personal'))
                        return;
                    if (!!(!__VLS_ctx.family))
                        return;
                    __VLS_ctx.calendarView = 'week';
                    // @ts-ignore
                    [calendarView, calendarView,];
                } },
            type: "button",
            ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.calendarView === 'week' }]) },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
        /** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.tab === 'personal'))
                        return;
                    if (!!(!__VLS_ctx.family))
                        return;
                    __VLS_ctx.calendarView = 'month';
                    // @ts-ignore
                    [calendarView, calendarView,];
                } },
            type: "button",
            ...{ class: (['filter-select', { 'nav-link-active': __VLS_ctx.calendarView === 'month' }]) },
        });
        /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
        /** @type {__VLS_StyleScopedClasses['nav-link-active']} */ ;
        if (__VLS_ctx.calendarView !== 'list') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "calendar-period-navigation" },
            });
            /** @type {__VLS_StyleScopedClasses['calendar-period-navigation']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.tab === 'personal'))
                            return;
                        if (!!(!__VLS_ctx.family))
                            return;
                        if (!(__VLS_ctx.calendarView !== 'list'))
                            return;
                        __VLS_ctx.movePeriod(-1);
                        // @ts-ignore
                        [calendarView, calendarView, movePeriod,];
                    } },
                type: "button",
                ...{ class: "filter-select" },
            });
            /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.goToToday) },
                type: "button",
                ...{ class: "filter-select" },
            });
            /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.tab === 'personal'))
                            return;
                        if (!!(!__VLS_ctx.family))
                            return;
                        if (!(__VLS_ctx.calendarView !== 'list'))
                            return;
                        __VLS_ctx.movePeriod(1);
                        // @ts-ignore
                        [movePeriod, goToToday,];
                    } },
                type: "button",
                ...{ class: "filter-select" },
            });
            /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "calendar-period-label" },
            });
            /** @type {__VLS_StyleScopedClasses['calendar-period-label']} */ ;
            (__VLS_ctx.periodLabel);
        }
        if (__VLS_ctx.calendarView === 'list') {
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
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            for (const [item] of __VLS_vFor((__VLS_ctx.visibleItems))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (item.id),
                    ...{ class: ({ 'table-row--muted': item.type === 'todo' && item.isDone }) },
                });
                /** @type {__VLS_StyleScopedClasses['table-row--muted']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ style: ({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: item.memberColor, flexShrink: '0' }) },
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (item.memberName);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (item.type === 'todo' ? '✓ Aufgabe' : '● Ereignis');
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    ...{ style: (item.type === 'todo' && item.isDone ? 'text-decoration:line-through;opacity:0.6' : '') },
                });
                (item.title);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (__VLS_ctx.formatDt(item.startUtc));
                // @ts-ignore
                [formatDt, calendarView, periodLabel, visibleItems,];
            }
            if (__VLS_ctx.visibleItems.length === 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    colspan: "5",
                    ...{ class: "table-empty" },
                });
                /** @type {__VLS_StyleScopedClasses['table-empty']} */ ;
            }
        }
        else if (__VLS_ctx.calendarView !== 'month') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "calendar-day-grid" },
                ...{ style: ({ gridTemplateColumns: `repeat(${__VLS_ctx.gridColumns}, minmax(0, 1fr))` }) },
            });
            /** @type {__VLS_StyleScopedClasses['calendar-day-grid']} */ ;
            for (const [day] of __VLS_vFor((__VLS_ctx.currentDayColumns))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (day.key),
                    ...{ class: (['calendar-day-column', { 'calendar-day-column--today': __VLS_ctx.isToday(day.date) }]) },
                });
                /** @type {__VLS_StyleScopedClasses['calendar-day-column']} */ ;
                /** @type {__VLS_StyleScopedClasses['calendar-day-column--today']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "calendar-day-column__header" },
                });
                /** @type {__VLS_StyleScopedClasses['calendar-day-column__header']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_ctx.formatWeekDayLabel(day.date));
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (__VLS_ctx.formatShortDate(day.date));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "calendar-day-column__events" },
                });
                /** @type {__VLS_StyleScopedClasses['calendar-day-column__events']} */ ;
                for (const [item] of __VLS_vFor((day.items))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (item.id),
                        ...{ class: ([
                                'calendar-event-chip',
                                { 'calendar-event-chip--todo': item.type === 'todo' },
                                { 'calendar-event-chip--done': item.type === 'todo' && item.isDone },
                            ]) },
                        ...{ style: (__VLS_ctx.chipStyle(item.memberColor)) },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-event-chip']} */ ;
                    /** @type {__VLS_StyleScopedClasses['calendar-event-chip--todo']} */ ;
                    /** @type {__VLS_StyleScopedClasses['calendar-event-chip--done']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "calendar-event-chip__time" },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-event-chip__time']} */ ;
                    (__VLS_ctx.formatItemTime(item));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "calendar-event-chip__title" },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-event-chip__title']} */ ;
                    (item.title);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "calendar-event-chip__member" },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-event-chip__member']} */ ;
                    (item.memberName);
                    // @ts-ignore
                    [calendarView, visibleItems, gridColumns, currentDayColumns, isToday, formatWeekDayLabel, formatShortDate, chipStyle, formatItemTime,];
                }
                if (day.items.length === 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "calendar-empty-day" },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-empty-day']} */ ;
                }
                // @ts-ignore
                [];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "calendar-month-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['calendar-month-grid']} */ ;
            for (const [day] of __VLS_vFor((__VLS_ctx.monthDays))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (day.key),
                    ...{ class: ([
                            'calendar-month-cell',
                            { 'calendar-month-cell--outside': !day.isCurrentMonth, 'calendar-month-cell--today': __VLS_ctx.isToday(day.date) },
                        ]) },
                });
                /** @type {__VLS_StyleScopedClasses['calendar-month-cell']} */ ;
                /** @type {__VLS_StyleScopedClasses['calendar-month-cell--outside']} */ ;
                /** @type {__VLS_StyleScopedClasses['calendar-month-cell--today']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "calendar-month-cell__header" },
                });
                /** @type {__VLS_StyleScopedClasses['calendar-month-cell__header']} */ ;
                (day.date.getDate());
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "calendar-month-cell__events" },
                });
                /** @type {__VLS_StyleScopedClasses['calendar-month-cell__events']} */ ;
                for (const [item] of __VLS_vFor((day.items.slice(0, __VLS_ctx.maxMonthItems)))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (`${day.key}-${item.id}`),
                        ...{ class: ([
                                'calendar-month-event',
                                { 'calendar-month-event--todo': item.type === 'todo' },
                                { 'calendar-month-event--done': item.type === 'todo' && item.isDone },
                            ]) },
                        ...{ style: (__VLS_ctx.chipStyle(item.memberColor)) },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-month-event']} */ ;
                    /** @type {__VLS_StyleScopedClasses['calendar-month-event--todo']} */ ;
                    /** @type {__VLS_StyleScopedClasses['calendar-month-event--done']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "calendar-month-event__time" },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-month-event__time']} */ ;
                    (__VLS_ctx.formatMonthItemTime(item));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "calendar-month-event__title" },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-month-event__title']} */ ;
                    (item.title);
                    // @ts-ignore
                    [isToday, chipStyle, monthDays, maxMonthItems, formatMonthItemTime,];
                }
                if (day.items.length === 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "calendar-month-empty" },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-month-empty']} */ ;
                }
                else if (day.items.length > __VLS_ctx.maxMonthItems) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "calendar-month-more" },
                    });
                    /** @type {__VLS_StyleScopedClasses['calendar-month-more']} */ ;
                    (day.items.length - __VLS_ctx.maxMonthItems);
                }
                // @ts-ignore
                [maxMonthItems, maxMonthItems,];
            }
        }
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
