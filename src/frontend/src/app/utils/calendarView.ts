export interface CalendarEventLike {
  startUtc: string
  endUtc: string
}

export interface CalendarDayCell {
  date: Date
  key: string
  isCurrentMonth: boolean
}

export function startOfLocalDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function startOfWeek(date: Date): Date {
  const dayStart = startOfLocalDay(date)
  const day = dayStart.getDay()
  const distanceToMonday = day === 0 ? -6 : 1 - day
  return addDays(dayStart, distanceToMonday)
}

export function createOneDayDays(anchorDate: Date): CalendarDayCell[] {
  const date = startOfLocalDay(anchorDate)
  return [{ date, key: toDateKey(date), isCurrentMonth: true }]
}

export function createThreeDayDays(anchorDate: Date): CalendarDayCell[] {
  const start = startOfLocalDay(anchorDate)
  return Array.from({ length: 3 }, (_, index) => {
    const date = addDays(start, index)
    return { date, key: toDateKey(date), isCurrentMonth: true }
  })
}

export function createWeekDays(anchorDate: Date): CalendarDayCell[] {
  const firstDay = startOfWeek(anchorDate)
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(firstDay, index)
    return {
      date,
      key: toDateKey(date),
      isCurrentMonth: true,
    }
  })
}

export function createMonthDays(anchorDate: Date): CalendarDayCell[] {
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const firstVisibleDay = startOfWeek(monthStart)
  const currentMonth = anchorDate.getMonth()

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(firstVisibleDay, index)
    return {
      date,
      key: toDateKey(date),
      isCurrentMonth: date.getMonth() === currentMonth,
    }
  })
}

export function eventsForDay<T extends CalendarEventLike>(events: T[], day: Date): T[] {
  const dayStart = startOfLocalDay(day)
  const nextDayStart = addDays(dayStart, 1)

  return events
    .filter(event => {
      const eventStart = new Date(event.startUtc)
      const eventEnd = new Date(event.endUtc)

      if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) {
        return false
      }

      return eventStart < nextDayStart && eventEnd > dayStart
    })
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())
}

export function getContrastTextColor(backgroundColor: string): '#111827' | '#ffffff' {
  const rgb = toRgb(backgroundColor)
  if (!rgb) {
    return '#111827'
  }

  const [red, green, blue] = rgb
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000
  return brightness >= 160 ? '#111827' : '#ffffff'
}

export function formatMonthLabel(date: Date, locale = 'de-AT'): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toRgb(color: string): [number, number, number] | null {
  const normalized = color.trim().replace(/^#/, '')

  if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
    const red = parseInt(normalized[0] + normalized[0], 16)
    const green = parseInt(normalized[1] + normalized[1], 16)
    const blue = parseInt(normalized[2] + normalized[2], 16)
    return [red, green, blue]
  }

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    const red = parseInt(normalized.slice(0, 2), 16)
    const green = parseInt(normalized.slice(2, 4), 16)
    const blue = parseInt(normalized.slice(4, 6), 16)
    return [red, green, blue]
  }

  return null
}
