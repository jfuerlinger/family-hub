<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '../app/stores/authStore'
import { useFamilyStore } from '../app/stores/familyStore'
import type { FamilyMember } from '../app/types/family'

const authStore = useAuthStore()
const familyStore = useFamilyStore()

const familyName = ref('')
const passwordError = ref<string | null>(null)

const addMemberForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  isAdmin: false,
})

const editMemberId = ref<string | null>(null)
const editMemberForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  isAdmin: false,
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const selectedFamily = computed(() => familyStore.selectedFamily)
const currentUserId = computed(() => authStore.user?.id ?? null)
const currentMembership = computed(() => selectedFamily.value?.members.find(member => member.userId === currentUserId.value) ?? null)
const isCurrentUserAdmin = computed(() => currentMembership.value?.isAdmin === true)

async function loadFamiliesForCurrentUser(): Promise<void> {
  await familyStore.loadFamilies()
  familyName.value = selectedFamily.value?.name ?? ''
}

onMounted(async () => {
  if (authStore.requiresPasswordChange) {
    familyName.value = selectedFamily.value?.name ?? ''
    return
  }

  await loadFamiliesForCurrentUser()
})

watch(selectedFamily, (family) => {
  familyName.value = family?.name ?? ''
  editMemberId.value = null
})

async function saveFamily(): Promise<void> {
  if (!familyName.value.trim()) return

  if (selectedFamily.value) {
    await familyStore.renameFamily(selectedFamily.value.id, familyName.value.trim())
    return
  }

  await familyStore.createNewFamily(familyName.value.trim())
}

async function addMember(): Promise<void> {
  if (!selectedFamily.value) return
  await familyStore.addMember(selectedFamily.value.id, {
    firstName: addMemberForm.firstName.trim(),
    lastName: addMemberForm.lastName.trim(),
    email: addMemberForm.email.trim(),
    phoneNumber: addMemberForm.phoneNumber.trim() || null,
    isAdmin: addMemberForm.isAdmin,
  })

  if (!familyStore.error) {
    addMemberForm.firstName = ''
    addMemberForm.lastName = ''
    addMemberForm.email = ''
    addMemberForm.phoneNumber = ''
    addMemberForm.isAdmin = false
  }
}

function beginEditMember(member: FamilyMember): void {
  editMemberId.value = member.id
  editMemberForm.firstName = member.firstName
  editMemberForm.lastName = member.lastName
  editMemberForm.email = member.email
  editMemberForm.phoneNumber = member.phoneNumber ?? ''
  editMemberForm.isAdmin = member.isAdmin
}

function cancelEditMember(): void {
  editMemberId.value = null
}

async function saveMember(memberId: string): Promise<void> {
  if (!selectedFamily.value) return
  await familyStore.editMember(selectedFamily.value.id, memberId, {
    firstName: editMemberForm.firstName.trim(),
    lastName: editMemberForm.lastName.trim(),
    email: editMemberForm.email.trim(),
    phoneNumber: editMemberForm.phoneNumber.trim() || null,
    isAdmin: editMemberForm.isAdmin,
  })

  if (!familyStore.error) {
    editMemberId.value = null
  }
}

async function changePassword(): Promise<void> {
  passwordError.value = null
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Die neuen Passwoerter stimmen nicht ueberein.'
    return
  }

  await authStore.changeUserPassword(passwordForm.currentPassword, passwordForm.newPassword)
  if (authStore.authError) {
    passwordError.value = authStore.authError
    return
  }

  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''

  await loadFamiliesForCurrentUser()
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1>Einstellungen</h1>
    </div>

    <div v-if="authStore.requiresPasswordChange" class="card">
      <h3>Passwort aendern erforderlich</h3>
      <p>Du musst dein temporaeres Passwort zuerst aendern, bevor du Family Hub nutzen kannst.</p>
      <form class="form" @submit.prevent="changePassword">
        <input v-model="passwordForm.currentPassword" type="password" placeholder="Aktuelles Passwort" required minlength="8" />
        <input v-model="passwordForm.newPassword" type="password" placeholder="Neues Passwort" required minlength="8" />
        <input v-model="passwordForm.confirmPassword" type="password" placeholder="Neues Passwort bestaetigen" required minlength="8" />
        <button type="submit" class="btn-primary" :disabled="authStore.loading">Passwort speichern</button>
      </form>
      <p v-if="passwordError" class="error" style="margin-top: 0.5rem">{{ passwordError }}</p>
    </div>

    <div class="card">
      <h3>Familie</h3>
      <form class="form" @submit.prevent="saveFamily">
        <input v-model.trim="familyName" type="text" placeholder="Name der Familie" required />
        <button type="submit" class="btn-primary" :disabled="familyStore.loading">
          {{ selectedFamily ? 'Familienname speichern' : 'Familie erstellen' }}
        </button>
      </form>
    </div>

    <div v-if="familyStore.families.length > 1" class="card">
      <h3>Familie auswaehlen</h3>
      <div class="filter-bar">
        <button
          v-for="family in familyStore.families"
          :key="family.id"
          type="button"
          :class="['filter-select', { 'nav-link-active': familyStore.selectedFamilyId === family.id }]"
          @click="familyStore.selectFamily(family.id)"
        >{{ family.name }}</button>
      </div>
    </div>

    <div v-if="selectedFamily" class="card">
      <h3>Familienmitglieder</h3>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Vorname</th>
              <th>Nachname</th>
              <th>E-Mail</th>
              <th>Telefon</th>
              <th>Rolle</th>
              <th v-if="isCurrentUserAdmin">Aktion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in selectedFamily.members" :key="member.id">
              <template v-if="editMemberId === member.id">
                <td><input v-model.trim="editMemberForm.firstName" type="text" required /></td>
                <td><input v-model.trim="editMemberForm.lastName" type="text" required /></td>
                <td><input v-model.trim="editMemberForm.email" type="email" required /></td>
                <td><input v-model.trim="editMemberForm.phoneNumber" type="tel" /></td>
                <td>
                  <label style="display: inline-flex; gap: 0.35rem; align-items: center;">
                    <input v-model="editMemberForm.isAdmin" type="checkbox" />
                    Admin
                  </label>
                </td>
                <td>
                  <button type="button" class="filter-select" @click="saveMember(member.id)">Speichern</button>
                  <button type="button" class="filter-select" @click="cancelEditMember">Abbrechen</button>
                </td>
              </template>
              <template v-else>
                <td>{{ member.firstName }}</td>
                <td>{{ member.lastName }}</td>
                <td>{{ member.email }}</td>
                <td>{{ member.phoneNumber || '-' }}</td>
                <td>{{ member.isAdmin ? 'Admin' : 'Mitglied' }}</td>
                <td v-if="isCurrentUserAdmin">
                  <button type="button" class="filter-select" @click="beginEditMember(member)">Bearbeiten</button>
                </td>
              </template>
            </tr>
            <tr v-if="selectedFamily.members.length === 0">
              <td :colspan="isCurrentUserAdmin ? 6 : 5" class="table-empty">Noch keine Mitglieder vorhanden.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="isCurrentUserAdmin" style="margin-top: 1rem">
        <h3>Familienmitglied erstellen</h3>
        <form class="form" @submit.prevent="addMember">
          <input v-model.trim="addMemberForm.firstName" type="text" placeholder="Vorname" required />
          <input v-model.trim="addMemberForm.lastName" type="text" placeholder="Nachname" required />
          <input v-model.trim="addMemberForm.email" type="email" placeholder="E-Mail-Adresse" required />
          <input v-model.trim="addMemberForm.phoneNumber" type="tel" placeholder="Telefonnummer (optional)" />
          <label style="display: inline-flex; gap: 0.35rem; align-items: center;">
            <input v-model="addMemberForm.isAdmin" type="checkbox" />
            Als Admin erstellen
          </label>
          <button type="submit" class="btn-primary" :disabled="familyStore.loading">Mitglied einladen</button>
        </form>
      </div>
      <p v-else class="table-empty" style="margin-top: 1rem;">Nur Admins koennen Familienmitglieder bearbeiten.</p>
    </div>

    <p v-if="familyStore.error" class="error">{{ familyStore.error }}</p>
  </div>
</template>
