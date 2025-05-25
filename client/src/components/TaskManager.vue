<template>
  <div class="p-4 md:p-8">
    <div class="mx-auto max-w-md">
      <div class="mb-6 flex items-center gap-2">
        <div class="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center">
          <div class="h-3 w-3 rounded-full bg-amber-600"></div>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">
          My Task Board
          <PencilIcon class="h-4 w-4 inline-block ml-1" />
        </h1>
      </div>
      <p class="mb-6 text-gray-600">Tasks to keep organised</p>

      <!-- Guest Banner -->
      <div v-if="!user" class="mb-4 bg-amber-50 p-4 rounded-xl">
        <p class="text-amber-800 mb-2">
          You're using the task manager as a guest. Your tasks are saved locally.
        </p>
        <p class="text-amber-800 text-sm">Login to sync your tasks across devices.</p>
      </div>

      <!-- Sync Info -->
      <div v-if="user && (pendingSync.length > 0 || hasUnsyncedChanges)" class="mb-4 bg-blue-50 p-4 rounded-xl">
        <p class="text-blue-800 flex items-center">
          <CloudIcon class="h-4 w-4 mr-2" />
          {{ pendingSync.length }} tasks pending sync
        </p>
        <button 
          v-if="isOnline && !isSyncing"
          @click="forceSyncTasks"
          class="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Sync Now
        </button>
      </div>

      <div class="space-y-4">
        <!-- Category Headers -->
        <div class="grid gap-4">
          <CategoryCard
            v-for="category in categories"
            :key="category.status"
            :category="category"
            :selected="selectedCategory === category.status"
            @click="setSelectedCategory(category.status)"
          />
        </div>

        <!-- Show All Categories Button -->
        <button
          @click="setSelectedCategory(null)"
          class="w-full rounded-xl bg-white border border-gray-200 p-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {{ selectedCategory ? 'Show All Categories' : 'All Categories (Selected)' }}
        </button>

        <!-- Add New Task Button -->
        <AddTaskButton v-if="!isAddingTask" @click="isAddingTask = true" />

        <!-- Tasks -->
        <TaskCard
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          :is-logged-in="!!user"
          :is-synced="isTaskSynced(task)"
          @status-change="changeTaskStatus"
          @edit="setEditingTask"
          @delete="deleteTask"
          @update="updateTask"
          @toggle-public="toggleTaskPublic"
        />

        <!-- Empty State -->
        <div v-if="tasks.length === 0" class="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
          <p class="text-gray-500">No tasks yet. Add your first task to get started!</p>
        </div>
      </div>

      <!-- Task Form Modal -->
      <TaskForm
        v-if="isAddingTask || editingTask"
        :task="editingTask"
        :selected-category="selectedCategory"
        @submit="handleTaskSubmit"
        @cancel="handleTaskCancel"
      />

      <!-- Toast Notifications -->
      <div v-if="toast.show" class="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
        <div class="flex items-start">
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ toast.title }}</p>
            <p v-if="toast.description" class="text-sm text-gray-600 mt-1">{{ toast.description }}</p>
          </div>
          <button @click="toast.show = false" class="ml-4 text-gray-400 hover:text-gray-600">
            <XIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, watch, type Ref } from 'vue'
import { PencilIcon, XIcon, CloudIcon } from 'lucide-vue-next'
import CategoryCard from './CategoryCard.vue'
import AddTaskButton from './AddTaskButton.vue'
import TaskCard from './TaskCard.vue'
import TaskForm from './TaskForm.vue'
import { 
  TaskStatus,
  type Task, 
  type ApiTask, 
  type SyncItem, 
  type ToastMessage, 
  type Category, 
  type AuthContext, 
  type NetworkContext, 
  type SyncContext
} from '../types'

const auth = inject<AuthContext>('auth')!
const network = inject<NetworkContext>('network')!
const syncContext = inject<SyncContext>('sync')!

const { user, handleUnauthorized } = auth
const { isOnline } = network
const { updateSyncStatus } = syncContext

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// State
const tasks = ref<Task[]>([])
const selectedCategory = ref<TaskStatus | null>(null)
const isAddingTask = ref<boolean>(false)
const editingTask = ref<Task | null>(null)
const isSyncing = ref<boolean>(false)
const toast = ref<ToastMessage>({ show: false, title: '', description: '' })
const pendingSync = ref<SyncItem[]>([])
const hasUnsyncedChanges = ref<boolean>(false)

// Categories configuration
const categories: Category[] = [
  {
    status: TaskStatus.IN_PROGRESS,
    title: 'Task in Progress',
    icon: 'clock',
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    actionColor: 'bg-amber-400',
    ringColor: 'ring-amber-400',
  },
  {
    status: TaskStatus.COMPLETED,
    title: 'Task Completed',
    icon: 'check-circle',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    actionColor: 'bg-green-400',
    ringColor: 'ring-green-400',
  },
  {
    status: TaskStatus.WONT_DO,
    title: "Task Won't Do",
    icon: 'coffee',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-400',
    actionColor: 'bg-red-400',
    ringColor: 'ring-red-400',
  },
  {
    status: TaskStatus.TO_DO,
    title: 'Task To Do',
    icon: 'file-text',
    bgColor: 'bg-gray-200',
    iconColor: 'text-gray-600',
    actionColor: 'bg-gray-300',
    ringColor: 'ring-gray-400',
  },
]

// Computed
const filteredTasks = computed<Task[]>(() => {
  if (selectedCategory.value === null) return tasks.value
  return tasks.value.filter(task => task.status === selectedCategory.value)
})

// Storage keys
const TASKS_KEY = 'tasks'
const PENDING_SYNC_KEY = 'pending_sync'

// Local storage helpers
const saveTasksToStorage = (): void => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks.value))
}

const loadTasksFromStorage = (): Task[] => {
  const stored = localStorage.getItem(TASKS_KEY)
  return stored ? JSON.parse(stored) : []
}

const savePendingSyncToStorage = (): void => {
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingSync.value))
}

const loadPendingSyncFromStorage = (): SyncItem[] => {
  const stored = localStorage.getItem(PENDING_SYNC_KEY)
  return stored ? JSON.parse(stored) : []
}

// Task sync helpers
const isTaskSynced = (task: Task): boolean => {
  return !!task._id && !pendingSync.value.some(p => p.localId === task.id)
}

const markTaskForSync = (task: Task, operation: 'create' | 'update' | 'delete' = 'create'): void => {
  const syncItem: SyncItem = {
    localId: task.id,
    task: { ...task },
    operation,
    timestamp: Date.now()
  }
  
  pendingSync.value = pendingSync.value.filter(p => p.localId !== task.id)
  pendingSync.value.push(syncItem)
  savePendingSyncToStorage()
  hasUnsyncedChanges.value = true
  
  updateSyncStatus({
    pendingTasks: pendingSync.value.length,
    hasUnsyncedChanges: hasUnsyncedChanges.value
  })
}

// API Functions with offline support
const fetchTasks = async (token: string): Promise<Task[]> => {
  if (!isOnline.value) {
    throw new Error('Offline')
  }

  const response = await fetch(`${API_URL}/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 401) {
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }

  const apiTasks: ApiTask[] = await response.json()
  return apiTasks.map(apiTaskToLocalTask)
}

const createTaskAPI = async (task: Task, token: string): Promise<Task> => {
  if (!isOnline.value) {
    throw new Error('Offline')
  }

  const apiTask = localTaskToApiTask(task)
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiTask),
  })

  if (response.status === 401) {
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    throw new Error('Failed to create task')
  }

  const createdTask: ApiTask = await response.json()
  return apiTaskToLocalTask(createdTask)
}

const updateTaskAPI = async (task: Task, token: string): Promise<Task> => {
  if (!isOnline.value) {
    throw new Error('Offline')
  }

  const apiTask = localTaskToApiTask(task)
  const response = await fetch(`${API_URL}/tasks/${task._id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiTask),
  })

  if (response.status === 401) {
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    throw new Error('Failed to update task')
  }

  const updatedTask: ApiTask = await response.json()
  return apiTaskToLocalTask(updatedTask)
}

const deleteTaskAPI = async (taskId: string, token: string): Promise<void> => {
  if (!isOnline.value) {
    throw new Error('Offline')
  }

  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 401) {
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    throw new Error('Failed to delete task')
  }
}

// Conversion functions
const localTaskToApiTask = (task: Task): Partial<ApiTask> => {
  let category = 'none'
  switch (task.status) {
    case TaskStatus.IN_PROGRESS:
      category = 'in-progress'
      break
    case TaskStatus.COMPLETED:
      category = 'completed'
      break
    case TaskStatus.WONT_DO:
      category = 'wont-do'
      break
    case TaskStatus.TO_DO:
      category = 'to-do'
      break
  }

  return {
    title: task.title,
    description: task.description,
    completed: task.status === TaskStatus.COMPLETED,
    category,
    isPublic: task.isPublic || false,
  }
}

const apiTaskToLocalTask = (apiTask: ApiTask): Task => {
  let status: TaskStatus = TaskStatus.TO_DO
  switch (apiTask.category) {
    case 'in-progress':
      status = TaskStatus.IN_PROGRESS
      break
    case 'completed':
      status = TaskStatus.COMPLETED
      break
    case 'wont-do':
      status = TaskStatus.WONT_DO
      break
    case 'to-do':
      status = TaskStatus.TO_DO
      break
  }

  if (apiTask.completed) {
    status = TaskStatus.COMPLETED
  }

  let icon = 'file'
  switch (status) {
    case TaskStatus.IN_PROGRESS:
      icon = 'clock'
      break
    case TaskStatus.COMPLETED:
      icon = 'check'
      break
    case TaskStatus.WONT_DO:
      icon = 'coffee'
      break
    case TaskStatus.TO_DO:
      icon = 'file'
      break
  }

  return {
    id: apiTask._id || String(Date.now()),
    _id: apiTask._id,
    title: apiTask.title,
    description: apiTask.description,
    status,
    icon,
    isPublic: apiTask.isPublic,
  }
}

// Toast function
const showToast = (title: string, description = '', variant: 'default' | 'success' | 'error' = 'default'): void => {
  toast.value = { show: true, title, description, variant }
  setTimeout(() => {
    toast.value.show = false
  }, 5000)
}

// Sync functions
const syncTasksWithAPI = async (): Promise<void> => {
  if (!user.value || !user.value.token || !isOnline.value || isSyncing.value) {
    return
  }

  isSyncing.value = true
  updateSyncStatus({ isSyncing: true })

  try {
    const apiTasks = await fetchTasks(user.value.token)
    const apiTaskIds = new Set(apiTasks.map(t => t._id))

    for (const syncItem of pendingSync.value) {
      try {
        if (syncItem.operation === 'create') {
          if (!syncItem.task._id || !apiTaskIds.has(syncItem.task._id)) {
            const createdTask = await createTaskAPI(syncItem.task, user.value.token)
            const localTaskIndex = tasks.value.findIndex(t => t.id === syncItem.localId)
            if (localTaskIndex !== -1) {
              tasks.value[localTaskIndex]._id = createdTask._id
              tasks.value[localTaskIndex].id = createdTask.id
            }
          }
        } else if (syncItem.operation === 'update' && syncItem.task._id) {
          await updateTaskAPI(syncItem.task, user.value.token)
        } else if (syncItem.operation === 'delete' && syncItem.task._id) {
          await deleteTaskAPI(syncItem.task._id, user.value.token)
        }
      } catch (error) {
        console.error('Error syncing task:', error)
        if ((error as Error).message === 'Unauthorized') {
          handleUnauthorized()
          return
        }
      }
    }

    pendingSync.value = []
    savePendingSyncToStorage()

    const mergedTasks = [...apiTasks]
    
    for (const localTask of tasks.value) {
      if (!localTask._id && !mergedTasks.some(t => t.id === localTask.id)) {
        mergedTasks.push(localTask)
        markTaskForSync(localTask, 'create')
      }
    }

    tasks.value = mergedTasks
    saveTasksToStorage()

    hasUnsyncedChanges.value = pendingSync.value.length > 0
    
    updateSyncStatus({
      lastSync: Date.now(),
      pendingTasks: pendingSync.value.length,
      hasUnsyncedChanges: hasUnsyncedChanges.value
    })

    if (pendingSync.value.length === 0) {
      showToast('Sync Complete', 'All tasks have been synchronized.')
    }

  } catch (error) {
    console.error('Error syncing tasks:', error)
    if ((error as Error).message === 'Unauthorized') {
      handleUnauthorized()
      showToast('Session Expired', 'Your session has expired. Please login again.')
    } else if ((error as Error).message !== 'Offline') {
      showToast('Sync Failed', 'Failed to sync tasks. Will retry automatically.')
    }
  } finally {
    isSyncing.value = false
    updateSyncStatus({ isSyncing: false })
  }
}

const forceSyncTasks = (): void => {
  syncTasksWithAPI()
}

// Task management functions
const loadTasks = async (): Promise<void> => {
  tasks.value = loadTasksFromStorage()
  pendingSync.value = loadPendingSyncFromStorage()
  hasUnsyncedChanges.value = pendingSync.value.length > 0

  updateSyncStatus({
    pendingTasks: pendingSync.value.length,
    hasUnsyncedChanges: hasUnsyncedChanges.value
  })

  if (user.value && isOnline.value) {
    await syncTasksWithAPI()
  }
}

const addTask = async (task: Task): Promise<void> => {
  if (selectedCategory.value) {
    task.status = selectedCategory.value
    switch (selectedCategory.value) {
      case TaskStatus.IN_PROGRESS:
        task.icon = 'clock'
        break
      case TaskStatus.COMPLETED:
        task.icon = 'check'
        break
      case TaskStatus.WONT_DO:
        task.icon = 'coffee'
        break
      case TaskStatus.TO_DO:
        task.icon = 'file'
        break
    }
  }

  tasks.value.push(task)
  saveTasksToStorage()

  if (user.value) {
    if (isOnline.value) {
      try {
        const createdTask = await createTaskAPI(task, user.value.token)
        const taskIndex = tasks.value.findIndex(t => t.id === task.id)
        if (taskIndex !== -1) {
          tasks.value[taskIndex] = createdTask
          saveTasksToStorage()
        }
      } catch (error) {
        console.error('Error creating task:', error)
        if ((error as Error).message === 'Unauthorized') {
          handleUnauthorized()
          showToast('Session Expired', 'Your session has expired. Please login again.')
        } else {
          markTaskForSync(task, 'create')
          showToast('Offline', 'Task saved locally. Will sync when online.')
        }
      }
    } else {
      markTaskForSync(task, 'create')
      showToast('Offline', 'Task saved locally. Will sync when online.')
    }
  }
}

const updateTask = async (updatedTask: Task): Promise<void> => {
  const index = tasks.value.findIndex(task => task.id === updatedTask.id)
  if (index !== -1) {
    tasks.value[index] = updatedTask
    saveTasksToStorage()
  }

  if (user.value) {
    if (isOnline.value && updatedTask._id) {
      try {
        const updated = await updateTaskAPI(updatedTask, user.value.token)
        const taskIndex = tasks.value.findIndex(t => t.id === updated.id)
        if (taskIndex !== -1) {
          tasks.value[taskIndex] = updated
          saveTasksToStorage()
        }
      } catch (error) {
        console.error('Error updating task:', error)
        if ((error as Error).message === 'Unauthorized') {
          handleUnauthorized()
          showToast('Session Expired', 'Your session has expired. Please login again.')
        } else {
          markTaskForSync(updatedTask, 'update')
          showToast('Offline', 'Changes saved locally. Will sync when online.')
        }
      }
    } else {
      markTaskForSync(updatedTask, updatedTask._id ? 'update' : 'create')
      if (!isOnline.value) {
        showToast('Offline', 'Changes saved locally. Will sync when online.')
      }
    }
  }
}

const deleteTask = async (id: string): Promise<void> => {
  const taskToDelete = tasks.value.find(task => task.id === id)
  if (!taskToDelete) return

  tasks.value = tasks.value.filter(task => task.id !== id)
  saveTasksToStorage()

  pendingSync.value = pendingSync.value.filter(p => p.localId !== id)
  savePendingSyncToStorage()

  if (user.value && taskToDelete._id) {
    if (isOnline.value) {
      try {
        await deleteTaskAPI(taskToDelete._id, user.value.token)
      } catch (error) {
        console.error('Error deleting task:', error)
        if ((error as Error).message === 'Unauthorized') {
          handleUnauthorized()
          showToast('Session Expired', 'Your session has expired. Please login again.')
        } else {
          markTaskForSync(taskToDelete, 'delete')
          showToast('Offline', 'Deletion saved locally. Will sync when online.')
        }
      }
    } else {
      markTaskForSync(taskToDelete, 'delete')
      showToast('Offline', 'Deletion saved locally. Will sync when online.')
    }
  }

  updateSyncStatus({
    pendingTasks: pendingSync.value.length,
    hasUnsyncedChanges: pendingSync.value.length > 0
  })
}

const changeTaskStatus = async (id: string, newStatus: TaskStatus): Promise<void> => {
  const taskToUpdate = tasks.value.find(task => task.id === id)
  if (!taskToUpdate) return

  const updatedTask = { ...taskToUpdate, status: newStatus }
  await updateTask(updatedTask)
}

const toggleTaskPublic = async (id: string, isPublic: boolean): Promise<void> => {
  const taskToUpdate = tasks.value.find(task => task.id === id)
  if (!taskToUpdate) return

  const updatedTask = { ...taskToUpdate, isPublic }
  await updateTask(updatedTask)

  showToast(
    isPublic ? 'Task made public' : 'Task made private',
    isPublic ? 'This task is now visible to others.' : 'This task is now private.'
  )
}

// UI functions
const setSelectedCategory = (status: TaskStatus | null): void => {
  selectedCategory.value = selectedCategory.value === status ? null : status
}

const setEditingTask = (task: Task): void => {
  editingTask.value = task
}

const handleTaskSubmit = async (task: Task): Promise<void> => {
  if (editingTask.value) {
    await updateTask(task)
    editingTask.value = null
  } else {
    await addTask(task)
    isAddingTask.value = false
  }
}

const handleTaskCancel = (): void => {
  isAddingTask.value = false
  editingTask.value = null
}

// Watchers
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

// Auto-sync every 5 minutes when online and logged in
let syncInterval: number | null = null

watch([user, isOnline], ([newUser, online]) => {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }

  if (newUser && online) {
    syncInterval = setInterval(() => {
      if (!isSyncing.value) {
        syncTasksWithAPI()
      }
    }, 5 * 60 * 1000) // 5 minutes
  }
})

// Lifecycle
onMounted(() => {
  loadTasks()
})
</script>