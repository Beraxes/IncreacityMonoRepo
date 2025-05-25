import { ref, onMounted } from "vue"
import { storage } from "../utils/storage"

export function usePWA() {
  const showInstallBanner = ref<boolean>(false)
  let deferredPrompt: any = null

  const installPWA = async (): Promise<void> => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        showInstallBanner.value = false
      }
      deferredPrompt = null
    }
  }

  const dismissInstallBanner = (): void => {
    showInstallBanner.value = false
    storage.setPWADismissed()
  }

  onMounted(() => {
    // PWA Install prompt
    window.addEventListener("beforeinstallprompt", (e: Event) => {
      e.preventDefault()
      deferredPrompt = e
      if (!storage.isPWADismissed()) {
        showInstallBanner.value = true
      }
    })

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      showInstallBanner.value = false
    }
  })

  return {
    showInstallBanner,
    installPWA,
    dismissInstallBanner,
  }
}
