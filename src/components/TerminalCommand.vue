<!--
  The command on the "$ …" line under a page title ("cat ./privacy.md"), decrypted by
  DecryptedText (Vue Bits) once per page view, as the line rises in.

  The plain text is what the prerendered HTML, search engines and screen readers get,
  and what is left once the effect has played: DecryptedText only stands in while it
  runs (its scrambled copy is hidden from screen readers, its visually hidden copy
  holds the real text). It starts when the line's entrance shows it (.hero-in in
  styles.css: after the intro, html.intro-done, and after the rise's own delay), and
  never with reduced motion. The font is monospace and the scrambled characters are
  ASCII, so each one takes exactly the room of the real one: nothing moves.

  Registered globally (main.ts, entry-server.ts): on a page, the "$ …" line is the
  only thing that changes.
-->
<template>
  <span ref="rootRef" class="terminal-command">
    <DecryptedText
      v-if="playing"
      :text="text"
      animate-on="view"
      sequential
      reveal-direction="start"
      :speed="SPEED"
      :characters="CHARACTERS"
      encrypted-class-name="terminal-command-scrambled"
      @complete="playing = false"
    />
    <template v-else>{{ text }}</template>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DecryptedText from './DecryptedText.vue'

defineProps<{ text: string }>()

/** Milliseconds per character: they are revealed one by one, left to right. */
const SPEED = 35
/**
 * What the characters not yet revealed cycle through. No letters: "./privacy.m" plus a
 * random letter or two would read like an untranslated i18n key ("privacy.mQ").
 */
const CHARACTERS = '0123456789#$%&*+<=>?@^_~'

const rootRef = ref<HTMLElement | null>(null)
const playing = ref(false)
let cancel = () => {}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  if (rootRef.value) cancel = whenRisen(rootRef.value, () => (playing.value = true))
})

onBeforeUnmount(() => cancel())

/**
 * Calls `start` once the entrance of the line around `el` shows it: after the intro
 * (html.intro-done) and after the delay of its rise. Returns a function that cancels it.
 */
function whenRisen(el: HTMLElement, start: () => void): () => void {
  const html = document.documentElement
  let observer: MutationObserver | undefined
  let timer: number | undefined

  const afterDelay = () => {
    const rise = el
      .closest('.hero-in')
      ?.getAnimations?.()
      .find((a) => (a as CSSAnimation).animationName === 'hero-rise')
    const delay = Number(rise?.effect?.getComputedTiming().delay ?? 0)
    const elapsed = Number(rise?.currentTime ?? 0)
    timer = window.setTimeout(start, Math.max(0, delay - elapsed))
  }

  if (html.classList.contains('intro-done')) {
    afterDelay()
  } else {
    observer = new MutationObserver(() => {
      if (!html.classList.contains('intro-done')) return
      observer?.disconnect()
      afterDelay()
    })
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
  }

  return () => {
    observer?.disconnect()
    clearTimeout(timer)
  }
}
</script>

<style scoped>
/* The same box as DecryptedText's, so nothing moves when it takes over or hands back. */
.terminal-command {
  display: inline-block;
  white-space: pre-wrap;
}
.terminal-command :deep(.terminal-command-scrambled) {
  color: var(--color-accent);
}
</style>
