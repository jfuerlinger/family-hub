import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTodoStore } from '../app/stores/todoStore'
import * as todosApi from '../app/api/todosApi'
import type { TodoItem } from '../app/types/todo'

const mockTodo: TodoItem = {
  id: 'todo-1',
  familyId: 'fam-1',
  title: 'Einkaufen',
  description: null,
  isDone: false,
  assignedToUserId: null,
  dueDate: null,
  createdAt: '2024-01-01T00:00:00Z',
  doneAt: null,
}

describe('todoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('loads todos for a family', async () => {
    vi.spyOn(todosApi, 'getTodos').mockResolvedValue([mockTodo])

    const store = useTodoStore()
    await store.loadTodos('fam-1')

    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].title).toBe('Einkaufen')
  })

  it('adds a todo at the front of the list', async () => {
    vi.spyOn(todosApi, 'createTodo').mockResolvedValue({ ...mockTodo, id: 'todo-2', title: 'Kochen' })

    const store = useTodoStore()
    store.todos = [mockTodo]
    await store.addTodo('fam-1', { title: 'Kochen' })

    expect(store.todos[0].title).toBe('Kochen')
    expect(store.todos).toHaveLength(2)
  })

  it('toggles done state', async () => {
    const doneTodo = { ...mockTodo, isDone: true, doneAt: '2024-01-02T00:00:00Z' }
    vi.spyOn(todosApi, 'markTodoDone').mockResolvedValue(doneTodo)

    const store = useTodoStore()
    store.todos = [mockTodo]
    await store.toggleDone('fam-1', 'todo-1', false)

    expect(store.todos[0].isDone).toBe(true)
  })
})
