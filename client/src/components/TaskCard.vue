<template>
  <div :class="['rounded-xl p-4 relative', getCardStyle()]" @click.stop>
    <!-- Sync Status Indicator -->
    <div class="absolute top-2 left-2 flex items-center gap-1">
      <div v-if="!isSynced" class="h-2 w-2 rounded-full bg-amber-400" title="Pending sync"></div>
      <div v-else-if="task._id" class="h-2 w-2 rounded-full bg-green-400" title="Synced"></div>
      <div v-else class="h-2 w-2 rounded-full bg-gray-400" title="Local only"></div>
    </div>

    <!-- Public/Private Toggle -->
    <button
      v-if="isLoggedIn"
      @click="handleTogglePublic"
      class="absolute top-2 right-2 h-6 w-6 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors"
      :title="isPublic ? 'Make private' : 'Make public'"
    >
      <GlobeIcon v-if="isPublic" class="h-3.5 w-3.5 text-green-600" />
      <LockIcon v-else class="h-3.5 w-3.5 text-gray-600" />
    </button>

    <div class="flex items-center justify-between mt-4">
      <div class="flex items-center gap-3 flex-1">
        <!-- Task Icon -->
        <div class="h-8 w-8 rounded-md bg-white flex items-center justify-center">
          <component :is="getStatusIcon()" :class="getStatusIconClass()" />
        </div>

        <!-- Task Content -->
        <div v-if="isEditing" class="flex-1 space-y-2">
          <input
            v-model="editTitle"
            placeholder="Task title"
            class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <textarea
            v-model="editDescription"
            placeholder="Task description (optional)"
            rows="2"
            class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          ></textarea>
          <div class="flex gap-2">
            <button
              @click="handleSaveEdit"
              class="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
            >
              <SaveIcon class="h-3 w-3" /> Save
            </button>
            <button
              @click="handleCancelEdit"
              class="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
            >
              <XCircleIcon class="h-3 w-3" /> Cancel
            </button>
          </div>
        </div>
        <div v-else class="flex-1" @dblclick="isEditing = true">
          <h3 class="font-medium text-gray-900">{{ task.title }}</h3>
          <p v-if="task.description" class="text-sm text-gray-600">{{ task.description }}</p>
          <p class="text-xs text-gray-500 mt-1">Double-click to edit</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="!isEditing" class="relative flex gap-2">
        <!-- Status Change Button -->
        <div class="relative">
          <button
            ref="statusButton"
            :class="['h-8 w-8 rounded-md flex items-center justify-center', getActionButtonStyle()]"
            @click.stop="showCategoryMenu = !showCategoryMenu"
          >
            <component :is="getActionIcon()" class="h-4 w-4" :class="getActionIconClass()" />
          </button>

          <!-- Category Menu -->
          <div
            v-if="showCategoryMenu"
            ref="categoryMenu"
            class="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg z-20 border border-gray-200 max-h-60 overflow-y-auto"
            :class="getDropdownPosition()"
          >
            <div class="py-1">
              <button
                v-for="status in statusOptions"
                :key="status.value"
                @click.stop="handleStatusChange(status.value)"
                class="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                :class="{ 'bg-gray-50': status.value === task.status }"
              >
                <component :is="status.icon" :class="['h-4 w-4', status.iconClass]" />
                {{ status.label }}
                <CheckIcon v-if="status.value === task.status" class="h-3 w-3 text-green-600 ml-auto" />
              </button>
            </div>
          </div>
        </div>

        <!-- Delete Button -->
        <button
          @click="showDeleteConfirm = true"
          class="h-8 w-8 rounded-md bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
          title="Delete task"
        >
          <Trash2Icon class="h-4 w-4 text-white" />
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black bg-opacity-50" @click="showDeleteConfirm = false"></div>
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative z-10">
        <h3 class="text-lg font-semibold mb-2">Are you sure you want to delete this task?</h3>
        <p class="text-sm text-gray-600 mb-4">This action cannot be undone. This will permanently delete the task.</p>
        <div class="flex justify-end gap-2">
          <button
            @click="showDeleteConfirm = false"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="handleDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  ClockIcon,
  CheckCircle2Icon,
  CoffeeIcon,
  FileTextIcon,
  PlayIcon,
  CheckCircleIcon,
  XIcon,
  SaveIcon,
  XCircleIcon,
  Trash2Icon,
  GlobeIcon,
  LockIcon,
  CheckIcon,
} from 'lucide-vue-next'
import { TaskStatus, type Task } from '../types'

interface Props {
  task: Task
  isLoggedIn: boolean
  isSynced: boolean
}

interface Emits {
  (e: 'statusChange', id: string, status: TaskStatus): void
  (e: 'edit', task: Task): void
  (e: 'delete', id: string): void
  (e: 'update', task: Task): void
  (e: 'togglePublic', id: string, isPublic: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const isEditing = ref<boolean>(false)
const editTitle = ref<string>(props.task.title)
const editDescription = ref<string>(props.task.description)
const showDeleteConfirm = ref<boolean>(false)
const showCategoryMenu = ref<boolean>(false)
const isPublic = ref<boolean>(props.task.isPublic || false)

// Refs
const statusButton = ref<HTMLButtonElement | null>(null)
const categoryMenu = ref<HTMLDivElement | null>(null)

// Status options for the dropdown
const statusOptions = [
  {
    value: TaskStatus.TO_DO,
    label: 'To Do',
    icon: FileTextIcon,
    iconClass: 'text-gray-600',
  },
  {
    value: TaskStatus.IN_PROGRESS,
    label: 'In Progress',
    icon: ClockIcon,
    iconClass: 'text-amber-600',
  },
  {
    value: TaskStatus.COMPLETED,
    label: 'Completed',
    icon: CheckCircle2Icon,
    iconClass: 'text-green-600',
  },
  {
    value: TaskStatus.WONT_DO,
    label: "Won't Do",
    icon: CoffeeIcon,
    iconClass: 'text-red-400',
  },
]

// Methods
const getCardStyle = (): string => {
  switch (props.task.status) {
    case TaskStatus.IN_PROGRESS:
      return 'bg-amber-100'
    case TaskStatus.COMPLETED:
      return 'bg-green-100'
    case TaskStatus.WONT_DO:
      return 'bg-red-100'
    case TaskStatus.TO_DO:
      return 'bg-gray-200'
    default:
      return 'bg-gray-200'
  }
}

const getStatusIcon = () => {
  switch (props.task.status) {
    case TaskStatus.IN_PROGRESS:
      return ClockIcon
    case TaskStatus.COMPLETED:
      return CheckCircle2Icon
    case TaskStatus.WONT_DO:
      return CoffeeIcon
    case TaskStatus.TO_DO:
      return FileTextIcon
    default:
      return FileTextIcon
  }
}

const getStatusIconClass = (): string => {
  switch (props.task.status) {
    case TaskStatus.IN_PROGRESS:
      return 'h-5 w-5 text-amber-600'
    case TaskStatus.COMPLETED:
      return 'h-5 w-5 text-green-600'
    case TaskStatus.WONT_DO:
      return 'h-5 w-5 text-red-400'
    case TaskStatus.TO_DO:
      return 'h-5 w-5 text-gray-600'
    default:
      return 'h-5 w-5 text-gray-600'
  }
}

const getActionButtonStyle = (): string => {
  switch (props.task.status) {
    case TaskStatus.IN_PROGRESS:
      return 'bg-amber-400'
    case TaskStatus.COMPLETED:
      return 'bg-green-400'
    case TaskStatus.WONT_DO:
      return 'bg-red-400'
    case TaskStatus.TO_DO:
      return 'bg-gray-300'
    default:
      return 'bg-gray-300'
  }
}

const getActionIcon = () => {
  switch (props.task.status) {
    case TaskStatus.IN_PROGRESS:
      return PlayIcon
    case TaskStatus.COMPLETED:
      return CheckCircleIcon
    case TaskStatus.WONT_DO:
      return XIcon
    case TaskStatus.TO_DO:
      return PlayIcon
    default:
      return PlayIcon
  }
}

const getActionIconClass = (): string => {
  switch (props.task.status) {
    case TaskStatus.TO_DO:
      return 'text-gray-600'
    default:
      return 'text-white'
  }
}

const handleSaveEdit = (): void => {
  if (editTitle.value.trim()) {
    emit('update', {
      ...props.task,
      title: editTitle.value,
      description: editDescription.value,
    })
    isEditing.value = false
  }
}

const handleCancelEdit = (): void => {
  editTitle.value = props.task.title
  editDescription.value = props.task.description
  isEditing.value = false
}

const handleStatusChange = (newStatus: TaskStatus): void => {
  emit('statusChange', props.task.id, newStatus)
  showCategoryMenu.value = false
}

const handleDelete = (): void => {
  emit('delete', props.task.id)
  showDeleteConfirm.value = false
}

const handleTogglePublic = (): void => {
  const newIsPublic = !isPublic.value
  isPublic.value = newIsPublic
  emit('togglePublic', props.task.id, newIsPublic)
}

// Click outside handler
const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as Node
  if (
    showCategoryMenu.value &&
    categoryMenu.value &&
    statusButton.value &&
    !categoryMenu.value.contains(target) &&
    !statusButton.value.contains(target)
  ) {
    showCategoryMenu.value = false
  }
}

const getDropdownPosition = (): string => {
  if (!statusButton.value) return 'mt-2'
  
  const buttonRect = statusButton.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = 200 // Approximate height of dropdown
  
  // If there's not enough space below, position above
  if (buttonRect.bottom + dropdownHeight > viewportHeight) {
    return 'bottom-full mb-2'
  }
  
  return 'mt-2'
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>