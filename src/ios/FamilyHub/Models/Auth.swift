import Foundation

struct AuthenticatedUser: Codable, Identifiable, Equatable {
    let id: UUID
    let firstName: String
    let lastName: String
    let email: String

    var fullName: String { "\(firstName) \(lastName)" }

    var initials: String {
        "\(firstName.prefix(1))\(lastName.prefix(1))".uppercased()
    }
}

struct AuthResponse: Codable {
    let accessToken: String
    let expiresAtUtc: Date
    let user: AuthenticatedUser
}

struct RegisterRequest: Encodable {
    let firstName: String
    let lastName: String
    let email: String
    let password: String
}

struct LoginRequest: Encodable {
    let email: String
    let password: String
}
