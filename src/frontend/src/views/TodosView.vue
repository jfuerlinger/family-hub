<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTodoStore } from '../app/stores/todoStore'
import { useFamilyStore } from '../app/stores/familyStore'

const todoStore = useTodoStore()
const familyStore = useFamilyStore()

const newTitle = ref('')
const newDescription = ref('')
const newDueDate = ref('')
const newAssignedTo = ref('')
const filter = ref<'all' | 'open' | 'done'>('all')

onMounted(async () => {
  await familyStore.loadFamilies()
  const fam = familyStore.selectedFamily()
  if (fam) await todoStore.loadTodos(fam.id)
})

const family = computed(() => familyStore.selectedFamily())

const filteredTodos = computed(() => {
  if (filter.value === 'open') return todoStore.todos.filter(t => !t.isDone)
  if (filter.value === 'done') return todoStore.todos.filter(t => t.isDone)
  return todoStore.todos
})

async function addTodo() {
  const fam = family.value
  if (!fam || !newTitle.value.trim()) return
      await todoStore.addTodo(fam.id, {
    title: newTitle.value.trim(),
    description: newDescription.value || null,
    dueDateUtc: newDueDate.value ? new Date(newDueDate.value).toISOString() : null,
    assignedToUserId: newAssignedTo.value || null,
  })
  newTitle.value = ''
  newDescription.value = ''
  newDueDate.value = ''
  newAssignedTo.value = ''
}

async function toggle(todoId: string, isDone: boolean) {
  const fam = family.value
  if (!fam) return
  await todoStore.toggleDone(fam.id, todoId, isDone)
}

function memberName(userId: string | null): string {
  if (!userId || !family.value) return '—'
  const m = family.value.members.find(x => x.userId === userId)
  return m ? `${m.firstName} ${m.lastName}` : '—'
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1>Aufgaben</h1>
    </div>

    <div v-if="!family" class="card">
      <p class="muted">Keine Familie ausgewählt. Gehe zu <RouterLink to="/family">Familie</RouterLink>.</p>
    </div>

    <template v-else>
      <!-- Neue Aufgabe -->
      <div class="card">
        <h3>Neue Aufgabe</h3>
        <form @submit.prevent="addTodo">
          <div class="form" style="margin-bottom: 0.5rem">
            <input v-model.trim="newTitle" type="text" placeholder="Titel" required />
            <input v-model.trim="newDescription" type="text" placeholder="Beschreibung (optional)" />
            <input v-model="newDueDate" type="date" />
            <select v-model="newAssignedTo">
              <option value="">Kein Mitglied</option>
              <option v-for="m in family.members" :key="m.userId" :value="m.userId">
                {{ m.firstName }} {{ m.lastName }}
              </option>
            </select>
          </div>
          <button type="submit" class="btn-primary" :disabled="todoStore.loading">Aufgabe erstellen</button>
        </form>
        <p v-if="todoStore.error" class="error" style="margin-top: 0.5rem">{{ todoStore.error }}</p>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <button type="button" :class="['filter-select', { 'nav-link-active': filter === 'all' }]" @click="filter = 'all'">Alle</button>
        <button type="button" :class="['filter-select', { 'nav-link-active': filter === 'open' }]" @click="filter = 'open'">Offen</button>
        <button type="button" :class="['filter-select', { 'nav-link-active': filter === 'done' }]" @click="filter = 'done'">Erledigt</button>
      </div>

      <!-- Todo-Liste -->
      <div class="card">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Titel</th>
                <th>Zugewiesen an</th>
                <th>Fällig</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="todo in filteredTodos" :key="todo.id" :style="{ opacity: todo.isDone ? 0.6 : 1 }">
                <td>
                  <button type="button" :title="todo.isDone ? 'Als offen markieren' : 'Als erledigt markieren'" @click="toggle(todo.id, todo.isDone)">
                    <span v-if="todo.isDone" class="status-badge status-badge--success">✓ Erledigt</span>
                    <span v-else class="status-badge status-badge--warning">○ Offen</span>
                  </button>
                </td>
                <td :style="{ textDecoration: todo.isDone ? 'line-through' : 'none' }">{{ todo.title }}</td>
                <td>{{ memberName(todo.assignedToUserId) }}</td>
                <td>{{ todo.dueDateUtc ? new Date(todo.dueDateUtc).toLocaleDateString('de-AT') : '—' }}</td>
              </tr>
              <tr v-if="filteredTodos.length === 0">
                <td colspan="4" class="table-empty">Keine Aufgaben.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
