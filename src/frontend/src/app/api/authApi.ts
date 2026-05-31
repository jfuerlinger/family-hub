import { apiClient } from './client'
import type { AuthResponse, ChangePasswordRequest, LoginRequest, RegisterRequest } from '../types/auth'

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', request)
  return response.data
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', request)
  return response.data
}

export async function changePassword(request: ChangePasswordRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/change-password', request)
  return response.data
}
