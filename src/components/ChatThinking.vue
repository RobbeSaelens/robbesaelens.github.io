<!--
  The chat's thinking line: LatticeLoader (Vue Bits) in the chat window's teal.
  The window is dark in both themes, and so are these colours.

  While an answer is being worked out (in the typing row) its 3×3 dots pulse
  beside "Thinking" and a running timer. An answer to a question then opens with
  the same line, done: a check mark and the time it took (`took`). The newest one
  (`animate`) is drawn running first and turns into the check, so the dots seem
  to settle into it; older ones are just done.

  Decorative: ChatBot.vue keeps both places aria-hidden, so the loader's own
  role="status" (and its English "in progress" text) never reaches screen
  readers. The chat body is the one live region, and it reads the answer once.
  With reduced motion the dots hold still; the timer still counts.
-->
<template>
  <LatticeLoader
    class-name="chat-loader"
    :status="status"
    :elapsed="took"
    :label="$t('chat.thinking')"
    :done-label="$t('chat.answered')"
    error-label=""
    pattern="ripple"
    :grid="3"
    shape="round"
    :color="ink"
    :done-color="ink"
    :cell-size="4"
    :gap="2"
    :font-size="12"
    :idle-opacity="0.2"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import LatticeLoader from './LatticeLoader.vue'

const props = withDefaults(
  defineProps<{
    /** Seconds the answer took: shows the done line instead of the running one. */
    took?: number
    /** Turn from running into done after mounting (the newest answer). */
    animate?: boolean
    /** The easter egg's amber instead of teal. */
    riddle?: boolean
  }>(),
  { took: undefined, animate: false, riddle: false },
)

const status = ref<'working' | 'done'>(props.took != null && !props.animate ? 'done' : 'working')
const ink = computed(() => (props.riddle ? '#fbbf24' : '#5eead4'))

let frame = 0
onMounted(() => {
  if (status.value === 'done' || props.took == null) return
  // Painted running once, then done: the dots cross-fade into the check.
  frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => (status.value = 'done'))))
})
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<style scoped>
/* Labels and timer: light enough that the timer, at the loader's 60 %, keeps
   4.5:1 on the bot bubble. */
.chat-loader {
  color: #cbd5e1;
}
/* UnoCSS writes the animate-[…] shorthand after the arbitrary easing, so the
   shorthand's default (ease) wins there: set the loader's own easing again. */
.chat-loader :deep(.ll-run > span) {
  animation-timing-function: var(--ll-ease-in-out);
}
/* No pulsing: the loader's own rule (and the site's) still runs each dot once. */
@media (prefers-reduced-motion: reduce) {
  .chat-loader :deep(.ll-run > span) {
    animation: none !important;
    opacity: 0.6;
  }
}
</style>
