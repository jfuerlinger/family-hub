import { apiClient } from './client'
import type { CalendarEvent, CreateCalendarEventRequest, FamilyCalendarEvent } from '../types/calendar'

export async function getMyEvents(): Promise<CalendarEvent[]> {
  const response = await apiClient.get<CalendarEvent[]>('/events')
  return response.data
}

export async function createEvent(request: CreateCalendarEventRequest): Promise<CalendarEvent> {
  const response = await apiClient.post<CalendarEvent>('/events', request)
  return response.data
}

export async function getFamilyEvents(familyId: string): Promise<FamilyCalendarEvent[]> {
  const response = await apiClient.get<FamilyCalendarEvent[]>(`/families/${familyId}/events`)
  return response.data
}
