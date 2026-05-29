<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFamilyStore } from '../app/stores/familyStore'
import { useTodoStore } from '../app/stores/todoStore'
import { useAuthStore } from '../app/stores/authStore'

const authStore = useAuthStore()
const familyStore = useFamilyStore()
const todoStore = useTodoStore()

onMounted(async () => {
  await familyStore.loadFamilies()
  const fam = familyStore.selectedFamily()
  if (fam) await todoStore.loadTodos(fam.id)
})

const family = computed(() => familyStore.selectedFamily())
const pendingTodos = computed(() => todoStore.todos.filter(t => !t.isDone))
const doneTodos = computed(() => todoStore.todos.filter(t => t.isDone))

const displayName = computed(() =>
  authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}`.trim() : ''
)
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1>Willkommen, {{ displayName }}!</h1>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-card-header">
          <div class="summary-card-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span class="summary-card-label">Familie</span>
        </div>
        <div class="summary-card-value">{{ family?.name ?? '—' }}</div>
        <p class="summary-card-sub">{{ family?.members.length ?? 0 }} Mitglied(er)</p>
      </div>

      <div class="summary-card">
        <div class="summary-card-header">
          <div class="summary-card-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span class="summary-card-label">Offene Aufgaben</span>
        </div>
        <div class="summary-card-value">{{ pendingTodos.length }}</div>
        <p class="summary-card-sub">{{ doneTodos.length }} erledigt</p>
      </div>

      <div class="summary-card">
        <div class="summary-card-header">
          <div class="summary-card-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span class="summary-card-label">Mitglieder</span>
        </div>
        <div class="summary-card-value">{{ family?.members.length ?? 0 }}</div>
        <p class="summary-card-sub">in {{ familyStore.families.length }} Familie(n)</p>
      </div>
    </div>

    <div v-if="pendingTodos.length > 0" class="card">
      <h3>Offene Aufgaben</h3>
      <ul class="upcoming-list">
        <li v-for="todo in pendingTodos.slice(0, 5)" :key="todo.id">
          <span>{{ todo.title }}</span>
          <span class="muted">{{ todo.dueDateUtc ? new Date(todo.dueDateUtc).toLocaleDateString('de-AT') : '' }}</span>
        </li>
      </ul>
    </div>

    <div v-if="!family" class="card">
      <p class="muted">Noch keine Familie. Gehe zu <RouterLink to="/family">Familie</RouterLink>, um eine zu erstellen.</p>
    </div>
  </div>
</template>
