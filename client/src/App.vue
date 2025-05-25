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
import { provide, ref, onMounted, defineComponent } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import Navbar from './components/Navbar.vue'
import TaskManager from './components/TaskManager.vue'
import PWAInstallBanner from './components/PWAInstallBanner.vue'
import SyncStatusBar from './components/SyncStatusBar.vue'
import NetworkStatus from './components/NetworkStatus.vue'
import type { User, SyncStatus, AuthContext, NetworkContext, SyncContext } from './types'

// PWA Setup
const { updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    console.log('SW Registered: ' + r)
  },
  onRegisterError(error: any) {
    console.log('SW registration error', error)
  }
})

// PWA Install
const showInstallBanner = ref<boolean>(false)
let deferredPrompt: any = null

const installPWA = async (): Promise<void> => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      showInstallBanner.value = false
    }
    deferredPrompt = null
  }
}

const dismissInstallBanner = (): void => {
  showInstallBanner.value = false
  localStorage.setItem('pwa-install-dismissed', 'true')
}

// Network Status
const isOnline = ref<boolean>(navigator.onLine)
const syncStatus = ref<SyncStatus>({
  isSyncing: false,
  lastSync: null,
  pendingTasks: 0,
  hasUnsyncedChanges: false
})

// Auth Context
const user = ref<User | null>(null)
const isLoading = ref<boolean>(true)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Auth functions
const loginUser = async (username: string, password: string): Promise<User> => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(errorData.message || 'Failed to login')
    }

    const data = await response.json()
    const userData: User = {
      id: `user_${Date.now()}`,
      username,
      token: data.access_token,
    }

    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
    return userData
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

const registerUser = async (username: string, email: string, password: string): Promise<User> => {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }))
      throw new Error(errorData.message || 'Failed to register')
    }

    const data = await response.json()
    return {
      id: `user_${Date.now()}`,
      username,
      email,
      token: data.access_token || '',
    }
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

const logout = (): void => {
  user.value = null
  localStorage.removeItem('user')
}

const handleUnauthorized = (): void => {
  if (user.value) {
    logout()
  }
}

// Network event listeners
const updateOnlineStatus = (): void => {
  isOnline.value = navigator.onLine
}

// Auth Provider component
const AuthProvider = defineComponent({
  setup(_, { slots }) {
    const authContext: AuthContext = {
      user,
      isLoading,
      login: loginUser,
      register: registerUser,
      logout,
      handleUnauthorized,
    }

    const networkContext: NetworkContext = {
      isOnline,
    }

    const syncContext: SyncContext = {
      syncStatus,
      updateSyncStatus: (status: Partial<SyncStatus>) => {
        Object.assign(syncStatus.value, status)
      }
    }

    provide<AuthContext>('auth', authContext)
    provide<NetworkContext>('network', networkContext)
    provide<SyncContext>('sync', syncContext)

    return () => slots.default?.()
  }
})

onMounted(() => {
  // Load user
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser) as User
    } catch (error) {
      console.error('Failed to parse stored user:', error)
      localStorage.removeItem('user')
    }
  }
  isLoading.value = false

  // Network listeners
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)

  // PWA Install prompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt = e
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (!dismissed) {
      showInstallBanner.value = true
    }
  })

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    showInstallBanner.value = false
  }
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