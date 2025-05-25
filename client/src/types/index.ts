import type { Ref } from "vue"

export interface User {
  id: string
  username: string
  email?: string
  token: string
}

export interface Task {
  id: string
  _id?: string
  title: string
  description: string
  status: TaskStatus
  icon: string
  isPublic: boolean
}

export interface ApiTask {
  _id: string
  title: string
  description: string
  completed: boolean
  category: string
  isPublic: boolean
}

export interface SyncItem {
  localId: string
  task: Task
  operation: "create" | "update" | "delete"
  timestamp: number
}

export interface SyncStatus {
  isSyncing: boolean
  lastSync: number | null
  pendingTasks: number
  hasUnsyncedChanges: boolean
}

export interface ToastMessage {
  show: boolean
  title: string
  description: string
  variant?: "default" | "success" | "error"
}

export interface Category {
  status: TaskStatus
  title: string
  icon: string
  bgColor: string
  iconColor: string
  actionColor: string
  ringColor: string
}

export enum TaskStatus {
  TO_DO = "TO_DO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  WONT_DO = "WONT_DO",
}

export interface AuthContext {
  user: Ref<User | null>
  isLoading: Ref<boolean>
  login: (username: string, password: string) => Promise<User>
  register: (username: string, email: string, password: string) => Promise<User>
  logout: (isManual?: boolean) => void
  handleUnauthorized: () => void
}

export interface NetworkContext {
  isOnline: Ref<boolean>
}

export interface SyncContext {
  syncStatus: Ref<SyncStatus>
  updateSyncStatus: (status: Partial<SyncStatus>) => void
}