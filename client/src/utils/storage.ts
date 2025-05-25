import type { Task, SyncItem } from "../types"

const TASKS_KEY = "tasks"
const PENDING_SYNC_KEY = "pending_sync"
const USER_KEY = "user"

export const storage = {
  // Tasks
  saveTasks(tasks: Task[]): void {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  },

  loadTasks(): Task[] {
    const stored = localStorage.getItem(TASKS_KEY)
    return stored ? JSON.parse(stored) : []
  },

  // Sync queue
  savePendingSync(syncItems: SyncItem[]): void {
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(syncItems))
  },

  loadPendingSync(): SyncItem[] {
    const stored = localStorage.getItem(PENDING_SYNC_KEY)
    return stored ? JSON.parse(stored) : []
  },

  // User
  saveUser(user: any): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  loadUser(): any {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY)
  },

  // PWA
  setPWADismissed(): void {
    localStorage.setItem("pwa-install-dismissed", "true")
  },

  isPWADismissed(): boolean {
    return localStorage.getItem("pwa-install-dismissed") === "true"
  },

  // Clear all app data (for manual logout)
  clearAllData(): void {
    localStorage.removeItem(TASKS_KEY)
    localStorage.removeItem(PENDING_SYNC_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem("pwa-install-dismissed")
  },
}
