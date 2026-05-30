import Foundation

enum Config {
    /// API base URL.
    /// - iOS Simulator: http://localhost:5000
    /// - Physical device: replace with your Mac's local IP, e.g. http://192.168.1.10:5000
    static let apiBaseURL = URL(string: "http://localhost:5000")!
}
