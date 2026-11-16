import { onMounted, onBeforeUnmount, reactive, ref, toRefs } from 'vue'

/**
 * How far the ring trails the pointer: the seconds it takes to close about 63 % of the
 * gap (the 0.18-per-frame ease it had at 60 Hz, now the same at any frame rate). The dot
 * sits on the pointer itself: it stands in for the system pointer, so it never lags.
 */
const RING_LAG = 0.084

/**
 * The custom cursor (CustomCursor.vue): a dot on the pointer and a ring that follows it.
 * Both are moved with `transform` on their own element, never through Vue or with
 * left/top, so a mouse move costs no re-render and no layout. The loop runs only while
 * the ring is catching up, and only where the cursor shows: with a mouse or trackpad
 * (the same query that hides the system pointer in styles.css). With reduced motion the
 * ring doesn't trail.
 */
export function useCursor() {
  const state = reactive({
    hover: false,
    visible: false,
  })
  const dotEl = ref<HTMLElement | null>(null)
  const ringEl = ref<HTMLElement | null>(null)

  let raf = 0
  let last = 0
  /** The pointer */
  let x = -100
  let y = -100
  /** The ring */
  let rx = -100
  let ry = -100
  let still = false
  let fine: MediaQueryList | undefined
  let reduced: MediaQueryList | undefined

  const draw = () => {
    if (dotEl.value) dotEl.value.style.transform = `translate3d(${x}px, ${y}px, 0)`
    if (ringEl.value) ringEl.value.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
  }

  const tick = (now: number) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    const k = still ? 1 : 1 - Math.exp(-dt / RING_LAG)
    rx += (x - rx) * k
    ry += (y - ry) * k
    const settled = Math.abs(x - rx) < 0.1 && Math.abs(y - ry) < 0.1
    if (settled) {
      rx = x
      ry = y
    }
    draw()
    raf = settled ? 0 : requestAnimationFrame(tick)
  }

  function onMouseMove(e: MouseEvent) {
    x = e.clientX
    y = e.clientY
    if (!state.visible) {
      state.visible = true
      // Appear at the pointer, not flying in from where it was last seen
      rx = x
      ry = y
    }
    if (!raf) {
      last = 0
      raf = requestAnimationFrame(tick)
    }
  }

  function onMouseLeave() {
    state.visible = false
  }

  function onMouseOver(e: MouseEvent) {
    const el = e.target as HTMLElement
    const interactive = el.closest('a, button, [role="button"], .cursor-hover')
    state.hover = !!interactive
  }

  const listen = () => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseover', onMouseOver)
  }

  const unlisten = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseleave', onMouseLeave)
    document.removeEventListener('mouseover', onMouseOver)
    cancelAnimationFrame(raf)
    raf = 0
    state.visible = false
  }

  const sync = () => (fine?.matches ? listen() : unlisten())
  const syncReduced = () => (still = !!reduced?.matches)

  onMounted(() => {
    fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    syncReduced()
    sync()
    fine.addEventListener('change', sync)
    reduced.addEventListener('change', syncReduced)
  })

  onBeforeUnmount(() => {
    fine?.removeEventListener('change', sync)
    reduced?.removeEventListener('change', syncReduced)
    unlisten()
  })

  return { ...toRefs(state), dotEl, ringEl }
}
