import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var familyVM:   FamilyViewModel
    @EnvironmentObject var calendarVM: CalendarViewModel

    enum CalTab { case personal, family }
    @State private var activeTab: CalTab = .personal
    @State private var showAddEvent = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab switcher
                tabBar

                Divider()

                // Content
                Group {
                    if activeTab == .personal {
                        personalTab
                    } else {
                        familyTab
                    }
                }
                .animation(.easeInOut(duration: 0.2), value: activeTab)
            }
            .background(Color.fhSecondaryBackground)
            .navigationTitle("Kalender")
            .toolbar {
                if activeTab == .personal {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button { showAddEvent = true } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .sheet(isPresented: $showAddEvent) {
                AddEventSheet().environmentObject(calendarVM)
            }
            .task {
                await calendarVM.loadMyEvents()
                if let fam = familyVM.selectedFamily {
                    await calendarVM.loadFamilyEvents(familyId: fam.id)
                }
            }
            .refreshable {
                await calendarVM.loadMyEvents()
                if let fam = familyVM.selectedFamily {
                    await calendarVM.loadFamilyEvents(familyId: fam.id)
                }
            }
            .onChange(of: familyVM.selectedFamily?.id) { _, newId in
                guard let id = newId else { return }
                Task { await calendarVM.loadFamilyEvents(familyId: id) }
            }
        }
    }

    // MARK: - Tab Bar

    private var tabBar: some View {
        HStack(spacing: 0) {
            CalTabButton(title: "Persönlich", icon: "person.fill",   isActive: activeTab == .personal) { activeTab = .personal }
            CalTabButton(title: "Familie",    icon: "person.3.fill",  isActive: activeTab == .family)   { activeTab = .family }
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, 12)
        .background(Color.fhBackground)
    }

    // MARK: - Personal Tab

    private var personalTab: some View {
        Group {
            if calendarVM.isLoading && calendarVM.myEvents.isEmpty {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if calendarVM.myEvents.isEmpty {
                FHEmptyState(
                    systemImage: "calendar.badge.plus",
                    title: "Keine Ereignisse",
                    description: "Tippe auf + um dein erstes Ereignis zu erstellen."
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                personalEventList
            }
        }
    }

    private var personalEventList: some View {
        List {
            ForEach(groupedPersonalEvents, id: \.0) { (dateKey, events) in
                Section {
                    ForEach(events) { event in
                        PersonalEventRow(event: event)
                            .listRowInsets(EdgeInsets(top: 5, leading: 16, bottom: 5, trailing: 16))
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) {
                                    Task { await calendarVM.deleteEvent(id: event.id) }
                                } label: {
                                    Label("Löschen", systemImage: "trash")
                                }
                            }
                    }
                } header: {
                    Text(dateKey)
                        .font(.caption.weight(.semibold))
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)
                        .tracking(0.5)
                }
            }
        }
        .listStyle(.plain)
        .background(Color.fhSecondaryBackground)
    }

    private var groupedPersonalEvents: [(String, [CalendarEvent])] {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_AT")
        formatter.dateFormat = "EEEE, d. MMMM yyyy"

        let grouped = Dictionary(grouping: calendarVM.myEvents) { event in
            Calendar.current.startOfDay(for: event.startUtc)
        }
        return grouped
            .sorted { $0.key < $1.key }
            .map { (formatter.string(from: $0.key), $0.value.sorted { $0.startUtc < $1.startUtc }) }
    }

    // MARK: - Family Tab

    private var familyTab: some View {
        Group {
            if familyVM.selectedFamily == nil {
                FHEmptyState(
                    systemImage: "person.3.fill",
                    title: "Keine Familie",
                    description: "Erstelle oder tritt einer Familie bei um den Familienkalender zu sehen."
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(spacing: 0) {
                    // Member filter
                    if !calendarVM.uniqueMembers.isEmpty {
                        memberFilterBar
                            .background(Color.fhBackground)
                        Divider()
                    }

                    if calendarVM.visibleFamilyEvents.isEmpty {
                        FHEmptyState(
                            systemImage: "calendar",
                            title: "Keine Familienereignisse",
                            description: "Noch keine Ereignisse in der Familienansicht."
                        )
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        familyEventList
                    }
                }
            }
        }
    }

    private var memberFilterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(calendarVM.uniqueMembers, id: \.userId) { m in
                    let visible = calendarVM.isMemberVisible(m.userId)
                    Button {
                        withAnimation { calendarVM.toggleMemberVisibility(m.userId) }
                    } label: {
                        HStack(spacing: 5) {
                            Circle().fill(m.color).frame(width: 8, height: 8)
                            Text(m.name).font(.subheadline.weight(.medium))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(visible ? m.color.opacity(0.15) : Color.secondary.opacity(0.08))
                        .foregroundColor(visible ? m.color : .secondary)
                        .cornerRadius(20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .strokeBorder(visible ? m.color : .clear, lineWidth: 1.5)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, 12)
        }
    }

    private var familyEventList: some View {
        List {
            ForEach(calendarVM.visibleFamilyEvents) { event in
                FamilyEventRow(event: event)
                    .listRowInsets(EdgeInsets(top: 5, leading: 16, bottom: 5, trailing: 16))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }
        }
        .listStyle(.plain)
        .background(Color.fhSecondaryBackground)
    }
}

// MARK: - Cal Tab Button

struct CalTabButton: View {
    let title: String
    let icon: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                HStack(spacing: 5) {
                    Image(systemName: icon).font(.subheadline)
                    Text(title).font(.subheadline.weight(.semibold))
                }
                .foregroundColor(isActive ? .accentColor : .secondary)

                Rectangle()
                    .fill(isActive ? Color.accentColor : .clear)
                    .frame(height: 2)
                    .cornerRadius(1)
            }
        }
        .frame(maxWidth: .infinity)
        .buttonStyle(.plain)
        .animation(.easeInOut(duration: 0.2), value: isActive)
    }
}

// MARK: - Personal Event Row

struct PersonalEventRow: View {
    let event: CalendarEvent

    var body: some View {
        HStack(spacing: 14) {
            // Time column
            VStack(spacing: 3) {
                if event.allDay {
                    Text("Ganztägig")
                        .font(.caption2.weight(.semibold))
                        .foregroundColor(.accentColor)
                } else {
                    Text(timeString(event.startUtc))
                        .font(.caption.weight(.semibold))
                        .foregroundColor(.accentColor)
                    Text(timeString(event.endUtc))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 56, alignment: .trailing)

            // Accent bar
            RoundedRectangle(cornerRadius: 2)
                .fill(Color.accentColor)
                .frame(width: 3)
                .padding(.vertical, 4)

            // Event info
            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)
                if let desc = event.description, !desc.isEmpty {
                    Text(desc)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()
        }
        .padding(Spacing.md)
        .background(Color.fhBackground)
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }

    private func timeString(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .none
        f.timeStyle = .short
        f.locale = Locale(identifier: "de_AT")
        return f.string(from: date)
    }
}

// MARK: - Family Event Row

struct FamilyEventRow: View {
    let event: FamilyCalendarEvent

    var body: some View {
        HStack(spacing: 14) {
            // Member color bar
            RoundedRectangle(cornerRadius: 2)
                .fill(event.swiftUIColor)
                .frame(width: 4)
                .padding(.vertical, 4)

            // Content
            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 6) {
                    Circle().fill(event.swiftUIColor).frame(width: 8, height: 8)
                    Text(event.memberName)
                        .font(.caption.weight(.semibold))
                        .foregroundColor(event.swiftUIColor)
                }

                Text(event.title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)

                HStack(spacing: 6) {
                    Image(systemName: "clock").font(.caption2)
                    if event.allDay {
                        Text("Ganztägig")
                    } else {
                        Text("\(event.startUtc.localizedDateTime()) – \(timeString(event.endUtc))")
                    }
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(Spacing.md)
        .background(Color.fhBackground)
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }

    private func timeString(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .none
        f.timeStyle = .short
        f.locale = Locale(identifier: "de_AT")
        return f.string(from: date)
    }
}

// MARK: - Add Event Sheet

struct AddEventSheet: View {
    @EnvironmentObject var calendarVM: CalendarViewModel
    @Environment(\.dismiss) var dismiss

    @State private var title       = ""
    @State private var description = ""
    @State private var start       = Date()
    @State private var end         = Date().addingTimeInterval(3600)
    @State private var allDay      = false

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {

                    FHTextField(label: "Titel *", placeholder: "Ereignistitel", text: $title)
                    FHTextField(label: "Beschreibung", placeholder: "Optionale Details…", text: $description)

                    // All day toggle
                    VStack(spacing: 14) {
                        Toggle("Ganztägig", isOn: $allDay.animation())
                            .font(.subheadline.weight(.semibold))

                        if allDay {
                            DatePicker("Datum", selection: $start, displayedComponents: .date)
                                .datePickerStyle(.graphical)
                                .transition(.opacity.combined(with: .scale(scale: 0.97, anchor: .top)))
                        } else {
                            VStack(spacing: 12) {
                                DatePicker("Beginn", selection: $start, displayedComponents: [.date, .hourAndMinute])
                                    .onChange(of: start) { _, newStart in
                                        if end <= newStart { end = newStart.addingTimeInterval(3600) }
                                    }
                                DatePicker("Ende", selection: $end,
                                           in: start...,
                                           displayedComponents: [.date, .hourAndMinute])
                            }
                            .font(.subheadline)
                        }
                    }
                    .padding(Spacing.md)
                    .background(Color.fhSecondaryBackground)
                    .cornerRadius(12)

                    if let error = calendarVM.errorMessage {
                        FHErrorBanner(message: error)
                    }

                    Button("Ereignis erstellen") {
                        Task {
                            await calendarVM.createEvent(
                                title: title.trimmingCharacters(in: .whitespaces),
                                description: description.isEmpty ? nil : description,
                                start: start,
                                end: allDay ? Calendar.current.startOfDay(for: start).addingTimeInterval(86399) : end,
                                allDay: allDay
                            )
                            if calendarVM.errorMessage == nil { dismiss() }
                        }
                    }
                    .buttonStyle(.primary)
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || calendarVM.isLoading)
                }
                .padding(Spacing.lg)
            }
            .navigationTitle("Neues Ereignis")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
    }
}
