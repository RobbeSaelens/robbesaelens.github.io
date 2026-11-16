<!--
  The animated background behind every page: DarkVeil (Vue Bits), turned to the
  site's teal. Client-only (it needs WebGL; the prerendered HTML keeps the plain
  background) and skipped without a GPU (gpu.ts). It sits behind all content,
  over <html>'s background (App.vue's wrapper has none), and never takes the pointer. With
  reduced motion it holds still.

  The veil is opaque: black with glowing bands. Blending keeps the theme's own
  background colour and adds only the glow:
  - dark: "screen", so black drops out and the teal adds light;
  - light: inverted (white with dark teal bands, the hue rotated back) and
    "multiply", so white drops out and the teal tints.
  Both faintly enough that text over the brightest band keeps its contrast.

  It draws only what can be seen: 30 frames a second, none while an overlay hides the
  page (covered.ts), and a single one with reduced motion.
-->
<template>
  <div v-if="enabled" class="site-veil" aria-hidden="true">
    <DarkVeil
      :hue-shift="HUE_SHIFT"
      :speed="speed"
      :resolution-scale="RESOLUTION"
      :max-fps="MAX_FPS"
      :paused="pageCovered"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { hasGpuWebGL } from '../gpu'
import { pageCovered } from '../covered'
import DarkVeil from './DarkVeil.vue'

/** Turns the veil's violet to the accent teal (degrees, in the shader's YIQ space). */
const HUE_SHIFT = 55
/** A soft, blurry field: rendering it at half size costs a quarter and looks the same. */
const RESOLUTION = 0.5
/**
 * The field drifts through a cycle in about 35 s, so 30 frames a second look the same
 * as 60 or 120 and cost half (a quarter on a 120 Hz screen).
 */
const MAX_FPS = 30

const enabled = ref(false)
const speed = ref(0.6)

onMounted(() => {
  // On the CPU this full-screen shader would make the whole page stutter.
  if (!hasGpuWebGL()) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) speed.value = 0
  enabled.value = true
})
</script>

<!-- Not scoped: the light-mode rule depends on <html>'s class, and a scoped
     :global(html:not(.dark)) .site-veil compiles to a rule on <html> itself. -->
<style>
.site-veil {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0.5;
}
html:not(.dark) .site-veil {
  filter: invert(1) hue-rotate(180deg);
  mix-blend-mode: multiply;
  opacity: 0.4;
}
/* ogl sizes the canvas in px at the reduced resolution: stretch it back. */
.site-veil canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
