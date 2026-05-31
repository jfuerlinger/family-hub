<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCalendarStore } from '../app/stores/calendarStore'
import { useFamilyStore } from '../app/stores/familyStore'
import type { CalendarRecurrence, FamilyCalendarEvent } from '../app/types/calendar'
import type { CalendarDayCell } from '../app/utils/calendarView'
import {
  addDays,
  createMonthDays,
  createWeekDays,
  eventsForDay,
  formatMonthLabel,
  getContrastTextColor,
  startOfLocalDay,
} from '../app/utils/calendarView'

type FamilyCalendarView = 'list' | 'week' | 'month'
interface CalendarDayWithEvents extends CalendarDayCell {
  events: FamilyCalendarEvent[]
}

const calendarStore = useCalendarStore()
const familyStore = useFamilyStore()

const tab = ref<'personal' | 'family'>('personal')
const familyView = ref<FamilyCalendarView>('list')
const focusDate = ref(startOfLocalDay(new Date()))
const maxMonthEvents = 3

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
      calendarStore.hiddenMemberIds.clear()
    }

    await calendarStore.loadFamilyEvents(familyId)
  },
  { immediate: true },
)

onMounted(async () => {
  await Promise.all([
    familyStore.loadFamilies(),
    calendarStore.loadMyEvents(),
  ])
})

const family = computed(() => familyStore.selectedFamily())

const uniqueMembers = computed(() => {
  const map = new Map<string, { userId: string; name: string; color: string }>()
  calendarStore.familyEvents.forEach(event => {
    if (!map.has(event.userId)) {
      map.set(event.userId, {
        userId: event.userId,
        name: event.memberName,
        color: event.memberColor,
      })
    }
  })

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'de-AT'))
})

const visibleEvents = computed<FamilyCalendarEvent[]>(() =>
  [...calendarStore.visibleFamilyEvents()].sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime()),
)
const isRecurring = computed(() => newRecurrence.value !== 'none')

const weekDays = computed<CalendarDayWithEvents[]>(() =>
  createWeekDays(focusDate.value).map(day => ({
    ...day,
    events: eventsForDay(visibleEvents.value, day.date),
  })),
)

const monthDays = computed<CalendarDayWithEvents[]>(() =>
  createMonthDays(focusDate.value).map(day => ({
    ...day,
    events: eventsForDay(visibleEvents.value, day.date),
  })),
)

const periodLabel = computed(() => {
  if (familyView.value === 'week') {
    const first = weekDays.value[0]
    const last = weekDays.value[weekDays.value.length - 1]
    if (!first || !last) {
      return ''
    }

    return `${formatShortDate(first.date)} - ${formatShortDate(last.date)}`
  }

  if (familyView.value === 'month') {
    return formatMonthLabel(focusDate.value, 'de-AT')
  }

  return ''
})

async function addEvent() {
  if (!newTitle.value.trim() || !newStart.value || !newEnd.value) {
    return
  }

  const parsedRecurrenceCount = newRecurrenceCount.value.trim()
    ? Number.parseInt(newRecurrenceCount.value.trim(), 10)
    : null

  const recurrenceCount = parsedRecurrenceCount && parsedRecurrenceCount > 0
    ? parsedRecurrenceCount
    : null

  if (isRecurring.value && !newRecurrenceUntil.value && recurrenceCount === null) {
    return
  }

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

function formatDt(iso: string): string {
  return new Date(iso).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' })
}

function formatWeekDayLabel(date: Date): string {
  return date.toLocaleDateString('de-AT', { weekday: 'short' })
}

function formatEventTime(event: FamilyCalendarEvent): string {
  if (event.allDay) {
    return 'Ganztägig'
  }

  const start = new Date(event.startUtc)
  const end = new Date(event.endUtc)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return ''
  }

  return `${start.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}-${end.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}`
}

function formatMonthEventTime(event: FamilyCalendarEvent): string {
  if (event.allDay) {
    return 'Ganztägig'
  }

  return new Date(event.startUtc).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })
}

function eventChipStyle(color: string): Record<string, string> {
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

function movePeriod(step: number): void {
  if (familyView.value === 'week') {
    focusDate.value = startOfLocalDay(addDays(focusDate.value, step * 7))
    return
  }

  if (familyView.value === 'month') {
    const shifted = new Date(focusDate.value)
    shifted.setDate(1)
    shifted.setMonth(shifted.getMonth() + step)
    focusDate.value = startOfLocalDay(shifted)
  }
}

function goToToday(): void {
  focusDate.value = startOfLocalDay(new Date())
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1>Kalender</h1>
      <div class="view-header-actions">
        <button type="button" :class="['filter-select', { 'nav-link-active': tab === 'personal' }]" @click="tab = 'personal'">Persönlich</button>
        <button type="button" :class="['filter-select', { 'nav-link-active': tab === 'family' }]" @click="tab = 'family'">Familie</button>
      </div>
    </div>

    <template v-if="tab === 'personal'">
      <div class="card">
        <h3>Neues Ereignis</h3>
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
          Für Serientermine muss mindestens „Serie bis“ oder eine „Anzahl“ gesetzt sein.
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

    <template v-else>
      <div v-if="!family" class="card">
        <p class="muted">Keine Familie ausgewählt. Gehe zu <RouterLink to="/family">Familie</RouterLink>.</p>
      </div>

      <template v-else>
        <div class="card">
          <h3>Mitglieder anzeigen/ausblenden</h3>
          <div class="filter-bar">
            <button
              v-for="member in uniqueMembers"
              :key="member.userId"
              type="button"
              :style="{
                borderColor: member.color,
                color: calendarStore.isMemberVisible(member.userId) ? '#fff' : member.color,
                background: calendarStore.isMemberVisible(member.userId) ? member.color : 'transparent',
                borderRadius: '999px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: `2px solid ${member.color}`,
              }"
              @click="calendarStore.toggleMemberVisibility(member.userId)"
            >
              {{ member.name }}
            </button>
          </div>
        </div>

        <div class="card">
          <div class="calendar-toolbar">
            <h3>Familienereignisse</h3>

            <div class="calendar-toolbar__actions">
              <div class="calendar-view-toggle">
                <button type="button" :class="['filter-select', { 'nav-link-active': familyView === 'list' }]" @click="familyView = 'list'">Liste</button>
                <button type="button" :class="['filter-select', { 'nav-link-active': familyView === 'week' }]" @click="familyView = 'week'">Woche</button>
                <button type="button" :class="['filter-select', { 'nav-link-active': familyView === 'month' }]" @click="familyView = 'month'">Monat</button>
              </div>

              <div v-if="familyView !== 'list'" class="calendar-period-navigation">
                <button type="button" class="filter-select" @click="movePeriod(-1)">Zurück</button>
                <button type="button" class="filter-select" @click="goToToday">Heute</button>
                <button type="button" class="filter-select" @click="movePeriod(1)">Weiter</button>
                <span class="calendar-period-label">{{ periodLabel }}</span>
              </div>
            </div>
          </div>

          <div v-if="familyView === 'list'" class="table-container">
            <table class="table">
              <thead>
                <tr><th>Farbe</th><th>Person</th><th>Titel</th><th>Start</th><th>Ende</th></tr>
              </thead>
              <tbody>
                <tr v-for="event in visibleEvents" :key="event.id">
                  <td>
                    <span :style="{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: event.memberColor }"></span>
                  </td>
                  <td>{{ event.memberName }}</td>
                  <td>{{ event.title }}</td>
                  <td>{{ formatDt(event.startUtc) }}</td>
                  <td>{{ formatDt(event.endUtc) }}</td>
                </tr>
                <tr v-if="visibleEvents.length === 0">
                  <td colspan="5" class="table-empty">Keine Ereignisse.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else-if="familyView === 'week'" class="calendar-week-grid">
            <div v-for="day in weekDays" :key="day.key" :class="['calendar-day-column', { 'calendar-day-column--today': isToday(day.date) }]">
              <div class="calendar-day-column__header">
                <span>{{ formatWeekDayLabel(day.date) }}</span>
                <strong>{{ formatShortDate(day.date) }}</strong>
              </div>

              <div class="calendar-day-column__events">
                <div
                  v-for="event in day.events"
                  :key="event.id"
                  class="calendar-event-chip"
                  :style="eventChipStyle(event.memberColor)"
                >
                  <span class="calendar-event-chip__time">{{ formatEventTime(event) }}</span>
                  <span class="calendar-event-chip__title">{{ event.title }}</span>
                  <span class="calendar-event-chip__member">{{ event.memberName }}</span>
                </div>

                <p v-if="day.events.length === 0" class="calendar-empty-day">Keine Ereignisse</p>
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
                <div
                  v-for="event in day.events.slice(0, maxMonthEvents)"
                  :key="`${day.key}-${event.id}`"
                  class="calendar-month-event"
                  :style="eventChipStyle(event.memberColor)"
                >
                  <span class="calendar-month-event__time">{{ formatMonthEventTime(event) }}</span>
                  <span class="calendar-month-event__title">{{ event.title }}</span>
                </div>

                <p v-if="day.events.length === 0" class="calendar-month-empty">–</p>
                <p v-else-if="day.events.length > maxMonthEvents" class="calendar-month-more">
                  +{{ day.events.length - maxMonthEvents }} mehr
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
