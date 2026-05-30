import Foundation

extension APIClient {
    func getTodos(familyId: UUID) async throws -> [TodoItem] {
        try await get("api/families/\(familyId)/todos")
    }

    func createTodo(familyId: UUID, request: CreateTodoRequest) async throws -> TodoItem {
        try await post("api/families/\(familyId)/todos", body: request)
    }

    func markTodoDone(familyId: UUID, todoId: UUID) async throws -> TodoItem {
        try await patch("api/families/\(familyId)/todos/\(todoId)/done")
    }

    func markTodoPending(familyId: UUID, todoId: UUID) async throws -> TodoItem {
        try await patch("api/families/\(familyId)/todos/\(todoId)/pending")
    }
}
