import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsView from '../views/SettingsView.vue'

const mockAuthStore = {
  user: { id: 'user-1', firstName: 'Anna', lastName: 'Muster', email: 'anna@example.com', requiresPasswordChange: false },
  requiresPasswordChange: false,
  loading: false,
  authError: null as string | null,
  changeUserPassword: vi.fn().mockResolvedValue(undefined),
}

const mockFamilyStore = {
  families: [
    {
      id: 'family-1',
      name: 'Muster Familie',
      createdByUserId: 'user-1',
      createdAtUtc: '2024-01-01T00:00:00Z',
      members: [
        {
          id: 'member-1',
          familyId: 'family-1',
          userId: 'user-1',
          firstName: 'Anna',
          lastName: 'Muster',
          email: 'anna@example.com',
          phoneNumber: null,
          isAdmin: false,
          color: '#4f46e5',
          joinedAtUtc: '2024-01-01T00:00:00Z',
        },
      ],
    },
  ],
  selectedFamilyId: 'family-1',
  selectedFamily: {
    id: 'family-1',
    name: 'Muster Familie',
    createdByUserId: 'user-1',
    createdAtUtc: '2024-01-01T00:00:00Z',
    members: [
      {
        id: 'member-1',
        familyId: 'family-1',
        userId: 'user-1',
        firstName: 'Anna',
        lastName: 'Muster',
        email: 'anna@example.com',
        phoneNumber: null,
        isAdmin: false,
        color: '#4f46e5',
        joinedAtUtc: '2024-01-01T00:00:00Z',
      },
    ],
  },
  loading: false,
  error: null as string | null,
  loadFamilies: vi.fn().mockResolvedValue(undefined),
  createNewFamily: vi.fn().mockResolvedValue(undefined),
  renameFamily: vi.fn().mockResolvedValue(undefined),
  addMember: vi.fn().mockResolvedValue(undefined),
  editMember: vi.fn().mockResolvedValue(undefined),
  selectFamily: vi.fn(),
}

vi.mock('../app/stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('../app/stores/familyStore', () => ({
  useFamilyStore: () => mockFamilyStore,
}))

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.requiresPasswordChange = false
    mockAuthStore.loading = false
    mockAuthStore.authError = null
    mockAuthStore.user = { id: 'user-1', firstName: 'Anna', lastName: 'Muster', email: 'anna@example.com', requiresPasswordChange: false }
    mockFamilyStore.error = null
    mockFamilyStore.selectedFamily.members[0].isAdmin = false
  })

  it('shows admin-only hint when current user is not admin', async () => {
    render(SettingsView)

    expect(await screen.findByText('Nur Admins koennen Familienmitglieder bearbeiten.')).toBeInTheDocument()
    expect(screen.queryByText('Familienmitglied erstellen')).not.toBeInTheDocument()
  })

  it('shows forced password change section when required', async () => {
    mockAuthStore.requiresPasswordChange = true
    mockAuthStore.user.requiresPasswordChange = true
    render(SettingsView)

    expect(await screen.findByText('Passwort aendern erforderlich')).toBeInTheDocument()
  })
})
