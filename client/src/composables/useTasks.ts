"use client"

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
      console.log("Starting sync process...")

      // First, get all tasks from server
      const apiTasks = await tasksAPI.fetchTasks(user.value.token)
      const serverTasks = apiTasks.map(taskConverter.apiTaskToLocalTask)
      const apiTaskIds = new Set(apiTasks.map((t) => t._id))

      console.log(`Found ${apiTasks.length} tasks on server`)
      console.log(`Found ${pendingSync.value.length} pending sync items`)

      // Process pending sync items
      const syncedTaskIds = new Set<string>()

      for (const syncItem of pendingSync.value) {
        try {
          console.log(`Processing sync item: ${syncItem.operation} for task ${syncItem.localId}`)

          if (syncItem.operation === "create") {
            if (!syncItem.task._id || !apiTaskIds.has(syncItem.task._id)) {
              const apiTask = taskConverter.localTaskToApiTask(syncItem.task)
              const createdTask = await tasksAPI.createTask(apiTask, user.value.token)
              const convertedTask = taskConverter.apiTaskToLocalTask(createdTask)

              // Update the local task with server data
              const localTaskIndex = tasks.value.findIndex((t) => t.id === syncItem.localId)
              if (localTaskIndex !== -1) {
                console.log(`Updating local task ${syncItem.localId} with server data`)
                tasks.value[localTaskIndex] = {
                  ...tasks.value[localTaskIndex],
                  _id: convertedTask._id,
                  id: convertedTask.id || syncItem.localId, // Keep local ID if server doesn't provide one
                }
              }

              syncedTaskIds.add(syncItem.localId)
            }
          } else if (syncItem.operation === "update" && syncItem.task._id) {
            const apiTask = taskConverter.localTaskToApiTask(syncItem.task)
            const updatedTask = await tasksAPI.updateTask(syncItem.task._id, apiTask, user.value.token)
            const convertedTask = taskConverter.apiTaskToLocalTask(updatedTask)

            // Update the local task with server data
            const localTaskIndex = tasks.value.findIndex((t) => t.id === syncItem.localId)
            if (localTaskIndex !== -1) {
              console.log(`Updating local task ${syncItem.localId} after server update`)
              tasks.value[localTaskIndex] = {
                ...convertedTask,
                id: syncItem.localId, // Preserve local ID
              }
            }

            syncedTaskIds.add(syncItem.localId)
          } else if (syncItem.operation === "delete" && syncItem.task._id) {
            await tasksAPI.deleteTask(syncItem.task._id, user.value.token)
            syncedTaskIds.add(syncItem.localId)
          }
        } catch (error) {
          console.error("Error syncing task:", error)
          if ((error as Error).message === "TokenExpired") {
            handleUnauthorized()
            return
          }
        }
      }

      // Remove successfully synced items from pending queue
      pendingSync.value = pendingSync.value.filter((item) => !syncedTaskIds.has(item.localId))
      storage.savePendingSync(pendingSync.value)

      // Merge server tasks with local tasks
      const mergedTasks = [...tasks.value]

      // Add any new tasks from server that we don't have locally
      for (const serverTask of serverTasks) {
        const existsLocally = mergedTasks.some(
          (localTask) => localTask._id === serverTask._id || localTask.id === serverTask.id,
        )

        if (!existsLocally) {
          console.log(`Adding new task from server: ${serverTask.title}`)
          mergedTasks.push(serverTask)
        }
      }

      // Update tasks and save to storage
      tasks.value = mergedTasks
      storage.saveTasks(tasks.value)

      hasUnsyncedChanges.value = pendingSync.value.length > 0

      updateSyncStatus({
        lastSync: Date.now(),
        pendingTasks: pendingSync.value.length,
        hasUnsyncedChanges: hasUnsyncedChanges.value,
      })

      console.log(`Sync completed. ${syncedTaskIds.size} tasks synced, ${pendingSync.value.length} pending`)

      if (syncedTaskIds.size > 0) {
        showToast("Sync Complete", `${syncedTaskIds.size} task(s) synchronized successfully.`)
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
    console.log("Loading tasks from storage...")
    tasks.value = storage.loadTasks()
    pendingSync.value = storage.loadPendingSync()
    hasUnsyncedChanges.value = pendingSync.value.length > 0

    console.log(`Loaded ${tasks.value.length} tasks, ${pendingSync.value.length} pending sync`)

    updateSyncStatus({
      pendingTasks: pendingSync.value.length,
      hasUnsyncedChanges: hasUnsyncedChanges.value,
    })

    if (user.value && isOnline.value) {
      console.log("User is logged in and online, starting sync...")
      await syncTasksWithAPI()
    }
  }

  const addTask = async (task: Task): Promise<void> => {
    console.log(`Adding task: ${task.title}`)
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
            tasks.value[taskIndex] = {
              ...convertedTask,
              id: task.id, // Preserve local ID
            }
            storage.saveTasks(tasks.value)
            console.log(`Task ${task.id} created on server and updated locally`)
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
    console.log(`Updating task: ${updatedTask.title}`)
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

          const taskIndex = tasks.value.findIndex((t) => t.id === updatedTask.id)
          if (taskIndex !== -1) {
            tasks.value[taskIndex] = {
              ...convertedTask,
              id: updatedTask.id, // Preserve local ID
            }
            storage.saveTasks(tasks.value)
            console.log(`Task ${updatedTask.id} updated on server`)
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
    console.log(`Deleting task: ${id}`)
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
          console.log(`Task ${id} deleted from server`)
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
            console.log("Auto-sync triggered")
            syncTasksWithAPI()
          }
        },
        5 * 60 * 1000,
      ) // 5 minutes
    }
  })

  watch(user, async (newUser, oldUser) => {
    if (newUser && !oldUser) {
      console.log("User logged in, starting sync...")
      await syncTasksWithAPI()
    }
  })

  watch(isOnline, async (online, wasOnline) => {
    if (online && !wasOnline && user.value && pendingSync.value.length > 0) {
      console.log("Came back online with pending sync items, starting sync...")
      await syncTasksWithAPI()
    }
  })

  const clearTasksData = (): void => {
    console.log("Clearing tasks data...")
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
      const wasManualLogout = localStorage.getItem("manual-logout") === "true"
      if (wasManualLogout) {
        clearTasksData()
        localStorage.removeItem("manual-logout")
      }
    } else if (newUser && !oldUser) {
      // User logged in
      console.log("User logged in, starting sync...")
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