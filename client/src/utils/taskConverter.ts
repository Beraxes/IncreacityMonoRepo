import { TaskStatus, type Task, type ApiTask } from "../types"

export const taskConverter = {
  localTaskToApiTask(task: Task): Partial<ApiTask> {
    let category = "none"
    switch (task.status) {
      case TaskStatus.IN_PROGRESS:
        category = "in-progress"
        break
      case TaskStatus.COMPLETED:
        category = "completed"
        break
      case TaskStatus.WONT_DO:
        category = "wont-do"
        break
      case TaskStatus.TO_DO:
        category = "to-do"
        break
    }

    return {
      title: task.title,
      description: task.description,
      completed: task.status === TaskStatus.COMPLETED,
      category,
      isPublic: task.isPublic || false,
    }
  },

  apiTaskToLocalTask(apiTask: ApiTask): Task {
    let status: TaskStatus = TaskStatus.TO_DO
    switch (apiTask.category) {
      case "in-progress":
        status = TaskStatus.IN_PROGRESS
        break
      case "completed":
        status = TaskStatus.COMPLETED
        break
      case "wont-do":
        status = TaskStatus.WONT_DO
        break
      case "to-do":
        status = TaskStatus.TO_DO
        break
    }

    if (apiTask.completed) {
      status = TaskStatus.COMPLETED
    }

    let icon = "file"
    switch (status) {
      case TaskStatus.IN_PROGRESS:
        icon = "clock"
        break
      case TaskStatus.COMPLETED:
        icon = "check"
        break
      case TaskStatus.WONT_DO:
        icon = "coffee"
        break
      case TaskStatus.TO_DO:
        icon = "file"
        break
    }

    return {
      id: apiTask._id || String(Date.now()),
      _id: apiTask._id,
      title: apiTask.title,
      description: apiTask.description,
      status,
      icon,
      isPublic: apiTask.isPublic,
    }
  },
}
