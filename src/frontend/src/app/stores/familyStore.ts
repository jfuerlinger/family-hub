import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AddFamilyMemberRequest, Family, UpdateFamilyMemberRequest } from '../types/family'
import {
  addFamilyMember,
  createFamily,
  getFamilies,
  updateFamily,
  updateFamilyMember,
} from '../api/familiesApi'

export const useFamilyStore = defineStore('family', () => {
  const families = ref<Family[]>([])
  const selectedFamilyId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const selectedFamily = computed(() => families.value.find(f => f.id === selectedFamilyId.value) ?? null)

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

  async function renameFamily(familyId: string, name: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const updatedFamily = await updateFamily(familyId, { name })
      const targetIndex = families.value.findIndex(family => family.id === familyId)
      if (targetIndex >= 0) {
        families.value.splice(targetIndex, 1, updatedFamily)
      } else {
        families.value.push(updatedFamily)
      }
      selectedFamilyId.value = updatedFamily.id
    } catch {
      error.value = 'Familienname konnte nicht gespeichert werden.'
    } finally {
      loading.value = false
    }
  }

  async function addMember(familyId: string, request: AddFamilyMemberRequest): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await addFamilyMember(familyId, request)
      await loadFamilies()
    } catch {
      error.value = 'Mitglied konnte nicht hinzugefügt werden.'
    } finally {
      loading.value = false
    }
  }

  async function editMember(familyId: string, memberId: string, request: UpdateFamilyMemberRequest): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await updateFamilyMember(familyId, memberId, request)
      await loadFamilies()
    } catch {
      error.value = 'Mitglied konnte nicht aktualisiert werden.'
    } finally {
      loading.value = false
    }
  }

  function selectFamily(id: string): void {
    selectedFamilyId.value = id
  }

  return {
    families,
    selectedFamilyId,
    loading,
    error,
    selectedFamily,
    loadFamilies,
    createNewFamily,
    renameFamily,
    addMember,
    editMember,
    selectFamily,
  }
})
