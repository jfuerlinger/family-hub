export interface CalendarEvent {
  id: string
  userId: string
  title: string
  description: string | null
  startUtc: string
  endUtc: string
  allDay: boolean
  createdAtUtc: string
}

export type CalendarRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface CreateCalendarEventRequest {
  title: string
  description?: string | null
  startUtc: string
  endUtc: string
  allDay?: boolean
  recurrence?: CalendarRecurrence
  recurrenceInterval?: number
  recurrenceUntilUtc?: string | null
  recurrenceCount?: number | null
}

export interface FamilyCalendarEvent extends CalendarEvent {
  memberColor: string
  memberName: string
}
