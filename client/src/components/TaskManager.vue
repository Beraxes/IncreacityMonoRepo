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
          You're using the task manager as a guest. Your tasks are saved on this device only.
        </p>
        <p class="text-amber-800 text-sm">To sync your tasks across devices, please login or register.</p>
      </div>

      <!-- Syncing Banner -->
      <div v-if="isSyncing" class="mb-4 bg-blue-50 p-4 rounded-xl">
        <p class="text-blue-800 flex items-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Syncing your tasks...
        </p>
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
        <AddTaskButton v-if="!isAddingTask && !isSyncing" @click="isAddingTask = true" />

        <!-- Tasks -->
        <TaskCard
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          :is-logged-in="!!user"
          @status-change="changeTaskStatus"
          @edit="setEditingTask"
          @delete="deleteTask"
          @update="updateTask"
          @toggle-public="toggleTaskPublic"
        />

        <!-- Empty State -->
        <div v-if="tasks.length === 0 && !isSyncing" class="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
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
      <div v-if="toast.show" class="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
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

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { PencilIcon, XIcon } from 'lucide-vue-next'
import CategoryCard from './CategoryCard.vue'
import AddTaskButton from './AddTaskButton.vue'
import TaskCard from './TaskCard.vue'
import TaskForm from './TaskForm.vue'

const auth = inject('auth')
const { user, handleUnauthorized } = auth

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Task statuses
const TaskStatus = {
  TO_DO: 'TO_DO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  WONT_DO: 'WONT_DO',
}

// State
const tasks = ref([])
const selectedCategory = ref(null)
const isAddingTask = ref(false)
const editingTask = ref(null)
const isSyncing = ref(false)
const toast = ref({ show: false, title: '', description: '' })

// Categories configuration
const categories = [
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
const filteredTasks = computed(() => {
  if (selectedCategory.value === null) return tasks.value
  return tasks.value.filter(task => task.status === selectedCategory.value)
})

// API Functions
const fetchTasks = async (token) => {
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

  const apiTasks = await response.json()
  return apiTasks.map(apiTaskToLocalTask)
}

const createTask = async (task, token) => {
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

  const createdTask = await response.json()
  return apiTaskToLocalTask(createdTask)
}

const updateTaskAPI = async (task, token) => {
  const apiTask = localTaskToApiTask(task)
  const response = await fetch(`${API_URL}/tasks/${task.id}`, {
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

  const updatedTask = await response.json()
  return apiTaskToLocalTask(updatedTask)
}

const deleteTaskAPI = async (taskId, token) => {
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
const localTaskToApiTask = (task) => {
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

const apiTaskToLocalTask = (apiTask) => {
  let status = TaskStatus.TO_DO
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
    title: apiTask.title,
    description: apiTask.description,
    status,
    icon,
    isPublic: apiTask.isPublic,
  }
}

// Toast function
const showToast = (title, description = '', variant = 'default') => {
  toast.value = { show: true, title, description, variant }
  setTimeout(() => {
    toast.value.show = false
  }, 5000)
}

// Task management functions
const loadTasks = async () => {
  try {
    if (user.value && user.value.token) {
      const apiTasks = await fetchTasks(user.value.token)
      tasks.value = apiTasks
    } else {
      const savedTasks = localStorage.getItem('tasks')
      if (savedTasks) {
        tasks.value = JSON.parse(savedTasks)
      }
    }
  } catch (error) {
    console.error('Error loading tasks:', error)
    if (error.message === 'Unauthorized') {
      handleUnauthorized()
      showToast('Session Expired', 'Your session has expired. Please login again.')
    } else {
      showToast('Error', 'Failed to load tasks. Please try again.')
    }
  }
}

const syncLocalTasks = async () => {
  if (user.value && user.value.token) {
    const localTasks = localStorage.getItem('tasks')
    if (localTasks) {
      try {
        isSyncing.value = true
        const parsedTasks = JSON.parse(localTasks)
        if (parsedTasks.length > 0) {
          // Create all local tasks on the API
          const createPromises = parsedTasks.map(task => createTask(task, user.value.token))
          await Promise.all(createPromises)
          
          // Fetch all tasks from the API
          const syncedTasks = await fetchTasks(user.value.token)
          tasks.value = syncedTasks
          
          // Clear local storage after successful sync
          localStorage.removeItem('tasks')
          showToast('Tasks Synced', `Successfully synced ${parsedTasks.length} tasks with your account.`)
        }
      } catch (error) {
        console.error('Error syncing tasks:', error)
        if (error.message === 'Unauthorized') {
          handleUnauthorized()
          showToast('Session Expired', 'Your session has expired. Please login again.')
        } else {
          showToast('Sync Failed', 'Failed to sync tasks with your account. Please try again.')
        }
      } finally {
        isSyncing.value = false
      }
    }
  }
}

const addTask = async (task) => {
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

  try {
    if (user.value && user.value.token) {
      const createdTask = await createTask(task, user.value.token)
      tasks.value.push(createdTask)
    } else {
      tasks.value.push(task)
    }
  } catch (error) {
    console.error('Error adding task:', error)
    if (error.message === 'Unauthorized') {
      handleUnauthorized()
      showToast('Session Expired', 'Your session has expired. Please login again.')
    } else {
      showToast('Error', 'Failed to add task. Please try again.')
    }
  }
}

const updateTask = async (updatedTask) => {
  try {
    if (user.value && user.value.token) {
      const updated = await updateTaskAPI(updatedTask, user.value.token)
      const index = tasks.value.findIndex(task => task.id === updated.id)
      if (index !== -1) {
        tasks.value[index] = updated
      }
    } else {
      const index = tasks.value.findIndex(task => task.id === updatedTask.id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
    }
  } catch (error) {
    console.error('Error updating task:', error)
    if (error.message === 'Unauthorized') {
      handleUnauthorized()
      showToast('Session Expired', 'Your session has expired. Please login again.')
    } else {
      showToast('Error', 'Failed to update task. Please try again.')
    }
  }
}

const deleteTask = async (id) => {
      try {
        // Solo llamar a la API si el usuario está logueado
        if (user.value && user.value.token) {
          await deleteTaskAPI(id, user.value.token)
        }
        
        tasks.value = tasks.value.filter(task => task.id !== id)
        
        if (!user.value) {
          localStorage.setItem('tasks', JSON.stringify(tasks.value))
        }
      } catch (error) {
        console.error('Error deleting task:', error)
        if (error.message === 'Unauthorized') {
          handleUnauthorized()
          showToast('Session Expired', 'Your session has expired. Please login again.')
        } else {
          showToast('Error', 'Failed to delete task. Please try again.')
        }
      }
    }

const changeTaskStatus = async (id, newStatus) => {
  const taskToUpdate = tasks.value.find(task => task.id === id)
  if (!taskToUpdate) return

  const updatedTask = { ...taskToUpdate, status: newStatus }
  await updateTask(updatedTask)
}

const toggleTaskPublic = async (id, isPublic) => {
  const taskToUpdate = tasks.value.find(task => task.id === id)
  if (!taskToUpdate) return

  const updatedTask = { ...taskToUpdate, isPublic }
  await updateTask(updatedTask)

  if (user.value) {
    showToast(
      isPublic ? 'Task made public' : 'Task made private',
      isPublic ? 'This task is now visible to others.' : 'This task is now private.'
    )
  }
}

// UI functions
const setSelectedCategory = (status) => {
  selectedCategory.value = selectedCategory.value === status ? null : status
}

const setEditingTask = (task) => {
  editingTask.value = task
}

const handleTaskSubmit = async (task) => {
  if (editingTask.value) {
    await updateTask(task)
    editingTask.value = null
  } else {
    await addTask(task)
    isAddingTask.value = false
  }
}

const handleTaskCancel = () => {
  isAddingTask.value = false
  editingTask.value = null
}

// Watchers
watch(user, (newUser, oldUser) => {
  if (newUser && !oldUser) {
    // User just logged in
    loadTasks()
    syncLocalTasks()
  } else if (!newUser && oldUser) {
    // User just logged out
    tasks.value = []
  }
})

watch(tasks, (newTasks) => {
  if (!user.value && newTasks.length > 0) {
    localStorage.setItem('tasks', JSON.stringify(newTasks))
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadTasks()
})
</script>