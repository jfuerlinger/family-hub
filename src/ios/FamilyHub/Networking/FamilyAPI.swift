import Foundation

extension APIClient {
    func getFamilies() async throws -> [Family] {
        try await get("api/families")
    }

    func createFamily(_ request: CreateFamilyRequest) async throws -> Family {
        try await post("api/families", body: request)
    }

    func addMember(familyId: UUID, request: AddFamilyMemberRequest) async throws -> FamilyMember {
        try await post("api/families/\(familyId)/members", body: request)
    }
}
