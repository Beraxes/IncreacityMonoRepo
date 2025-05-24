<template>
  <div id="app">
    <AuthProvider>
      <div class="min-h-screen bg-gray-50">
        <Navbar />
        <TaskManager />
      </div>
    </AuthProvider>
  </div>
</template>

<script setup>
import { provide, ref, onMounted } from 'vue'
import Navbar from './components/Navbar.vue'
import TaskManager from './components/TaskManager.vue'

// Auth Context
const user = ref(null)
const isLoading = ref(true)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Auth functions
const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(errorData.message || 'Failed to login')
    }

    const data = await response.json()
    const userData = {
      id: `user_${Date.now()}`,
      username,
      token: data.access_token,
    }

    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
    return userData
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

const registerUser = async (username, email, password) => {
  try {
    const response = await fetch(`${API_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }))
      throw new Error(errorData.message || 'Failed to register')
    }

    const data = await response.json()
    return {
      id: `user_${Date.now()}`,
      username,
      email,
    }
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

const logout = () => {
  user.value = null
  localStorage.removeItem('user')
  localStorage.removeItem('tasks')
}

const handleUnauthorized = () => {
  if (user.value) {
    logout()
  }
}

// Load user on mount
onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (error) {
      console.error('Failed to parse stored user:', error)
      localStorage.removeItem('user')
    }
  }
  isLoading.value = false
})

// Auth Provider component
const AuthProvider = {
  setup(_, { slots }) {
    provide('auth', {
      user,
      isLoading,
      login: loginUser,
      register: registerUser,
      logout,
      handleUnauthorized,
    })

    return () => slots.default()
  }
}
</script>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}
</style>