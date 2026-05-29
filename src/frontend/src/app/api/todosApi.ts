import { apiClient } from './client'
import type { TodoItem, CreateTodoRequest } from '../types/todo'

export async function getTodos(familyId: string): Promise<TodoItem[]> {
  const response = await apiClient.get<TodoItem[]>(`/families/${familyId}/todos`)
  return response.data
}

export async function createTodo(familyId: string, request: CreateTodoRequest): Promise<TodoItem> {
  const response = await apiClient.post<TodoItem>(`/families/${familyId}/todos`, request)
  return response.data
}

export async function markTodoDone(familyId: string, todoId: string): Promise<TodoItem> {
  const response = await apiClient.patch<TodoItem>(`/families/${familyId}/todos/${todoId}/done`)
  return response.data
}

export async function markTodoPending(familyId: string, todoId: string): Promise<TodoItem> {
  const response = await apiClient.patch<TodoItem>(`/families/${familyId}/todos/${todoId}/pending`)
  return response.data
}
