import { onMounted, onBeforeUnmount, reactive, ref, toRefs } from 'vue'

/**
 * The custom cursor (CustomCursor.vue): a dot and a ring, both on the pointer. One element
 * holds them and is moved with `transform` straight from `mousemove`, never through Vue or
 * with left/top: a mouse move costs no re-render and no layout, and there is no loop.
 * Only where the cursor shows: with a mouse or trackpad (the same query that hides the
 * system pointer in styles.css).
 */
export function useCursor() {
  const state = reactive({
    hover: false,
    visible: false,
  })
  const posEl = ref<HTMLElement | null>(null)
  let fine: MediaQueryList | undefined

  function onMouseMove(e: MouseEvent) {
    if (posEl.value) posEl.value.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
    if (!state.visible) state.visible = true
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
    state.visible = false
  }

  const sync = () => (fine?.matches ? listen() : unlisten())

  onMounted(() => {
    fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    sync()
    fine.addEventListener('change', sync)
  })

  onBeforeUnmount(() => {
    fine?.removeEventListener('change', sync)
    unlisten()
  })

  return { ...toRefs(state), posEl }
}
