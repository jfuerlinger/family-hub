import Foundation

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var user: AuthenticatedUser?
    @Published var isLoading = false
    @Published var errorMessage: String?

    var isAuthenticated: Bool { user != nil }

    private let api = APIClient.shared
    private let keychain = KeychainService.shared

    // MARK: - Session Restoration

    func restoreSession() {
        guard let token = keychain.loadToken(),
              let user = keychain.loadUser() else { return }
        api.token = token
        self.user = user
    }

    // MARK: - Auth Actions

    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.login(LoginRequest(email: email, password: password))
            applyAuthResponse(response)
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func register(firstName: String, lastName: String, email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.register(
                RegisterRequest(firstName: firstName, lastName: lastName, email: email, password: password)
            )
            applyAuthResponse(response)
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func logout() {
        api.token = nil
        keychain.deleteToken()
        keychain.deleteUser()
        user = nil
        errorMessage = nil
    }

    // MARK: - Private

    private func applyAuthResponse(_ response: AuthResponse) {
        api.token = response.accessToken
        keychain.saveToken(response.accessToken)
        keychain.saveUser(response.user)
        user = response.user
    }
}
