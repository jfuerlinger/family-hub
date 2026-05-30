import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var auth: AuthViewModel
    @StateObject private var familyVM   = FamilyViewModel()
    @StateObject private var todoVM     = TodoViewModel()
    @StateObject private var calendarVM = CalendarViewModel()

    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Übersicht", systemImage: "house.fill") }
                .tag(0)

            FamilyView()
                .tabItem { Label("Familie", systemImage: "person.3.fill") }
                .tag(1)

            TodosView()
                .tabItem { Label("Aufgaben", systemImage: "checklist") }
                .tag(2)

            CalendarView()
                .tabItem { Label("Kalender", systemImage: "calendar") }
                .tag(3)
        }
        .environmentObject(familyVM)
        .environmentObject(todoVM)
        .environmentObject(calendarVM)
        .task { await familyVM.loadFamilies() }
    }
}
