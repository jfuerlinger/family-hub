import { describe, expect, it } from 'vitest'
import {
  createMonthDays,
  createWeekDays,
  eventsForDay,
  getContrastTextColor,
  startOfWeek,
} from '../app/utils/calendarView'

interface TestEvent {
  id: string
  startUtc: string
  endUtc: string
}

function toLocalIso(year: number, month: number, day: number, hour: number, minute = 0): string {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString()
}

describe('calendarView utils', () => {
  it('uses Monday as start of week', () => {
    const start = startOfWeek(new Date(2026, 5, 3, 12, 0, 0))
    expect(start.getDay()).toBe(1)

    const weekDays = createWeekDays(new Date(2026, 5, 3, 12, 0, 0))
    expect(weekDays).toHaveLength(7)
    expect(weekDays[0].date.getDay()).toBe(1)
    expect(weekDays[6].date.getDay()).toBe(0)
  })

  it('creates a 6x7 month grid', () => {
    const days = createMonthDays(new Date(2026, 4, 15))
    expect(days).toHaveLength(42)
    expect(days.filter(day => day.isCurrentMonth)).toHaveLength(31)
  })

  it('uses half-open day overlaps for events', () => {
    const events: TestEvent[] = [
      {
        id: 'late-evening',
        startUtc: toLocalIso(2026, 6, 10, 22),
        endUtc: toLocalIso(2026, 6, 11, 0),
      },
    ]

    expect(eventsForDay(events, new Date(2026, 5, 10))).toHaveLength(1)
    expect(eventsForDay(events, new Date(2026, 5, 11))).toHaveLength(0)
  })

  it('includes multi-day events on each overlapping day', () => {
    const event: TestEvent = {
      id: 'multi-day',
      startUtc: toLocalIso(2026, 6, 30, 10),
      endUtc: toLocalIso(2026, 7, 2, 9),
    }

    expect(eventsForDay([event], new Date(2026, 5, 30))).toHaveLength(1)
    expect(eventsForDay([event], new Date(2026, 6, 1))).toHaveLength(1)
    expect(eventsForDay([event], new Date(2026, 6, 2))).toHaveLength(1)
    expect(eventsForDay([event], new Date(2026, 6, 3))).toHaveLength(0)
  })

  it('chooses readable text color for event chips', () => {
    expect(getContrastTextColor('#ffffff')).toBe('#111827')
    expect(getContrastTextColor('#000000')).toBe('#ffffff')
    expect(getContrastTextColor('invalid')).toBe('#111827')
  })
})
