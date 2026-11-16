<!--
  Water ripples under the mouse on a photo: RippleDistortion (Vue Bits) laid over the
  real <img>, like HeroWordmark does with its text. The <img> stays underneath, for the
  prerendered HTML, search engines and screen readers; the canvas is hidden from them and
  never takes the pointer. Used for the about page's photo cards.

  The canvas is see-through where nothing ripples and hidden between ripples
  (RippleDistortion.vue), so at rest the photo is the <img> itself. It draws the photo the
  way the <img> shows it (object-fit: cover, centred), and Contact.vue gives it the photo's
  hover zoom and dim, so a ripple lines up with the photo around it. The settings are
  gentler than Vue Bits' demo (a strong, swirling smear, in grey): a light push with
  little swirl, so lines wobble as in a reflection on water, in the photo's own colours,
  fading out a second or two after the mouse stops.

  Only where it works well: a mouse or trackpad (on phones the photo cards swipe
  sideways), a real GPU (gpu.ts), no reduced motion. Anywhere else the plain photo shows,
  as before.

  RippleDistortion follows the pointer anywhere over its box (it listens on the window),
  so also over the caption that lies on the photo. `area` (a selector of an ancestor, the
  card) switches it on while the mouse is over that: not under a dialog or the chat
  panel, not for touch. It draws only while a ripple fades, and only on screen.
-->
<template>
  <div v-if="active" ref="rootRef" class="photo-ripple" aria-hidden="true">
    <RippleDistortion
      :src="src"
      :enabled="pointing"
      :brush-size="90"
      :strength="0.05"
      :swirl="0.12"
      :rings="5"
      :spacing="20"
      :fade="5"
      :grayscale="false"
      :tint-amount="0"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { hasGpuWebGL } from '../gpu'
import RippleDistortion from './RippleDistortion.vue'

const props = defineProps<{ src: string; area?: string }>()

const active = ref(false)
const rootRef = ref<HTMLElement | null>(null)
/** The mouse is over `area` (without one: always). */
const pointing = ref(!props.area)

let alive = true
let stopListening = () => {}

/** Switches the ripples on while a mouse (or pen) is over `area`. */
const listen = (area: HTMLElement) => {
  const over = (e: PointerEvent) => {
    pointing.value = e.pointerType !== 'touch'
  }
  const out = () => {
    pointing.value = false
  }
  area.addEventListener('pointermove', over, { passive: true })
  area.addEventListener('pointerleave', out, { passive: true })
  return () => {
    area.removeEventListener('pointermove', over)
    area.removeEventListener('pointerleave', out)
  }
}

onMounted(async () => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
  if (typeof ResizeObserver === 'undefined' || typeof IntersectionObserver === 'undefined') return
  if (!hasGpuWebGL()) return

  active.value = true
  await nextTick()
  if (!alive) return
  const area = props.area ? rootRef.value?.closest<HTMLElement>(props.area) : null
  if (area) stopListening = listen(area)
})

onBeforeUnmount(() => {
  alive = false
  stopListening()
})
</script>

<style scoped>
.photo-ripple {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
/* ogl sizes the canvas in whole px: stretch it to the photo's exact box. */
.photo-ripple :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
