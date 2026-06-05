import { describe, expect, it } from 'vitest'
import type { TodoItem } from '../app/types/todo'
import { filterTodos } from '../app/utils/todoFilters'

function createTodo(overrides: Partial<TodoItem>): TodoItem {
  return {
    id: overrides.id ?? 'todo-1',
    familyId: 'fam-1',
    title: 'Aufgabe',
    description: null,
    isDone: false,
    assignedToUserId: null,
    dueDateUtc: null,
    createdAtUtc: '2026-06-05T08:00:00Z',
    completedAtUtc: null,
    ...overrides,
  }
}

describe('todoFilters', () => {
  const now = new Date(2026, 5, 5, 12, 0, 0, 0)

  it('filters by assigned person', () => {
    const assigned = createTodo({ id: 'assigned', assignedToUserId: 'user-1' })
    const unassigned = createTodo({ id: 'unassigned', assignedToUserId: null })

    const result = filterTodos(
      [assigned, unassigned],
      { status: 'all', assignee: 'user-1', dueDate: 'all' },
      now,
    )

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('assigned')
  })

  it('filters for unassigned todos', () => {
    const assigned = createTodo({ id: 'assigned', assignedToUserId: 'user-1' })
    const unassigned = createTodo({ id: 'unassigned', assignedToUserId: null })

    const result = filterTodos(
      [assigned, unassigned],
      { status: 'all', assignee: 'unassigned', dueDate: 'all' },
      now,
    )

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('unassigned')
  })

  it('filters by due date windows', () => {
    const todos = [
      createTodo({ id: 'today', dueDateUtc: new Date(2026, 5, 5, 8, 0, 0, 0).toISOString() }),
      createTodo({ id: 'tomorrow', dueDateUtc: new Date(2026, 5, 6, 8, 0, 0, 0).toISOString() }),
      createTodo({ id: 'next-week', dueDateUtc: new Date(2026, 5, 9, 8, 0, 0, 0).toISOString() }),
      createTodo({ id: 'this-month', dueDateUtc: new Date(2026, 5, 25, 8, 0, 0, 0).toISOString() }),
      createTodo({ id: 'other-month', dueDateUtc: new Date(2026, 6, 2, 8, 0, 0, 0).toISOString() }),
      createTodo({ id: 'without-due', dueDateUtc: null }),
    ]

    expect(filterTodos(todos, { status: 'all', assignee: 'all', dueDate: 'today' }, now).map(t => t.id)).toEqual(['today'])
    expect(filterTodos(todos, { status: 'all', assignee: 'all', dueDate: 'tomorrow' }, now).map(t => t.id)).toEqual([
      'tomorrow',
    ])
    expect(filterTodos(todos, { status: 'all', assignee: 'all', dueDate: 'thisWeek' }, now).map(t => t.id)).toEqual([
      'today',
      'tomorrow',
    ])
    expect(filterTodos(todos, { status: 'all', assignee: 'all', dueDate: 'nextWeek' }, now).map(t => t.id)).toEqual([
      'next-week',
    ])
    expect(filterTodos(todos, { status: 'all', assignee: 'all', dueDate: 'thisMonth' }, now).map(t => t.id)).toEqual([
      'today',
      'tomorrow',
      'next-week',
      'this-month',
    ])
  })
})
