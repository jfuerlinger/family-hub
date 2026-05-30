import SwiftUI

struct FamilyView: View {
    @EnvironmentObject var familyVM: FamilyViewModel
    @State private var showCreateFamily = false
    @State private var showAddMember    = false

    var body: some View {
        NavigationStack {
            Group {
                if familyVM.isLoading && familyVM.families.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if familyVM.families.isEmpty {
                    FHEmptyState(
                        systemImage: "person.3.fill",
                        title: "Noch keine Familie",
                        description: "Erstelle deine erste Familie, um Aufgaben und Kalender gemeinsam zu nutzen."
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    familyContent
                }
            }
            .background(Color.fhSecondaryBackground)
            .navigationTitle("Familie")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button { showCreateFamily = true } label: {
                            Label("Neue Familie", systemImage: "plus.circle")
                        }
                        if familyVM.selectedFamily != nil {
                            Button { showAddMember = true } label: {
                                Label("Mitglied einladen", systemImage: "person.badge.plus")
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .refreshable { await familyVM.loadFamilies() }
            .sheet(isPresented: $showCreateFamily) {
                CreateFamilySheet().environmentObject(familyVM)
            }
            .sheet(isPresented: $showAddMember) {
                AddMemberSheet().environmentObject(familyVM)
            }
        }
    }

    // MARK: - Main content

    private var familyContent: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                if familyVM.families.count > 1 { familySelectorSection }
                if let family = familyVM.selectedFamily {
                    familyHeaderCard(family)
                    membersSection(family)
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
        }
    }

    private var familySelectorSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Meine Familien")
                .font(.caption.weight(.semibold))
                .foregroundColor(.secondary)
                .textCase(.uppercase)
                .tracking(0.5)
                .padding(.horizontal, 4)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(familyVM.families) { family in
                        FamilyChip(
                            family: family,
                            isSelected: familyVM.selectedFamilyId == family.id
                        ) {
                            withAnimation { familyVM.selectedFamilyId = family.id }
                        }
                    }
                }
                .padding(.horizontal, 4)
                .padding(.vertical, 4)
            }
        }
    }

    private func familyHeaderCard(_ family: Family) -> some View {
        HStack(spacing: 16) {
            UserAvatar(initials: family.initials, color: .accentColor, size: 56)

            VStack(alignment: .leading, spacing: 5) {
                Text(family.name)
                    .font(.title2.weight(.bold))
                HStack(spacing: 4) {
                    Image(systemName: "person.2")
                        .font(.caption)
                    Text("\(family.members.count) Mitglied(er)")
                }
                .font(.subheadline)
                .foregroundColor(.secondary)

                Text("Erstellt \(family.createdAtUtc.localizedDate())")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(Spacing.md)
        .sectionCardStyle()
    }

    private func membersSection(_ family: Family) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Mitglieder")
                    .font(.title3.weight(.semibold))
                Spacer()
                Button {
                    showAddMember = true
                } label: {
                    Label("Einladen", systemImage: "person.badge.plus")
                        .font(.subheadline.weight(.medium))
                }
                .buttonStyle(.borderless)
                .foregroundColor(.accentColor)
            }
            .padding(.horizontal, 4)

            if family.members.isEmpty {
                FHEmptyState(
                    systemImage: "person.fill",
                    title: "Keine Mitglieder",
                    description: "Lade Personen per E-Mail ein, deiner Familie beizutreten."
                )
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(family.members.enumerated()), id: \.element.id) { idx, member in
                        MemberRow(member: member)
                        if idx < family.members.count - 1 {
                            Divider().padding(.leading, 70)
                        }
                    }
                }
                .cardStyle()
            }
        }
    }
}

// MARK: - Family Chip

struct FamilyChip: View {
    let family: Family
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 8) {
                UserAvatar(
                    initials: family.initials,
                    color: isSelected ? .accentColor : .secondary,
                    size: 48
                )
                Text(family.name)
                    .font(.caption2.weight(.medium))
                    .foregroundColor(isSelected ? .primary : .secondary)
                    .lineLimit(1)
                    .frame(width: 68)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Member Row

struct MemberRow: View {
    let member: FamilyMember

    var body: some View {
        HStack(spacing: 14) {
            UserAvatar(initials: member.initials, color: member.swiftUIColor, size: 44)

            VStack(alignment: .leading, spacing: 3) {
                Text(member.fullName)
                    .font(.subheadline.weight(.semibold))
                Text(member.email)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("seit")
                    .font(.caption2)
                    .foregroundColor(.tertiary)
                Text(member.joinedAtUtc.localizedDate(style: .short))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, 13)
        .background(Color.fhBackground)
    }
}

// MARK: - Create Family Sheet

struct CreateFamilySheet: View {
    @EnvironmentObject var familyVM: FamilyViewModel
    @Environment(\.dismiss) var dismiss
    @State private var name = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                FHTextField(label: "Familienname", placeholder: "z.B. Familie Mustermann", text: $name)

                if let error = familyVM.errorMessage {
                    FHErrorBanner(message: error)
                }

                Button("Familie erstellen") {
                    Task {
                        await familyVM.createFamily(name: name.trimmingCharacters(in: .whitespaces))
                        if familyVM.errorMessage == nil { dismiss() }
                    }
                }
                .buttonStyle(.primary)
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || familyVM.isLoading)

                Spacer()
            }
            .padding(Spacing.lg)
            .navigationTitle("Neue Familie")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - Add Member Sheet

struct AddMemberSheet: View {
    @EnvironmentObject var familyVM: FamilyViewModel
    @Environment(\.dismiss) var dismiss
    @State private var email = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    FHTextField(
                        label: "E-Mail-Adresse",
                        placeholder: "mitglied@example.com",
                        text: $email,
                        keyboardType: .emailAddress
                    )
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)

                    Text("Die Person muss bereits registriert sein.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                if let error = familyVM.errorMessage {
                    FHErrorBanner(message: error)
                }

                Button("Mitglied einladen") {
                    Task {
                        await familyVM.addMember(email: email.trimmingCharacters(in: .whitespaces))
                        if familyVM.errorMessage == nil { dismiss() }
                    }
                }
                .buttonStyle(.primary)
                .disabled(!email.isValidEmail || familyVM.isLoading)

                Spacer()
            }
            .padding(Spacing.lg)
            .navigationTitle("Mitglied einladen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}
