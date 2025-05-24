<template>
  <nav class="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
    <div class="flex items-center gap-2">
      <div class="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center">
        <div class="h-3 w-3 rounded-full bg-amber-600"></div>
      </div>
      <span class="font-bold text-xl">Task Manager</span>
    </div>

    <div>
      <div v-if="user" class="flex items-center gap-4">
        <span class="text-sm text-gray-600">Hello, {{ user.username || user.email }}</span>
        <button
          @click="logout"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>
      <button
        v-else
        @click="showLoginModal = true"
        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        Login / Register
      </button>
    </div>

    <!-- Auth Modal -->
    <div v-if="showLoginModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black bg-opacity-50" @click="showLoginModal = false"></div>
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative z-10">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">{{ isLogin ? 'Login' : 'Register' }}</h2>
          <button @click="showLoginModal = false" class="text-gray-400 hover:text-gray-600">
            <XIcon class="h-5 w-5" />
          </button>
        </div>

        <LoginForm
          v-if="isLogin"
          @success="handleAuthSuccess"
          @register-click="isLogin = false"
        />
        <RegisterForm
          v-else
          @success="handleRegisterSuccess"
          @login-click="isLogin = true"
        />

        <div class="mt-4 pt-4 border-t text-center text-sm text-gray-500">
          <p>{{ isLogin ? 'Login' : 'Register' }} to sync your tasks across devices</p>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, inject } from 'vue'
import { XIcon } from 'lucide-vue-next'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'

const auth = inject('auth')
const { user, logout } = auth

const showLoginModal = ref(false)
const isLogin = ref(true)

const handleAuthSuccess = () => {
  showLoginModal.value = false
}

const handleRegisterSuccess = () => {
  isLogin.value = true
}
</script>