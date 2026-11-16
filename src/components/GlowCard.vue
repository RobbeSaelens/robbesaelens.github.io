<!--
  A card with a soft teal glow that follows the mouse: SpotlightCard (Vue Bits) in the
  site's colours. For the project pages' feature cards, the Drupal page's panels and
  the about page's text cards. The card keeps its own tag (`as`) and its classes and
  attributes, which fall through to SpotlightCard's root: the scroll reveal and the
  tests rely on them, and the page's styles still give it its look.

  The glow is --color-spotlight (terminal-theme.css), per theme, under the text and
  faint enough that the text keeps its contrast. Only with a mouse or trackpad and
  without reduced motion; on touch screens, and in the prerendered HTML, it stays
  transparent.
-->
<template>
  <SpotlightCard :as="as" :spotlight-color="enabled ? 'var(--color-spotlight)' : 'transparent'">
    <slot />
  </SpotlightCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SpotlightCard from './SpotlightCard.vue'

withDefaults(defineProps<{ as?: string }>(), { as: 'div' })

const enabled = ref(false)

onMounted(() => {
  enabled.value = window.matchMedia(
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
  ).matches
})
</script>
