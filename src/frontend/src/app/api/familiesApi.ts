import { apiClient } from './client'
import type { Family, CreateFamilyRequest, AddFamilyMemberRequest } from '../types/family'

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
