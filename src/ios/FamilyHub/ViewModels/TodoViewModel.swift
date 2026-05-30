import Foundation

@MainActor
final class TodoViewModel: ObservableObject {
    @Published var todos: [TodoItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    var pendingTodos: [TodoItem] { todos.filter { !$0.isDone } }
    var doneTodos: [TodoItem]    { todos.filter {  $0.isDone } }

    private let api = APIClient.shared
    private let iso = ISO8601DateFormatter()

    func loadTodos(familyId: UUID) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            todos = try await api.getTodos(familyId: familyId)
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func createTodo(
        familyId: UUID,
        title: String,
        description: String?,
        dueDate: Date?,
        assignedToUserId: UUID?
    ) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        let request = CreateTodoRequest(
            title: title,
            description: description?.isEmpty == true ? nil : description,
            dueDateUtc: dueDate.map { iso.string(from: $0) },
            assignedToUserId: assignedToUserId?.uuidString
        )
        do {
            let todo = try await api.createTodo(familyId: familyId, request: request)
            todos.insert(todo, at: 0)
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleTodo(familyId: UUID, todo: TodoItem) async {
        do {
            let updated: TodoItem = todo.isDone
                ? try await api.markTodoPending(familyId: familyId, todoId: todo.id)
                : try await api.markTodoDone(familyId: familyId, todoId: todo.id)
            if let idx = todos.firstIndex(where: { $0.id == updated.id }) {
                todos[idx] = updated
            }
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
