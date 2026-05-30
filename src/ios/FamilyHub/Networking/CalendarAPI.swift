import Foundation

extension APIClient {
    func getMyEvents() async throws -> [CalendarEvent] {
        try await get("api/events")
    }

    func getFamilyEvents(familyId: UUID) async throws -> [FamilyCalendarEvent] {
        try await get("api/families/\(familyId)/events")
    }

    func createEvent(_ request: CreateCalendarEventRequest) async throws -> CalendarEvent {
        try await post("api/events", body: request)
    }

    func deleteEvent(id: UUID) async throws {
        try await deleteResource("api/events/\(id)")
    }
}
