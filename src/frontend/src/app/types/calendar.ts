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

export interface CreateCalendarEventRequest {
  title: string
  description?: string | null
  startUtc: string
  endUtc: string
  allDay?: boolean
}

export interface FamilyCalendarEvent extends CalendarEvent {
  memberColor: string
  memberName: string
}
