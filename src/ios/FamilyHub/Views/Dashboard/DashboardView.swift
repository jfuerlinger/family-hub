import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var auth: AuthViewModel
    @EnvironmentObject var familyVM: FamilyViewModel
    @EnvironmentObject var todoVM: TodoViewModel
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    greetingHeader
                    statsGrid
                    if !todoVM.pendingTodos.isEmpty { pendingSection }
                    if familyVM.families.isEmpty && !familyVM.isLoading { noFamilyCard }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, 8)
                .padding(.bottom, Spacing.xl)
            }
            .background(Color.fhSecondaryBackground)
            .navigationTitle("Übersicht")
            .toolbar { profileButton }
            .sheet(isPresented: $showSettings) {
                SettingsSheet().environmentObject(auth)
            }
            .refreshable {
                await familyVM.loadFamilies()
                if let fam = familyVM.selectedFamily {
                    await todoVM.loadTodos(familyId: fam.id)
                }
            }
            .task {
                if let fam = familyVM.selectedFamily {
                    await todoVM.loadTodos(familyId: fam.id)
                }
            }
            .onChange(of: familyVM.selectedFamily?.id) { _, newId in
                guard let id = newId else { return }
                Task { await todoVM.loadTodos(familyId: id) }
            }
        }
    }

    // MARK: - Subviews

    private var greetingHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(greetingText)
                    .font(.title2.weight(.bold))
                if let fam = familyVM.selectedFamily {
                    Text("Familie \(fam.name)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
        }
        .padding(.top, 4)
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
            DashboardStatCard(
                icon: "person.3.fill", color: .blue,
                title: "Familie",
                value: familyVM.selectedFamily?.name ?? "–",
                subtitle: "\(familyVM.selectedFamily?.members.count ?? 0) Mitglied(er)"
            )
            DashboardStatCard(
                icon: "checklist",
                color: todoVM.pendingTodos.isEmpty ? .green : .orange,
                title: "Aufgaben offen",
                value: "\(todoVM.pendingTodos.count)",
                subtitle: "\(todoVM.doneTodos.count) erledigt"
            )
            DashboardStatCard(
                icon: "house.fill", color: .purple,
                title: "Familien",
                value: "\(familyVM.families.count)",
                subtitle: "insgesamt"
            )
            DashboardStatCard(
                icon: "person.fill", color: .teal,
                title: "Mitglieder",
                value: "\(familyVM.selectedFamily?.members.count ?? 0)",
                subtitle: "in dieser Familie"
            )
        }
    }

    private var pendingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Offene Aufgaben")
                .font(.title3.weight(.semibold))
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(Array(todoVM.pendingTodos.prefix(5).enumerated()), id: \.element.id) { idx, todo in
                    HStack(spacing: 12) {
                        Image(systemName: "circle")
                            .font(.system(size: 18))
                            .foregroundColor(.secondary)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(todo.title)
                                .font(.subheadline.weight(.medium))
                                .lineLimit(1)
                            if let due = todo.dueDateUtc {
                                Text(due.localizedDate(style: .short))
                                    .font(.caption)
                                    .foregroundColor(todo.isOverdue ? .red : .secondary)
                            }
                        }

                        Spacer()

                        if todo.isOverdue {
                            StatusBadge(text: "Überfällig", color: .red)
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, 12)
                    .background(Color.fhBackground)

                    if idx < min(4, todoVM.pendingTodos.count - 1) {
                        Divider().padding(.leading, 50)
                    }
                }
            }
            .cardStyle()
        }
    }

    private var noFamilyCard: some View {
        VStack(spacing: 16) {
            Image(systemName: "house.badge.plus")
                .font(.system(size: 44))
                .foregroundStyle(.quaternary)

            VStack(spacing: 6) {
                Text("Noch keine Familie")
                    .font(.title3.weight(.semibold))
                Text("Wechsle zum Reiter «Familie», um eine Familie zu erstellen und alle Features zu nutzen.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity)
        .sectionCardStyle()
    }

    private var profileButton: some ToolbarContent {
        ToolbarItem(placement: .navigationBarTrailing) {
            Button { showSettings = true } label: {
                UserAvatar(
                    initials: auth.user?.initials ?? "?",
                    color: .accentColor,
                    size: 32
                )
            }
        }
    }

    // MARK: - Helpers

    private var greetingText: String {
        let name = auth.user?.firstName ?? ""
        switch Calendar.current.component(.hour, from: Date()) {
        case 5..<12: return "Guten Morgen, \(name)! ☀️"
        case 12..<17: return "Guten Tag, \(name)! 👋"
        case 17..<22: return "Guten Abend, \(name)! 🌆"
        default:     return "Hallo, \(name)! 🌙"
        }
    }
}

// MARK: - Stat Card

struct DashboardStatCard: View {
    let icon: String
    let color: Color
    let title: String
    let value: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(color)
                .frame(width: 34, height: 34)
                .background(color.opacity(0.12))
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 3) {
                Text(value)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                Text(title)
                    .font(.subheadline.weight(.medium))
                    .lineLimit(1)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.fhBackground)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Settings Sheet

struct SettingsSheet: View {
    @EnvironmentObject var auth: AuthViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            List {
                // Profile section
                Section {
                    HStack(spacing: 16) {
                        UserAvatar(initials: auth.user?.initials ?? "?", color: .accentColor, size: 56)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(auth.user?.fullName ?? "")
                                .font(.title3.weight(.semibold))
                            Text(auth.user?.email ?? "")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }

                // API settings
                Section("Server") {
                    HStack {
                        Label("API-URL", systemImage: "network")
                        Spacer()
                        Text(Config.apiBaseURL.absoluteString)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Actions
                Section {
                    Button(role: .destructive) {
                        auth.logout()
                        dismiss()
                    } label: {
                        Label("Abmelden", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Einstellungen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Fertig") { dismiss() }
                        .fontWeight(.semibold)
                }
            }
        }
    }
}
