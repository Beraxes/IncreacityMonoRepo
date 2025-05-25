import { ref, onMounted, onUnmounted } from "vue"

export function useNetwork() {
  const isOnline = ref<boolean>(navigator.onLine)

  const updateOnlineStatus = (): void => {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)
  })

  onUnmounted(() => {
    window.removeEventListener("online", updateOnlineStatus)
    window.removeEventListener("offline", updateOnlineStatus)
  })

  return {
    isOnline,
  }
}
