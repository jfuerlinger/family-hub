import Foundation
import SwiftUI

struct CalendarEvent: Codable, Identifiable, Equatable {
    let id: UUID
    let userId: UUID
    let title: String
    let description: String?
    let startUtc: Date
    let endUtc: Date
    let allDay: Bool
    let createdAtUtc: Date
}

struct FamilyCalendarEvent: Codable, Identifiable, Equatable {
    let id: UUID
    let userId: UUID
    let title: String
    let description: String?
    let startUtc: Date
    let endUtc: Date
    let allDay: Bool
    let createdAtUtc: Date
    let memberColor: String
    let memberName: String

    var swiftUIColor: Color {
        Color(hex: memberColor) ?? .accentColor
    }
}

struct CreateCalendarEventRequest: Encodable {
    let title: String
    let description: String?
    let startUtc: String
    let endUtc: String
    let allDay: Bool
}
