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
