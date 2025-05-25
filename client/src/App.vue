<template>
  <div id="app">
    <AuthProvider>
      <div class="min-h-screen bg-gray-50">
        <!-- PWA Install Banner -->
        <PWAInstallBanner v-if="showInstallBanner" @install="installPWA" @dismiss="dismissInstallBanner" />
        
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
import { provide, defineComponent, onMounted } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
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

// PWA Setup
const { updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    console.log('SW Registered: ' + r)
  },
  onRegisterError(error) {
    console.log('SW registration error', error)
  }
})

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