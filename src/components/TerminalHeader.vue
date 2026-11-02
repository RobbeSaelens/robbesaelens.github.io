<template>
  <header class="terminal-header">
    <h1 class="hero-in terminal-title text-2xl font-bold sm:text-3xl lg:text-5xl" style="--i: 0">
      <span class="terminal-prompt">&gt;</span>
      <span class="terminal-text">{{ title }}</span>
      <span class="terminal-cursor" aria-hidden="true"></span>
    </h1>
    <p class="hero-in terminal-subtitle text-sm tracking-wide md:text-base" style="--i: 1">
      <span class="opacity-50">$</span> {{ subtitle }}
    </p>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TerminalHeader',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
  },
})
</script>

<!-- Spacing shrinks with the screen height: the pages using it fill one screen. -->
<style scoped>
.terminal-header {
  flex-shrink: 0;
  padding: clamp(1rem, 3.5vh, 2.25rem) 0 clamp(0.75rem, 3vh, 1.75rem);
}
.terminal-subtitle {
  margin-top: clamp(0.5rem, 1.5vh, 1.25rem);
}
</style>
