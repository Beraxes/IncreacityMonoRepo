<template>
  <button
    @click="$emit('click')"
    class="w-full rounded-xl bg-amber-100 p-4 flex items-center gap-3 hover:bg-amber-200 transition-colors"
  >
    <div class="h-8 w-8 rounded-md bg-amber-400 flex items-center justify-center">
      <span class="text-white text-xl font-bold">+</span>
    </div>
    <span class="text-gray-900 font-medium">Add new task</span>
  </button>
</template>

<script setup>
defineEmits(['click'])
</script>