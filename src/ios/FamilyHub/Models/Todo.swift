import Foundation

struct TodoItem: Codable, Identifiable, Equatable {
    let id: UUID
    let familyId: UUID
    let title: String
    let description: String?
    let isDone: Bool
    let assignedToUserId: UUID?
    let dueDateUtc: Date?
    let createdAtUtc: Date
    let completedAtUtc: Date?

    var isOverdue: Bool {
        guard let due = dueDateUtc, !isDone else { return false }
        return due < Date()
    }
}

struct CreateTodoRequest: Encodable {
    let title: String
    let description: String?
    let dueDateUtc: String?
    let assignedToUserId: String?
}
