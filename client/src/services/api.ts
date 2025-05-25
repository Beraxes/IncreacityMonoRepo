import type { ApiTask } from "../types"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

// Auth API
export const authAPI = {
  async login(username: string, password: string): Promise<{ access_token: string }> {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Login failed" }))
      throw new Error(errorData.message || "Failed to login")
    }

    return response.json()
  },

  async register(username: string, email: string, password: string): Promise<{ access_token: string }> {
    const response = await fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Registration failed" }))
      throw new Error(errorData.message || "Failed to register")
    }

    return response.json()
  },
}

// Tasks API with better error handling
export const tasksAPI = {
  async fetchTasks(token: string): Promise<ApiTask[]> {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (response.status === 401) {
      throw new Error("TokenExpired")
    }

    if (!response.ok) {
      throw new Error("Failed to fetch tasks")
    }

    return response.json()
  },

  async createTask(task: Partial<ApiTask>, token: string): Promise<ApiTask> {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    })

    if (response.status === 401) {
      throw new Error("TokenExpired")
    }

    if (!response.ok) {
      throw new Error("Failed to create task")
    }

    return response.json()
  },

  async updateTask(taskId: string, task: Partial<ApiTask>, token: string): Promise<ApiTask> {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    })

    if (response.status === 401) {
      throw new Error("TokenExpired")
    }

    if (!response.ok) {
      throw new Error("Failed to update task")
    }

    return response.json()
  },

  async deleteTask(taskId: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (response.status === 401) {
      throw new Error("TokenExpired")
    }

    if (!response.ok) {
      throw new Error("Failed to delete task")
    }
  },
}