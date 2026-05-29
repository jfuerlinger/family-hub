<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFamilyStore } from '../app/stores/familyStore'

const familyStore = useFamilyStore()

const newFamilyName = ref('')
const newMemberEmail = ref('')
const addMemberError = ref<string | null>(null)

onMounted(() => { familyStore.loadFamilies() })

async function createFamily() {
  if (!newFamilyName.value.trim()) return
  await familyStore.createNewFamily(newFamilyName.value.trim())
  newFamilyName.value = ''
}

async function addMember() {
  addMemberError.value = null
  const fam = familyStore.selectedFamily()
  if (!fam || !newMemberEmail.value.trim()) return
  await familyStore.addMember(fam.id, newMemberEmail.value.trim())
  if (familyStore.error) {
    addMemberError.value = familyStore.error
  } else {
    newMemberEmail.value = ''
  }
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1>Familie</h1>
    </div>

    <!-- Familie erstellen -->
    <div v-if="familyStore.families.length === 0" class="card">
      <h3>Familie erstellen</h3>
      <form class="form" @submit.prevent="createFamily">
        <input v-model.trim="newFamilyName" type="text" placeholder="Name der Familie" required />
        <button type="submit" class="btn-primary" :disabled="familyStore.loading">Familie erstellen</button>
      </form>
    </div>

    <!-- Familien-Auswahl -->
    <div v-if="familyStore.families.length > 1" class="card">
      <h3>Familie auswählen</h3>
      <div class="filter-bar">
        <button
          v-for="fam in familyStore.families"
          :key="fam.id"
          type="button"
          :class="['filter-select', { 'nav-link-active': familyStore.selectedFamilyId === fam.id }]"
          @click="familyStore.selectFamily(fam.id)"
        >{{ fam.name }}</button>
      </div>
    </div>

    <!-- Mitglieder -->
    <div v-if="familyStore.selectedFamily()" class="card">
      <h3>{{ familyStore.selectedFamily()?.name }} – Mitglieder</h3>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Farbe</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Mitglied seit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in familyStore.selectedFamily()?.members" :key="member.id">
              <td>
                <span :style="{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', background: member.color }"></span>
              </td>
              <td>{{ member.firstName }} {{ member.lastName }}</td>
              <td>{{ member.email }}</td>
              <td>{{ new Date(member.joinedAtUtc).toLocaleDateString('de-AT') }}</td>
            </tr>
            <tr v-if="!familyStore.selectedFamily()?.members.length">
              <td colspan="4" class="table-empty">Noch keine Mitglieder.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mitglied hinzufügen -->
      <div style="margin-top: 1rem">
        <h3>Mitglied hinzufügen</h3>
        <form class="form" @submit.prevent="addMember">
          <input v-model.trim="newMemberEmail" type="email" placeholder="E-Mail-Adresse" required />
          <button type="submit" class="btn-primary" :disabled="familyStore.loading">Hinzufügen</button>
        </form>
        <p v-if="addMemberError" class="error" style="margin-top: 0.5rem">{{ addMemberError }}</p>
      </div>
    </div>

    <!-- Neue Familie (wenn schon eine existiert) -->
    <div v-if="familyStore.families.length > 0" class="card">
      <h3>Weitere Familie erstellen</h3>
      <form class="form" @submit.prevent="createFamily">
        <input v-model.trim="newFamilyName" type="text" placeholder="Name der Familie" required />
        <button type="submit" class="btn-primary" :disabled="familyStore.loading">Erstellen</button>
      </form>
    </div>
  </div>
</template>
