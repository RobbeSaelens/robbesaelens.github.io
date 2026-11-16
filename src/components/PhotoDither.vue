<!--
  A photo shown as two-colour pixels, the mouse revealing it in full colour: DitherVeil
  (Vue Bits) laid over the real <img>, like HeroWordmark does with its text. The <img>
  stays underneath, for the prerendered HTML, search engines and screen readers; the
  canvas is hidden from them. Used for the about page's photo cards.

  Only where it works well: a mouse or trackpad (on phones the photo cards swipe
  sideways, and the canvas would take that gesture), a real GPU with WebGL 2 (gpu.ts),
  no reduced motion. Anywhere else the plain photo shows, as before. It waits for the
  photo, so the veil never covers it with an empty, flat colour.

  The two colours are theme tokens (--color-dither-ink and -paper, terminal-theme.css).
  `area` (a selector of an ancestor, the card) lets the pointer anywhere on it move the
  reveal, also over the caption that lies on the photo. DitherVeil draws only while
  something moves (the pointer, its fading trail, the intro) and while on screen.
-->
<template>
  <div v-if="active" ref="rootRef" class="photo-dither" aria-hidden="true">
    <DitherVeil
      :src="src"
      fit="cover"
      :pixel-size="2"
      :ink-color="ink"
      :paper-color="paper"
      :reveal-radius="REVEAL_RADIUS"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { hasGpuWebGL } from '../gpu'
import DitherVeil from './DitherVeil.vue'

const props = defineProps<{ src: string; area?: string }>()

/** The circle of full colour around the pointer, in px. */
const REVEAL_RADIUS = 170

const active = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const ink = ref('#134e4a')
const paper = ref('#ffffff')

let alive = true
let themeObserver: MutationObserver | undefined
let stopForwarding = () => {}

/** The colours of the current theme, as the hex the canvas needs. */
const readColors = () => {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string, current: string) => {
    const value = style.getPropertyValue(name).trim()
    return /^#[0-9a-f]{3,6}$/i.test(value) ? value : current
  }
  ink.value = read('--color-dither-ink', ink.value)
  paper.value = read('--color-dither-paper', paper.value)
}

/**
 * DitherVeil listens on its own box only. Hands it the pointer events of the rest of
 * `area` too (they carry the position, it works out the rest).
 */
const forwardPointer = (area: HTMLElement, veil: HTMLElement) => {
  const forward = (e: PointerEvent) => {
    if (e.target instanceof Node && veil.contains(e.target)) return // it has these itself
    const { clientX, clientY, pointerId, pointerType, button, buttons, isPrimary } = e
    veil.dispatchEvent(new PointerEvent(e.type, { clientX, clientY, pointerId, pointerType, button, buttons, isPrimary }))
  }
  const types = ['pointermove', 'pointerdown', 'pointerleave'] as const
  types.forEach((type) => area.addEventListener(type, forward, { passive: true }))
  return () => types.forEach((type) => area.removeEventListener(type, forward))
}

onMounted(async () => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
  if (typeof ResizeObserver === 'undefined' || typeof IntersectionObserver === 'undefined') return
  if (!hasGpuWebGL('webgl2')) return

  // Requested the way DitherVeil requests it, so it then comes straight from the cache.
  const photo = new Image()
  photo.crossOrigin = 'anonymous'
  photo.src = props.src
  try {
    await photo.decode()
  } catch {
    return
  }
  if (!alive) return

  readColors()
  // The theme toggle switches the "dark" class on <html>.
  themeObserver = new MutationObserver(readColors)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  active.value = true

  await nextTick()
  if (!alive) return
  const veil = rootRef.value?.firstElementChild
  const area = props.area ? rootRef.value?.closest<HTMLElement>(props.area) : null
  if (area && veil instanceof HTMLElement) stopForwarding = forwardPointer(area, veil)
})

onBeforeUnmount(() => {
  alive = false
  themeObserver?.disconnect()
  stopForwarding()
})
</script>

<style scoped>
.photo-dither {
  position: absolute;
  inset: 0;
}
</style>
