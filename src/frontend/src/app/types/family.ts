export interface FamilyMember {
  id: string
  familyId: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  isAdmin: boolean
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
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string | null
  isAdmin?: boolean
  color?: string | null
}

export interface UpdateFamilyMemberRequest {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string | null
  isAdmin: boolean
}

export interface UpdateFamilyRequest {
  name: string
}
