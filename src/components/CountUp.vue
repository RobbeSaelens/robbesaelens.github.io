<!--
  CountUp from Vue Bits (https://vue-bits.dev, https://github.com/DavidHDev/vue-bits),
  TypeScript + Tailwind, as published except for the lines marked "Site change".
  Copyright (c) 2025 David Haz, MIT + Commons Clause License Condition v1.0.
  Used by CountUpNumber.vue.

  Site changes:
  - A `format` prop, so the numbers are formatted the way the rest of the site formats
    them (en-GB / nl-BE, RepoActivity.vue) instead of in en-US.
  - It counts in `duration` seconds, easing out (a quartic), measured in real time. The
    published spring took about 3.5 s to land on a few hundred whatever `duration` said
    (the last numbers alone over a second), and assumed 60 frames a second, so it ran
    twice as fast on a 120 Hz screen.
-->
<template>
  <span ref="elementRef" :class="className" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, useTemplateRef } from 'vue'; // Site change: no computed (it was the spring's)

interface Props {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
  // Site change: formats each whole number shown (replaces the en-US format and `separator`)
  format?: (value: number) => string;
}

const props = withDefaults(defineProps<Props>(), {
  from: 0,
  direction: 'up',
  delay: 0,
  duration: 2,
  className: '',
  startWhen: true,
  separator: ''
});

const elementRef = useTemplateRef<HTMLSpanElement>('elementRef');
const currentValue = ref(props.direction === 'down' ? props.to : props.from);
const isInView = ref(false);
const animationId = ref<number | null>(null);
const hasStarted = ref(false);

let intersectionObserver: IntersectionObserver | null = null;

// Site change: no spring (damping, stiffness, velocity); a time-based ease-out instead
let startTime = 0;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

const formatNumber = (value: number) => {
  if (props.format) return props.format(Number(value.toFixed(0))); // Site change

  const options = {
    useGrouping: !!props.separator,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  };

  const formattedNumber = Intl.NumberFormat('en-US', options).format(Number(value.toFixed(0)));

  return props.separator ? formattedNumber.replace(/,/g, props.separator) : formattedNumber;
};

const updateDisplay = () => {
  if (elementRef.value) {
    elementRef.value.textContent = formatNumber(currentValue.value);
  }
};

// Site change: eases from the start value to the target in `duration` seconds (was a spring)
const springAnimation = (timestamp: number) => {
  if (!startTime) startTime = timestamp;

  const start = props.direction === 'down' ? props.to : props.from;
  const target = props.direction === 'down' ? props.from : props.to;
  const progress = Math.min(1, (timestamp - startTime) / (Math.max(0.01, props.duration) * 1000));
  currentValue.value = start + (target - start) * easeOut(progress);

  updateDisplay();

  if (progress < 1) {
    animationId.value = requestAnimationFrame(springAnimation);
  } else {
    currentValue.value = target;
    updateDisplay();
    animationId.value = null;

    if (props.onEnd) {
      props.onEnd();
    }
  }
};

const startAnimation = () => {
  if (hasStarted.value || !isInView.value || !props.startWhen) return;

  hasStarted.value = true;

  if (props.onStart) {
    props.onStart();
  }

  setTimeout(() => {
    startTime = 0;
    animationId.value = requestAnimationFrame(springAnimation);
  }, props.delay * 1000);
};

const setupIntersectionObserver = () => {
  if (!elementRef.value) return;

  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !isInView.value) {
        isInView.value = true;
        startAnimation();
      }
    },
    {
      threshold: 0,
      rootMargin: '0px'
    }
  );

  intersectionObserver.observe(elementRef.value);
};

const cleanup = () => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
    animationId.value = null;
  }

  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
};

watch(
  [() => props.from, () => props.to, () => props.direction],
  () => {
    currentValue.value = props.direction === 'down' ? props.to : props.from;
    updateDisplay();
    hasStarted.value = false;
  },
  { immediate: true }
);

watch(
  () => props.startWhen,
  () => {
    if (props.startWhen && isInView.value && !hasStarted.value) {
      startAnimation();
    }
  }
);

onMounted(() => {
  updateDisplay();
  setupIntersectionObserver();
});

onUnmounted(() => {
  cleanup();
});
</script>
