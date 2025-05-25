import { ref, watch } from "vue"
import { tasksAPI } from "../services/api"
import { taskConverter } from "../utils/taskConverter"
import { storage } from "../utils/storage"
import { useAuth } from "./useAuth"
import { useNetwork } from "./useNetwork"
import { useSync } from "./useSync"
import { useToast } from "./useToast"
import type { TaskStatus, Task, SyncItem } from "../types"

export function useTasks() {
  const { user, handleUnauthorized } = useAuth()
  const { isOnline } = useNetwork()
  const { updateSyncStatus } = useSync()
  const { showToast } = useToast()

  // State
  const tasks = ref<Task[]>([])
  const pendingSync = ref<SyncItem[]>([])
  const hasUnsyncedChanges = ref<boolean>(false)
  const isSyncing = ref<boolean>(false)

  // Computed
  const isTaskSynced = (task: Task): boolean => {
    return !!task._id && !pendingSync.value.some((p) => p.localId === task.id)
  }

  // Sync helpers
  const markTaskForSync = (task: Task, operation: "create" | "update" | "delete" = "create"): void => {
    const syncItem: SyncItem = {
      localId: task.id,
      task: { ...task },
      operation,
      timestamp: Date.now(),
    }

    pendingSync.value = pendingSync.value.filter((p) => p.localId !== task.id)
    pendingSync.value.push(syncItem)
    storage.savePendingSync(pendingSync.value)
    hasUnsyncedChanges.value = true

    updateSyncStatus({
      pendingTasks: pendingSync.value.length,
      hasUnsyncedChanges: hasUnsyncedChanges.value,
    })
  }

  // API operations
  const syncTasksWithAPI = async (): Promise<void> => {
    if (!user.value || !user.value.token || !isOnline.value || isSyncing.value) {
      return
    }

    isSyncing.value = true
    updateSyncStatus({ isSyncing: true })

    try {
      const apiTasks = await tasksAPI.fetchTasks(user.value.token)
      const localTasks = apiTasks.map(taskConverter.apiTaskToLocalTask)
      const apiTaskIds = new Set(apiTasks.map((t) => t._id))

      // Process pending sync items
      for (const syncItem of pendingSync.value) {
        try {
          if (syncItem.operation === "create") {
            if (!syncItem.task._id || !apiTaskIds.has(syncItem.task._id)) {
              const apiTask = taskConverter.localTaskToApiTask(syncItem.task)
              const createdTask = await tasksAPI.createTask(apiTask, user.value.token)
              const localTaskIndex = tasks.value.findIndex((t) => t.id === syncItem.localId)
              if (localTaskIndex !== -1) {
                const convertedTask = taskConverter.apiTaskToLocalTask(createdTask)
                tasks.value[localTaskIndex]._id = convertedTask._id
                tasks.value[localTaskIndex].id = convertedTask.id
              }
            }
          } else if (syncItem.operation === "update" && syncItem.task._id) {
            const apiTask = taskConverter.localTaskToApiTask(syncItem.task)
            await tasksAPI.updateTask(syncItem.task._id, apiTask, user.value.token)
          } else if (syncItem.operation === "delete" && syncItem.task._id) {
            await tasksAPI.deleteTask(syncItem.task._id, user.value.token)
          }
        } catch (error) {
          console.error("Error syncing task:", error)
          if ((error as Error).message === "TokenExpired") {
            handleUnauthorized()
            return
          }
        }
      }

      // Clear sync queue
      pendingSync.value = []
      storage.savePendingSync(pendingSync.value)

      // Merge tasks
      const mergedTasks = [...localTasks]

      for (const localTask of tasks.value) {
        if (!localTask._id && !mergedTasks.some((t) => t.id === localTask.id)) {
          mergedTasks.push(localTask)
          markTaskForSync(localTask, "create")
        }
      }

      tasks.value = mergedTasks
      storage.saveTasks(tasks.value)

      hasUnsyncedChanges.value = pendingSync.value.length > 0

      updateSyncStatus({
        lastSync: Date.now(),
        pendingTasks: pendingSync.value.length,
        hasUnsyncedChanges: hasUnsyncedChanges.value,
      })

      if (pendingSync.value.length === 0) {
        showToast("Sync Complete", "All tasks have been synchronized.")
      }
    } catch (error) {
      console.error("Error syncing tasks:", error)
      if ((error as Error).message === "TokenExpired") {
        handleUnauthorized()
        showToast("Session Expired", "Your session has expired. Please login again.")
      } else if ((error as Error).message !== "Offline") {
        showToast("Sync Failed", "Failed to sync tasks. Will retry automatically.")
      }
    } finally {
      isSyncing.value = false
      updateSyncStatus({ isSyncing: false })
    }
  }

  // Task operations
  const loadTasks = async (): Promise<void> => {
    tasks.value = storage.loadTasks()
    pendingSync.value = storage.loadPendingSync()
    hasUnsyncedChanges.value = pendingSync.value.length > 0

    updateSyncStatus({
      pendingTasks: pendingSync.value.length,
      hasUnsyncedChanges: hasUnsyncedChanges.value,
    })

    if (user.value && isOnline.value) {
      await syncTasksWithAPI()
    }
  }

  const addTask = async (task: Task): Promise<void> => {
    tasks.value.push(task)
    storage.saveTasks(tasks.value)

    if (user.value) {
      if (isOnline.value) {
        try {
          const apiTask = taskConverter.localTaskToApiTask(task)
          const createdTask = await tasksAPI.createTask(apiTask, user.value.token)
          const convertedTask = taskConverter.apiTaskToLocalTask(createdTask)

          const taskIndex = tasks.value.findIndex((t) => t.id === task.id)
          if (taskIndex !== -1) {
            tasks.value[taskIndex] = convertedTask
            storage.saveTasks(tasks.value)
          }
        } catch (error) {
          console.error("Error creating task:", error)
          if ((error as Error).message === "TokenExpired") {
            handleUnauthorized()
            showToast("Session Expired", "Your session has expired. Please login again.")
          } else {
            markTaskForSync(task, "create")
            showToast("Offline", "Task saved locally. Will sync when online.")
          }
        }
      } else {
        markTaskForSync(task, "create")
        showToast("Offline", "Task saved locally. Will sync when online.")
      }
    }
  }

  const updateTask = async (updatedTask: Task): Promise<void> => {
    const index = tasks.value.findIndex((task) => task.id === updatedTask.id)
    if (index !== -1) {
      tasks.value[index] = updatedTask
      storage.saveTasks(tasks.value)
    }

    if (user.value) {
      if (isOnline.value && updatedTask._id) {
        try {
          const apiTask = taskConverter.localTaskToApiTask(updatedTask)
          const updated = await tasksAPI.updateTask(updatedTask._id, apiTask, user.value.token)
          const convertedTask = taskConverter.apiTaskToLocalTask(updated)

          const taskIndex = tasks.value.findIndex((t) => t.id === convertedTask.id)
          if (taskIndex !== -1) {
            tasks.value[taskIndex] = convertedTask
            storage.saveTasks(tasks.value)
          }
        } catch (error) {
          console.error("Error updating task:", error)
          if ((error as Error).message === "TokenExpired") {
            handleUnauthorized()
            showToast("Session Expired", "Your session has expired. Please login again.")
          } else {
            markTaskForSync(updatedTask, "update")
            showToast("Offline", "Changes saved locally. Will sync when online.")
          }
        }
      } else {
        markTaskForSync(updatedTask, updatedTask._id ? "update" : "create")
        if (!isOnline.value) {
          showToast("Offline", "Changes saved locally. Will sync when online.")
        }
      }
    }
  }

  const deleteTask = async (id: string): Promise<void> => {
    const taskToDelete = tasks.value.find((task) => task.id === id)
    if (!taskToDelete) return

    tasks.value = tasks.value.filter((task) => task.id !== id)
    storage.saveTasks(tasks.value)

    pendingSync.value = pendingSync.value.filter((p) => p.localId !== id)
    storage.savePendingSync(pendingSync.value)

    if (user.value && taskToDelete._id) {
      if (isOnline.value) {
        try {
          await tasksAPI.deleteTask(taskToDelete._id, user.value.token)
        } catch (error) {
          console.error("Error deleting task:", error)
          if ((error as Error).message === "TokenExpired") {
            handleUnauthorized()
            showToast("Session Expired", "Your session has expired. Please login again.")
          } else {
            markTaskForSync(taskToDelete, "delete")
            showToast("Offline", "Deletion saved locally. Will sync when online.")
          }
        }
      } else {
        markTaskForSync(taskToDelete, "delete")
        showToast("Offline", "Deletion saved locally. Will sync when online.")
      }
    }

    updateSyncStatus({
      pendingTasks: pendingSync.value.length,
      hasUnsyncedChanges: pendingSync.value.length > 0,
    })
  }

  const changeTaskStatus = async (id: string, newStatus: TaskStatus): Promise<void> => {
    const taskToUpdate = tasks.value.find((task) => task.id === id)
    if (!taskToUpdate) return

    const updatedTask = { ...taskToUpdate, status: newStatus }
    await updateTask(updatedTask)
  }

  const toggleTaskPublic = async (id: string, isPublic: boolean): Promise<void> => {
    const taskToUpdate = tasks.value.find((task) => task.id === id)
    if (!taskToUpdate) return

    const updatedTask = { ...taskToUpdate, isPublic }
    await updateTask(updatedTask)

    showToast(
      isPublic ? "Task made public" : "Task made private",
      isPublic ? "This task is now visible to others." : "This task is now private.",
    )
  }

  // Auto-sync setup
  let syncInterval: number | null = null

  watch([user, isOnline], ([newUser, online]) => {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }

    if (newUser && online) {
      syncInterval = setInterval(
        () => {
          if (!isSyncing.value) {
            syncTasksWithAPI()
          }
        },
        5 * 60 * 1000,
      ) // 5 minutes
    }
  })

  watch(user, async (newUser, oldUser) => {
    if (newUser && !oldUser) {
      await syncTasksWithAPI()
    }
  })

  watch(isOnline, async (online) => {
    if (online && user.value && pendingSync.value.length > 0) {
      await syncTasksWithAPI()
    }
  })

  const clearTasksData = (): void => {
    tasks.value = []
    pendingSync.value = []
    hasUnsyncedChanges.value = false

    // Clear sync interval if exists
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }

    updateSyncStatus({
      isSyncing: false,
      lastSync: null,
      pendingTasks: 0,
      hasUnsyncedChanges: false,
    })
  }

  // Watch for manual logout to clear tasks
  watch(user, (newUser, oldUser) => {
    if (oldUser && !newUser) {
      // User logged out, check if we should clear data
      // We'll use a flag in localStorage to determine if it was manual
      const wasManualLogout = localStorage.getItem("manual-logout") === "true"
      if (wasManualLogout) {
        clearTasksData()
        localStorage.removeItem("manual-logout")
      }
    } else if (newUser && !oldUser) {
      // User logged in
      syncTasksWithAPI()
    }
  })

  return {
    tasks,
    pendingSync,
    hasUnsyncedChanges,
    isSyncing,
    isTaskSynced,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    toggleTaskPublic,
    syncTasksWithAPI,
    clearTasksData,
  }
}