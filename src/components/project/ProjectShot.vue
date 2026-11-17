<!--
  A screenshot on a project page: a button that opens it full screen (the page's
  lightbox: the parent listens to click), in a browser frame (desktop, with an "expand"
  mark in the bar) or a phone frame. The picture is ShotPicture (AVIF/WebP copies), with
  ShotGlare's glass sweep under the mouse. Its size and place are the page's.

  Lazy unless `eager`: only the two at the top of the page load straight away, the
  desktop one first (`priority`: fetchpriority="high"), as they are the largest paint.
-->
<template>
  <button
    type="button"
    class="shot"
    :class="kind === 'phone' ? 'shot-phone' : 'shot-desktop'"
    :aria-label="$t('aria.openScreenshot', { name: caption })"
  >
    <ShotGlare :radius="kind === 'phone' ? '1.25rem' : '0'">
      <span v-if="kind === 'desktop'" class="shot-bar" aria-hidden="true">
        <span class="shot-dot"></span>
        <span class="shot-dot"></span>
        <span class="shot-dot"></span>
        <span class="shot-url">{{ url }}</span>
        <Maximize2 class="shot-expand" />
      </span>
      <span v-else class="shot-notch" aria-hidden="true"></span>
      <ShotPicture
        :src="src"
        :alt="alt"
        :width="width"
        :height="height"
        :sizes="sizes"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : undefined"
      />
    </ShotGlare>
  </button>
</template>

<script setup lang="ts">
import { Maximize2 } from 'lucide-vue-next'
import ShotGlare from '../ShotGlare.vue'
import ShotPicture from '../ShotPicture.vue'

withDefaults(
  defineProps<{
    /** The JPG in public/ */
    src: string
    /** Its real size (ShotPicture) */
    width: number
    height: number
    alt: string
    /** Names it in the button's label and the lightbox ("exulta.be — mobile") */
    caption: string
    kind?: 'desktop' | 'phone'
    /** The text in the browser bar */
    url?: string
    /** How wide it is shown (SHOT_SIZES in src/images.ts) */
    sizes: string
    eager?: boolean
    priority?: boolean
  }>(),
  { kind: 'desktop', url: '', eager: false, priority: false },
)
</script>
