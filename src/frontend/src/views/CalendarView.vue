<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCalendarStore } from '../app/stores/calendarStore'
import { useFamilyStore } from '../app/stores/familyStore'
import { useTodoStore } from '../app/stores/todoStore'
import type { CalendarRecurrence } from '../app/types/calendar'
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

const tab = ref<'calendar' | 'personal'>('calendar')
const calendarView = ref<FamilyCalendarView>('week')
const focusDate = ref(startOfLocalDay(new Date()))
const maxMonthItems = 3
const showDoneTodos = ref(false)

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

  // Include orphaned assignees not in the family members list
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
      // Open todos before done todos
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

// ─── Personal event form ───────────────────────────────────────────────────

const isRecurring = computed(() => newRecurrence.value !== 'none')

async function addEvent(): Promise<void> {
  if (!newTitle.value.trim() || !newStart.value || !newEnd.value) return

  const parsedRecurrenceCount = newRecurrenceCount.value.trim()
    ? Number.parseInt(newRecurrenceCount.value.trim(), 10)
    : null

  const recurrenceCount = parsedRecurrenceCount && parsedRecurrenceCount > 0
    ? parsedRecurrenceCount
    : null

  if (isRecurring.value && !newRecurrenceUntil.value && recurrenceCount === null) return

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
  })

  if (!calendarStore.error) {
    newTitle.value = ''
    newDescription.value = ''
    newStart.value = ''
    newEnd.value = ''
    newAllDay.value = false
    newRecurrence.value = 'none'
    newRecurrenceInterval.value = 1
    newRecurrenceUntil.value = ''
    newRecurrenceCount.value = ''
  }
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
        <button type="button" :class="['filter-select', { 'nav-link-active': tab === 'calendar' }]" @click="tab = 'calendar'">Kalender</button>
        <button type="button" :class="['filter-select', { 'nav-link-active': tab === 'personal' }]" @click="tab = 'personal'">Persönliche Ereignisse</button>
      </div>
    </div>

    <!-- ── Personal events tab ── -->
    <template v-if="tab === 'personal'">
      <div class="card">
        <h3>Neues persönliches Ereignis</h3>
        <form @submit.prevent="addEvent">
          <div class="form" style="margin-bottom: 0.5rem">
            <input v-model.trim="newTitle" type="text" placeholder="Titel" required />
            <input v-model.trim="newDescription" type="text" placeholder="Beschreibung (optional)" />
            <input v-model="newStart" type="datetime-local" required />
            <input v-model="newEnd" type="datetime-local" required />
            <label style="display:flex;align-items:center;gap:0.4rem">
              <input v-model="newAllDay" type="checkbox" />
              Ganztägig
            </label>
            <select v-model="newRecurrence">
              <option value="none">Keine Serie</option>
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
            <template v-if="isRecurring">
              <input v-model.number="newRecurrenceInterval" type="number" min="1" step="1" placeholder="Intervall" />
              <input v-model="newRecurrenceUntil" type="datetime-local" placeholder="Serie bis" />
              <input v-model="newRecurrenceCount" type="number" min="1" step="1" placeholder="Anzahl (optional)" />
            </template>
          </div>
          <button type="submit" class="btn-primary" :disabled="calendarStore.loading">Ereignis erstellen</button>
        </form>
        <p v-if="calendarStore.error" class="error" style="margin-top: 0.5rem">{{ calendarStore.error }}</p>
        <p v-if="isRecurring" class="muted" style="margin-top: 0.5rem">
          Für Serientermine muss mindestens „Serie bis" oder eine „Anzahl" gesetzt sein.
        </p>
      </div>

      <div class="card">
        <h3>Meine Ereignisse</h3>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr><th>Titel</th><th>Start</th><th>Ende</th><th>Ganztägig</th></tr>
            </thead>
            <tbody>
              <tr v-for="event in calendarStore.myEvents" :key="event.id">
                <td>{{ event.title }}</td>
                <td>{{ formatDt(event.startUtc) }}</td>
                <td>{{ formatDt(event.endUtc) }}</td>
                <td>{{ event.allDay ? 'Ja' : 'Nein' }}</td>
              </tr>
              <tr v-if="calendarStore.myEvents.length === 0">
                <td colspan="4" class="table-empty">Keine Ereignisse.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ── Calendar tab ── -->
    <template v-else>
      <div v-if="!family" class="card">
        <p class="muted">Keine Familie ausgewählt. Gehe zu <RouterLink to="/settings">Einstellungen</RouterLink>.</p>
      </div>

      <template v-else>
        <!-- Member filter -->
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

        <!-- Calendar grid -->
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

          <!-- List view -->
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
                  <td :style="item.type === 'todo' && item.isDone ? 'text-decoration:line-through;opacity:0.6' : ''">{{ item.title }}</td>
                  <td>{{ formatDt(item.startUtc) }}</td>
                </tr>
                <tr v-if="visibleItems.length === 0">
                  <td colspan="5" class="table-empty">Keine Einträge.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Day / 3-day / Week views -->
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
                <div
                  v-for="item in day.items"
                  :key="item.id"
                  :class="[
                    'calendar-event-chip',
                    { 'calendar-event-chip--todo': item.type === 'todo' },
                    { 'calendar-event-chip--done': item.type === 'todo' && item.isDone },
                  ]"
                  :style="chipStyle(item.memberColor)"
                >
                  <span class="calendar-event-chip__time">{{ formatItemTime(item) }}</span>
                  <span class="calendar-event-chip__title">{{ item.title }}</span>
                  <span class="calendar-event-chip__member">{{ item.memberName }}</span>
                </div>

                <p v-if="day.items.length === 0" class="calendar-empty-day">Keine Einträge</p>
              </div>
            </div>
          </div>

          <!-- Month view -->
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
                <div
                  v-for="item in day.items.slice(0, maxMonthItems)"
                  :key="`${day.key}-${item.id}`"
                  :class="[
                    'calendar-month-event',
                    { 'calendar-month-event--todo': item.type === 'todo' },
                    { 'calendar-month-event--done': item.type === 'todo' && item.isDone },
                  ]"
                  :style="chipStyle(item.memberColor)"
                >
                  <span class="calendar-month-event__time">{{ formatMonthItemTime(item) }}</span>
                  <span class="calendar-month-event__title">{{ item.title }}</span>
                </div>

                <p v-if="day.items.length === 0" class="calendar-month-empty">–</p>
                <p v-else-if="day.items.length > maxMonthItems" class="calendar-month-more">
                  +{{ day.items.length - maxMonthItems }} mehr
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
