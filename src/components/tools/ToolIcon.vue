<!--
  A tool's own app icon, drawn as in its repository (build/icon.svg): the same night-blue
  tile for both, with Project Updater's three dependency layers (the top one lifted and
  lit) or Sift's three bars narrowing like a sieve, with the one line that made it
  through. Decoration: aria-hidden, the name is always next to it. Its gradients get ids
  of their own, so each copy on the page draws (one in a hidden tool would otherwise take
  the others' gradient with it).
-->
<template>
  <svg class="tool-icon" viewBox="100 100 824 824" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient :id="`${uid}-bg`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1d2542" />
        <stop offset="1" stop-color="#0e1320" />
      </linearGradient>
      <radialGradient :id="`${uid}-glow`" cx="0.5" cy="0.05" r="0.75">
        <stop offset="0" stop-color="#6366f1" stop-opacity="0.32" />
        <stop offset="1" stop-color="#6366f1" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect x="100" y="100" width="824" height="824" rx="185" :fill="`url(#${uid}-bg)`" />
    <rect x="100" y="100" width="824" height="824" rx="185" :fill="`url(#${uid}-glow)`" />
    <rect x="100.5" y="100.5" width="823" height="823" rx="184.5" fill="none" stroke="#ffffff" stroke-opacity="0.09" />
    <template v-if="tool === 'project-updater'">
      <path d="M512 532 L742 650 L512 768 L282 650 Z" fill="#2a3456" />
      <path d="M512 442 L742 560 L512 678 L282 560 Z" fill="#3b4877" />
      <path d="M512 274 L742 392 L512 510 L282 392 Z" fill="#a5b4fc" />
      <path d="M512 274 L742 392 L512 510 L282 392 Z" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="6" />
    </template>
    <g v-else stroke-linecap="round" stroke-width="64">
      <line x1="292" y1="330" x2="732" y2="330" stroke="#e5e8f0" />
      <line x1="362" y1="458" x2="662" y2="458" stroke="#e5e8f0" stroke-opacity="0.72" />
      <line x1="432" y1="586" x2="592" y2="586" stroke="#e5e8f0" stroke-opacity="0.46" />
      <line x1="512" y1="714" x2="512" y2="714" stroke="#a5b4fc" stroke-width="84" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import type { ToolId } from '../../tools'

defineProps<{ tool: ToolId }>()

const uid = `tool-icon-${useId()}`
</script>
