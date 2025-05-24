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
            placeholder="Task description (Required)"
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
            <option value="TO_DO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="WONT_DO">Won't Do</option>
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

<script setup>
import { ref } from 'vue'
import { XIcon } from 'lucide-vue-next'

const props = defineProps({
  task: Object,
  selectedCategory: String,
})

const emit = defineEmits(['submit', 'cancel'])

const TaskStatus = {
  TO_DO: 'TO_DO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  WONT_DO: 'WONT_DO',
}

// Form state
const title = ref(props.task?.title || '')
const description = ref(props.task?.description || '')
const status = ref(props.task?.status || props.selectedCategory || TaskStatus.TO_DO)
const icon = ref(props.task?.icon || 'file')

const handleSubmit = () => {
  if (!title.value.trim()) return

  const newTask = {
    id: props.task?.id || Date.now().toString(),
    title: title.value,
    description: description.value,
    status: status.value,
    icon: icon.value,
    isPublic: props.task?.isPublic || false,
  }

  emit('submit', newTask)
}
</script>