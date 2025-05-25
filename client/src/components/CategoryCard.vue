<template>
  <div
    :class="[
      'rounded-xl p-4 cursor-pointer transition-all duration-200',
      category.bgColor,
      selected ? `ring-2 ${category.ringColor}` : 'hover:scale-105'
    ]"
    @click="$emit('click')"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 rounded-md bg-white flex items-center justify-center">
          <component :is="getIcon()" :class="['h-5 w-5', category.iconColor]" />
        </div>
        <div>
          <h3 class="font-medium text-gray-900">{{ category.title }}</h3>
          <p class="text-sm text-gray-600">{{ getTaskCount() }} tasks</p>
        </div>
      </div>
      <div v-if="selected" class="text-amber-600">
        <CheckIcon class="h-5 w-5" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { 
  ClockIcon, 
  CheckCircle2Icon, 
  CoffeeIcon, 
  FileTextIcon,
  CheckIcon 
} from 'lucide-vue-next'
import type { Category } from '../types'

interface Props {
  category: Category
  selected: boolean
}

const props = defineProps<Props>()
defineEmits<{
  (e: 'click'): void
}>()

// You would need to inject tasks or pass them as props
// For now, we'll return 0
const getTaskCount = (): number => {
  return 0 // This should be calculated based on actual tasks
}

const getIcon = () => {
  switch (props.category.icon) {
    case 'clock':
      return ClockIcon
    case 'check-circle':
      return CheckCircle2Icon
    case 'coffee':
      return CoffeeIcon
    case 'file-text':
      return FileTextIcon
    default:
      return FileTextIcon
  }
}
</script>