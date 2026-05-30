import Foundation
import SwiftUI

@MainActor
final class CalendarViewModel: ObservableObject {
    @Published var myEvents: [CalendarEvent] = []
    @Published var familyEvents: [FamilyCalendarEvent] = []
    @Published var hiddenMemberIds: Set<UUID> = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api = APIClient.shared
    private let iso = ISO8601DateFormatter()

    var visibleFamilyEvents: [FamilyCalendarEvent] {
        familyEvents
            .filter { !hiddenMemberIds.contains($0.userId) }
            .sorted { $0.startUtc < $1.startUtc }
    }

    var uniqueMembers: [(userId: UUID, name: String, color: Color)] {
        var seen = Set<UUID>()
        return familyEvents.compactMap { event in
            guard seen.insert(event.userId).inserted else { return nil }
            return (event.userId, event.memberName, event.swiftUIColor)
        }
    }

    func isMemberVisible(_ userId: UUID) -> Bool { !hiddenMemberIds.contains(userId) }

    func toggleMemberVisibility(_ userId: UUID) {
        if hiddenMemberIds.contains(userId) { hiddenMemberIds.remove(userId) }
        else { hiddenMemberIds.insert(userId) }
    }

    func loadMyEvents() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            myEvents = try await api.getMyEvents()
                .sorted { $0.startUtc < $1.startUtc }
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadFamilyEvents(familyId: UUID) async {
        do {
            familyEvents = try await api.getFamilyEvents(familyId: familyId)
                .sorted { $0.startUtc < $1.startUtc }
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func createEvent(title: String, description: String?, start: Date, end: Date, allDay: Bool) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        let request = CreateCalendarEventRequest(
            title: title,
            description: description?.isEmpty == true ? nil : description,
            startUtc: iso.string(from: start),
            endUtc: iso.string(from: end),
            allDay: allDay
        )
        do {
            let event = try await api.createEvent(request)
            myEvents.append(event)
            myEvents.sort { $0.startUtc < $1.startUtc }
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteEvent(id: UUID) async {
        do {
            try await api.deleteEvent(id: id)
            myEvents.removeAll { $0.id == id }
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
