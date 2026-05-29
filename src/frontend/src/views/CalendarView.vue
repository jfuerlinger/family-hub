<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCalendarStore } from '../app/stores/calendarStore'
import { useFamilyStore } from '../app/stores/familyStore'

const calendarStore = useCalendarStore()
const familyStore = useFamilyStore()

const tab = ref<'personal' | 'family'>('personal')
const newTitle = ref('')
const newDescription = ref('')
const newStart = ref('')
const newEnd = ref('')
const newAllDay = ref(false)

onMounted(async () => {
  await familyStore.loadFamilies()
  await calendarStore.loadMyEvents()
  const fam = familyStore.selectedFamily()
  if (fam) await calendarStore.loadFamilyEvents(fam.id)
})

const family = computed(() => familyStore.selectedFamily())

const uniqueMembers = computed(() => {
  const map = new Map<string, { userId: string; name: string; color: string }>()
  calendarStore.familyEvents.forEach(e => {
    if (!map.has(e.userId)) {
      map.set(e.userId, { userId: e.userId, name: e.memberName, color: e.memberColor })
    }
  })
  return [...map.values()]
})

const visibleEvents = computed(() => calendarStore.visibleFamilyEvents())

async function addEvent() {
  if (!newTitle.value.trim() || !newStart.value || !newEnd.value) return
  await calendarStore.addEvent({
    title: newTitle.value.trim(),
    description: newDescription.value || null,
    startUtc: new Date(newStart.value).toISOString(),
    endUtc: new Date(newEnd.value).toISOString(),
    allDay: newAllDay.value,
  })
  if (!calendarStore.error) {
    newTitle.value = ''
    newDescription.value = ''
    newStart.value = ''
    newEnd.value = ''
    newAllDay.value = false
  }
}

function formatDt(iso: string) {
  return new Date(iso).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1>Kalender</h1>
      <div class="view-header-actions">
        <button type="button" :class="['filter-select', { 'nav-link-active': tab === 'personal' }]" @click="tab = 'personal'">Persönlich</button>
        <button type="button" :class="['filter-select', { 'nav-link-active': tab === 'family' }]" @click="tab = 'family'">Familie</button>
      </div>
    </div>

    <!-- Persönlicher Kalender -->
    <template v-if="tab === 'personal'">
      <div class="card">
        <h3>Neues Ereignis</h3>
        <form @submit.prevent="addEvent">
          <div class="form" style="margin-bottom: 0.5rem">
            <input v-model.trim="newTitle" type="text" placeholder="Titel" required />
            <input v-model.trim="newDescription" type="text" placeholder="Beschreibung (optional)" />
            <input v-model="newStart" type="datetime-local" required />
            <input v-model="newEnd" type="datetime-local" required />
            <label style="display:flex;align-items:center;gap:0.4rem">
              <input v-model="newAllDay" type="checkbox" />
              Ganztägig
            </label>
          </div>
          <button type="submit" class="btn-primary" :disabled="calendarStore.loading">Ereignis erstellen</button>
        </form>
        <p v-if="calendarStore.error" class="error" style="margin-top: 0.5rem">{{ calendarStore.error }}</p>
      </div>

      <div class="card">
        <h3>Meine Ereignisse</h3>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr><th>Titel</th><th>Start</th><th>Ende</th><th>Ganztägig</th></tr>
            </thead>
            <tbody>
              <tr v-for="ev in calendarStore.myEvents" :key="ev.id">
                <td>{{ ev.title }}</td>
                <td>{{ formatDt(ev.startUtc) }}</td>
                <td>{{ formatDt(ev.endUtc) }}</td>
                <td>{{ ev.allDay ? 'Ja' : 'Nein' }}</td>
              </tr>
              <tr v-if="calendarStore.myEvents.length === 0">
                <td colspan="4" class="table-empty">Keine Ereignisse.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Familienkalender -->
    <template v-else>
      <div v-if="!family" class="card">
        <p class="muted">Keine Familie ausgewählt. Gehe zu <RouterLink to="/family">Familie</RouterLink>.</p>
      </div>

      <template v-else>
        <!-- Mitglieder-Toggle -->
        <div class="card">
          <h3>Mitglieder anzeigen/ausblenden</h3>
          <div class="filter-bar">
            <button
              v-for="member in uniqueMembers"
              :key="member.userId"
              type="button"
              :style="{
                borderColor: member.color,
                color: calendarStore.isMemberVisible(member.userId) ? '#fff' : member.color,
                background: calendarStore.isMemberVisible(member.userId) ? member.color : 'transparent',
                borderRadius: '999px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: `2px solid ${member.color}`,
              }"
              @click="calendarStore.toggleMemberVisibility(member.userId)"
            >
              {{ member.name }}
            </button>
          </div>
        </div>

        <!-- Ereignisse -->
        <div class="card">
          <h3>Familienereignisse</h3>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr><th>Farbe</th><th>Person</th><th>Titel</th><th>Start</th><th>Ende</th></tr>
              </thead>
              <tbody>
                <tr v-for="ev in visibleEvents" :key="ev.id">
                  <td>
                    <span :style="{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: ev.memberColor }"></span>
                  </td>
                  <td>{{ ev.memberName }}</td>
                  <td>{{ ev.title }}</td>
                  <td>{{ formatDt(ev.startUtc) }}</td>
                  <td>{{ formatDt(ev.endUtc) }}</td>
                </tr>
                <tr v-if="visibleEvents.length === 0">
                  <td colspan="5" class="table-empty">Keine Ereignisse.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
