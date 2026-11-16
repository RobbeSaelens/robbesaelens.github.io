<!--
  SpotlightCard from Vue Bits (https://vue-bits.dev, https://github.com/DavidHDev/vue-bits).
  Copyright (c) 2025 David Haz, MIT + Commons Clause License Condition v1.0.
  Used by GlowCard.vue. Changed from the published version:
  - `as`: the card's tag (published: always a div), so the site's cards stay <article>
    and <section>.
  - None of its own look (published: rounded-3xl border p-8): the site's card classes
    give radius, border and padding. It is `isolate` and the glow `-z-1`, so the glow
    lies over the card's background and under its text (published, it lies over the
    text and takes some of its contrast).
  - Pointer instead of mouse events, touch ignored: a tap fires mouse events too, which
    left the glow on the card where the finger had been.
  - The glow fades in and out in 200 ms with `ease` (published: 500 ms ease-in-out, slow
    for a hover).
-->
<template>
  <component
    :is="as"
    ref="divRef"
    @pointermove="handleMouseMove"
    @focus="handleFocus"
    @blur="handleBlur"
    @pointerenter="handleMouseEnter"
    @pointerleave="handleMouseLeave"
    :class="['relative isolate overflow-hidden', className]"
  >
    <!-- Site change: duration-200 and ease (was duration-500 ease-in-out) -->
    <div
      class="pointer-events-none absolute inset-0 -z-1 opacity-0 transition-opacity duration-200 [transition-timing-function:ease]"
      :style="{
        opacity,
        background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`
      }"
    />

    <slot />
  </component>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps {
  as?: string;
  className?: string;
  spotlightColor?: string;
}

const { as = 'div', className = '', spotlightColor = 'rgba(255, 255, 255, 0.25)' } = defineProps<SpotlightCardProps>();

const divRef = useTemplateRef<HTMLElement>('divRef');
const isFocused = ref<boolean>(false);
const position = ref<Position>({ x: 0, y: 0 });
const opacity = ref<number>(0);

const handleMouseMove = (e: PointerEvent) => {
  if (!divRef.value || isFocused.value || e.pointerType === 'touch') return;

  const rect = divRef.value.getBoundingClientRect();
  position.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const handleFocus = () => {
  isFocused.value = true;
  opacity.value = 0.6;
};

const handleBlur = () => {
  isFocused.value = false;
  opacity.value = 0;
};

const handleMouseEnter = (e: PointerEvent) => {
  if (e.pointerType === 'touch') return;
  opacity.value = 0.6;
};

const handleMouseLeave = () => {
  opacity.value = 0;
};
</script>
