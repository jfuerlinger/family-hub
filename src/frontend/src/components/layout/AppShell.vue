<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../app/stores/authStore'

interface NavItem {
  to: string
  label: string
  icon: string
}

const mainNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/family', label: 'Familie', icon: 'users' },
  { to: '/todos', label: 'Aufgaben', icon: 'check' },
  { to: '/calendar', label: 'Kalender', icon: 'calendar' },
]

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)
const mobileNavigationId = 'primary-navigation'

const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value }
const closeMobileMenu = () => { isMobileMenuOpen.value = false }

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isMobileMenuOpen.value) closeMobileMenu()
}

onMounted(() => { window.addEventListener('keydown', handleGlobalKeydown) })
onBeforeUnmount(() => { window.removeEventListener('keydown', handleGlobalKeydown) })
watch(() => route.fullPath, () => { closeMobileMenu() })

const displayName = computed(() => {
  if (!authStore.user) return 'Mein Profil'
  return `${authStore.user.firstName} ${authStore.user.lastName}`.trim()
})

const userInitials = computed(() => {
  if (!authStore.user) return '?'
  return `${authStore.user.firstName[0] ?? ''}${authStore.user.lastName[0] ?? ''}`.toUpperCase()
})

function logout() {
  authStore.logout()
  closeMobileMenu()
  void router.push({ name: 'auth' })
}
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--menu-open': isMobileMenuOpen }">
    <button
      type="button"
      class="mobile-nav-backdrop"
      :class="{ 'mobile-nav-backdrop--visible': isMobileMenuOpen }"
      aria-label="Menü schließen"
      @click="closeMobileMenu"
    />

    <aside class="sidebar" :class="{ 'sidebar--open': isMobileMenuOpen }" :id="mobileNavigationId">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">F</div>
        <div class="sidebar-brand-text">
          <strong>Family Hub</strong>
          <small>Familien-Manager</small>
        </div>
      </div>

      <!-- Main nav -->
      <div class="sidebar-section-label">Navigation</div>
      <nav class="nav">
        <RouterLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          active-class="nav-link-active"
          @click="closeMobileMenu"
        >
          <!-- Grid icon -->
          <svg v-if="item.icon === 'grid'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <!-- Users icon -->
          <svg v-else-if="item.icon === 'users'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <!-- Check icon -->
          <svg v-else-if="item.icon === 'check'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <!-- Calendar icon -->
          <svg v-else-if="item.icon === 'calendar'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="sidebar-spacer" />

      <!-- User -->
      <div class="sidebar-user" style="cursor:default">
        <div class="sidebar-user-avatar">{{ userInitials }}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ displayName }}</div>
          <div class="sidebar-user-plan">Family Hub</div>
        </div>
      </div>
      <button class="sidebar-promo-btn" type="button" style="margin-top: 0.5rem" @click="logout">Abmelden</button>
    </aside>

    <main class="content">
      <header class="mobile-topbar">
        <button
          type="button"
          class="mobile-menu-btn"
          :aria-expanded="isMobileMenuOpen"
          :aria-controls="mobileNavigationId"
          :aria-label="isMobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'"
          @click="toggleMobileMenu"
        >
          <svg v-if="!isMobileMenuOpen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <RouterLink class="mobile-topbar-brand" to="/dashboard">Family Hub</RouterLink>
      </header>
      <slot />
    </main>
  </div>
</template>
