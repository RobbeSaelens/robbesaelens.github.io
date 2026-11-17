<!--
  A screenshot from public/ as a <picture>: the AVIF and WebP copies the build makes of
  its JPG (scripts/images.mjs, src/images.ts), at full and half width, and the JPG itself
  as the fallback. Every other attribute (alt, class, loading, fetchpriority, draggable)
  goes on the <img>, and the <picture> is display: contents, so the <img> lays out and is
  styled exactly as on its own.

  `width` and `height` are the JPG's real size: they hold its room while it loads (no
  layout shift) and tell the browser how wide each copy is. `sizes` is the width it is
  shown at; without it, only the full-size copies are offered (the lightbox).
-->
<template>
  <picture style="display: contents">
    <source v-for="source in sources" :key="source.type" :type="source.type" :srcset="source.srcset" :sizes="sizes" />
    <img v-bind="$attrs" :src="src" :width="width" :height="height" />
  </picture>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FORMATS, variant, variantSrcset } from '../images'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** The JPG in public/, e.g. /exulta-home.jpg */
  src: string
  width?: number | string
  height?: number | string
  sizes?: string
}>()

const sources = computed(() =>
  FORMATS.map(({ format, type }) => ({
    type,
    srcset:
      props.sizes && props.width
        ? variantSrcset(props.src, format, Number(props.width))
        : variant(props.src, format),
  })).filter((source) => source.srcset),
)
</script>
