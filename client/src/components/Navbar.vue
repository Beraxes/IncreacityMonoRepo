<template>
  <nav class="bg-white border-b border-gray-200 px-4 py-3">
    <div class="flex items-center justify-between max-w-md mx-auto">
      <div class="flex items-center gap-2">
        <div class="h-6 w-6 rounded bg-amber-400 flex items-center justify-center">
          <div class="h-2 w-2 rounded bg-amber-600"></div>
        </div>
        <span class="font-semibold text-gray-900">Task Manager</span>
      </div>
      
      <div class="flex items-center gap-2">
        <div v-if="user" class="flex items-center gap-2">
          <span class="text-sm text-gray-600">{{ user.username }}</span>
          <button
            @click="handleLogout"
            class="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
        <div v-else class="flex items-center gap-2">
          <button
            @click="showLogin = true"
            class="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Login
          </button>
          <button
            @click="showRegister = true"
            class="text-sm bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600"
          >
            Register
          </button>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <div v-if="showLogin" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black bg-opacity-50" @click="showLogin = false"></div>
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative z-10">
        <h2 class="text-lg font-semibold mb-4">Login</h2>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              v-model="loginForm.username"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="loginForm.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              @click="showLogin = false"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isLoggingIn"
              class="px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
            >
              {{ isLoggingIn ? 'Logging in...' : 'Login' }}
            </button>
          </div>
        </form>
        <div v-if="loginError" class="mt-4 text-sm text-red-600">
          {{ loginError }}
        </div>
      </div>
    </div>

    <!-- Register Modal -->
    <div v-if="showRegister" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black bg-opacity-50" @click="showRegister = false"></div>
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative z-10">
        <h2 class="text-lg font-semibold mb-4">Register</h2>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              v-model="registerForm.username"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="registerForm.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="registerForm.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              @click="showRegister = false"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isRegistering"
              class="px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
            >
              {{ isRegistering ? 'Registering...' : 'Register' }}
            </button>
          </div>
        </form>
        <div v-if="registerError" class="mt-4 text-sm text-red-600">
          {{ registerError }}
        </div>
        <div v-if="registerSuccess" class="mt-4 text-sm text-green-600">
          {{ registerSuccess }}
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import type { AuthContext } from '../types'

const auth = inject<AuthContext>('auth')
if (!auth) {
  throw new Error('Auth context not found')
}

const { user, login, register, logout } = auth

// State
const showLogin = ref<boolean>(false)
const showRegister = ref<boolean>(false)
const isLoggingIn = ref<boolean>(false)
const isRegistering = ref<boolean>(false)
const loginError = ref<string>('')
const registerError = ref<string>('')
const registerSuccess = ref<string>('')

// Forms
const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: ''
})

// Methods
const handleLogin = async (): Promise<void> => {
  isLoggingIn.value = true
  loginError.value = ''
  
  try {
    await login(loginForm.value.username, loginForm.value.password)
    showLogin.value = false
    loginForm.value = { username: '', password: '' }
  } catch (error) {
    loginError.value = (error as Error).message
  } finally {
    isLoggingIn.value = false
  }
}

const handleRegister = async (): Promise<void> => {
  isRegistering.value = true
  registerError.value = ''
  registerSuccess.value = ''
  
  try {
    await register(registerForm.value.username, registerForm.value.email, registerForm.value.password)
    registerSuccess.value = 'Registration successful! You can now login.'
    registerForm.value = { username: '', email: '', password: '' }
    setTimeout(() => {
      showRegister.value = false
      showLogin.value = true
      registerSuccess.value = ''
    }, 2000)
  } catch (error) {
    registerError.value = (error as Error).message
  } finally {
    isRegistering.value = false
  }
}

const handleLogout = (): void => {
  logout()
}
</script>