<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div v-if="error" class="bg-red-50 p-3 rounded-md text-red-500 text-sm">
      {{ error }}
    </div>

    <div class="space-y-2">
      <label for="username" class="text-sm font-medium">Username</label>
      <input
        id="username"
        v-model="username"
        type="text"
        placeholder="johndoe"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      />
    </div>

    <div class="space-y-2">
      <label for="password" class="text-sm font-medium">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        placeholder="••••••••"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      />
    </div>

    <button
      type="submit"
      :disabled="isLoading"
      class="w-full bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {{ isLoading ? 'Logging in...' : 'Login' }}
    </button>

    <div class="text-center text-sm">
      Don't have an account?
      <button
        type="button"
        @click="$emit('registerClick')"
        class="text-amber-600 hover:underline"
      >
        Register
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, inject } from 'vue'

const emit = defineEmits(['success', 'registerClick'])

const auth = inject('auth')
const { login } = auth

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true

  try {
    await login(username.value, password.value)
    emit('success')
  } catch (err) {
    error.value = err.message || 'Failed to login'
  } finally {
    isLoading.value = false
  }
}
</script>