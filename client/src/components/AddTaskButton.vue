<template>
  <button
    @click="$emit('click')"
    class="w-full rounded-xl bg-amber-100 border-2 border-dashed border-amber-300 p-4 text-amber-600 hover:bg-amber-200 hover:border-amber-400 transition-colors"
  >
    <div class="flex items-center justify-center gap-2">
      <PlusIcon class="h-5 w-5" />
      <span class="font-medium">Add New Task</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { PlusIcon } from 'lucide-vue-next'

defineEmits<{
  (e: 'click'): void
}>()
</script>