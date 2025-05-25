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
      <label for="email" class="text-sm font-medium">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        placeholder="your@email.com"
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

    <div class="space-y-2">
      <label for="confirmPassword" class="text-sm font-medium">Confirm Password</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
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
      {{ isLoading ? 'Registering...' : 'Register' }}
    </button>

    <div class="text-center text-sm">
      Already have an account?
      <button
        type="button"
        @click="$emit('loginClick')"
        class="text-amber-600 hover:underline"
      >
        Login
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import type { AuthContext } from '../types';

const emit = defineEmits(['success', 'loginClick'])

const auth = inject<AuthContext>('auth');

if (!auth) {
 throw new Error('Auth context not provided. Ensure it is available via provide/inject.');
}

const { register } = auth

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  isLoading.value = true

  try {
    await register(username.value, email.value, password.value)
    emit('success')
  } catch (err: any) {
    error.value = err.message || 'Failed to register'
  } finally {
    isLoading.value = false
  }
}
</script>