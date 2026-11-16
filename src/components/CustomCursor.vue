<template>
  <!-- useCursor.ts moves .cursor-pos with transform: the dot and the ring both sit on
       the pointer. -->
  <div :class="['custom-cursor', { 'is-hover': hover, 'is-visible': visible }]" aria-hidden="true">
    <div ref="posEl" class="cursor-pos">
      <div class="cursor-dot"></div>
      <div class="cursor-ring"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useCursor } from '../composables/useCursor'

export default defineComponent({
  name: 'CustomCursor',
  setup() {
    return useCursor()
  },
})
</script>

<style scoped>
.custom-cursor {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 99999;
  opacity: 0;
  transition: opacity 0.15s ease;
}

/* A point, placed at the pointer with transform; the dot and ring centre on it */
.cursor-pos {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
}

.custom-cursor.is-visible {
  opacity: 1;
}

.cursor-dot {
  width: 6px;
  height: 6px;
  background: #14b8a6;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.cursor-ring {
  width: 32px;
  height: 32px;
  border: 1.5px solid rgba(20, 184, 166, 0.5);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    opacity 0.25s ease;
}

/* Hover: expand ring, shrink dot */
.custom-cursor.is-hover .cursor-ring {
  transform: translate(-50%, -50%) scale(2.2);
  border-color: rgba(20, 184, 166, 0.8);
  border-width: 1px;
}

.custom-cursor.is-hover .cursor-dot {
  transform: translate(-50%, -50%) scale(0.5);
}

/* Dark mode. Not :global(.dark) .x: in scoped CSS Vue drops everything after
   :global(), which compiled to a bare .dark rule that painted <html> teal. */
.dark .cursor-dot {
  background: #2dd4bf;
}

.dark .cursor-ring {
  border-color: rgba(45, 212, 191, 0.5);
}

.dark .custom-cursor.is-hover .cursor-ring {
  border-color: rgba(45, 212, 191, 0.8);
}

/* Touch devices: hide custom cursor */
@media (hover: none) and (pointer: coarse) {
  .custom-cursor {
    display: none;
  }
}
</style>
