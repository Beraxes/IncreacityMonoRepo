<template>
  <div
    :class="[
      'rounded-xl p-4 cursor-pointer transition-all',
      category.bgColor,
      selected ? `ring-2 ${category.ringColor}` : ''
    ]"
    @click="$emit('click')"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 rounded-md bg-white flex items-center justify-center">
          <component :is="getIcon(category.icon)" :class="['h-5 w-5', category.iconColor]" />
        </div>
        <h3 class="font-medium text-gray-900">{{ category.title }}</h3>
      </div>
      <div :class="['h-8 w-8 rounded-md flex items-center justify-center', category.actionColor]">
        <component :is="getActionIcon(category.status)" class="h-4 w-4 text-white" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ClockIcon, CheckCircle2Icon, CoffeeIcon, FileTextIcon, PlayIcon, CheckCircleIcon, XIcon } from 'lucide-vue-next'

defineProps({
  category: Object,
  selected: Boolean,
})

defineEmits(['click'])

const TaskStatus = {
  TO_DO: 'TO_DO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  WONT_DO: 'WONT_DO',
}

const getIcon = (iconName) => {
  switch (iconName) {
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

const getActionIcon = (status) => {
  switch (status) {
    case TaskStatus.COMPLETED:
      return CheckCircleIcon
    case TaskStatus.WONT_DO:
      return XIcon
    default:
      return PlayIcon
  }
}
</script>