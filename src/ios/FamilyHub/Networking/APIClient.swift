import Foundation

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int, String?)
    case decodingError(Error)
    case unauthorized
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Ungültige Server-Adresse."
        case .invalidResponse:
            return "Ungültige Antwort vom Server."
        case .httpError(_, let msg):
            return msg ?? "Unbekannter Server-Fehler."
        case .decodingError:
            return "Daten konnten nicht verarbeitet werden."
        case .unauthorized:
            return "Nicht autorisiert. Bitte erneut anmelden."
        case .networkError(let err):
            return "Netzwerkfehler: \(err.localizedDescription)"
        }
    }
}

// MARK: - APIClient

final class APIClient {
    static let shared = APIClient()

    private(set) var baseURL: URL = Config.apiBaseURL
    var token: String?

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .custom { decoder -> Date in
            let container = try decoder.singleValueContainer()
            let str = try container.decode(String.self)

            let withFrac = ISO8601DateFormatter()
            withFrac.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = withFrac.date(from: str) { return date }

            let plain = ISO8601DateFormatter()
            plain.formatOptions = [.withInternetDateTime]
            if let date = plain.date(from: str) { return date }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot parse date: \(str)"
            )
        }
        return d
    }()

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    private init() {}

    func setBaseURL(_ url: URL) { baseURL = url }

    // MARK: - Typed Requests

    func get<T: Decodable>(_ path: String) async throws -> T {
        try await request(path, method: "GET", body: Optional<EmptyBody>.none)
    }

    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        try await request(path, method: "POST", body: body)
    }

    func postVoid<B: Encodable>(_ path: String, body: B) async throws {
        try await requestVoid(path, method: "POST", body: body)
    }

    func patch<T: Decodable>(_ path: String) async throws -> T {
        try await request(path, method: "PATCH", body: Optional<EmptyBody>.none)
    }

    func deleteResource(_ path: String) async throws {
        try await requestVoid(path, method: "DELETE", body: Optional<EmptyBody>.none)
    }

    // MARK: - Core

    private func request<T: Decodable, B: Encodable>(_ path: String, method: String, body: B?) async throws -> T {
        let data = try await perform(path: path, method: method, body: body)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    private func requestVoid<B: Encodable>(_ path: String, method: String, body: B?) async throws {
        _ = try await perform(path: path, method: method, body: body)
    }

    private func perform<B: Encodable>(path: String, method: String, body: B?) async throws -> Data {
        let trimmed = path.hasPrefix("/") ? path : "/\(path)"
        guard let url = URL(string: trimmed, relativeTo: baseURL) else {
            throw APIError.invalidURL
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            req.httpBody = try encoder.encode(body)
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw APIError.networkError(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch http.statusCode {
        case 200...299:
            return data
        case 401:
            throw APIError.unauthorized
        default:
            let message = (try? decoder.decode(ProblemDetails.self, from: data))?.firstMessage
                ?? String(data: data, encoding: .utf8)
            throw APIError.httpError(http.statusCode, message)
        }
    }
}

// MARK: - Helpers

private struct EmptyBody: Encodable {}

private struct ProblemDetails: Decodable {
    let title: String?
    let detail: String?
    let status: Int?
    let errors: [String: [String]]?

    var firstMessage: String? {
        errors?.values.first?.first ?? detail ?? title
    }
}
