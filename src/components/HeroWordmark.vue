<!--
  The hero name, drawn by TechText (Vue Bits) once the page runs in a browser.

  The real text stays in place underneath: it sizes the box, it is what the
  prerendered HTML, search engines and screen readers get, and it shows until
  the canvas has drawn. Then it turns transparent (still selectable, still
  read out) and the canvas, which hangs over it with room for the selection
  frame and its label, takes over. The canvas itself is hidden from screen
  readers, so the name is not read twice.
-->
<template>
  <span class="wordmark">
    <span ref="textRef" class="terminal-text wordmark-text" :class="{ 'is-drawn': drawn }">{{ text }}</span>
    <span v-if="active" class="wordmark-canvas" aria-hidden="true">
      <TechText
        :text="text"
        :font-weight="700"
        :font-size="fontSize"
        :letter-spacing="0"
        :color="color"
        :accent-color="color"
        reveal="letter"
        line-style="dashed"
        :specks="12"
      />
    </span>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import TechText from './TechText.vue'

defineProps<{ text: string }>()

const textRef = ref<HTMLElement | null>(null)
const active = ref(false)
const drawn = ref(false)
const fontSize = ref(48)
const color = ref('#0f766e')

let resizeObserver: ResizeObserver | undefined
let themeObserver: MutationObserver | undefined

/** The title's font size in px: it scales with its column (cqi), so it is read, not set. */
const readSize = () => {
  if (textRef.value) fontSize.value = parseFloat(getComputedStyle(textRef.value).fontSize) || 48
}

/** The accent of the current theme (terminal-theme.css), as the hex the canvas needs. */
const readColor = () => {
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
  if (/^#[0-9a-f]{3,6}$/i.test(accent)) color.value = accent
}

onMounted(() => {
  // A browser without these keeps the plain text.
  if (typeof ResizeObserver === 'undefined' || typeof IntersectionObserver === 'undefined') return
  readSize()
  readColor()
  resizeObserver = new ResizeObserver(readSize)
  if (textRef.value) resizeObserver.observe(textRef.value)
  // The theme toggle switches the "dark" class on <html>.
  themeObserver = new MutationObserver(readColor)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  active.value = true
  // TechText draws on its first frames (after its own resize observer has run).
  requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => (drawn.value = true))))
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
})
</script>

<style scoped>
.wordmark {
  position: relative;
  display: inline-block;
}
.wordmark-text {
  transition: opacity 0.2s ease;
}
.wordmark-text.is-drawn {
  opacity: 0;
}
/* Wider and taller than the text: TechText fits the word into 90 % of its width
   and 66 % of its height, and needs the room above for the frame's label. */
.wordmark-canvas {
  position: absolute;
  inset: -0.85em -0.8em;
}
</style>
