import SwiftUI

// MARK: - Color Helpers

extension Color {
    init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "#", with: "")
        guard s.count == 6 || s.count == 8 else { return nil }
        if s.count == 6 { s = "FF" + s }
        var val: UInt64 = 0
        guard Scanner(string: s).scanHexInt64(&val) else { return nil }
        self.init(
            .sRGB,
            red:     Double((val & 0xFF000000) >> 24) / 255,
            green:   Double((val & 0x00FF0000) >> 16) / 255,
            blue:    Double((val & 0x0000FF00) >>  8) / 255,
            opacity: Double( val & 0x000000FF        ) / 255
        )
    }

    // Semantic aliases
    static let fhBackground           = Color(.systemBackground)
    static let fhSecondaryBackground  = Color(.secondarySystemBackground)
    static let fhTertiaryBackground   = Color(.tertiarySystemBackground)
    static let fhLabel                = Color(.label)
    static let fhSecondaryLabel       = Color(.secondaryLabel)
    static let fhTertiaryLabel        = Color(.tertiaryLabel)
}

// MARK: - Spacing

enum Spacing {
    static let xs:  CGFloat = 4
    static let sm:  CGFloat = 8
    static let md:  CGFloat = 16
    static let lg:  CGFloat = 24
    static let xl:  CGFloat = 32
}

// MARK: - Card Modifier

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Color.fhBackground)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.07), radius: 10, x: 0, y: 4)
    }
}

struct SectionCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(Spacing.md)
            .background(Color.fhBackground)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
    }
}

extension View {
    func cardStyle() -> some View     { modifier(CardModifier()) }
    func sectionCardStyle() -> some View { modifier(SectionCardModifier()) }
}

// MARK: - Button Styles

struct PrimaryButtonStyle: ButtonStyle {
    var isDestructive = false
    @Environment(\.isEnabled) private var enabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                (isDestructive ? Color.red : Color.accentColor)
                    .opacity(enabled ? 1 : 0.5)
            )
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.accentColor)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color.accentColor.opacity(0.1))
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    static var primary:     PrimaryButtonStyle { PrimaryButtonStyle() }
    static var destructive: PrimaryButtonStyle { PrimaryButtonStyle(isDestructive: true) }
}

extension ButtonStyle where Self == SecondaryButtonStyle {
    static var secondary: SecondaryButtonStyle { SecondaryButtonStyle() }
}

// MARK: - Reusable Form Field

struct FHTextField: View {
    let label: String
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var isSecure = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundColor(.fhSecondaryLabel)
                .textCase(.uppercase)
                .tracking(0.5)

            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                        .keyboardType(keyboardType)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Color.fhSecondaryBackground)
            .cornerRadius(10)
            .font(.body)
        }
    }
}

// MARK: - Error Banner

struct FHErrorBanner: View {
    let message: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.circle.fill")
                .font(.system(size: 16))
            Text(message)
                .font(.subheadline)
        }
        .foregroundColor(.white)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.red.gradient)
        .cornerRadius(12)
    }
}

// MARK: - Empty State

struct FHEmptyState: View {
    let systemImage: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: systemImage)
                .font(.system(size: 52))
                .foregroundStyle(.quaternary)

            VStack(spacing: 6) {
                Text(title)
                    .font(.title3.weight(.semibold))
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .foregroundColor(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.12))
            .cornerRadius(6)
    }
}

// MARK: - Avatar

struct UserAvatar: View {
    let initials: String
    let color: Color
    var size: CGFloat = 40

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
            .overlay {
                Text(initials)
                    .font(.system(size: size * 0.35, weight: .bold))
                    .foregroundColor(.white)
            }
    }
}

// MARK: - Loading Overlay

struct FHLoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.15).ignoresSafeArea()
            ProgressView()
                .scaleEffect(1.4)
                .padding(24)
                .background(.regularMaterial)
                .cornerRadius(16)
        }
    }
}
