<!--
  The Drupal drop in 3D, for the Drupal page: the logo (DrupalIcon's path, from Simple
  Icons, CC0; Drupal is a registered trademark of Dries Buytaert) as a front face, with
  a stack of its silhouette behind it as the thickness. Decoration only: aria-hidden.

  It turns in once when the page opens (with the page's entrance, about a second), then
  rests. With a mouse it leans towards the pointer and a light moves over its face:
  pointer moves set two numbers at most once a frame, the transform eases after them in
  CSS. It listens only while it is in view, and not at all with reduced motion or on a
  touch screen.
-->
<template>
  <div ref="root" class="drop3d" :class="{ 'is-tilting': tilting }" aria-hidden="true">
    <div class="drop3d-shadow"></div>
    <div class="drop3d-turn">
      <div class="drop3d-body" :style="tiltStyle">
        <svg
          v-for="n in DEPTH"
          :key="n"
          class="drop3d-layer"
          viewBox="0 0 24 24"
          :style="{ transform: `translateZ(${-n * STEP}px)` }"
          focusable="false"
        >
          <path :d="SILHOUETTE" :fill="n === DEPTH ? 'var(--drop-back)' : 'var(--drop-side)'" />
        </svg>
        <svg class="drop3d-layer drop3d-face" viewBox="0 0 24 24" focusable="false">
          <defs>
            <linearGradient :id="`${uid}-fill`" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stop-color="var(--drop-top)" />
              <stop offset="1" stop-color="var(--drop-bottom)" />
            </linearGradient>
            <radialGradient :id="`${uid}-shine`">
              <stop offset="0" stop-color="#fff" stop-opacity="0.45" />
              <stop offset="1" stop-color="#fff" stop-opacity="0" />
            </radialGradient>
            <clipPath :id="`${uid}-clip`">
              <path :d="SILHOUETTE" />
            </clipPath>
          </defs>
          <path :d="SILHOUETTE" fill="#fff" />
          <path :d="LOGO" :fill="`url(#${uid}-fill)`" />
          <g :clip-path="`url(#${uid}-clip)`">
            <circle class="drop3d-shine" cx="12" cy="12" r="9" :fill="`url(#${uid}-shine)`" />
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'

/** The drop's outline: the first part of the logo's path, closed. */
const SILHOUETTE =
  'M15.78 5.113C14.09 3.425 12.48 1.815 11.998 0c-.48 1.815-2.09 3.425-3.778 5.113-2.534 2.53-5.405 5.4-5.405 9.702a9.184 9.185 0 1018.368 0c0-4.303-2.871-7.171-5.405-9.702Z'
/** The whole logo: the outline with the face cut out of it (DrupalIcon.vue). */
const LOGO =
  'M15.78 5.113C14.09 3.425 12.48 1.815 11.998 0c-.48 1.815-2.09 3.425-3.778 5.113-2.534 2.53-5.405 5.4-5.405 9.702a9.184 9.185 0 1018.368 0c0-4.303-2.871-7.171-5.405-9.702M6.72 16.954c-.563-.019-2.64-3.6 1.215-7.416l2.55 2.788a.218.218 0 01-.016.325c-.61.625-3.204 3.227-3.527 4.126-.066.186-.164.18-.222.177M12 21.677a3.158 3.158 0 01-3.158-3.159 3.291 3.291 0 01.787-2.087c.57-.696 2.37-2.655 2.37-2.655s1.774 1.988 2.367 2.649a3.09 3.09 0 01.792 2.093A3.158 3.158 0 0112 21.677m6.046-5.123c-.068.15-.223.398-.431.405-.371.014-.411-.177-.686-.583-.604-.892-5.864-6.39-6.848-7.455-.866-.935-.122-1.595.223-1.94C10.736 6.547 12 5.285 12 5.285s3.766 3.574 5.336 6.016c1.57 2.443 1.029 4.556.71 5.253'

/** Layers of thickness, and the gap between them in px */
const DEPTH = 14
const STEP = 1.4
/** How far it leans at most, in degrees */
const MAX_TILT = 18

const uid = `drop-${useId()}`
const root = ref<HTMLElement | null>(null)
const tilt = ref({ x: 0, y: 0 })
const tilting = ref(false)

const tiltStyle = computed(() => ({
  '--rx': `${tilt.value.y * -MAX_TILT}deg`,
  '--ry': `${tilt.value.x * MAX_TILT}deg`,
  '--sx': `${tilt.value.x * -5}px`,
  '--sy': `${tilt.value.y * -5}px`,
}))

let frame = 0
let pointer: { x: number; y: number } | null = null
let observer: IntersectionObserver | undefined

function apply() {
  frame = 0
  if (!pointer || !root.value) return
  const box = root.value.getBoundingClientRect()
  // -1 … 1 from the drop's centre, reaching the edge about a screen-half away
  const reach = Math.max(window.innerWidth, window.innerHeight) / 2
  const clamp = (v: number) => Math.max(-1, Math.min(1, v))
  tilt.value = {
    x: clamp((pointer.x - (box.left + box.width / 2)) / reach),
    y: clamp((pointer.y - (box.top + box.height / 2)) / reach),
  }
}

function onMove(event: MouseEvent) {
  pointer = { x: event.clientX, y: event.clientY }
  tilting.value = true
  if (!frame) frame = requestAnimationFrame(apply)
}

function onLeave() {
  pointer = null
  tilt.value = { x: 0, y: 0 }
}

function listen(on: boolean) {
  if (on) {
    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
  } else {
    window.removeEventListener('mousemove', onMove)
    document.documentElement.removeEventListener('mouseleave', onLeave)
    cancelAnimationFrame(frame)
    frame = 0
  }
}

onMounted(() => {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!fine || reduced || !root.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(([entry]) => listen(entry.isIntersecting))
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  listen(false)
})
</script>

<style scoped>
.drop3d {
  --drop-top: #2ba9e0;
  --drop-bottom: #0678be;
  --drop-side: #055f97;
  --drop-back: #04476f;
  position: relative;
  width: var(--drop-size, 9rem);
  aspect-ratio: 1;
  perspective: 700px;
  pointer-events: none;
}
.drop3d-shadow {
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: -6%;
  height: 12%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(6, 120, 190, 0.35), transparent);
}
.drop3d-turn {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  animation: drop-turn 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s backwards;
}
.drop3d-body {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.drop3d-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.drop3d-face {
  transform: translateZ(0.5px);
}
.drop3d-shine {
  transform: translate(var(--sx, 0px), var(--sy, 0px)) translate(-3px, -4px);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes drop-turn {
  from {
    opacity: 0;
    transform: translateY(14px) rotateY(-200deg);
  }
  30% {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .drop3d-turn {
    animation: none;
  }
}
</style>
