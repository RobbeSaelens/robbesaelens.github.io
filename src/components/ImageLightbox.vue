<template>
  <Teleport v-if="mounted" to="body">
    <Transition name="lightbox">
      <div
        v-if="isOpen"
        ref="overlay"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="current?.alt || 'Screenshot'"
        tabindex="-1"
        @click.self="close"
        @keydown.esc.prevent="close"
        @keydown.left.prevent="step(-1)"
        @keydown.right.prevent="step(1)"
      >
        <button ref="closeBtn" class="lightbox-close" aria-label="Close" @click="close">
          <X class="h-5 w-5" />
        </button>

        <button
          v-if="images.length > 1"
          class="lightbox-nav lightbox-prev"
          aria-label="Previous image"
          @click.stop="step(-1)"
        >
          <ChevronLeft class="h-6 w-6" />
        </button>

        <figure class="lightbox-figure" @click.stop>
          <img :src="current.src" :alt="current.alt" class="lightbox-img" />
          <figcaption v-if="current.caption" class="lightbox-caption">
            {{ current.caption }}
            <span v-if="images.length > 1" class="lightbox-count">
              {{ index + 1 }} / {{ images.length }}
            </span>
          </figcaption>
        </figure>

        <button
          v-if="images.length > 1"
          class="lightbox-nav lightbox-next"
          aria-label="Next image"
          @click.stop="step(1)"
        >
          <ChevronRight class="h-6 w-6" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

export interface LightboxImage {
  src: string
  alt: string
  caption?: string
}

export default defineComponent({
  name: 'ImageLightbox',
  components: { X, ChevronLeft, ChevronRight },

  props: {
    images: {
      type: Array as PropType<LightboxImage[]>,
      required: true,
    },
    /** Index of the open image, or null when closed. */
    modelValue: {
      type: Number as PropType<number | null>,
      default: null,
    },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      // Teleport needs a real document, which prerendering does not have.
      mounted: false,
      lastFocused: null as HTMLElement | null,
    }
  },

  computed: {
    isOpen(): boolean {
      return this.modelValue !== null && this.images.length > 0
    },
    index(): number {
      return this.modelValue ?? 0
    },
    current(): LightboxImage {
      return this.images[this.index] ?? this.images[0]
    },
  },

  watch: {
    isOpen(open: boolean) {
      if (typeof document === 'undefined') return

      if (open) {
        this.lastFocused = document.activeElement as HTMLElement
        document.body.style.overflow = 'hidden'
        this.$nextTick(() => (this.$refs.overlay as HTMLElement | undefined)?.focus())
      } else {
        document.body.style.overflow = ''
        this.lastFocused?.focus?.()
        this.lastFocused = null
      }
    },
  },

  mounted() {
    this.mounted = true
  },

  beforeUnmount() {
    if (typeof document !== 'undefined') document.body.style.overflow = ''
  },

  methods: {
    close() {
      this.$emit('update:modelValue', null)
    },
    step(delta: number) {
      if (this.images.length < 2) return
      const next = (this.index + delta + this.images.length) % this.images.length
      this.$emit('update:modelValue', next)
    },
  },
})
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 6000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: clamp(1rem, 4vw, 3rem);
  background: rgba(4, 10, 12, 0.92);
  backdrop-filter: blur(6px);
  outline: none;
}

.lightbox-figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  max-width: 100%;
  max-height: 100%;
}

.lightbox-img {
  max-width: 100%;
  max-height: calc(100vh - 8rem);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.75rem;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
}

.lightbox-caption {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.72);
}
.lightbox-count {
  opacity: 0.6;
}

.lightbox-close,
.lightbox-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}
.lightbox-close:hover,
.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.18);
}
.lightbox-close:focus-visible,
.lightbox-nav:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.lightbox-close {
  position: absolute;
  top: clamp(0.75rem, 3vw, 1.5rem);
  right: clamp(0.75rem, 3vw, 1.5rem);
  width: 2.5rem;
  height: 2.5rem;
}

.lightbox-nav {
  flex: 0 0 auto;
  width: 2.75rem;
  height: 2.75rem;
}
@media (max-width: 640px) {
  .lightbox-nav {
    position: absolute;
    bottom: 1rem;
  }
  .lightbox-prev {
    left: 1rem;
  }
  .lightbox-next {
    right: 1rem;
  }
}

/* Transition */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.25s ease;
}
.lightbox-enter-active .lightbox-figure,
.lightbox-leave-active .lightbox-figure {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
.lightbox-enter-from .lightbox-figure,
.lightbox-leave-to .lightbox-figure {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .lightbox-enter-active,
  .lightbox-leave-active,
  .lightbox-enter-active .lightbox-figure,
  .lightbox-leave-active .lightbox-figure {
    transition: none;
  }
}
</style>
