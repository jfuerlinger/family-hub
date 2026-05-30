import Foundation
import SwiftUI

struct FamilyMember: Codable, Identifiable, Equatable {
    let id: UUID
    let familyId: UUID
    let userId: UUID
    let firstName: String
    let lastName: String
    let email: String
    let color: String
    let joinedAtUtc: Date

    var fullName: String { "\(firstName) \(lastName)" }

    var initials: String {
        "\(firstName.prefix(1))\(lastName.prefix(1))".uppercased()
    }

    var swiftUIColor: Color {
        Color(hex: color) ?? .accentColor
    }
}

struct Family: Codable, Identifiable, Equatable {
    let id: UUID
    let name: String
    let createdByUserId: UUID
    let createdAtUtc: Date
    let members: [FamilyMember]

    var initials: String {
        String(name.prefix(2)).uppercased()
    }
}

struct CreateFamilyRequest: Encodable {
    let name: String
}

struct AddFamilyMemberRequest: Encodable {
    let email: String
}
