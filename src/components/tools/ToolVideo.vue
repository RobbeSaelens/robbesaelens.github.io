<!--
  A tool's film in place of its deck of captures (Project Updater's tour, `video` in
  src/tools.ts): 20 seconds of the app at work, with music.

  It plays by itself, muted and looping, while at least half of it is in view, and pauses
  when it scrolls away, the tab is hidden or an overlay covers the page, so a page at rest
  comes to rest. Nothing of it loads before (`preload="none"`): the poster is what the
  prerendered HTML and a first paint show. Two buttons over its corner: play / pause, and
  sound on / off (turning the sound on also plays it). Once the visitor pauses it, it
  never starts by itself again. With reduced motion it never plays by itself.

  Phones get the 480p file, the rest 720p (a <source> per media query). Its title is its
  accessible name; the caption under it says what it shows.
-->
<template>
  <figure ref="root" class="tool-film" :class="{ 'is-playing': playing }">
    <div class="film-frame">
      <video
        ref="player"
        :aria-label="video.title"
        :poster="video.poster"
        :width="video.width"
        :height="video.height"
        muted
        loop
        playsinline
        disablepictureinpicture
        preload="none"
        @play="playing = true"
        @pause="playing = false"
        @volumechange="onVolume"
        @click="toggle"
      >
        <source :src="video.small" type="video/mp4" media="(max-width: 767px)" />
        <source :src="video.src" type="video/mp4" />
      </video>
      <div class="film-controls">
        <button
          type="button"
          class="film-button"
          :aria-label="playing ? $t('tools.video.pause') : $t('tools.video.play')"
          @click="toggle"
        >
          <Pause v-if="playing" aria-hidden="true" />
          <Play v-else aria-hidden="true" />
        </button>
        <button
          type="button"
          class="film-button film-sound"
          :aria-pressed="sound ? 'true' : 'false'"
          @click="toggleSound"
        >
          <Volume2 v-if="sound" aria-hidden="true" />
          <VolumeX v-else aria-hidden="true" />
          <span class="film-sound-label">{{ $t('tools.video.sound') }}</span>
        </button>
      </div>
    </div>
    <figcaption class="film-caption">{{ video.caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Pause, Play, Volume2, VolumeX } from 'lucide-vue-next'
import { pageCovered } from '../../covered'
import type { ToolVideo } from '../../tools'

defineProps<{ video: ToolVideo }>()

const root = ref<HTMLElement | null>(null)
const player = ref<HTMLVideoElement | null>(null)
const playing = ref(false)
const sound = ref(false)
/** In view (half of it at least), and whether it may start by itself */
let inView = false
let auto = true
let observer: IntersectionObserver | undefined

function start() {
  player.value?.play().catch(() => {
    // Blocked (sound without a gesture, or no autoplay at all): stay on the poster
    playing.value = false
  })
}

/** Plays when it should, pauses when it shouldn't: in view, page shown, not covered */
function sync() {
  const v = player.value
  if (!v) return
  const visible = inView && document.visibilityState === 'visible' && !pageCovered.value
  if (visible && auto && v.paused) start()
  else if (!visible && !v.paused) v.pause()
}

function toggle() {
  const v = player.value
  if (!v) return
  if (v.paused) {
    auto = true
    start()
  } else {
    // Paused by the visitor: it waits for them from now on
    auto = false
    v.pause()
  }
}

function toggleSound() {
  const v = player.value
  if (!v) return
  v.muted = !v.muted
  if (!v.muted) {
    auto = true
    if (v.paused) start()
  }
}

function onVolume() {
  sound.value = !!player.value && !player.value.muted
}

watch(pageCovered, sync)

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) auto = false
  document.addEventListener('visibilitychange', sync)
  if (!root.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting
      sync()
    },
    { threshold: 0.5 },
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', sync)
  player.value?.pause()
})
</script>

<style scoped>
/* 16 : 9 in a frame like the captures', its poster until it plays. Two round buttons over
   its bottom left corner: play / pause and the sound. The tools page sets --tool-accent and
   --tool-star per tool; elsewhere the site's accent stands in. */
.tool-film {
  margin: 0;
}
.film-frame {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 0.875rem;
  background: #0e1320;
  box-shadow: 0 24px 60px -18px rgba(0, 0, 0, 0.45);
}
.film-frame video {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  cursor: pointer;
}
.film-controls {
  position: absolute;
  left: 0.75rem;
  bottom: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
/* With a mouse the buttons stay out of the picture until it is wanted: they fade in
   under the pointer, and whenever one of them has the keyboard's focus. A touch screen
   has no hover, so there they are simply always there. */
@media (hover: hover) and (pointer: fine) {
  .film-controls {
    opacity: 0;
    transform: translateY(0.375rem);
    transition:
      opacity 0.2s ease,
      transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .tool-film:hover .film-controls,
  .tool-film:focus-within .film-controls {
    opacity: 1;
    transform: none;
  }
}
.film-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.7rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(14, 19, 32, 0.72);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.12s ease-out;
}
.film-button svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
@media (hover: hover) and (pointer: fine) {
  .film-button:hover {
    background: rgba(14, 19, 32, 0.9);
    border-color: rgba(255, 255, 255, 0.35);
  }
}
.film-button:active {
  transform: scale(0.97);
}
.film-button:focus-visible {
  outline: 2px solid var(--tool-accent, var(--color-accent));
  outline-offset: 2px;
}
/* Sound on: the button takes the tool's light colour */
.film-sound[aria-pressed='true'] {
  background: var(--tool-star, var(--color-accent));
  border-color: var(--tool-star, var(--color-accent));
  color: #0e1320;
}
@media (pointer: coarse) {
  .film-button {
    min-width: 2.75rem;
    height: 2.75rem;
  }
}
.film-caption {
  margin-top: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .film-controls {
    transition: none;
    transform: none;
  }
}
</style>
