<template>
  <div id="app">
    <AuthProvider>
      <div class="min-h-screen bg-gray-50">
        <!-- PWA Install Banner -->
        <PWAInstallBanner v-if="showInstallBanner" @install="installPWA" @dismiss="dismissInstallBanner" />
        
        <!-- PWA Update Banner -->
        <div v-if="needRefresh" class="bg-blue-500 text-white px-4 py-3 flex items-center justify-between z-50 relative">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
              <RefreshCwIcon class="h-4 w-4" :class="{ 'animate-spin': isUpdating }" />
            </div>
            <div>
              <p class="font-medium">App Update Available</p>
              <p class="text-sm opacity-90">A new version is ready. Click update to get the latest features.</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="handleUpdate"
              :disabled="isUpdating"
              class="bg-white text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isUpdating ? 'Updating...' : 'Update Now' }}
            </button>
            <button
              @click="dismissUpdate"
              class="text-white hover:text-gray-200 p-1"
              title="Dismiss (update will be applied on next visit)"
            >
              <XIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <!-- Sync Status Bar -->
        <SyncStatusBar />
        
        <!-- Network Status -->
        <NetworkStatus />
        
        <Navbar />
        <TaskManager />
      </div>
    </AuthProvider>
  </div>
</template>

<script setup lang="ts">
import { provide, defineComponent, onMounted, ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { RefreshCwIcon, XIcon } from 'lucide-vue-next'
import Navbar from './components/Navbar.vue'
import TaskManager from './components/TaskManager.vue'
import PWAInstallBanner from './components/PWAInstallBanner.vue'
import SyncStatusBar from './components/SyncStatusBar.vue'
import NetworkStatus from './components/NetworkStatus.vue'
import { useAuth } from './composables/useAuth'
import { useNetwork } from './composables/useNetwork'
import { useSync } from './composables/useSync'
import { usePWA } from './composables/usePWA'
import type { AuthContext, NetworkContext, SyncContext } from './types'

// Composables
const auth = useAuth()
const network = useNetwork()
const sync = useSync()
const pwa = usePWA()

const { showInstallBanner, installPWA, dismissInstallBanner } = pwa

// Update state
const isUpdating = ref(false)
const needRefresh = ref(false) // Initialize needRefresh here

// PWA Setup with proper update handling for production
const {
  updateServiceWorker,
} = useRegisterSW({
  onRegistered(r) {
    console.log('SW Registered: ' + r)
    
    // Check for updates every 5 minutes in production
    setInterval(() => {
      console.log('Checking for SW updates...')
      r?.update()
    }, 5 * 60 * 1000) // 5 minutes
  },
  onRegisterError(error) {
    console.log('SW registration error', error)
  },
  onNeedRefresh() {
    console.log('SW needs refresh - new content available')
    needRefresh.value = true
    // Show update notification immediately
  },
  onOfflineReady() {
    console.log('SW offline ready')
  },
})

// Handle update
const handleUpdate = async () => {
  isUpdating.value = true
  try {
    console.log('Updating service worker...')
    await updateServiceWorker(true)
    // The page will reload automatically after update
  } catch (error) {
    console.error('Failed to update:', error)
    isUpdating.value = false
  }
}

// Dismiss update notification
const dismissUpdate = () => {
  needRefresh.value = false
}

// Manual update check function
const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      console.log('Manually checking for updates...')
      await registration.update()
    }
  }
}

// Auth Provider component
const AuthProvider = defineComponent({
  setup(_, { slots }) {
    const authContext: AuthContext = {
      user: auth.user,
      isLoading: auth.isLoading,
      login: auth.login,
      register: auth.register,
      logout: auth.logout,
      handleUnauthorized: auth.handleUnauthorized,
    }

    const networkContext: NetworkContext = {
      isOnline: network.isOnline,
    }

    const syncContext: SyncContext = {
      syncStatus: sync.syncStatus,
      updateSyncStatus: sync.updateSyncStatus
    }

    provide<AuthContext>('auth', authContext)
    provide<NetworkContext>('network', networkContext)
    provide<SyncContext>('sync', syncContext)

    return () => slots.default?.()
  }
})

onMounted(() => {
  auth.loadUser()
  
  // Check for updates when the app becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('App became visible, checking for updates...')
      checkForUpdates()
    }
  })
  
  // Check for updates when the user comes back online
  window.addEventListener('online', () => {
    console.log('App came online, checking for updates...')
    checkForUpdates()
  })
})
</script>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}
</style>