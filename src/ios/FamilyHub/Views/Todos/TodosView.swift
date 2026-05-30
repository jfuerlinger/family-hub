import SwiftUI

struct TodosView: View {
    @EnvironmentObject var familyVM: FamilyViewModel
    @EnvironmentObject var todoVM: TodoViewModel
    @State private var showAddTodo = false
    @State private var filter: TodoFilter = .all

    enum TodoFilter: String, CaseIterable {
        case all = "Alle"
        case open = "Offen"
        case done = "Erledigt"
    }

    var filteredTodos: [TodoItem] {
        switch filter {
        case .all:  return todoVM.todos
        case .open: return todoVM.pendingTodos
        case .done: return todoVM.doneTodos
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if familyVM.selectedFamily == nil {
                    FHEmptyState(
                        systemImage: "checklist",
                        title: "Keine Familie",
                        description: "Erstelle zuerst eine Familie, um Aufgaben zu verwalten."
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.fhSecondaryBackground)
                } else {
                    contentView
                }
            }
            .navigationTitle("Aufgaben")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { showAddTodo = true } label: {
                        Image(systemName: "plus")
                    }
                    .disabled(familyVM.selectedFamily == nil)
                }
            }
            .sheet(isPresented: $showAddTodo) {
                AddTodoSheet()
                    .environmentObject(familyVM)
                    .environmentObject(todoVM)
            }
            .refreshable {
                if let fam = familyVM.selectedFamily {
                    await todoVM.loadTodos(familyId: fam.id)
                }
            }
        }
    }

    // MARK: - Content

    private var contentView: some View {
        VStack(spacing: 0) {
            // Filter bar
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(TodoFilter.allCases, id: \.self) { option in
                        FilterPill(
                            title: option.rawValue,
                            isSelected: filter == option,
                            count: countFor(option)
                        ) {
                            withAnimation(.easeInOut(duration: 0.2)) { filter = option }
                        }
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, 12)
            }
            .background(Color.fhBackground)

            Divider()

            if todoVM.isLoading && todoVM.todos.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if filteredTodos.isEmpty {
                emptyState
            } else {
                todoList
            }
        }
        .background(Color.fhSecondaryBackground)
    }

    private var emptyState: some View {
        FHEmptyState(
            systemImage: filter == .done ? "checkmark.circle" : "circle.dashed",
            title: filter == .done ? "Noch nichts erledigt" : "Keine offenen Aufgaben",
            description: filter == .done
                ? "Erledigte Aufgaben erscheinen hier."
                : "Tippe auf + um eine neue Aufgabe zu erstellen."
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var todoList: some View {
        List {
            ForEach(filteredTodos) { todo in
                TodoRowView(
                    todo: todo,
                    assignedMember: member(for: todo.assignedToUserId)
                )
                .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    Button {
                        Task {
                            if let fam = familyVM.selectedFamily {
                                await todoVM.toggleTodo(familyId: fam.id, todo: todo)
                            }
                        }
                    } label: {
                        Label(
                            todo.isDone ? "Öffnen" : "Erledigt",
                            systemImage: todo.isDone ? "arrow.uturn.backward" : "checkmark"
                        )
                    }
                    .tint(todo.isDone ? .orange : .green)
                }
            }
        }
        .listStyle(.plain)
        .background(Color.fhSecondaryBackground)
    }

    // MARK: - Helpers

    private func countFor(_ f: TodoFilter) -> Int {
        switch f {
        case .all:  return todoVM.todos.count
        case .open: return todoVM.pendingTodos.count
        case .done: return todoVM.doneTodos.count
        }
    }

    private func member(for userId: UUID?) -> FamilyMember? {
        guard let id = userId else { return nil }
        return familyVM.selectedFamily?.members.first { $0.userId == id }
    }
}

// MARK: - Filter Pill

struct FilterPill: View {
    let title: String
    let isSelected: Bool
    let count: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Text(title)
                    .font(.subheadline.weight(.medium))
                if count > 0 {
                    Text("\(count)")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(isSelected ? .white.opacity(0.3) : Color.accentColor.opacity(0.15))
                        .cornerRadius(10)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(isSelected ? Color.accentColor : Color.secondary.opacity(0.1))
            .foregroundColor(isSelected ? .white : .secondary)
            .cornerRadius(20)
        }
    }
}

// MARK: - Todo Row

struct TodoRowView: View {
    let todo: TodoItem
    let assignedMember: FamilyMember?

    var body: some View {
        HStack(spacing: 14) {
            // Checkbox circle
            ZStack {
                Circle()
                    .strokeBorder(
                        todo.isDone ? Color.green : (todo.isOverdue ? Color.red : Color.secondary.opacity(0.4)),
                        lineWidth: 2
                    )
                    .frame(width: 24, height: 24)
                if todo.isDone {
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.green)
                }
            }

            // Content
            VStack(alignment: .leading, spacing: 5) {
                Text(todo.title)
                    .font(.subheadline.weight(.semibold))
                    .strikethrough(todo.isDone)
                    .foregroundColor(todo.isDone ? .secondary : .primary)
                    .lineLimit(2)

                if let desc = todo.description, !desc.isEmpty {
                    Text(desc)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                HStack(spacing: 8) {
                    if let due = todo.dueDateUtc {
                        HStack(spacing: 3) {
                            Image(systemName: "calendar")
                                .font(.caption2)
                            Text(due.localizedDate(style: .short))
                                .font(.caption)
                        }
                        .foregroundColor(todo.isOverdue && !todo.isDone ? .red : .secondary)
                    }

                    if let member = assignedMember {
                        HStack(spacing: 4) {
                            Circle().fill(member.swiftUIColor).frame(width: 8, height: 8)
                            Text(member.firstName)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }

            Spacer()

            // Overdue badge
            if todo.isOverdue && !todo.isDone {
                StatusBadge(text: "Überfällig", color: .red)
            }
        }
        .padding(Spacing.md)
        .background(Color.fhBackground)
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
        .opacity(todo.isDone ? 0.65 : 1)
    }
}

// MARK: - Add Todo Sheet

struct AddTodoSheet: View {
    @EnvironmentObject var familyVM: FamilyViewModel
    @EnvironmentObject var todoVM: TodoViewModel
    @Environment(\.dismiss) var dismiss

    @State private var title        = ""
    @State private var description  = ""
    @State private var hasDueDate   = false
    @State private var dueDate      = Date().addingTimeInterval(86400)
    @State private var assignedId: UUID? = nil

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {

                    FHTextField(label: "Titel *", placeholder: "Was muss erledigt werden?", text: $title)

                    FHTextField(label: "Beschreibung", placeholder: "Optionale Details…", text: $description)

                    // Due date toggle
                    VStack(alignment: .leading, spacing: 10) {
                        Toggle("Fälligkeitsdatum", isOn: $hasDueDate.animation())
                            .font(.subheadline.weight(.semibold))

                        if hasDueDate {
                            DatePicker("", selection: $dueDate, displayedComponents: .date)
                                .datePickerStyle(.graphical)
                                .transition(.opacity.combined(with: .scale(scale: 0.97, anchor: .top)))
                        }
                    }
                    .padding(Spacing.md)
                    .background(Color.fhSecondaryBackground)
                    .cornerRadius(12)

                    // Assignee picker
                    if let members = familyVM.selectedFamily?.members, !members.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Zugewiesen an")
                                .font(.caption.weight(.semibold))
                                .foregroundColor(.secondary)
                                .textCase(.uppercase)
                                .tracking(0.5)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 10) {
                                    AssigneeChip(name: "Niemand", color: .secondary, isSelected: assignedId == nil) {
                                        assignedId = nil
                                    }
                                    ForEach(members) { m in
                                        AssigneeChip(name: m.firstName, color: m.swiftUIColor, isSelected: assignedId == m.userId) {
                                            assignedId = m.userId
                                        }
                                    }
                                }
                                .padding(.horizontal, 2)
                            }
                        }
                        .padding(Spacing.md)
                        .background(Color.fhSecondaryBackground)
                        .cornerRadius(12)
                    }

                    if let error = todoVM.errorMessage {
                        FHErrorBanner(message: error)
                    }

                    Button("Aufgabe erstellen") {
                        Task {
                            guard let fam = familyVM.selectedFamily else { return }
                            await todoVM.createTodo(
                                familyId: fam.id,
                                title: title.trimmingCharacters(in: .whitespaces),
                                description: description.isEmpty ? nil : description,
                                dueDate: hasDueDate ? dueDate : nil,
                                assignedToUserId: assignedId
                            )
                            if todoVM.errorMessage == nil { dismiss() }
                        }
                    }
                    .buttonStyle(.primary)
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || todoVM.isLoading)
                }
                .padding(Spacing.lg)
            }
            .navigationTitle("Neue Aufgabe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Assignee Chip

struct AssigneeChip: View {
    let name: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Circle().fill(color).frame(width: 10, height: 10)
                Text(name).font(.subheadline.weight(.medium))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? color.opacity(0.15) : Color.fhTertiaryBackground)
            .foregroundColor(isSelected ? color : .secondary)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .strokeBorder(isSelected ? color : .clear, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }
}
