<template>
  <div
    :class="['custom-cursor', { 'is-hover': hover, 'is-visible': visible }]"
    :style="{ left: x + 'px', top: y + 'px' }"
  >
    <div class="cursor-dot"></div>
    <div class="cursor-ring"></div>
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
  pointer-events: none;
  z-index: 99999;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.15s ease;
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

/* Dark mode */
:global(.dark) .cursor-dot {
  background: #2dd4bf;
}

:global(.dark) .cursor-ring {
  border-color: rgba(45, 212, 191, 0.5);
}

:global(.dark) .custom-cursor.is-hover .cursor-ring {
  border-color: rgba(45, 212, 191, 0.8);
}

/* Touch devices: hide custom cursor */
@media (hover: none) and (pointer: coarse) {
  .custom-cursor {
    display: none;
  }
}
</style>
