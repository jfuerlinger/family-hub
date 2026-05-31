export interface AuthenticatedUser {
  id: string
  firstName: string
  lastName: string
  email: string
  requiresPasswordChange: boolean
}

export interface AuthResponse {
  accessToken: string
  expiresAtUtc: string
  user: AuthenticatedUser
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
