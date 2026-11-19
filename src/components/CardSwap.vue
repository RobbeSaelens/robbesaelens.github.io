<!--
  CardSwap from Vue Bits (https://vue-bits.dev, https://github.com/DavidHDev/vue-bits),
  TypeScript + Tailwind, as published except for the lines marked "Site change".
  Copyright (c) 2025 David Haz, MIT + Commons Clause License Condition v1.0.
  Used by ToolShots.vue (the tools page's captures). Needs gsap.

  Site changes:
  - In the page's flow, sized by its wrapper (published: absolutely placed in a hero's
    bottom-right corner, pushed out of it and shrunk at breakpoints).
  - The cards have no look of their own (published: a white border on black): the
    wrapper's classes give them theirs.
  - It swaps when it is told to (`swap`, exposed) and says which card comes to the front
    (`front`): the wrapper decides when, and rests after a round (published: it swapped
    on mount and then every `delay` for as long as the page was open). `delay` and
    `pauseOnHover` went with that interval.
  - A swap asked for while one is under way finishes that one first (published: both ran
    at once and fought over the cards); `swap(true)` puts the cards in their new places
    without moving them (reduced motion, the keyboard).
  - The front card drops `dropDistance` px (published: 500): the height of the stage,
    which clips it.
  - New distances (the stage was resized) put the cards in their new places, in the same
    order (published: it started over from the first card, and swapped).
-->
<script lang="ts">
import { defineComponent, h } from 'vue';

export const Card = defineComponent({
  name: 'Card',
  props: {
    customClass: { type: String, default: '' }
  },
  setup(cardProps, { slots, attrs }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          class: [
            // Site change: no look of its own (was rounded-xl border border-white bg-black)
            'absolute top-1/2 left-1/2 [transform-style:preserve-3d] [will-change:transform] [backface-visibility:hidden]',
            cardProps.customClass,
            attrs.class
          ]
        },
        slots.default?.()
      );
  }
});

export default {};
</script>

<script setup lang="ts">
import gsap from 'gsap';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  // Site change: no `delay` and `pauseOnHover` (the wrapper decides when to swap)
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
  // Site change: how far the front card drops (was 500 px)
  dropDistance?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 500,
  height: 400,
  cardDistance: 60,
  verticalDistance: 70,
  skewAmount: 6,
  easing: 'elastic',
  dropDistance: 500
});

// Site change: `front`, the card that comes to the front
const emit = defineEmits<{ cardClick: [idx: number]; front: [idx: number] }>();

const container = ref<HTMLDivElement | null>(null);

const cssDim = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);

const makeSlot = (i: number, distX: number, distY: number, total: number) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el: HTMLElement, slot: ReturnType<typeof makeSlot>, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

const getConfig = () =>
  props.easing === 'elastic'
    ? { ease: 'elastic.out(0.6,0.9)', durDrop: 2, durMove: 2, durReturn: 2, promoteOverlap: 0.9, returnDelay: 0.05 }
    : { ease: 'power1.inOut', durDrop: 0.8, durMove: 0.8, durReturn: 0.8, promoteOverlap: 0.45, returnDelay: 0.2 };

let tlRef: gsap.core.Timeline | null = null;
// Site change: no interval (intervalId, startInterval, stopInterval)
const order = ref<number[]>([]);

function getCards(): HTMLElement[] {
  if (!container.value) return [];
  return Array.from(container.value.children) as HTMLElement[];
}

function init() {
  const cards = getCards();
  const total = cards.length;
  // Site change: keeps the order it has, so the same card stays in front (was: from the first)
  if (order.value.length !== total) order.value = Array.from({ length: total }, (_, i) => i);
  order.value.forEach((idx, i) => {
    const card = cards[idx];
    card.style.width = cssDim(props.width);
    card.style.height = cssDim(props.height);
    placeNow(card, makeSlot(i, props.cardDistance, props.verticalDistance, total), props.skewAmount);
  });
}

// Site change: `instant`, and a swap under way finishes first
function swap(instant = false) {
  const cards = getCards();
  if (order.value.length < 2) return;
  tlRef?.progress(1);
  tlRef?.kill();
  tlRef = null;
  if (instant) {
    const [first, ...others] = order.value;
    order.value = [...others, first];
    init();
    emit('front', order.value[0]);
    return;
  }
  const config = getConfig();
  const [front, ...rest] = order.value;
  const elFront = cards[front];
  const tl = gsap.timeline();
  tlRef = tl;

  // Site change: `dropDistance` (was +=500)
  tl.to(elFront, { y: `+=${props.dropDistance}`, duration: config.durDrop, ease: config.ease });
  tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
  // Site change: says which card comes to the front, as it starts to
  tl.call(() => emit('front', rest[0]), undefined, 'promote');
  rest.forEach((idx, i) => {
    const el = cards[idx];
    const slot = makeSlot(i, props.cardDistance, props.verticalDistance, cards.length);
    tl.set(el, { zIndex: slot.zIndex }, 'promote');
    tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, `promote+=${i * 0.15}`);
  });

  const backSlot = makeSlot(cards.length - 1, props.cardDistance, props.verticalDistance, cards.length);
  tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
  tl.call(
    () => {
      gsap.set(elFront, { zIndex: backSlot.zIndex });
    },
    undefined,
    'return'
  );
  tl.to(
    elFront,
    { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: config.durReturn, ease: config.ease },
    'return'
  );
  tl.call(() => {
    order.value = [...rest, front];
  });
}

// Site change: exposed, for the wrapper
defineExpose({ swap });

onMounted(async () => {
  await nextTick();
  // Site change: only placed (was: init, swap, startInterval, setupHover)
  init();
});

onUnmounted(() => {
  // Site change: no interval or hover to stop (was stopInterval, teardownHover)
  tlRef?.kill();
});

watch(
  // Site change: dropDistance too; no delay and pauseOnHover
  () => [props.cardDistance, props.verticalDistance, props.skewAmount, props.easing, props.dropDistance],
  async () => {
    // Site change: finishes a swap under way and puts the cards in their new places, in
    // their order (was: stop, start over from the first card, swap, start the interval)
    tlRef?.progress(1);
    tlRef?.kill();
    tlRef = null;
    await nextTick();
    init();
  }
);
</script>

<template>
  <!-- Site change: in the flow, sized by the wrapper (was right-0 bottom-0 absolute, with a
       translate and a scale per breakpoint) -->
  <div
    ref="container"
    class="relative overflow-visible perspective-[900px]"
    :style="{ width: cssDim(width), height: cssDim(height) }"
  >
    <slot />
  </div>
</template>
