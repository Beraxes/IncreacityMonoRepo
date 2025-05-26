import { ref, onMounted } from "vue"

export function useUpdateNotification() {
  const showUpdateNotification = ref(false)
  const updateAvailable = ref(false)

  const checkForUpdates = () => {
    // Force a service worker update check
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.update()
        })
      })
    }
  }

  const showUpdatePrompt = () => {
    showUpdateNotification.value = true
    updateAvailable.value = true
  }

  const hideUpdatePrompt = () => {
    showUpdateNotification.value = false
  }

  onMounted(() => {
    // Listen for service worker updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // New service worker has taken control
        window.location.reload()
      })
    }

    // Check for updates periodically in development
    if (import.meta.env.DEV) {
      setInterval(checkForUpdates, 30000) // Check every 30 seconds
    }
  })

  return {
    showUpdateNotification,
    updateAvailable,
    checkForUpdates,
    showUpdatePrompt,
    hideUpdatePrompt,
  }
}
