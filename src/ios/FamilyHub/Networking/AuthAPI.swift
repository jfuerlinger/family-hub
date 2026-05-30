import Foundation

extension APIClient {
    func login(_ request: LoginRequest) async throws -> AuthResponse {
        try await post("api/auth/login", body: request)
    }

    func register(_ request: RegisterRequest) async throws -> AuthResponse {
        try await post("api/auth/register", body: request)
    }
}
