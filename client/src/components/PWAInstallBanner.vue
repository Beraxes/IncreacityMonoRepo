<template>
  <div class="bg-amber-500 text-white px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded bg-amber-600 flex items-center justify-center">
        <DownloadIcon class="h-4 w-4" />
      </div>
      <div>
        <p class="font-medium">Install Task Manager</p>
        <p class="text-sm opacity-90">Get the full app experience</p>
      </div>
    </div>
    <div class="flex gap-2">
      <button
        @click="$emit('install')"
        class="bg-white text-amber-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
      >
        Install
      </button>
      <button
        @click="$emit('dismiss')"
        class="text-white hover:text-gray-200"
      >
        <XIcon class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DownloadIcon, XIcon } from 'lucide-vue-next'

interface Emits {
  (e: 'install'): void
  (e: 'dismiss'): void
}

defineEmits<Emits>()
</script>