export interface TodoItem {
  id: string
  familyId: string
  title: string
  description: string | null
  isDone: boolean
  assignedToUserId: string | null
  dueDateUtc: string | null
  createdAtUtc: string
  completedAtUtc: string | null
}

export interface CreateTodoRequest {
  title: string
  description?: string | null
  dueDateUtc?: string | null
  assignedToUserId?: string | null
}
