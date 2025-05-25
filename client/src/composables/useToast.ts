import { ref } from "vue"
import type { ToastMessage } from "../types"

export function useToast() {
  const toast = ref<ToastMessage>({ show: false, title: "", description: "" })

  const showToast = (title: string, description = "", variant: "default" | "success" | "error" = "default"): void => {
    toast.value = { show: true, title, description, variant }
    setTimeout(() => {
      toast.value.show = false
    }, 5000)
  }

  const hideToast = (): void => {
    toast.value.show = false
  }

  return {
    toast,
    showToast,
    hideToast,
  }
}
