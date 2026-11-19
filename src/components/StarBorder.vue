<!--
  StarBorder from Vue Bits (https://vue-bits.dev, https://github.com/DavidHDev/vue-bits),
  TypeScript + Tailwind, as published except for the lines marked "Site change".
  Copyright (c) 2025 David Haz, MIT + Commons Clause License Condition v1.0.
  Used by ToolSwitch.vue (the tools page's switch between the two tools).

  Site changes:
  - The inner box has no look of its own (published: a dark box with a grey border, white
    centred text and 64 × 24 px of padding): the site's classes give it its look.
  - The two lights run along the edges once, each time `sweep` changes, and fade out
    (published: back and forth for as long as the page was open). Not at all before the
    first `sweep`, and nothing with reduced motion (the global rule in terminal-theme.css).
  - They are aria-hidden: decoration.
-->
<template>
  <component
    :is="as"
    :class="['relative inline-block overflow-hidden !bg-transparent !border-none !rounded-[20px]', customClass]"
    v-bind="restAttrs"
    :style="componentStyle"
  >
    <!-- Site change: keyed by `sweep`, so each new value runs them once more; aria-hidden -->
    <template v-if="sweep > 0">
      <div
        :key="`bottom-${sweep}`"
        aria-hidden="true"
        class="right-[-250%] bottom-[-11px] z-0 absolute opacity-70 rounded-full w-[300%] h-[50%] animate-star-movement-bottom"
        :style="{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }"
      ></div>

      <div
        :key="`top-${sweep}`"
        aria-hidden="true"
        class="top-[-10px] left-[-250%] z-0 absolute opacity-70 rounded-full w-[300%] h-[50%] animate-star-movement-top"
        :style="{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }"
      ></div>
    </template>

    <!-- Site change: no look of its own (was bg-[#0b0b0b] px-[64px] py-[24px] border
         border-[#333] rounded-[20px] text-[16px] text-white text-center) -->
    <div :class="['z-10 relative', innerClass]">
      <slot />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false }); // Site change: the attributes go on the root once (restAttrs), not twice

interface StarBorderProps {
  as?: string;
  customClass?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  // Site change: the inner box's classes, and the count of sweeps so far
  innerClass?: string;
  sweep?: number;
}

const props = withDefaults(defineProps<StarBorderProps>(), {
  as: 'button',
  customClass: '',
  color: 'white',
  speed: '6s',
  thickness: 1,
  innerClass: '',
  sweep: 0
});

const restAttrs = useAttrs();

const componentStyle = computed(() => {
  const base = {
    padding: `${props.thickness}px 0`
  };
  const userStyle = (restAttrs.style as Record<string, string>) || {};
  return { ...base, ...userStyle };
});
</script>

<style scoped>
@keyframes star-movement-bottom {
  0% {
    transform: translate(0%, 0%);
    opacity: 1;
  }

  100% {
    transform: translate(-100%, 0%);
    opacity: 0;
  }
}

@keyframes star-movement-top {
  0% {
    transform: translate(0%, 0%);
    opacity: 1;
  }

  100% {
    transform: translate(100%, 0%);
    opacity: 0;
  }
}

/* Site change: once, holding the end (faded out); was linear infinite alternate */
.animate-star-movement-bottom {
  animation: star-movement-bottom linear 1 both;
}

.animate-star-movement-top {
  animation: star-movement-top linear 1 both;
}
</style>
