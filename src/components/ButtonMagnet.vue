<!--
  Magnet (Vue Bits) around a button: the button leans a little towards the mouse
  when it comes close. Only with a mouse (a pointer that is fine and can hover),
  so never on touch screens, and not with reduced motion: then it holds still.
  The button itself is untouched (its focus outline, label and click), and Magnet
  removes its window mousemove listener when it unmounts.

  The pull is 1/strength of the mouse's distance from the button's centre, up to
  padding px past its edge: keep both small enough that the button never moves
  onto its neighbours or off screen.
-->
<template>
  <Magnet
    :padding="padding"
    :magnet-strength="strength"
    :disabled="disabled || !canPull"
    :inner-class-name="innerClass"
    wrapper-class-name="button-magnet"
  >
    <slot />
  </Magnet>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Magnet from './Magnet.vue'

withDefaults(
  defineProps<{
    /** How far past the button's edges the mouse pulls, in px. */
    padding?: number
    /** Higher pulls less. */
    strength?: number
    disabled?: boolean
    /** Classes for the element that moves (it holds the button). */
    innerClass?: string
  }>(),
  { padding: 16, strength: 5, disabled: false, innerClass: '' },
)

/** A mouse, and motion welcome: the same test as the tilt of the project slides. */
const QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

const canPull = ref(false)
let media: MediaQueryList | undefined
const update = () => (canPull.value = !!media?.matches)

onMounted(() => {
  media = window.matchMedia(QUERY)
  update()
  media.addEventListener('change', update)
})
onBeforeUnmount(() => media?.removeEventListener('change', update))
</script>
