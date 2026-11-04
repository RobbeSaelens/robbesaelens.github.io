<template>
  <!-- "Geluwe" with a small map card on hover, focus or tap. The map is an SVG
       drawn from OpenStreetMap data (src/assets/geluwe-map.svg), coloured by the
       site's theme; showing it contacts no third party. -->
  <span
    ref="root"
    class="place"
    :class="{ 'is-open': open }"
    @mouseenter="show"
    @mouseleave="open = false"
    @focusin="show"
    @focusout="onFocusOut"
  >
    <button type="button" class="place-name" :aria-expanded="open" aria-describedby="place-card" @click="show">
      Geluwe
    </button>
    <span id="place-card" class="place-card" role="tooltip" :style="{ '--shift': `${shift}px` }">
      <span class="place-map" role="img" :aria-label="$t('home.map.alt')">
        <!-- Local, generated file (no user content) -->
        <span class="place-svg" v-html="svg"></span>
        <span class="place-dot" aria-hidden="true"></span>
      </span>
      <span class="place-foot">
        <span class="place-caption"><MapPin class="place-pin" aria-hidden="true" />{{ $t('home.map.caption') }}</span>
        <a
          class="place-credit"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          >© OpenStreetMap</a
        >
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { MapPin } from 'lucide-vue-next'

const root = ref<HTMLElement | null>(null)
const open = ref(false)
/** The map, fetched the first time the card opens (~28 KB gzipped). */
const svg = ref('')

function loadMap() {
  if (svg.value) return
  import('../assets/geluwe-map.svg?raw').then((m) => (svg.value = m.default))
}
/** Horizontal nudge that keeps the card inside the viewport. */
const shift = ref(0)

/** Opens on hover, focus and tap; a tap elsewhere (focus leaves) or Escape closes it. */
async function show() {
  if (open.value) return
  loadMap()
  open.value = true
  shift.value = 0
  await nextTick()
  const card = root.value?.querySelector<HTMLElement>('.place-card')
  if (!card || !root.value) return
  // From the word and the card's layout width: its rect is still mid-animation here.
  const word = root.value.getBoundingClientRect()
  const left = word.left + word.width / 2 - card.offsetWidth / 2
  const right = left + card.offsetWidth
  const margin = 12
  if (left < margin) shift.value = margin - left
  else if (right > innerWidth - margin) shift.value = innerWidth - margin - right
}

function close() {
  open.value = false
}

function onFocusOut(e: FocusEvent) {
  if (!root.value?.contains(e.relatedTarget as Node | null)) open.value = false
}

// Escape closes it wherever focus is, also when it was opened by hovering.
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.place {
  position: relative;
  display: inline-block;
}
.place-name {
  padding: 0;
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  cursor: help;
  text-decoration: underline dotted;
  text-decoration-color: var(--color-accent);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  transition: color 0.2s ease;
}
.place-name:hover,
.is-open .place-name {
  color: var(--color-accent);
}
.place-name:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 3px;
}

/* The card, above the word; --shift keeps it on screen */
.place-card {
  position: absolute;
  z-index: 30;
  bottom: calc(100% + 0.6rem);
  left: 50%;
  width: min(20rem, calc(100vw - 1.5rem));
  padding: 0.4rem;
  /* The surface colour is translucent in dark mode: lay it over the page colour */
  background: linear-gradient(var(--color-surface), var(--color-surface)), var(--color-bg);
  border: 1px solid var(--color-border-glow);
  border-radius: 1rem;
  box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.3);
  opacity: 0;
  visibility: hidden;
  transform: translate(calc(-50% + var(--shift, 0px)), 6px) scale(0.97);
  transform-origin: bottom center;
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0.2s;
}
.is-open .place-card {
  opacity: 1;
  visibility: visible;
  transform: translate(calc(-50% + var(--shift, 0px)), 0) scale(1);
}
/* Bridge the gap, so moving the pointer onto the card keeps it open */
.place-card::after {
  content: '';
  position: absolute;
  inset: 100% 0 -0.7rem;
}

.place-map {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 0.7rem;
  aspect-ratio: 320 / 200;
}
.place-map {
  --map-bg: #f3f7f6;
  --map-built: #e2ebe9;
  --map-water: #bfe0e4;
  --map-minor: #d5e2e0;
  --map-mid: #c3d8d4;
  --map-major: #a6d4cc;
  --map-motorway: #7cc3b8;
  --map-rail: #9fb1ae;
  --map-label: #3d5c58;
  --map-main: var(--color-accent);
  background: var(--map-bg);
}
.dark .place-map {
  --map-bg: #111a22;
  --map-built: #18242e;
  --map-water: #16323b;
  --map-minor: #26333f;
  --map-mid: #2f3f4d;
  --map-major: #2f5753;
  --map-motorway: #3a7a72;
  --map-rail: #3a4855;
  --map-label: #8fa3b5;
}
.place-svg,
.place-svg :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
.place-svg :deep(.m-bg) {
  fill: var(--map-bg);
}
.place-svg :deep(.m-built) {
  fill: var(--map-built);
}
.place-svg :deep(.m-water) {
  fill: var(--map-water);
}
.place-svg :deep(path:not(.m-built, .m-water)) {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.place-svg :deep(.m-river) {
  stroke: var(--map-water);
  stroke-width: 5;
}
.place-svg :deep(.m-rail) {
  stroke: var(--map-rail);
  stroke-width: 1.2;
  stroke-dasharray: 4 3;
  stroke-linecap: butt;
}
.place-svg :deep(.m-minor) {
  stroke: var(--map-minor);
  stroke-width: 1.1;
}
.place-svg :deep(.m-mid) {
  stroke: var(--map-mid);
  stroke-width: 2.2;
}
.place-svg :deep(.m-major) {
  stroke: var(--map-major);
  stroke-width: 3.4;
}
.place-svg :deep(.m-motorway) {
  stroke: var(--map-motorway);
  stroke-width: 4.6;
}
.place-svg :deep(.m-label) {
  font-family: inherit;
  font-size: 19px;
  font-weight: 600;
  fill: var(--map-label);
  text-anchor: middle;
  paint-order: stroke;
  stroke: var(--map-bg);
  stroke-width: 5px;
  stroke-linejoin: round;
}
.place-svg :deep(.m-label-small) {
  font-size: 15px;
  font-weight: 500;
}
.place-svg :deep(.m-label-main) {
  font-size: 24px;
  font-weight: 700;
  fill: var(--map-main);
}
.place-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0.75rem;
  height: 0.75rem;
  margin: -0.375rem 0 0 -0.375rem;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 0 3px #fff;
}
.place-dot::after {
  content: '';
  position: absolute;
  inset: -0.5rem;
  border-radius: 50%;
  border: 2px solid var(--color-accent);
  animation: place-pulse 1.8s ease-out infinite;
}
@keyframes place-pulse {
  from {
    transform: scale(0.4);
    opacity: 1;
  }
  to {
    transform: scale(1.6);
    opacity: 0;
  }
}

.place-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.45rem 0.35rem 0.15rem;
  font-size: 0.75rem;
  line-height: 1.3;
}
.place-caption {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
  color: var(--color-text-primary);
}
.place-pin {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--color-accent);
}
.place-credit {
  color: var(--color-text-muted);
  white-space: nowrap;
  text-decoration: none;
}
.place-credit:hover,
.place-credit:focus-visible {
  color: var(--color-accent);
  text-decoration: underline;
}

@media (prefers-reduced-motion: reduce) {
  .place-card {
    transition: none;
  }
  .place-dot::after {
    animation: none;
  }
}
</style>
