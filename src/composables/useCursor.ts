import { onMounted, onBeforeUnmount, reactive } from 'vue'

export function useCursor() {
  const state = reactive({
    x: -100,
    y: -100,
    hover: false,
    visible: false,
  })

  let raf = 0
  let targetX = -100
  let targetY = -100

  function onMouseMove(e: MouseEvent) {
    targetX = e.clientX
    targetY = e.clientY
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

  function animate() {
    state.x += (targetX - state.x) * 0.18
    state.y += (targetY - state.y) * 0.18
    raf = requestAnimationFrame(animate)
  }

  onMounted(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseover', onMouseOver)
    animate()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseleave', onMouseLeave)
    document.removeEventListener('mouseover', onMouseOver)
    cancelAnimationFrame(raf)
  })

  return state
}
