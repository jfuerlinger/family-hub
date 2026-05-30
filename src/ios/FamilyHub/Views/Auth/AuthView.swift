import SwiftUI

struct AuthView: View {
    @EnvironmentObject var auth: AuthViewModel

    enum Mode: Hashable { case login, register }
    enum Field: Hashable { case firstName, lastName, email, password }

    @State private var mode: Mode = .login
    @State private var firstName = ""
    @State private var lastName  = ""
    @State private var email     = ""
    @State private var password  = ""
    @FocusState private var focus: Field?

    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                colors: [
                    Color(hex: "#0D1B2A") ?? .black,
                    Color(hex: "#1B3A5C") ?? .blue
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Ambient blobs
            Circle()
                .fill(Color.accentColor.opacity(0.18))
                .frame(width: 340, height: 340)
                .blur(radius: 60)
                .offset(x: -120, y: -220)

            Circle()
                .fill(Color.cyan.opacity(0.12))
                .frame(width: 240, height: 240)
                .blur(radius: 40)
                .offset(x: 160, y: 320)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Logo + title
                    VStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(.white.opacity(0.08))
                                .frame(width: 88, height: 88)
                            Image(systemName: "house.fill")
                                .font(.system(size: 40, weight: .semibold))
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [.white, Color.accentColor.opacity(0.85)],
                                        startPoint: .top, endPoint: .bottom
                                    )
                                )
                        }

                        Text("Family Hub")
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .foregroundColor(.white)

                        Text("Deine Familie, immer verbunden")
                            .font(.callout)
                            .foregroundColor(.white.opacity(0.65))
                    }
                    .padding(.top, 80)
                    .padding(.bottom, 44)

                    // Auth card
                    VStack(spacing: 22) {

                        // Mode toggle
                        HStack(spacing: 0) {
                            ForEach([Mode.login, Mode.register], id: \.self) { m in
                                Button { withAnimation(.easeInOut(duration: 0.25)) { mode = m } } label: {
                                    Text(m == .login ? "Anmelden" : "Registrieren")
                                        .font(.subheadline.weight(.semibold))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 11)
                                        .background(mode == m ? Color.accentColor : .clear)
                                        .foregroundColor(mode == m ? .white : .secondary)
                                        .cornerRadius(9)
                                }
                            }
                        }
                        .padding(4)
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(13)

                        // Fields
                        VStack(spacing: 14) {
                            if mode == .register {
                                HStack(spacing: 12) {
                                    FHTextField(label: "Vorname", placeholder: "Max", text: $firstName)
                                        .focused($focus, equals: .firstName)
                                        .submitLabel(.next)
                                        .onSubmit { focus = .lastName }
                                    FHTextField(label: "Nachname", placeholder: "Mustermann", text: $lastName)
                                        .focused($focus, equals: .lastName)
                                        .submitLabel(.next)
                                        .onSubmit { focus = .email }
                                }
                                .transition(.asymmetric(
                                    insertion: .push(from: .top).combined(with: .opacity),
                                    removal:   .push(from: .bottom).combined(with: .opacity)
                                ))
                            }

                            FHTextField(label: "E-Mail", placeholder: "max@example.com",
                                        text: $email, keyboardType: .emailAddress)
                                .focused($focus, equals: .email)
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.never)
                                .submitLabel(.next)
                                .onSubmit { focus = .password }

                            FHTextField(label: "Passwort", placeholder: "••••••••",
                                        text: $password, isSecure: true)
                                .focused($focus, equals: .password)
                                .submitLabel(.done)
                                .onSubmit { Task { await submit() } }
                        }

                        // Error
                        if let error = auth.errorMessage {
                            FHErrorBanner(message: error)
                                .transition(.move(edge: .top).combined(with: .opacity))
                        }

                        // CTA
                        Button {
                            Task { await submit() }
                        } label: {
                            if auth.isLoading {
                                HStack(spacing: 8) {
                                    ProgressView().tint(.white)
                                    Text("Bitte warten…")
                                }
                            } else {
                                Text(mode == .login ? "Anmelden" : "Konto erstellen")
                            }
                        }
                        .buttonStyle(.primary)
                        .disabled(auth.isLoading || !isFormValid)
                        .animation(.default, value: auth.isLoading)
                    }
                    .padding(Spacing.lg)
                    .background(.regularMaterial)
                    .cornerRadius(24)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 48)
                }
            }
        }
        .animation(.easeInOut(duration: 0.3), value: mode)
        .animation(.easeInOut(duration: 0.25), value: auth.errorMessage)
        .onTapGesture { hideKeyboard() }
    }

    private var isFormValid: Bool {
        guard email.isValidEmail && !password.isEmpty else { return false }
        if mode == .register {
            return !firstName.isEmpty && !lastName.isEmpty && password.count >= 8
        }
        return true
    }

    private func submit() async {
        let e = email.trimmingCharacters(in: .whitespaces)
        if mode == .login {
            await auth.login(email: e, password: password)
        } else {
            await auth.register(
                firstName: firstName.trimmingCharacters(in: .whitespaces),
                lastName:  lastName.trimmingCharacters(in: .whitespaces),
                email: e,
                password: password
            )
        }
    }
}
