<template>
  <div v-if="!isOnline" class="bg-red-500 text-white px-4 py-2 text-center text-sm">
    <WifiOffIcon class="h-4 w-4 inline mr-2" />
    You're offline. Changes will be saved locally and synced when you're back online.
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import { WifiOffIcon } from 'lucide-vue-next'
import type { NetworkContext } from '../types'

const network = inject<NetworkContext>('network')

// Add null check with fallback
const { isOnline } = network || { isOnline: ref(true) }
</script>