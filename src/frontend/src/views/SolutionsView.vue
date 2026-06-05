<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { TodoItem } from '../app/types/todo'
import { useFamilyStore } from '../app/stores/familyStore'
import { useTodoStore } from '../app/stores/todoStore'

interface MindmapNode {
  id: string
  title: string
  x: number
  y: number
  parentId: string | null
}

interface MindmapData {
  version: 1
  nodes: MindmapNode[]
  taskLinks: Record<string, string[]>
}

interface DragState {
  nodeId: string
  pointerId: number
  startClientX: number
  startClientY: number
  startNodeX: number
  startNodeY: number
  dragged: boolean
  dragElement: HTMLElement | null
}

const STORAGE_KEY_PREFIX = 'familyhub:solutions:mindmap:'
const MINDMAP_DRAG_THRESHOLD = 5

const familyStore = useFamilyStore()
const todoStore = useTodoStore()

const canvasRef = ref<HTMLElement | null>(null)
const taskTitleInputRef = ref<HTMLInputElement | null>(null)

const nodes = ref<MindmapNode[]>([])
const taskLinks = ref<Record<string, string[]>>({})
const selectedNodeId = ref<string | null>(null)

const nodeTitleDraft = ref('')
const taskTitle = ref('')
const taskDescription = ref('')
const taskDueDate = ref('')
const taskAssigneeId = ref('')
const keepTaskDetails = ref(true)
const createHint = ref('')

const dragState = ref<DragState | null>(null)
const suppressClickNodeId = ref<string | null>(null)
let activeFamilyLoadId = 0

const family = computed(() => familyStore.selectedFamily)
const selectedNode = computed(() => nodes.value.find(node => node.id === selectedNodeId.value) ?? null)
const familyMembers = computed(() => family.value?.members ?? [])

const connectorLines = computed(() =>
  nodes.value
    .filter(node => node.parentId !== null)
    .map(node => {
      const parentNode = nodes.value.find(candidate => candidate.id === node.parentId)
      if (!parentNode) return null
      return {
        id: `${parentNode.id}:${node.id}`,
        x1: parentNode.x,
        y1: parentNode.y,
        x2: node.x,
        y2: node.y,
      }
    })
    .filter((line): line is { id: string, x1: number, y1: number, x2: number, y2: number } => line !== null),
)

const nodeTaskCountMap = computed(() => {
  const map = new Map<string, number>()
  Object.entries(taskLinks.value).forEach(([nodeId, todoIds]) => {
    map.set(nodeId, todoIds.length)
  })
  return map
})

const linkedTodos = computed<TodoItem[]>(() => {
  const selected = selectedNode.value
  if (!selected) return []

  const todosById = new Map(todoStore.todos.map(todo => [todo.id, todo]))
  const todoIds = taskLinks.value[selected.id] ?? []
  return todoIds
    .map(todoId => todosById.get(todoId))
    .filter((todo): todo is TodoItem => todo !== undefined)
    .sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1
      return new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime()
    })
})

function createNodeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `node-${Date.now()}-${Math.round(Math.random() * 100_000)}`
}

function cloneDefaultMindmap(): MindmapData {
  const rootId = createNodeId()
  return {
    version: 1,
    nodes: [{ id: rootId, title: 'Lösungsidee', x: 210, y: 190, parentId: null }],
    taskLinks: {},
  }
}

function isMindmapNode(value: unknown): value is MindmapNode {
  if (!value || typeof value !== 'object') return false
  const node = value as Partial<MindmapNode>
  return (
    typeof node.id === 'string'
    && typeof node.title === 'string'
    && typeof node.x === 'number'
    && typeof node.y === 'number'
    && (typeof node.parentId === 'string' || node.parentId === null)
  )
}

function storageKey(familyId: string): string {
  return `${STORAGE_KEY_PREFIX}${familyId}`
}

function loadMindmap(familyId: string): MindmapData {
  try {
    const raw = window.localStorage.getItem(storageKey(familyId))
    if (!raw) return cloneDefaultMindmap()
    const parsed = JSON.parse(raw) as Partial<MindmapData>
    if (parsed.version !== 1 || !Array.isArray(parsed.nodes) || typeof parsed.taskLinks !== 'object' || parsed.taskLinks === null) {
      return cloneDefaultMindmap()
    }

    const validNodes = parsed.nodes.filter(isMindmapNode)
    if (validNodes.length === 0) return cloneDefaultMindmap()
    const validLinks: Record<string, string[]> = {}
    Object.entries(parsed.taskLinks).forEach(([nodeId, todoIds]) => {
      if (!Array.isArray(todoIds)) return
      validLinks[nodeId] = todoIds.filter(todoId => typeof todoId === 'string')
    })
    return { version: 1, nodes: validNodes, taskLinks: validLinks }
  } catch {
    return cloneDefaultMindmap()
  }
}

function saveMindmap(): void {
  const familyId = familyStore.selectedFamilyId
  if (!familyId) return

  const data: MindmapData = {
    version: 1,
    nodes: nodes.value,
    taskLinks: taskLinks.value,
  }
  window.localStorage.setItem(storageKey(familyId), JSON.stringify(data))
}

function pruneTaskLinks(existingLinks: Record<string, string[]>): Record<string, string[]> {
  const validTodoIds = new Set(todoStore.todos.map(todo => todo.id))
  const validNodeIds = new Set(nodes.value.map(node => node.id))
  const normalized: Record<string, string[]> = {}

  Object.entries(existingLinks).forEach(([nodeId, todoIds]) => {
    if (!validNodeIds.has(nodeId)) return
    const unique = Array.from(new Set(todoIds.filter(todoId => validTodoIds.has(todoId))))
    if (unique.length > 0) normalized[nodeId] = unique
  })
  return normalized
}

function setSelectedNode(nodeId: string | null): void {
  selectedNodeId.value = nodeId
  const node = nodes.value.find(candidate => candidate.id === nodeId)
  nodeTitleDraft.value = node?.title ?? ''

  if (node && taskTitle.value.trim().length === 0) {
    taskTitle.value = `${node.title}: `
  }
  void nextTick(() => taskTitleInputRef.value?.focus())
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function toDateOnlyUtc(dateInput: string): string | null {
  if (!dateInput) return null
  const parts = dateInput.split('-').map(part => Number(part))
  if (parts.length !== 3 || parts.some(part => Number.isNaN(part))) {
    return new Date(dateInput).toISOString()
  }
  const [year, month, day] = parts
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString()
}

function addChildNode(): void {
  const parent = selectedNode.value ?? nodes.value.find(node => node.parentId === null) ?? null
  if (!parent) return

  const siblings = nodes.value
    .filter(node => node.parentId === parent.id)
    .sort((a, b) => a.y - b.y)
  const anchorY = siblings.length === 0 ? parent.y : siblings[siblings.length - 1].y + 95

  const canvasRect = canvasRef.value?.getBoundingClientRect()
  const maxX = Math.max(260, (canvasRect?.width ?? 960) - 120)
  const maxY = Math.max(150, (canvasRect?.height ?? 560) - 80)

  const childNode: MindmapNode = {
    id: createNodeId(),
    title: 'Neue Idee',
    parentId: parent.id,
    x: clamp(parent.x + 220, 120, maxX),
    y: clamp(anchorY, 80, maxY),
  }
  nodes.value = [...nodes.value, childNode]
  setSelectedNode(childNode.id)
  saveMindmap()
}

function collectSubTreeIds(rootNodeId: string): Set<string> {
  const remaining = new Set<string>([rootNodeId])
  let updated = true
  while (updated) {
    updated = false
    nodes.value.forEach(node => {
      if (node.parentId && remaining.has(node.parentId) && !remaining.has(node.id)) {
        remaining.add(node.id)
        updated = true
      }
    })
  }
  return remaining
}

function removeSelectedNode(): void {
  const selected = selectedNode.value
  if (!selected || selected.parentId === null) return

  const removableIds = collectSubTreeIds(selected.id)
  nodes.value = nodes.value.filter(node => !removableIds.has(node.id))

  const nextLinks: Record<string, string[]> = {}
  Object.entries(taskLinks.value).forEach(([nodeId, todoIds]) => {
    if (!removableIds.has(nodeId)) nextLinks[nodeId] = todoIds
  })
  taskLinks.value = nextLinks

  const fallback = nodes.value.find(node => node.parentId === null) ?? nodes.value[0] ?? null
  setSelectedNode(fallback?.id ?? null)
  saveMindmap()
}

function saveNodeTitle(): void {
  const selected = selectedNode.value
  if (!selected) return

  const trimmedTitle = nodeTitleDraft.value.trim()
  if (!trimmedTitle) {
    nodeTitleDraft.value = selected.title
    return
  }

  nodes.value = nodes.value.map(node => node.id === selected.id ? { ...node, title: trimmedTitle } : node)
  if (taskTitle.value.trim().length === 0) {
    taskTitle.value = `${trimmedTitle}: `
  }
  saveMindmap()
}

function setNodePosition(nodeId: string, x: number, y: number): void {
  nodes.value = nodes.value.map(node => node.id === nodeId ? { ...node, x, y } : node)
}

function stopDragging(state?: DragState | null): void {
  if (state?.dragElement && state.dragElement.hasPointerCapture(state.pointerId)) {
    state.dragElement.releasePointerCapture(state.pointerId)
  }
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

function onPointerMove(event: PointerEvent): void {
  const state = dragState.value
  if (!state || state.pointerId !== event.pointerId) return

  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return

  const deltaX = event.clientX - state.startClientX
  const deltaY = event.clientY - state.startClientY
  if (!state.dragged && Math.hypot(deltaX, deltaY) >= MINDMAP_DRAG_THRESHOLD) {
    state.dragged = true
  }
  if (!state.dragged) return

  const boundedX = clamp(state.startNodeX + deltaX, 120, canvasRect.width - 120)
  const boundedY = clamp(state.startNodeY + deltaY, 70, canvasRect.height - 70)
  setNodePosition(state.nodeId, boundedX, boundedY)
}

function onPointerUp(event: PointerEvent): void {
  const state = dragState.value
  if (!state || state.pointerId !== event.pointerId) return

  dragState.value = null
  stopDragging(state)

  if (state.dragged) {
    suppressClickNodeId.value = state.nodeId
    window.setTimeout(() => {
      if (suppressClickNodeId.value === state.nodeId) suppressClickNodeId.value = null
    }, 0)
    saveMindmap()
  }
}

function startNodeDrag(event: PointerEvent, nodeId: string): void {
  if (event.button !== 0) return
  const node = nodes.value.find(candidate => candidate.id === nodeId)
  if (!node) return

  const element = event.currentTarget as HTMLElement | null
  element?.setPointerCapture(event.pointerId)

  dragState.value = {
    nodeId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startNodeX: node.x,
    startNodeY: node.y,
    dragged: false,
    dragElement: element,
  }
  setSelectedNode(nodeId)

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function selectNode(nodeId: string): void {
  if (suppressClickNodeId.value === nodeId) {
    suppressClickNodeId.value = null
    return
  }
  setSelectedNode(nodeId)
}

function linkTodoToNode(nodeId: string, todoId: string): void {
  const existingLinks = taskLinks.value[nodeId] ?? []
  if (existingLinks.includes(todoId)) return
  taskLinks.value = {
    ...taskLinks.value,
    [nodeId]: [...existingLinks, todoId],
  }
  saveMindmap()
}

function unlinkTodoFromNode(nodeId: string, todoId: string): void {
  const existingLinks = taskLinks.value[nodeId] ?? []
  const nextLinks = existingLinks.filter(linkedTodoId => linkedTodoId !== todoId)
  const copied = { ...taskLinks.value }
  if (nextLinks.length === 0) {
    delete copied[nodeId]
  } else {
    copied[nodeId] = nextLinks
  }
  taskLinks.value = copied
  saveMindmap()
}

async function createTodoForSelectedNode(): Promise<void> {
  createHint.value = ''
  const selected = selectedNode.value
  const currentFamily = family.value
  if (!selected || !currentFamily) return

  const trimmedTaskTitle = taskTitle.value.trim()
  if (!trimmedTaskTitle) return

  const createdTodo = await todoStore.addTodo(currentFamily.id, {
    title: trimmedTaskTitle,
    description: taskDescription.value.trim() ? taskDescription.value.trim() : null,
    dueDateUtc: toDateOnlyUtc(taskDueDate.value),
    assignedToUserId: taskAssigneeId.value || null,
  })

  if (!createdTodo) return

  linkTodoToNode(selected.id, createdTodo.id)
  createHint.value = `„${createdTodo.title}“ wurde zur Idee hinzugefügt.`

  taskTitle.value = keepTaskDetails.value ? '' : `${selected.title}: `
  taskDescription.value = ''
  if (!keepTaskDetails.value) {
    taskDueDate.value = ''
    taskAssigneeId.value = ''
  }
  void nextTick(() => taskTitleInputRef.value?.focus())
}

watch(
  () => familyStore.selectedFamilyId,
  async (familyId) => {
    activeFamilyLoadId += 1
    const currentLoadId = activeFamilyLoadId
    createHint.value = ''
    stopDragging()
    dragState.value = null

    if (!familyId) {
      nodes.value = []
      taskLinks.value = {}
      setSelectedNode(null)
      return
    }

    await todoStore.loadTodos(familyId)
    if (currentLoadId !== activeFamilyLoadId) return

    const loadedMindmap = loadMindmap(familyId)
    nodes.value = loadedMindmap.nodes
    taskLinks.value = pruneTaskLinks(loadedMindmap.taskLinks)

    const rootNode = nodes.value.find(node => node.parentId === null) ?? nodes.value[0] ?? null
    setSelectedNode(rootNode?.id ?? null)
    saveMindmap()
  },
  { immediate: true },
)

onMounted(async () => {
  await familyStore.loadFamilies()
})

onBeforeUnmount(() => {
  stopDragging()
})
</script>

<template>
  <div class="view solutions-view">
    <div class="view-header">
      <h1>Lösungen</h1>
      <button
        v-if="family"
        type="button"
        class="btn-primary"
        @click="addChildNode"
      >
        Idee hinzufügen
      </button>
    </div>

    <div v-if="!family" class="card">
      <p class="muted">
        Keine Familie ausgewählt. Gehe zu <RouterLink to="/settings">Einstellungen</RouterLink>.
      </p>
    </div>

    <template v-else>
      <div class="solutions-layout">
        <section class="card solutions-map-card">
          <div class="solutions-toolbar">
            <p class="muted">
              Ziehe Einträge mit der Maus. Wähle eine Idee aus und erstelle direkt dazu Aufgaben.
            </p>
            <button type="button" @click="addChildNode">Unteridee erstellen</button>
          </div>

          <div class="solutions-canvas" ref="canvasRef">
            <svg class="solutions-links" preserveAspectRatio="none" aria-hidden="true">
              <line
                v-for="line in connectorLines"
                :key="line.id"
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
              />
            </svg>

            <button
              v-for="node in nodes"
              :key="node.id"
              type="button"
              class="mindmap-node"
              :class="{ 'mindmap-node--selected': selectedNodeId === node.id }"
              :style="{ left: `${node.x}px`, top: `${node.y}px` }"
              :aria-label="`Idee ${node.title} auswählen`"
              @pointerdown="startNodeDrag($event, node.id)"
              @click="selectNode(node.id)"
            >
              <span class="mindmap-node__title">{{ node.title }}</span>
              <small v-if="(nodeTaskCountMap.get(node.id) ?? 0) > 0">
                {{ nodeTaskCountMap.get(node.id) }} Aufgabe(n)
              </small>
            </button>
          </div>
        </section>

        <aside class="card solutions-side-panel">
          <template v-if="selectedNode">
            <h3>Idee bearbeiten</h3>
            <p class="muted">Füge Details hinzu und erstelle Aufgaben direkt aus dieser Idee.</p>

            <form class="solutions-inline-form" @submit.prevent="saveNodeTitle">
              <input
                v-model.trim="nodeTitleDraft"
                type="text"
                placeholder="Titel der Idee"
                required
              />
              <div class="solutions-inline-actions">
                <button type="submit" class="btn-primary">Titel speichern</button>
                <button
                  type="button"
                  :disabled="selectedNode.parentId === null"
                  @click="removeSelectedNode"
                >
                  Idee löschen
                </button>
              </div>
            </form>

            <h3>Aufgabe zur Idee erstellen</h3>
            <form class="solutions-task-form" @submit.prevent="createTodoForSelectedNode">
              <label>
                Titel *
                <input
                  ref="taskTitleInputRef"
                  v-model.trim="taskTitle"
                  type="text"
                  placeholder="Was soll konkret erledigt werden?"
                  required
                />
              </label>

              <label>
                Beschreibung
                <textarea
                  v-model.trim="taskDescription"
                  class="solutions-textarea"
                  rows="3"
                  placeholder="Details, Akzeptanzkriterien oder Notizen"
                />
              </label>

              <div class="solutions-task-grid">
                <label>
                  Fällig am
                  <input
                    v-model="taskDueDate"
                    type="date"
                    @click="($event.target as HTMLInputElement).showPicker()"
                  />
                </label>

                <label>
                  Zuständig
                  <select v-model="taskAssigneeId">
                    <option value="">Kein Mitglied</option>
                    <option v-for="member in familyMembers" :key="member.userId" :value="member.userId">
                      {{ member.firstName }} {{ member.lastName }}
                    </option>
                  </select>
                </label>
              </div>

              <label class="solutions-checkbox-label">
                <input v-model="keepTaskDetails" type="checkbox" />
                Nach dem Speichern Fälligkeitsdatum und Zuständigkeit behalten
              </label>

              <button type="submit" class="btn-primary" :disabled="todoStore.loading">
                Aufgabe hinzufügen
              </button>
            </form>

            <p v-if="todoStore.error" class="error">{{ todoStore.error }}</p>
            <p v-if="createHint" class="muted">{{ createHint }}</p>

            <h3>Verknüpfte Aufgaben</h3>
            <ul v-if="linkedTodos.length > 0" class="solutions-linked-list">
              <li v-for="todo in linkedTodos" :key="todo.id">
                <div>
                  <strong>{{ todo.title }}</strong>
                  <p class="muted">
                    {{ todo.description || 'Keine Beschreibung' }}
                  </p>
                </div>
                <button type="button" @click="unlinkTodoFromNode(selectedNode.id, todo.id)">
                  Entfernen
                </button>
              </li>
            </ul>
            <p v-else class="muted">Noch keine Aufgaben mit dieser Idee verknüpft.</p>
          </template>

          <template v-else>
            <h3>Idee auswählen</h3>
            <p class="muted">Wähle links einen Mindmap-Eintrag aus, um Aufgaben mit Details anzulegen.</p>
          </template>
        </aside>
      </div>
    </template>
  </div>
</template>
