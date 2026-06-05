import { describe, expect, it } from 'vitest'
import {
  createMonthDays,
  createOneDayDays,
  createThreeDayDays,
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

  it('createOneDayDays returns exactly one day cell for the anchor date', () => {
    const anchor = new Date(2026, 5, 15, 14, 0, 0)
    const days = createOneDayDays(anchor)
    expect(days).toHaveLength(1)
    expect(days[0].date.getFullYear()).toBe(2026)
    expect(days[0].date.getMonth()).toBe(5)
    expect(days[0].date.getDate()).toBe(15)
    expect(days[0].date.getHours()).toBe(0)
  })

  it('createThreeDayDays returns three consecutive days starting at the anchor date', () => {
    const anchor = new Date(2026, 5, 15, 14, 0, 0)
    const days = createThreeDayDays(anchor)
    expect(days).toHaveLength(3)
    expect(days[0].date.getDate()).toBe(15)
    expect(days[1].date.getDate()).toBe(16)
    expect(days[2].date.getDate()).toBe(17)
    days.forEach(day => expect(day.date.getHours()).toBe(0))
  })

  it('todo mapped as full-day interval appears on correct day via eventsForDay', () => {
    // Simulate how CalendarView converts a todo: startUtc = local day start, endUtc = next day start
    const dueDateLocal = new Date(2026, 5, 15, 0, 0, 0, 0)
    const nextDayLocal = new Date(2026, 5, 16, 0, 0, 0, 0)
    const todo: TestEvent = {
      id: 'todo-1',
      startUtc: dueDateLocal.toISOString(),
      endUtc: nextDayLocal.toISOString(),
    }

    expect(eventsForDay([todo], new Date(2026, 5, 15))).toHaveLength(1)
    expect(eventsForDay([todo], new Date(2026, 5, 14))).toHaveLength(0)
    expect(eventsForDay([todo], new Date(2026, 5, 16))).toHaveLength(0)
  })
})
