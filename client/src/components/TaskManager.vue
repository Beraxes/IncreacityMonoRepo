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
          @click="syncTasksWithAPI"
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
          <button @click="hideToast" class="ml-4 text-gray-400 hover:text-gray-600">
            <XIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { PencilIcon, XIcon, CloudIcon } from 'lucide-vue-next'
import CategoryCard from './CategoryCard.vue'
import AddTaskButton from './AddTaskButton.vue'
import TaskCard from './TaskCard.vue'
import TaskForm from './TaskForm.vue'
import { useTasks } from '../composables/useTasks'
import { useToast } from '../composables/useToast'
import { TaskStatus, type Task, type Category, type AuthContext, type NetworkContext } from '../types'

const auth = inject<AuthContext>('auth')!
const network = inject<NetworkContext>('network')!

const { user } = auth
const { isOnline } = network

// Composables
const {
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
  syncTasksWithAPI
} = useTasks()

const { toast, hideToast } = useToast()

// Local state
const selectedCategory = ref<TaskStatus | null>(null)
const isAddingTask = ref<boolean>(false)
const editingTask = ref<Task | null>(null)

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

// UI functions
const setSelectedCategory = (status: TaskStatus | null): void => {
  selectedCategory.value = selectedCategory.value === status ? null : status
}

const setEditingTask = (task: Task): void => {
  editingTask.value = task
}

const handleTaskSubmit = async (task: Task): Promise<void> => {
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

// Lifecycle
onMounted(() => {
  loadTasks()
})
</script>