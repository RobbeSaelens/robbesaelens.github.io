<template>
  <header class="mb-10 mt-8 md:mb-14 md:mt-12">
    <h1 class="terminal-title text-2xl font-bold sm:text-3xl lg:text-5xl">
      <span class="terminal-prompt">&gt;</span>
      <span class="terminal-text">{{ title }}</span>
      <span class="terminal-cursor" aria-hidden="true"></span>
    </h1>
    <p class="terminal-subtitle mt-5 text-sm tracking-wide md:text-base">
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
