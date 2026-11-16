<!--
  A number that counts up with CountUp (Vue Bits) when it scrolls into view: the
  commit counts in RepoActivity.vue.

  The final number is what the prerendered HTML, search engines and screen readers
  get, and what is left once it has counted. CountUp renders an empty span until it
  runs in a browser, so it only stands in while it counts: hidden from screen readers,
  next to the final number in a visually hidden span. Every number is written by
  `format`, the site's own (en-GB / nl-BE), not CountUp's en-US. With reduced motion
  it never counts.
-->
<template>
  <span ref="rootRef">
    <template v-if="counting">
      <span class="sr-only">{{ format(value) }}</span>
      <CountUp
        aria-hidden="true"
        :to="value"
        :duration="0.5"
        :delay="delay"
        :start-when="inView"
        :format="show"
      />
    </template>
    <template v-else>{{ format(value) }}</template>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import CountUp from './CountUp.vue'

const props = withDefaults(
  defineProps<{
    value: number
    /** Writes a number, e.g. (n) => n.toLocaleString('nl-BE') */
    format: (n: number) => string
    /** Seconds between coming into view and counting, e.g. to wait for an entrance */
    delay?: number
  }>(),
  { delay: 0 },
)

const rootRef = ref<HTMLElement | null>(null)
const counting = ref(false)
const inView = ref(false)
let observer: IntersectionObserver | undefined

/**
 * CountUp's formatter. Once it shows the final number, the plain number takes over:
 * CountUp's spring would go on easing towards it for a few more seconds, invisibly.
 */
const show = (n: number) => {
  if (n === props.value) stop()
  return props.format(n)
}

function stop() {
  counting.value = false
  observer?.disconnect()
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  counting.value = true
  // Mostly in view and clear of the bottom edge: by then the section around it has
  // risen in (reveal.ts), so the count is seen from the start.
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      inView.value = true
      observer?.disconnect()
    },
    { threshold: 0.5, rootMargin: '0px 0px -10% 0px' },
  )
  if (rootRef.value) observer.observe(rootRef.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>
