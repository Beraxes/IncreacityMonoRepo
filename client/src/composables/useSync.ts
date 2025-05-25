import { ref } from "vue"
import type { SyncStatus } from "../types"

const syncStatus = ref<SyncStatus>({
  isSyncing: false,
  lastSync: null,
  pendingTasks: 0,
  hasUnsyncedChanges: false,
})

export function useSync() {
  const updateSyncStatus = (status: Partial<SyncStatus>): void => {
    Object.assign(syncStatus.value, status)
  }

  return {
    syncStatus,
    updateSyncStatus,
  }
}
