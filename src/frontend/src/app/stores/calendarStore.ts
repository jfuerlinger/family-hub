import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CalendarEvent, CreateCalendarEventRequest, FamilyCalendarEvent } from '../types/calendar'
import { getMyEvents, createEvent, getFamilyEvents } from '../api/calendarApi'

export const useCalendarStore = defineStore('calendar', () => {
  const myEvents = ref<CalendarEvent[]>([])
  const familyEvents = ref<FamilyCalendarEvent[]>([])
  const hiddenMemberIds = ref<Set<string>>(new Set())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadMyEvents(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      myEvents.value = await getMyEvents()
    } catch {
      error.value = 'Ereignisse konnten nicht geladen werden.'
    } finally {
      loading.value = false
    }
  }

  async function addEvent(request: CreateCalendarEventRequest): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const event = await createEvent(request)
      myEvents.value.push(event)
    } catch {
      error.value = 'Ereignis konnte nicht erstellt werden.'
    } finally {
      loading.value = false
    }
  }

  async function loadFamilyEvents(familyId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      familyEvents.value = await getFamilyEvents(familyId)
    } catch {
      error.value = 'Familienereignisse konnten nicht geladen werden.'
    } finally {
      loading.value = false
    }
  }

  function toggleMemberVisibility(userId: string): void {
    if (hiddenMemberIds.value.has(userId)) {
      hiddenMemberIds.value.delete(userId)
    } else {
      hiddenMemberIds.value.add(userId)
    }
  }

  function isMemberVisible(userId: string): boolean {
    return !hiddenMemberIds.value.has(userId)
  }

  const visibleFamilyEvents = () =>
    familyEvents.value.filter(e => !hiddenMemberIds.value.has(e.userId))

  return {
    myEvents, familyEvents, hiddenMemberIds, loading, error,
    loadMyEvents, addEvent, loadFamilyEvents, toggleMemberVisibility, isMemberVisible, visibleFamilyEvents,
  }
})
