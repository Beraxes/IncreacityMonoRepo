import { ref } from "vue"
import { authAPI } from "../services/api"
import { storage } from "../utils/storage"
import type { User } from "../types"

const user = ref<User | null>(null)
const isLoading = ref<boolean>(true)

export function useAuth() {
  const login = async (username: string, password: string): Promise<User> => {
    try {
      const data = await authAPI.login(username, password)
      const userData: User = {
        id: `user_${Date.now()}`,
        username,
        token: data.access_token,
      }

      user.value = userData
      storage.saveUser(userData)
      return userData
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (username: string, email: string, password: string): Promise<User> => {
    try {
      const data = await authAPI.register(username, email, password)
      return {
        id: `user_${Date.now()}`,
        username,
        email,
        token: data.access_token || "",
      }
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = (isManual = false): void => {
    // Set flag for manual logout
    if (isManual) {
      localStorage.setItem("manual-logout", "true")
    }

    user.value = null
    storage.removeUser()

    // Only clear all data if it's a manual logout
    if (isManual) {
      storage.clearAllData()
    }
  }

  const handleUnauthorized = (): void => {
    if (user.value) {
      // This is an automatic logout due to token expiration
      // Don't clear tasks and sync data
      logout(false)
    }
  }

  const loadUser = (): void => {
    const storedUser = storage.loadUser()
    if (storedUser) {
      try {
        user.value = storedUser as User
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        storage.removeUser()
      }
    }
    isLoading.value = false
  }

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    handleUnauthorized,
    loadUser,
  }
}