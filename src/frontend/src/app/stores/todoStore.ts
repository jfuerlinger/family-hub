import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TodoItem, CreateTodoRequest } from '../types/todo'
import { getTodos, createTodo, markTodoDone, markTodoPending } from '../api/todosApi'

export const useTodoStore = defineStore('todos', () => {
  const todos = ref<TodoItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadTodos(familyId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      todos.value = await getTodos(familyId)
    } catch {
      error.value = 'Aufgaben konnten nicht geladen werden.'
    } finally {
      loading.value = false
    }
  }

  async function addTodo(familyId: string, request: CreateTodoRequest): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const todo = await createTodo(familyId, request)
      todos.value.unshift(todo)
    } catch {
      error.value = 'Aufgabe konnte nicht erstellt werden.'
    } finally {
      loading.value = false
    }
  }

  async function toggleDone(familyId: string, todoId: string, isDone: boolean): Promise<void> {
    try {
      const updated = isDone
        ? await markTodoPending(familyId, todoId)
        : await markTodoDone(familyId, todoId)
      const idx = todos.value.findIndex(t => t.id === todoId)
      if (idx !== -1) todos.value[idx] = updated
    } catch {
      error.value = 'Status konnte nicht geändert werden.'
    }
  }

  return { todos, loading, error, loadTodos, addTodo, toggleDone }
})
