import type { TodoItem } from '../types/todo'
import { addDays, startOfLocalDay, startOfWeek } from './calendarView'

export type TodoStatusFilter = 'all' | 'open' | 'done'
export type TodoAssigneeFilter = 'all' | 'unassigned' | string
export type TodoDueDateFilter = 'all' | 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth'

export interface TodoFilters {
  status: TodoStatusFilter
  assignee: TodoAssigneeFilter
  dueDate: TodoDueDateFilter
}

export function filterTodos(todos: TodoItem[], filters: TodoFilters, referenceDate = new Date()): TodoItem[] {
  const referenceDayStart = startOfLocalDay(referenceDate)

  return todos.filter(todo => {
    if (filters.status === 'open' && todo.isDone) {
      return false
    }

    if (filters.status === 'done' && !todo.isDone) {
      return false
    }

    if (filters.assignee === 'unassigned' && todo.assignedToUserId !== null) {
      return false
    }

    if (filters.assignee !== 'all' && filters.assignee !== 'unassigned' && todo.assignedToUserId !== filters.assignee) {
      return false
    }

    if (filters.dueDate === 'all') {
      return true
    }

    if (!todo.dueDateUtc) {
      return false
    }

    const dueDate = new Date(todo.dueDateUtc)
    if (Number.isNaN(dueDate.getTime())) {
      return false
    }

    const dueDayStart = startOfLocalDay(dueDate)
    const dueTimestamp = dueDayStart.getTime()

    if (filters.dueDate === 'today') {
      return dueTimestamp === referenceDayStart.getTime()
    }

    if (filters.dueDate === 'tomorrow') {
      return dueTimestamp === addDays(referenceDayStart, 1).getTime()
    }

    if (filters.dueDate === 'thisWeek') {
      const weekStart = startOfWeek(referenceDayStart)
      const nextWeekStart = addDays(weekStart, 7)
      return dueDayStart >= weekStart && dueDayStart < nextWeekStart
    }

    if (filters.dueDate === 'nextWeek') {
      const nextWeekStart = addDays(startOfWeek(referenceDayStart), 7)
      const weekAfterNextStart = addDays(nextWeekStart, 7)
      return dueDayStart >= nextWeekStart && dueDayStart < weekAfterNextStart
    }

    return dueDayStart.getFullYear() === referenceDayStart.getFullYear() && dueDayStart.getMonth() === referenceDayStart.getMonth()
  })
}
