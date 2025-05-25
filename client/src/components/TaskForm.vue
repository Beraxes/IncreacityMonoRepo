<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black bg-opacity-50" @click="$emit('cancel')"></div>
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative z-10">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">{{ task ? 'Edit Task' : 'Add New Task' }}</h2>
        <button @click="$emit('cancel')" class="text-gray-400 hover:text-gray-600">
          <XIcon class="h-5 w-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label for="title" class="text-sm font-medium">Title</label>
          <input
            id="title"
            v-model="title"
            type="text"
            placeholder="Task title"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <div class="space-y-2">
          <label for="description" class="text-sm font-medium">Description</label>
          <textarea
            id="description"
            v-model="description"
            placeholder="Task description (optional)"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
          ></textarea>
        </div>

        <div class="space-y-2">
          <label for="status" class="text-sm font-medium">Status</label>
          <select
            id="status"
            v-model="status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option :value="TaskStatus.TO_DO">To Do</option>
            <option :value="TaskStatus.IN_PROGRESS">In Progress</option>
            <option :value="TaskStatus.COMPLETED">Completed</option>
            <option :value="TaskStatus.WONT_DO">Won't Do</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            @click="$emit('cancel')"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600"
          >
            {{ task ? 'Update' : 'Add' }} Task
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { XIcon } from 'lucide-vue-next'
import { TaskStatus, type Task } from '../types'

interface Props {
  task?: Task | null
  selectedCategory?: TaskStatus | null
}

interface Emits {
  (e: 'submit', task: Task): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const title = ref<string>(props.task?.title || '')
const description = ref<string>(props.task?.description || '')
const status = ref<TaskStatus>(props.task?.status || props.selectedCategory || TaskStatus.TO_DO)

const handleSubmit = (): void => {
  if (!title.value.trim()) return

  // Automatically set icon based on status
  let autoIcon = 'file'
  switch (status.value) {
    case TaskStatus.IN_PROGRESS:
      autoIcon = 'clock'
      break
    case TaskStatus.COMPLETED:
      autoIcon = 'check'
      break
    case TaskStatus.WONT_DO:
      autoIcon = 'coffee'
      break
    case TaskStatus.TO_DO:
      autoIcon = 'file'
      break
  }

  const newTask: Task = {
    id: props.task?.id || Date.now().toString(),
    _id: props.task?._id,
    title: title.value,
    description: description.value,
    status: status.value,
    icon: autoIcon,
    isPublic: props.task?.isPublic || false,
  }

  emit('submit', newTask)
}
</script>