<template>
  <!-- Zero-height marker: once it scrolls out of view the header gets its border. -->
  <div ref="sentinel" class="header-sentinel" aria-hidden="true"></div>
  <header class="site-header" :class="{ 'is-scrolled': scrolled }">
    <nav class="mx-auto flex max-w-screen-2xl items-center px-6" :aria-label="$t('aria.mainNav')">
      <AppNavigation />
    </nav>
  </header>
</template>

<script lang="ts">
import AppNavigation from '../generic/AppNavigation.vue'

export default {
  components: {
    AppNavigation,
  },

  data() {
    return {
      scrolled: false,
      observer: null as IntersectionObserver | null,
    }
  },

  mounted() {
    if (typeof IntersectionObserver === 'undefined') return
    this.observer = new IntersectionObserver(([entry]) => {
      this.scrolled = !entry.isIntersecting
    })
    this.observer.observe(this.$refs.sentinel as Element)
  },

  beforeUnmount() {
    this.observer?.disconnect()
  },
}
</script>

<style>
.header-sentinel {
  height: 0;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: 1rem 0;
  border-bottom: 1px solid transparent;
  background: rgba(246, 246, 246, 0.82);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    padding 0.3s ease;
}
.dark .site-header {
  background: rgba(34, 34, 34, 0.82);
}

.site-header.is-scrolled {
  padding: 0.65rem 0;
  border-bottom-color: var(--color-border);
  box-shadow: 0 6px 24px -18px rgba(0, 0, 0, 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .site-header {
    transition: none;
  }
}
</style>
