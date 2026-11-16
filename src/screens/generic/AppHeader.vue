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
}

/* Transparent at the top, so the animated background (SiteBackground.vue) runs
   through it. Once the page scrolls under it, a light frosted backing fades in (its
   opacity only) and keeps the nav readable over the content, still thin enough to
   show the background. The header keeps its height: animating it laid the whole page
   out again every frame, and the browser's scroll anchoring undid small scrolls near
   the top (the header flipped back and forth). */
.site-header::before {
  content: '';
  position: absolute;
  inset: 0 0 -1px 0;
  z-index: -1;
  pointer-events: none;
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 6px 24px -18px rgba(0, 0, 0, 0.35);
  background: rgba(246, 246, 246, 0.6);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.dark .site-header::before {
  background: rgba(34, 34, 34, 0.6);
}
.site-header.is-scrolled::before {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .site-header::before {
    transition: none;
  }
}
</style>
