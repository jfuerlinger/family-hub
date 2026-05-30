import Foundation

@MainActor
final class FamilyViewModel: ObservableObject {
    @Published var families: [Family] = []
    @Published var selectedFamilyId: UUID?
    @Published var isLoading = false
    @Published var errorMessage: String?

    var selectedFamily: Family? {
        if let id = selectedFamilyId { return families.first { $0.id == id } }
        return families.first
    }

    private let api = APIClient.shared

    func loadFamilies() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            families = try await api.getFamilies()
            if selectedFamilyId == nil || !families.contains(where: { $0.id == selectedFamilyId }) {
                selectedFamilyId = families.first?.id
            }
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func createFamily(name: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let family = try await api.createFamily(CreateFamilyRequest(name: name))
            families.append(family)
            selectedFamilyId = family.id
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func addMember(email: String) async {
        guard let familyId = selectedFamily?.id else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            _ = try await api.addMember(
                familyId: familyId,
                request: AddFamilyMemberRequest(email: email)
            )
            // Reload to get the updated members list
            await loadFamilies()
        } catch let err as APIError {
            errorMessage = err.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
