export interface FamilyMember {
  id: string
  familyId: string
  userId: string
  firstName: string
  lastName: string
  email: string
  color: string
  joinedAtUtc: string
}

export interface Family {
  id: string
  name: string
  createdByUserId: string
  createdAtUtc: string
  members: FamilyMember[]
}

export interface CreateFamilyRequest {
  name: string
}

export interface AddFamilyMemberRequest {
  email: string
}
