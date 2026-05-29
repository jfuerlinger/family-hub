import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFamilyStore } from '../app/stores/familyStore'
import * as familiesApi from '../app/api/familiesApi'
import type { Family } from '../app/types/family'

const mockFamily: Family = {
  id: 'fam-1',
  name: 'Muster Familie',
  createdAt: '2024-01-01T00:00:00Z',
  members: [
    {
      id: 'mem-1',
      familyId: 'fam-1',
      userId: 'user-1',
      firstName: 'Max',
      lastName: 'Muster',
      email: 'max@example.com',
      color: '#4f46e5',
      joinedAtUtc: '2024-01-01T00:00:00Z',
    },
  ],
}

describe('familyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('loads families and selects the first', async () => {
    vi.spyOn(familiesApi, 'getFamilies').mockResolvedValue([mockFamily])

    const store = useFamilyStore()
    await store.loadFamilies()

    expect(store.families).toHaveLength(1)
    expect(store.selectedFamilyId).toBe('fam-1')
    expect(store.selectedFamily()?.name).toBe('Muster Familie')
  })

  it('adds new family to the list', async () => {
    vi.spyOn(familiesApi, 'getFamilies').mockResolvedValue([])
    vi.spyOn(familiesApi, 'createFamily').mockResolvedValue(mockFamily)

    const store = useFamilyStore()
    await store.loadFamilies()
    await store.createNewFamily('Muster Familie')

    expect(store.families).toHaveLength(1)
    expect(store.selectedFamilyId).toBe('fam-1')
  })
})
