import { ref } from 'vue'

/**
 * Shared reactive state for the easter egg unlock.
 * ChatBot sets isEasterEggUnlocked to true when the riddle sequence is completed.
 * App.vue renders the EasterEgg overlay based on this state.
 * There is NO route — only unlockable via the chatbot riddle.
 */

// ── Unlock state ──
export const isEasterEggUnlocked = ref(false)

// ── Signal to reset the chatbot terminal ──
export const shouldResetChatbot = ref(false)

// ── Logo click → secret code (riddle 2) ──
export const secretCode = ref<string | null>(null)
export const showSecretCode = ref(false)

let clickTimes: number[] = []
let codeTimeout: ReturnType<typeof setTimeout> | null = null

export function useEasterEgg() {
  const unlock = () => {
    isEasterEggUnlocked.value = true
  }

  const close = () => {
    isEasterEggUnlocked.value = false
    shouldResetChatbot.value = true
  }

  /**
   * Track rapid clicks on the logo.
   * 3 clicks within 1500ms generates a 4-digit secret code
   * that must be typed into the chatbot to solve riddle 2.
   */
  const handleLogoClick = () => {
    const now = Date.now()
    clickTimes.push(now)
    clickTimes = clickTimes.filter((t) => now - t < 1500)

    if (clickTimes.length >= 3) {
      clickTimes = []
      const code = String(Math.floor(1000 + Math.random() * 9000))
      secretCode.value = code
      showSecretCode.value = true

      // Clear the auto-display after 4 seconds, but keep the code valid for 30s
      if (codeTimeout) clearTimeout(codeTimeout)
      setTimeout(() => {
        showSecretCode.value = false
      }, 4000)

      codeTimeout = setTimeout(() => {
        secretCode.value = null
        showSecretCode.value = false
      }, 30000)
    }
  }

  /**
   * Clear the secret code (called after it's used in the riddle).
   */
  const clearSecretCode = () => {
    secretCode.value = null
    showSecretCode.value = false
    if (codeTimeout) clearTimeout(codeTimeout)
  }

  return {
    isEasterEggUnlocked,
    unlock,
    close,
    handleLogoClick,
    secretCode,
    showSecretCode,
    clearSecretCode,
    shouldResetChatbot,
  }
}
