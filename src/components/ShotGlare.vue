<!--
  A glass sweep over a screenshot on the project pages: GlareHover (Vue Bits) inside
  the screenshot <button>, around its content. Its own box is undone (a 500px black
  square with a #333 border, a centring grid and a pointer cursor), so the button
  looks and behaves as before and only the sweep is new. `radius` rounds the sweep
  where the button doesn't clip it (the phone, inside its frame).

  Only with a mouse or trackpad (on touch a tap opens the lightbox straight away) and
  without reduced motion; otherwise the glare is fully transparent.
-->
<template>
  <GlareHover
    width="100%"
    height="auto"
    background="transparent"
    border-color="transparent"
    :border-radius="radius"
    :glare-opacity="enabled ? 0.3 : 0"
    :transition-duration="800"
    play-once
    :style="PLAIN"
  >
    <slot />
  </GlareHover>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import GlareHover from './GlareHover.vue'

withDefaults(defineProps<{ radius?: string }>(), { radius: '0' })

/** Undoes GlareHover's box: a plain block, no border, the button's cursor. */
const PLAIN = { display: 'block', placeItems: 'normal', borderWidth: '0', cursor: 'inherit' }

const enabled = ref(false)

onMounted(() => {
  enabled.value = window.matchMedia(
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
  ).matches
})
</script>
