<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCalendarStore } from '../app/stores/calendarStore'
import { useFamilyStore } from '../app/stores/familyStore'
import { useTodoStore } from '../app/stores/todoStore'
import type { CalendarRecurrence, CreateCalendarEventRequest } from '../app/types/calendar'
import type { CalendarDayCell } from '../app/utils/calendarView'
import {
  addDays,
  createMonthDays,
  createOneDayDays,
  createThreeDayDays,
  createWeekDays,
  eventsForDay,
  formatMonthLabel,
  getContrastTextColor,
  startOfLocalDay,
} from '../app/utils/calendarView'

type FamilyCalendarView = 'list' | 'day' | 'three-day' | 'week' | 'month'

const UNASSIGNED_ID = '__unassigned__'
const UNASSIGNED_COLOR = '#9ca3af'

interface CalendarItem {
  id: string
  type: 'event' | 'todo'
  title: string
  description: string | null
  startUtc: string
  endUtc: string
  allDay: boolean
  memberColor: string
  memberName: string
  userId: string
  isDone?: boolean
}

interface CalendarDayWithItems extends CalendarDayCell {
  items: CalendarItem[]
}

const calendarStore = useCalendarStore()
const familyStore = useFamilyStore()
const todoStore = useTodoStore()

const calendarView = ref<FamilyCalendarView>('week')
const focusDate = ref(startOfLocalDay(new Date()))
const maxMonthItems = 3
const showDoneTodos = ref(false)

const showComposer = ref(false)
const localFormError = ref<string | null>(null)
const userEditedEnd = ref(false)
const recurrenceEndMode = ref<'until' | 'count'>('until')
const selectedItem = ref<CalendarItem | null>(null)

const newTitle = ref('')
const newDescription = ref('')
const newStart = ref('')
const newEnd = ref('')
const newAllDay = ref(false)
const newRecurrence = ref<CalendarRecurrence>('none')
const newRecurrenceInterval = ref(1)
const newRecurrenceUntil = ref('')
const newRecurrenceCount = ref('')

watch(
  () => familyStore.selectedFamilyId,
  async (familyId, previousFamilyId) => {
    if (!familyId) {
      return
    }

    if (previousFamilyId && previousFamilyId !== familyId) {
      hiddenUserIds.value = new Set()
    }

    await Promise.all([
      calendarStore.loadFamilyEvents(familyId),
      todoStore.loadTodos(familyId),
    ])
  },
  { immediate: true },
)

onMounted(async () => {
  await Promise.all([
    familyStore.loadFamilies(),
    calendarStore.loadMyEvents(),
  ])
})

const family = computed(() => familyStore.selectedFamily)
const isRecurring = computed(() => newRecurrence.value !== 'none')
const recurrenceHint = computed(() => {
  if (!isRecurring.value) return null
  if (recurrenceEndMode.value === 'until') return newRecurrenceUntil.value ? null : 'Für Serientermine muss ein Enddatum gesetzt sein.'
  return newRecurrenceCount.value.trim() ? null : 'Für Serientermine muss eine Anzahl gesetzt sein.'
})
const hasValidRange = computed(() => {
  if (!newStart.value || !newEnd.value) return false
  const start = new Date(newStart.value)
  const end = new Date(newEnd.value)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
  return end.getTime() > start.getTime()
})
const canSubmitEvent = computed(() => {
  if (calendarStore.loading) return false
  if (!newTitle.value.trim()) return false
  if (!hasValidRange.value) return false
  if (!isRecurring.value) return true
  return recurrenceHint.value === null
})

watch(newRecurrence, value => {
  if (value === 'none') {
    recurrenceEndMode.value = 'until'
    newRecurrenceUntil.value = ''
    newRecurrenceCount.value = ''
  }
})

watch(newStart, value => {
  if (!value || userEditedEnd.value) return
  const start = new Date(value)
  if (Number.isNaN(start.getTime())) return
  const nextHour = new Date(start.getTime() + 60 * 60 * 1000)
  newEnd.value = toLocalDateTimeInput(nextHour)
})

// ─── Member filter ─────────────────────────────────────────────────────────

const hiddenUserIds = ref<Set<string>>(new Set())

const filterMembers = computed(() => {
  const members = (family.value?.members ?? [])
    .map(m => ({
      userId: m.userId,
      name: `${m.firstName} ${m.lastName}`.trim(),
      color: m.color,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de-AT'))

  const knownUserIds = new Set(members.map(m => m.userId))
  const orphans = new Map<string, string>()
  todoStore.todos.forEach(t => {
    if (t.assignedToUserId && !knownUserIds.has(t.assignedToUserId)) {
      orphans.set(t.assignedToUserId, t.assignedToUserId)
    }
  })
  orphans.forEach((_, userId) => {
    members.push({ userId, name: 'Unbekanntes Mitglied', color: UNASSIGNED_COLOR })
  })

  const hasUnassigned = todoStore.todos.some(t => !t.assignedToUserId && t.dueDateUtc)
  if (hasUnassigned) {
    members.push({ userId: UNASSIGNED_ID, name: 'Nicht zugewiesen', color: UNASSIGNED_COLOR })
  }

  return members
})

function toggleMember(userId: string): void {
  const next = new Set(hiddenUserIds.value)
  if (next.has(userId)) {
    next.delete(userId)
  } else {
    next.add(userId)
  }
  hiddenUserIds.value = next
}

function isMemberVisible(userId: string): boolean {
  return !hiddenUserIds.value.has(userId)
}

// ─── Unified calendar items ────────────────────────────────────────────────

const allCalendarItems = computed<CalendarItem[]>(() => {
  const events: CalendarItem[] = calendarStore.familyEvents.map(e => ({
    id: `event:${e.id}`,
    type: 'event',
    title: e.title,
    description: e.description,
    startUtc: e.startUtc,
    endUtc: e.endUtc,
    allDay: e.allDay,
    memberColor: e.memberColor,
    memberName: e.memberName,
    userId: e.userId,
  }))

  const members = family.value?.members ?? []
  const todos: CalendarItem[] = todoStore.todos
    .filter(t => t.dueDateUtc !== null)
    .map(t => {
      const member = members.find(m => m.userId === t.assignedToUserId)
      const dayStart = startOfLocalDay(new Date(t.dueDateUtc!))
      return {
        id: `todo:${t.id}`,
        type: 'todo',
        title: t.title,
        description: t.description,
        startUtc: dayStart.toISOString(),
        endUtc: addDays(dayStart, 1).toISOString(),
        allDay: true,
        memberColor: member?.color ?? UNASSIGNED_COLOR,
        memberName: member ? `${member.firstName} ${member.lastName}`.trim() : 'Nicht zugewiesen',
        userId: t.assignedToUserId ?? UNASSIGNED_ID,
        isDone: t.isDone,
      }
    })

  return [...events, ...todos]
})

const visibleItems = computed<CalendarItem[]>(() => {
  return allCalendarItems.value
    .filter(item => {
      if (hiddenUserIds.value.has(item.userId)) return false
      if (item.type === 'todo' && item.isDone && !showDoneTodos.value) return false
      return true
    })
    .sort((a, b) => {
      if (a.type === 'todo' && b.type === 'todo') {
        if (a.isDone !== b.isDone) return a.isDone ? 1 : -1
      }
      return new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime()
    })
})

// ─── Day grids ─────────────────────────────────────────────────────────────

const oneDayDays = computed<CalendarDayWithItems[]>(() =>
  createOneDayDays(focusDate.value).map(day => ({
    ...day,
    items: eventsForDay(visibleItems.value, day.date),
  })),
)

const threeDayDays = computed<CalendarDayWithItems[]>(() =>
  createThreeDayDays(focusDate.value).map(day => ({
    ...day,
    items: eventsForDay(visibleItems.value, day.date),
  })),
)

const weekDayItems = computed<CalendarDayWithItems[]>(() =>
  createWeekDays(focusDate.value).map(day => ({
    ...day,
    items: eventsForDay(visibleItems.value, day.date),
  })),
)

const monthDays = computed<CalendarDayWithItems[]>(() =>
  createMonthDays(focusDate.value).map(day => ({
    ...day,
    items: eventsForDay(visibleItems.value, day.date),
  })),
)

const currentDayColumns = computed<CalendarDayWithItems[]>(() => {
  if (calendarView.value === 'day') return oneDayDays.value
  if (calendarView.value === 'three-day') return threeDayDays.value
  return weekDayItems.value
})

const gridColumns = computed<number>(() => {
  if (calendarView.value === 'day') return 1
  if (calendarView.value === 'three-day') return 3
  return 7
})

// ─── Navigation ────────────────────────────────────────────────────────────

const periodLabel = computed(() => {
  switch (calendarView.value) {
    case 'day':
      return focusDate.value.toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    case 'three-day': {
      const days = threeDayDays.value
      if (!days[0] || !days[2]) return ''
      return `${formatShortDate(days[0].date)} – ${formatShortDate(days[2].date)}`
    }
    case 'week': {
      const days = weekDayItems.value
      if (!days[0] || !days[6]) return ''
      return `${formatShortDate(days[0].date)} – ${formatShortDate(days[6].date)}`
    }
    case 'month':
      return formatMonthLabel(focusDate.value, 'de-AT')
    default:
      return ''
  }
})

function movePeriod(step: number): void {
  switch (calendarView.value) {
    case 'day':
      focusDate.value = startOfLocalDay(addDays(focusDate.value, step))
      break
    case 'three-day':
      focusDate.value = startOfLocalDay(addDays(focusDate.value, step * 3))
      break
    case 'week':
      focusDate.value = startOfLocalDay(addDays(focusDate.value, step * 7))
      break
    case 'month': {
      const shifted = new Date(focusDate.value)
      shifted.setDate(1)
      shifted.setMonth(shifted.getMonth() + step)
      focusDate.value = startOfLocalDay(shifted)
      break
    }
  }
}

function goToToday(): void {
  focusDate.value = startOfLocalDay(new Date())
}

// ─── Event composer ────────────────────────────────────────────────────────

function toLocalDateTimeInput(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function resetEventForm(): void {
  newTitle.value = ''
  newDescription.value = ''
  newStart.value = ''
  newEnd.value = ''
  newAllDay.value = false
  newRecurrence.value = 'none'
  newRecurrenceInterval.value = 1
  newRecurrenceUntil.value = ''
  newRecurrenceCount.value = ''
  recurrenceEndMode.value = 'until'
  localFormError.value = null
  userEditedEnd.value = false
}

function openComposer(anchorDate?: Date): void {
  const base = startOfLocalDay(anchorDate ?? focusDate.value)
  const start = new Date(base)
  if (!anchorDate) {
    start.setHours(9, 0, 0, 0)
  }
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  showComposer.value = true
  localFormError.value = null
  userEditedEnd.value = false
  if (!newStart.value) {
    newStart.value = toLocalDateTimeInput(start)
    newEnd.value = toLocalDateTimeInput(end)
  }
}

function closeComposer(): void {
  showComposer.value = false
  resetEventForm()
}

function applyDuration(minutes: number): void {
  if (!newStart.value) return
  const start = new Date(newStart.value)
  if (Number.isNaN(start.getTime())) return
  const end = new Date(start.getTime() + minutes * 60 * 1000)
  newEnd.value = toLocalDateTimeInput(end)
  userEditedEnd.value = true
}

async function addEvent(): Promise<void> {
  localFormError.value = null
  if (!newTitle.value.trim()) {
    localFormError.value = 'Bitte gib einen Titel an.'
    return
  }
  if (!newStart.value || !newEnd.value) {
    localFormError.value = 'Bitte setze Start und Ende.'
    return
  }

  const start = new Date(newStart.value)
  const end = new Date(newEnd.value)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    localFormError.value = 'Start oder Ende ist ungültig.'
    return
  }
  if (end.getTime() <= start.getTime()) {
    localFormError.value = 'Das Ende muss nach dem Start liegen.'
    return
  }

  const request: CreateCalendarEventRequest = {
    title: newTitle.value.trim(),
    description: newDescription.value.trim() || null,
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
    allDay: newAllDay.value,
    recurrence: 'none',
  }

  if (isRecurring.value) {
    request.recurrence = newRecurrence.value
    request.recurrenceInterval = Math.max(1, Math.trunc(newRecurrenceInterval.value || 1))
    request.recurrenceUntilUtc = null
    request.recurrenceCount = null

    if (recurrenceEndMode.value === 'until') {
      if (!newRecurrenceUntil.value) {
        localFormError.value = 'Für Serientermine muss ein Enddatum gesetzt sein.'
        return
      }
      const recurrenceUntil = new Date(newRecurrenceUntil.value)
      if (Number.isNaN(recurrenceUntil.getTime())) {
        localFormError.value = 'Das Serien-Enddatum ist ungültig.'
        return
      }
      if (recurrenceUntil.getTime() <= start.getTime()) {
        localFormError.value = 'Das Serien-Enddatum muss nach dem Start liegen.'
        return
      }
      request.recurrenceUntilUtc = recurrenceUntil.toISOString()
    } else {
      const parsedCount = Number.parseInt(newRecurrenceCount.value.trim(), 10)
      if (!Number.isFinite(parsedCount) || parsedCount < 1) {
        localFormError.value = 'Bitte gib eine gültige Anzahl für die Serie an.'
        return
      }
      request.recurrenceCount = parsedCount
    }
  }

  await calendarStore.addEvent(request)
  if (!calendarStore.error) {
    if (familyStore.selectedFamilyId) {
      await calendarStore.loadFamilyEvents(familyStore.selectedFamilyId)
    }
    closeComposer()
  }
}

// ─── Details ───────────────────────────────────────────────────────────────

function openItemDetails(item: CalendarItem): void {
  selectedItem.value = item
}

function closeItemDetails(): void {
  selectedItem.value = null
}

function openDayFromMonth(date: Date): void {
  focusDate.value = startOfLocalDay(date)
  calendarView.value = 'day'
}

// ─── Formatters ────────────────────────────────────────────────────────────

function formatDt(iso: string): string {
  return new Date(iso).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' })
}

function formatWeekDayLabel(date: Date): string {
  return date.toLocaleDateString('de-AT', { weekday: 'short' })
}

function formatItemTime(item: CalendarItem): string {
  if (item.type === 'todo') return 'Fällig'
  if (item.allDay) return 'Ganztägig'
  const start = new Date(item.startUtc)
  const end = new Date(item.endUtc)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''
  return `${start.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}`
}

function formatMonthItemTime(item: CalendarItem): string {
  if (item.type === 'todo') return '✓'
  if (item.allDay) return ''
  return new Date(item.startUtc).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })
}

function formatDetailDateRange(item: CalendarItem): string {
  if (item.type === 'todo') {
    return new Date(item.startUtc).toLocaleDateString('de-AT', { dateStyle: 'full' })
  }
  if (item.allDay) {
    return `${new Date(item.startUtc).toLocaleDateString('de-AT', { dateStyle: 'full' })} (Ganztägig)`
  }
  return `${formatDt(item.startUtc)} – ${formatDt(item.endUtc)}`
}

function chipStyle(color: string): Record<string, string> {
  return {
    backgroundColor: color,
    borderColor: color,
    color: getContrastTextColor(color),
  }
}

function isToday(date: Date): boolean {
  const today = startOfLocalDay(new Date())
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1>Kalender</h1>
      <div class="view-header-actions">
        <button type="button" class="btn-primary" @click="showComposer ? closeComposer() : openComposer()">
          {{ showComposer ? 'Erstellung schließen' : 'Neues Ereignis' }}
        </button>
      </div>
    </div>

    <div v-if="showComposer" class="card">
      <div class="calendar-composer-header">
        <h3>Neues Ereignis</h3>
      </div>
      <form @submit.prevent="addEvent">
        <div class="form calendar-composer-grid">
          <input v-model.trim="newTitle" type="text" placeholder="Titel" required />
          <input v-model.trim="newDescription" type="text" placeholder="Beschreibung (optional)" />
          <input v-model="newStart" type="datetime-local" required />
          <input v-model="newEnd" type="datetime-local" required @input="userEditedEnd = true" />
          <label class="calendar-toggle-label">
            <input v-model="newAllDay" type="checkbox" />
            Ganztägig
          </label>
          <select v-model="newRecurrence">
            <option value="none">Keine Serie</option>
            <option value="daily">Täglich</option>
            <option value="weekly">Wöchentlich</option>
            <option value="monthly">Monatlich</option>
          </select>
        </div>

        <div class="calendar-composer-meta">
          <div class="calendar-duration-buttons">
            <span class="muted">Schnelle Dauer</span>
            <button type="button" class="filter-select" @click="applyDuration(30)">30 Min</button>
            <button type="button" class="filter-select" @click="applyDuration(60)">60 Min</button>
            <button type="button" class="filter-select" @click="applyDuration(90)">90 Min</button>
          </div>

          <template v-if="isRecurring">
            <div class="calendar-recurrence-row">
              <input v-model.number="newRecurrenceInterval" type="number" min="1" step="1" placeholder="Intervall" />
              <div class="calendar-recurrence-mode">
                <label>
                  <input v-model="recurrenceEndMode" type="radio" value="until" />
                  Endet am
                </label>
                <label>
                  <input v-model="recurrenceEndMode" type="radio" value="count" />
                  Endet nach Anzahl
                </label>
              </div>
            </div>
            <div class="calendar-recurrence-input">
              <input v-if="recurrenceEndMode === 'until'" v-model="newRecurrenceUntil" type="datetime-local" />
              <input
                v-else
                v-model="newRecurrenceCount"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                placeholder="Anzahl Termine"
              />
            </div>
            <p v-if="recurrenceHint" class="muted">{{ recurrenceHint }}</p>
          </template>
        </div>

        <div class="calendar-composer-actions">
          <button type="submit" class="btn-primary" :disabled="!canSubmitEvent">Ereignis erstellen</button>
          <button type="button" class="filter-select" @click="closeComposer">Abbrechen</button>
        </div>
      </form>
      <p v-if="localFormError || calendarStore.error" class="error" style="margin-top: 0.5rem">
        {{ localFormError || calendarStore.error }}
      </p>
    </div>

    <div v-if="!family" class="card">
      <p class="muted">Keine Familie ausgewählt. Gehe zu <RouterLink to="/settings">Einstellungen</RouterLink>.</p>
    </div>

    <template v-else>
      <div class="card">
        <div class="calendar-filter-header">
          <h3>Mitglieder</h3>
          <label class="calendar-toggle-label">
            <input v-model="showDoneTodos" type="checkbox" />
            Erledigte Aufgaben anzeigen
          </label>
        </div>
        <div class="filter-bar">
          <button
            v-for="member in filterMembers"
            :key="member.userId"
            type="button"
            class="calendar-member-pill"
            :style="{
              '--pill-color': member.color,
              background: isMemberVisible(member.userId) ? member.color : 'transparent',
              color: isMemberVisible(member.userId) ? getContrastTextColor(member.color) : member.color,
              borderColor: member.color,
            }"
            @click="toggleMember(member.userId)"
          >
            {{ member.name }}
          </button>
        </div>
        <p v-if="calendarStore.error || todoStore.error" class="error" style="margin-top: 0.5rem">
          {{ calendarStore.error || todoStore.error }}
        </p>
      </div>

      <div class="card">
        <div class="calendar-toolbar">
          <div class="calendar-view-toggle">
            <button type="button" :class="['filter-select', { 'nav-link-active': calendarView === 'list' }]" @click="calendarView = 'list'">Liste</button>
            <button type="button" :class="['filter-select', { 'nav-link-active': calendarView === 'day' }]" @click="calendarView = 'day'">1 Tag</button>
            <button type="button" :class="['filter-select', { 'nav-link-active': calendarView === 'three-day' }]" @click="calendarView = 'three-day'">3 Tage</button>
            <button type="button" :class="['filter-select', { 'nav-link-active': calendarView === 'week' }]" @click="calendarView = 'week'">Woche</button>
            <button type="button" :class="['filter-select', { 'nav-link-active': calendarView === 'month' }]" @click="calendarView = 'month'">Monat</button>
          </div>

          <div v-if="calendarView !== 'list'" class="calendar-period-navigation">
            <button type="button" class="filter-select" @click="movePeriod(-1)">‹</button>
            <button type="button" class="filter-select" @click="goToToday">Heute</button>
            <button type="button" class="filter-select" @click="movePeriod(1)">›</button>
            <span class="calendar-period-label">{{ periodLabel }}</span>
          </div>
        </div>

        <div v-if="calendarView === 'list'" class="table-container">
          <table class="table">
            <thead>
              <tr><th></th><th>Person</th><th>Typ</th><th>Titel</th><th>Datum</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="item in visibleItems"
                :key="item.id"
                :class="{ 'table-row--muted': item.type === 'todo' && item.isDone }"
              >
                <td>
                  <span :style="{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: item.memberColor, flexShrink: '0' }"></span>
                </td>
                <td>{{ item.memberName }}</td>
                <td>{{ item.type === 'todo' ? '✓ Aufgabe' : '● Ereignis' }}</td>
                <td>
                  <button
                    type="button"
                    class="calendar-item-link"
                    :style="item.type === 'todo' && item.isDone ? 'text-decoration:line-through;opacity:0.6' : ''"
                    @click="openItemDetails(item)"
                  >
                    {{ item.title }}
                  </button>
                </td>
                <td>{{ formatDt(item.startUtc) }}</td>
              </tr>
              <tr v-if="visibleItems.length === 0">
                <td colspan="5" class="table-empty">Keine Einträge.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-else-if="calendarView !== 'month'"
          class="calendar-day-grid"
          :style="{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }"
        >
          <div
            v-for="day in currentDayColumns"
            :key="day.key"
            :class="['calendar-day-column', { 'calendar-day-column--today': isToday(day.date) }]"
          >
            <div class="calendar-day-column__header">
              <span>{{ formatWeekDayLabel(day.date) }}</span>
              <strong>{{ formatShortDate(day.date) }}</strong>
            </div>

            <div class="calendar-day-column__events">
              <button
                v-for="item in day.items"
                :key="item.id"
                type="button"
                :class="[
                  'calendar-event-chip',
                  'calendar-item-button',
                  { 'calendar-event-chip--todo': item.type === 'todo' },
                  { 'calendar-event-chip--done': item.type === 'todo' && item.isDone },
                ]"
                :style="chipStyle(item.memberColor)"
                @click="openItemDetails(item)"
              >
                <span class="calendar-event-chip__time">{{ formatItemTime(item) }}</span>
                <span class="calendar-event-chip__title">{{ item.title }}</span>
                <span class="calendar-event-chip__member">{{ item.memberName }}</span>
              </button>

              <p v-if="day.items.length === 0" class="calendar-empty-day">Keine Einträge</p>
            </div>
          </div>
        </div>

        <div v-else class="calendar-month-grid">
          <div
            v-for="day in monthDays"
            :key="day.key"
            :class="[
              'calendar-month-cell',
              { 'calendar-month-cell--outside': !day.isCurrentMonth, 'calendar-month-cell--today': isToday(day.date) },
            ]"
          >
            <div class="calendar-month-cell__header">{{ day.date.getDate() }}</div>

            <div class="calendar-month-cell__events">
              <button
                v-for="item in day.items.slice(0, maxMonthItems)"
                :key="`${day.key}-${item.id}`"
                type="button"
                :class="[
                  'calendar-month-event',
                  'calendar-item-button',
                  { 'calendar-month-event--todo': item.type === 'todo' },
                  { 'calendar-month-event--done': item.type === 'todo' && item.isDone },
                ]"
                :style="chipStyle(item.memberColor)"
                @click="openItemDetails(item)"
              >
                <span class="calendar-month-event__time">{{ formatMonthItemTime(item) }}</span>
                <span class="calendar-month-event__title">{{ item.title }}</span>
              </button>

              <p v-if="day.items.length === 0" class="calendar-month-empty">–</p>
              <button
                v-else-if="day.items.length > maxMonthItems"
                type="button"
                class="calendar-month-more calendar-month-more-btn"
                @click="openDayFromMonth(day.date)"
              >
                +{{ day.items.length - maxMonthItems }} mehr anzeigen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedItem" class="card calendar-detail-card">
        <div class="calendar-detail-header">
          <h3>Eintrag-Details</h3>
          <button type="button" class="filter-select" @click="closeItemDetails">Schließen</button>
        </div>
        <div class="calendar-detail-grid">
          <div>
            <span class="muted">Titel</span>
            <p>{{ selectedItem.title }}</p>
          </div>
          <div>
            <span class="muted">Typ</span>
            <p>{{ selectedItem.type === 'todo' ? 'Aufgabe' : 'Ereignis' }}</p>
          </div>
          <div>
            <span class="muted">Mitglied</span>
            <p>{{ selectedItem.memberName }}</p>
          </div>
          <div>
            <span class="muted">Zeit</span>
            <p>{{ formatDetailDateRange(selectedItem) }}</p>
          </div>
          <div v-if="selectedItem.type === 'todo'">
            <span class="muted">Status</span>
            <p>{{ selectedItem.isDone ? 'Erledigt' : 'Offen' }}</p>
          </div>
        </div>
        <div v-if="selectedItem.description" class="calendar-detail-description">
          <span class="muted">Beschreibung</span>
          <p>{{ selectedItem.description }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
