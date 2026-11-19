<!--
  A tool's captures as a deck of cards: CardSwap (Vue Bits) on the tools page. The front
  card is a whole capture; the others stand behind it, up and to the right, in depth. A
  card is a button that opens the page's lightbox at its capture (`open`); under the deck
  a line says what the front one shows, with a button to the next.

  How it moves (CardSwap, gsap): the front card drops out of the deck, which clips it at
  its bottom edge, the others move up a place, and it comes back in at the back. By itself
  only one round, once the deck is mostly in view: a capture every few seconds until the
  first is in front again, then it rests. It waits while the mouse is on it or something
  in it has focus, while it is off screen or in the tool that isn't shown, while the tab
  is hidden and while an overlay covers the page (the lightbox). Once the visitor moves it
  (Next), it never moves by itself again. With reduced motion it never moves by itself,
  and Next puts the cards in their places at once; so does Next from the keyboard.

  The prerendered HTML already shows the deck (tools-page.css places the cards with
  --slot, in container units of the stage), with every capture and its alt text in it;
  CardSwap then sets the same places in pixels. Only the front card is a tab stop; the
  others are in the list for screen readers, and in the lightbox.
-->
<template>
  <figure
    ref="root"
    class="tool-deck"
    :data-front="front"
    :data-autoplay="autoplay ? 'on' : 'off'"
    @pointerenter="onPointer(true, $event)"
    @pointerleave="onPointer(false, $event)"
    @focusin="focused = true"
    @focusout="onFocusOut"
  >
    <div ref="stage" class="deck-stage">
      <CardSwap
        ref="deck"
        class="deck"
        role="list"
        :aria-label="$t('tools.shotsLabel', { name })"
        width="100%"
        height="auto"
        :card-distance="distance.x"
        :vertical-distance="distance.y"
        :skew-amount="SKEW"
        easing="linear"
        :drop-distance="distance.drop"
        @front="onFront"
      >
        <Card v-for="(shot, i) in shots" :key="shot.src" role="listitem" class="deck-card" :style="{ '--slot': i }">
          <button
            type="button"
            class="shot shot-app deck-shot"
            :tabindex="i === front ? undefined : -1"
            :aria-label="$t('aria.openScreenshot', { name: shot.caption })"
            @click="emit('open', i)"
          >
            <ShotGlare radius="0.75rem">
              <ShotPicture
                :src="shot.src"
                :alt="shot.alt"
                :width="shot.width"
                :height="shot.height"
                :sizes="SHOT_SIZES.deck"
                :loading="eager && i === 0 ? 'eager' : 'lazy'"
                :fetchpriority="eager && i === 0 ? 'high' : undefined"
                draggable="false"
              />
            </ShotGlare>
          </button>
        </Card>
      </CardSwap>
    </div>
    <!-- The button first: the chat button's corner is on the right -->
    <figcaption class="deck-foot">
      <button type="button" class="deck-next" :aria-label="$t('tools.nextShot')" @click="next">
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </button>
      <span class="deck-count" aria-hidden="true">{{ front + 1 }} / {{ shots.length }}</span>
      <span class="deck-label">{{ shots[front]?.label }}</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import CardSwap, { Card } from '../CardSwap.vue'
import ShotGlare from '../ShotGlare.vue'
import ShotPicture from '../ShotPicture.vue'
import { pageCovered } from '../../covered'
import { SHOT_SIZES } from '../../images'
import type { ToolShot } from '../../tools'

const props = withDefaults(
  defineProps<{
    name: string
    shots: ToolShot[]
    /** The first capture is the largest paint of the page: load it at once, first */
    eager?: boolean
  }>(),
  { eager: false },
)
const emit = defineEmits<{ open: [index: number] }>()

/** The cards lean a little, as CardSwap's do (it publishes 6°: captures hold text) */
const SKEW = 4
/** By themselves: the first swap this long after the deck comes into view, then one every… */
const FIRST_WAIT = 2200
const EVERY = 3800
/**
 * The cards' offsets, as a share of the stage's width: keep in step with --deck-x and
 * --deck-y in tools-page.css, which place them the same way before this runs.
 */
const STEP_X = 0.045
const STEP_Y = 0.05

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const deck = ref<InstanceType<typeof CardSwap> | null>(null)

const front = ref(0)
const distance = reactive({ x: 0, y: 0, drop: 600 })

// What keeps it still
const motion = ref(false)
const inView = ref(false)
const hovered = ref(false)
const focused = ref(false)
const tabHidden = ref(false)
/** Swaps left in its one round by itself; none once the visitor has moved it */
const left = ref(props.shots.length)

const autoplay = computed(
  () =>
    motion.value &&
    left.value > 0 &&
    inView.value &&
    !hovered.value &&
    !focused.value &&
    !tabHidden.value &&
    !pageCovered.value,
)

let timer = 0
let started = false
watch(autoplay, (on) => {
  clearTimeout(timer)
  if (on) {
    timer = window.setTimeout(tick, started ? EVERY : FIRST_WAIT)
    started = true
  }
})

function tick() {
  if (!autoplay.value) return
  deck.value?.swap()
  left.value -= 1
  if (autoplay.value) timer = window.setTimeout(tick, EVERY)
}

/** Next: the visitor takes over. At once with reduced motion or from the keyboard. */
function next(event: MouseEvent) {
  left.value = 0
  clearTimeout(timer)
  deck.value?.swap(!motion.value || event.detail === 0)
}

function onFront(index: number) {
  front.value = index
}

function onPointer(on: boolean, event: PointerEvent) {
  if (event.pointerType === 'mouse') hovered.value = on
}

function onFocusOut(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node | null)) focused.value = false
}

function onVisibility() {
  tabHidden.value = document.visibilityState === 'hidden'
}

/** The offsets and the drop from the stage's size (0 while its tool is hidden: skipped) */
function measure() {
  const el = stage.value
  if (!el || !el.clientWidth) return
  distance.x = Math.round(el.clientWidth * STEP_X)
  distance.y = Math.round(el.clientWidth * STEP_Y)
  distance.drop = Math.round(el.offsetHeight + 24)
}

let resize: ResizeObserver | undefined
let observer: IntersectionObserver | undefined

onMounted(() => {
  motion.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  measure()
  if (typeof ResizeObserver !== 'undefined' && stage.value) {
    resize = new ResizeObserver(measure)
    resize.observe(stage.value)
  }
  if (typeof IntersectionObserver !== 'undefined' && root.value) {
    observer = new IntersectionObserver(([entry]) => (inView.value = !!entry?.isIntersecting), {
      threshold: 0.6,
    })
    observer.observe(root.value)
  }
  onVisibility()
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  resize?.disconnect()
  observer?.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>
