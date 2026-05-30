import Foundation
import Security

final class KeychainService {
    static let shared = KeychainService()

    private let service = "com.familyhub.app"

    private init() {}

    func save(_ value: String, forKey key: String) {
        guard let data = value.data(using: .utf8) else { return }
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key
        ]
        SecItemDelete(query as CFDictionary)
        var addQuery = query
        addQuery[kSecValueData] = data
        SecItemAdd(addQuery as CFDictionary, nil)
    }

    func load(forKey key: String) -> String? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func delete(forKey key: String) {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}

extension KeychainService {
    private static let tokenKey = "auth_token"
    private static let userKey  = "auth_user"

    func saveToken(_ token: String) { save(token, forKey: Self.tokenKey) }
    func loadToken() -> String?    { load(forKey: Self.tokenKey) }
    func deleteToken()              { delete(forKey: Self.tokenKey) }

    func saveUser(_ user: AuthenticatedUser) {
        guard let encoded = try? JSONEncoder().encode(user),
              let str = String(data: encoded, encoding: .utf8) else { return }
        save(str, forKey: Self.userKey)
    }

    func loadUser() -> AuthenticatedUser? {
        guard let str = load(forKey: Self.userKey),
              let data = str.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(AuthenticatedUser.self, from: data)
    }

    func deleteUser() { delete(forKey: Self.userKey) }
}
