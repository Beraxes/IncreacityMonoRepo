<template>
  <div v-if="shouldShowSyncBar" :class="getSyncBarClass()">
    <div class="flex items-center justify-between px-4 py-2">
      <div class="flex items-center gap-2">
        <component :is="getSyncIcon()" :class="getSyncIconClass()" />
        <span class="text-sm font-medium">{{ getSyncMessage() }}</span>
      </div>
      <div v-if="syncStatus.pendingTasks > 0" class="text-xs">
        {{ syncStatus.pendingTasks }} pending
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { 
  CheckCircleIcon, 
  CloudIcon, 
  WifiOffIcon, 
  RefreshCwIcon,
  AlertCircleIcon 
} from 'lucide-vue-next'
import type { NetworkContext, SyncContext } from '../types'

const network = inject<NetworkContext>('network')
const syncContext = inject<SyncContext>('sync')

// Add null checks
if (!network || !syncContext) {
  console.error('Required contexts not found')
}

const { isOnline } = network || { isOnline: ref(true) }
const { syncStatus } = syncContext || { syncStatus: ref({ isSyncing: false, lastSync: null, pendingTasks: 0, hasUnsyncedChanges: false }) }

const shouldShowSyncBar = computed<boolean>(() => {
  return !isOnline.value || 
         syncStatus.value.isSyncing || 
         syncStatus.value.hasUnsyncedChanges ||
         syncStatus.value.pendingTasks > 0
})

const getSyncBarClass = (): string => {
  if (!isOnline.value) return 'bg-red-100 text-red-800 border-b border-red-200'
  if (syncStatus.value.isSyncing) return 'bg-blue-100 text-blue-800 border-b border-blue-200'
  if (syncStatus.value.hasUnsyncedChanges) return 'bg-amber-100 text-amber-800 border-b border-amber-200'
  return 'bg-green-100 text-green-800 border-b border-green-200'
}

const getSyncIcon = () => {
  if (!isOnline.value) return WifiOffIcon
  if (syncStatus.value.isSyncing) return RefreshCwIcon
  if (syncStatus.value.hasUnsyncedChanges) return AlertCircleIcon
  return CheckCircleIcon
}

const getSyncIconClass = (): string => {
  const baseClass = 'h-4 w-4'
  if (syncStatus.value.isSyncing) return `${baseClass} animate-spin`
  return baseClass
}

const getSyncMessage = (): string => {
  if (!isOnline.value) return 'Offline - Changes will sync when online'
  if (syncStatus.value.isSyncing) return 'Syncing tasks...'
  if (syncStatus.value.hasUnsyncedChanges) return 'Changes pending sync'
  if (syncStatus.value.lastSync) {
    const lastSync = new Date(syncStatus.value.lastSync)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60))
    if (diffMinutes < 1) return 'Synced just now'
    if (diffMinutes < 60) return `Synced ${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    return `Synced ${diffHours}h ago`
  }
  return 'All tasks synced'
}
</script>