import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Family } from '../types/family'
import { getFamilies, createFamily, addFamilyMember } from '../api/familiesApi'

export const useFamilyStore = defineStore('family', () => {
  const families = ref<Family[]>([])
  const selectedFamilyId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const selectedFamily = () => families.value.find(f => f.id === selectedFamilyId.value) ?? null

  async function loadFamilies(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      families.value = await getFamilies()
      if (!selectedFamilyId.value && families.value.length > 0) {
        selectedFamilyId.value = families.value[0].id
      }
    } catch {
      error.value = 'Familien konnten nicht geladen werden.'
    } finally {
      loading.value = false
    }
  }

  async function createNewFamily(name: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const family = await createFamily({ name })
      families.value.push(family)
      selectedFamilyId.value = family.id
    } catch {
      error.value = 'Familie konnte nicht erstellt werden.'
    } finally {
      loading.value = false
    }
  }

  async function addMember(familyId: string, email: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await addFamilyMember(familyId, { email })
      await loadFamilies()
    } catch {
      error.value = 'Mitglied konnte nicht hinzugefügt werden.'
    } finally {
      loading.value = false
    }
  }

  function selectFamily(id: string): void {
    selectedFamilyId.value = id
  }

  return { families, selectedFamilyId, loading, error, selectedFamily, loadFamilies, createNewFamily, addMember, selectFamily }
})
