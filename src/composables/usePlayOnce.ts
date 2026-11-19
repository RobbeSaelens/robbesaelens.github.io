import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * A small story told in motion once, when it scrolls into view (the tools page's update
 * pipeline and Sift's two apps coming together). Its CSS draws three states:
 * - '' (at rest): the final picture. What the prerendered HTML, reduced motion and a
 *   story already on screen when the page opens show; nothing moves.
 * - 'is-armed': its first frame, waiting below the fold (or in a tool that isn't shown).
 * - 'is-playing': on its way to the final picture, once (CSS keyframes that fill
 *   backwards: when they end, the picture at rest is left).
 * Only transform and opacity move. Mostly in view (`threshold`) before it starts, so it is
 * seen from its first frame; a background tab that never reports shows it at rest.
 */
export function usePlayOnce(root: Ref<HTMLElement | null>, threshold = 0.45) {
  const state = ref<'' | 'is-armed' | 'is-playing'>('')
  let observer: IntersectionObserver | undefined
  let fallback = 0

  onMounted(() => {
    const el = root.value
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    // Already on screen when the page opens: leave it at rest rather than blank it out
    const box = el.getBoundingClientRect()
    if (box.height > 0 && box.top < window.innerHeight && box.bottom > 0) return

    state.value = 'is-armed'
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        state.value = 'is-playing'
        observer?.disconnect()
      },
      { threshold },
    )
    observer.observe(el)
    // In a tab that never gets an observer report, don't leave it at its first frame
    fallback = window.setTimeout(() => {
      if (state.value === 'is-armed' && document.visibilityState === 'hidden') state.value = ''
    }, 1500)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    clearTimeout(fallback)
  })

  return state
}
