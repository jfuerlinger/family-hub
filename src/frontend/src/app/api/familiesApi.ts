import { apiClient } from './client'
import type {
  Family,
  CreateFamilyRequest,
  AddFamilyMemberRequest,
  UpdateFamilyMemberRequest,
  UpdateFamilyRequest,
} from '../types/family'

export async function getFamilies(): Promise<Family[]> {
  const response = await apiClient.get<Family[]>('/families')
  return response.data
}

export async function createFamily(request: CreateFamilyRequest): Promise<Family> {
  const response = await apiClient.post<Family>('/families', request)
  return response.data
}

export async function getFamily(familyId: string): Promise<Family> {
  const response = await apiClient.get<Family>(`/families/${familyId}`)
  return response.data
}

export async function addFamilyMember(familyId: string, request: AddFamilyMemberRequest): Promise<void> {
  await apiClient.post(`/families/${familyId}/members`, request)
}

export async function updateFamily(familyId: string, request: UpdateFamilyRequest): Promise<Family> {
  const response = await apiClient.put<Family>(`/families/${familyId}`, request)
  return response.data
}

export async function updateFamilyMember(
  familyId: string,
  memberId: string,
  request: UpdateFamilyMemberRequest,
): Promise<void> {
  await apiClient.put(`/families/${familyId}/members/${memberId}`, request)
}
