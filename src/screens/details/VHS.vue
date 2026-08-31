<template>
  <article class="detail-page fade-out pb-10">
    <div class="mx-auto max-w-screen-xl px-4 pt-10 sm:px-6">
      <!-- Header -->
      <header class="text-center">
        <h1 class="terminal-title justify-center text-2xl font-bold sm:text-3xl lg:text-5xl">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('vhs.title') }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="terminal-subtitle mt-3 text-sm tracking-wide md:text-base">
          <span class="opacity-50">$</span> cat ./vhs-project.md
        </p>

        <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span class="status-badge">{{ $t('vhs.rebrandingBadge') }}</span>
          <span class="status-note">{{ $t('vhs.notLiveYet') }}</span>
        </div>

        <div class="mt-5 flex flex-wrap justify-center gap-2">
          <span v-for="tag in heroTags" :key="tag" class="tag-pill">{{ tag }}</span>
        </div>
      </header>

      <!-- Real screenshots of the running site -->
      <div class="shots">
        <button
          type="button"
          class="shot shot-desktop reveal"
          :aria-label="`Open ${shotList[0].caption} screenshot full screen`"
          @click="lightboxIndex = 0">
          <span class="shot-bar" aria-hidden="true">
            <span class="shot-dot"></span>
            <span class="shot-dot"></span>
            <span class="shot-dot"></span>
            <span class="shot-url">VHS Service</span>
          </span>
          <img
            src="/vhs-home.jpg"
            :alt="$t('vhs.alt')"
            width="1600"
            height="1000"
            loading="lazy"
          />
        </button>

        <button
          type="button"
          class="shot shot-phone reveal"
          :aria-label="`Open ${shotList[1].caption} screenshot full screen`"
          @click="lightboxIndex = 1">
          <span class="shot-notch" aria-hidden="true"></span>
          <img
            src="/vhs-mobile.jpg"
            :alt="$t('vhs.alt')"
            width="400"
            height="800"
            loading="lazy"
          />
        </button>
      </div>

      <div class="mx-5 pt-4 md:mx-10">
        <!-- Overview -->
        <h2 class="section-heading">{{ $t('vhs.overview') }}</h2>
        <div class="overview-card mb-14 px-6 py-8 md:px-8">
          <h3 class="overview-label">{{ $t('vhs.about') }}</h3>
          <p class="text-lg leading-relaxed" style="color: var(--color-text-secondary)">
            {{ $t('vhs.aboutText') }}
          </p>
        </div>

        <!-- Features -->
        <h2 class="section-heading">{{ $t('vhs.featuresTitle') }}</h2>
        <div class="feature-grid mb-14">
          <article v-for="f in features" :key="f.title" class="feature-card reveal">
            <component :is="f.icon" class="feature-icon" />
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-text">{{ f.text }}</p>
          </article>
        </div>



        <!-- Stack -->
        <div class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('vhs.languages') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackLanguages" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
          <div class="overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('vhs.tools') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackTools" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 inline-block">
          <router-link class="group flex items-center gap-2" to="/projects">
            <span class="text-sm" style="color: var(--color-accent); opacity: 0.6">./</span>
            <span
              class="font-medium transition-colors"
              style="color: var(--color-accent); font-family: var(--font-mono)"
              >{{ $t('vhs.viewOther') }}</span
            >
            <ArrowRight
              class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              style="color: var(--color-accent)"
            />
          </router-link>
        </div>
      </div>
    </div>

    <ImageLightbox v-model="lightboxIndex" :images="shotList" />
  </article>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue'
import ImageLightbox from '../../components/ImageLightbox.vue'
import {
  ArrowRight,
  Wand,
  Languages,
  Layers,
  Search,
  Mail,
  Image,
} from 'lucide-vue-next'

export default defineComponent({
  components: { ArrowRight, ImageLightbox },

  data() {
    return {
      lightboxIndex: null as number | null,
      observer: null as IntersectionObserver | null,
      revealFallback: 0 as unknown as ReturnType<typeof setTimeout>,
      heroTags: ['Next.js 16', 'React 19', 'TypeScript', 'GSAP', 'WebGL', 'i18n'],
      stackLanguages: ['TypeScript', 'Next.js 16', 'React 19', 'CSS', 'GSAP', 'Motion', 'OGL (WebGL)'],
      stackTools: [
        'Vercel',
        'Turbopack',
        'Lenis',
        'Resend',
        'Vercel Analytics',
        'Speed Insights',
        'Playwright',
        'ESLint',
      ],
    }
  },

  computed: {
    shotList(): { src: string; alt: string; caption: string }[] {
      return [
        { src: '/vhs-home.jpg', alt: this.$t('vhs.alt') as string, caption: 'VHS Service — desktop' },
        { src: '/vhs-mobile.jpg', alt: this.$t('vhs.alt') as string, caption: 'VHS Service — mobile' },
      ]
    },

    features(): { icon: unknown; title: string; text: string }[] {
      const map = [
        ['Motion', Wand],
        ['I18n', Languages],
        ['Services', Layers],
        ['Seo', Search],
        ['Forms', Mail],
        ['Gallery', Image],
      ] as const
      return map.map(([key, icon]) => ({
        icon: markRaw(icon),
        title: this.$t(`vhs.feature${key}`) as string,
        text: this.$t(`vhs.feature${key}Text`) as string,
      }))
    },
  },

  mounted() {
    const targets = [...this.$el.querySelectorAll('.reveal')] as Element[]

    // Content is visible by default and only hidden once the observer is armed,
    // so a missing or suspended IntersectionObserver can never leave it blank.
    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-visible'))
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            this.observer?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 },
    )

    targets.forEach((el) => {
      el.classList.add('reveal-armed')
      this.observer?.observe(el)
    })

    // Safety net for background tabs where callbacks never arrive.
    this.revealFallback = setTimeout(() => {
      targets.forEach((el) => el.classList.add('is-visible'))
    }, 1600)
  },

  beforeUnmount() {
    clearTimeout(this.revealFallback)
    this.observer?.disconnect()
  },
})
</script>

<style scoped>
/* =============================================
   Header
   ============================================= */
.terminal-title {
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.2;
}
@media (max-width: 640px) {
  .terminal-title {
    gap: 0.25rem;
  }
  .terminal-cursor {
    width: 0.4em;
    height: 0.8em;
  }
}
.terminal-prompt {
  color: var(--color-prompt);
  font-weight: 700;
  flex-shrink: 0;
}
.terminal-text {
  background: linear-gradient(135deg, var(--color-accent), var(--color-prompt));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.terminal-cursor {
  display: inline-block;
  width: 0.55em;
  height: 1.1em;
  background: var(--color-cursor);
  animation: blink 1s step-end infinite;
  border-radius: 1px;
  flex-shrink: 0;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.terminal-subtitle {
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
  overflow-x: auto;
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.7rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border-glow);
}
.status-note {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* =============================================
   Real screenshots
   ============================================= */
.shots {
  /* Mobile first: stack, with the phone shot on top because it is the one that
     stays legible at this width. Side by side only once there is room. */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin: 2rem auto 2.5rem;
}
@media (min-width: 900px) {
  .shots {
    flex-direction: row;
    align-items: flex-end;
    justify-content: center;
    gap: clamp(1rem, 4vw, 2.5rem);
    margin: 3rem auto 4rem;
  }
}

.shot {
  overflow: hidden;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}
/* The shots are buttons that open the lightbox. */
button.shot {
  display: block;
  position: relative;
  width: 100%;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: zoom-in;
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}
button.shot-phone {
  padding: 0.6rem;
}
@media (hover: hover) and (pointer: fine) {
  button.shot:hover {
    transform: translateY(-4px);
    border-color: var(--color-border-glow);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.16);
  }
}
button.shot:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.shot img {
  display: block;
  width: 100%;
  height: auto;
}

/* Browser chrome */
.shot-bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.85rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-hover);
}
.shot-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}
.shot-dot:nth-child(1) {
  background: #f87171;
}
.shot-dot:nth-child(2) {
  background: #facc15;
}
.shot-dot:nth-child(3) {
  background: #4ade80;
}
.shot-url {
  margin-left: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

.shot-desktop {
  max-width: 720px;
  order: 2;
}
@media (min-width: 900px) {
  .shot-desktop {
    flex: 1 1 640px;
    order: 0;
  }
}

/* Phone frame — shown on mobile too, where it reads better than the desktop
   capture, and sized so it stays close to life-size. */
.shot-phone {
  border-radius: 1.75rem;
  order: 1;
}
button.shot-phone {
  width: min(224px, 62%);
  padding: 0.6rem;
}
@media (min-width: 900px) {
  .shot-phone {
    order: 0;
  }
  button.shot-phone {
    flex: 0 0 190px;
    width: 190px;
  }
}

/* Touch devices get no hover cue, so mark the desktop capture as zoomable. */
@media (hover: none) {
  button.shot-desktop::after {
    content: '\2922';
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 9999px;
    font-size: 0.85rem;
    line-height: 1;
    color: #fff;
    background: rgba(0, 0, 0, 0.55);
    pointer-events: none;
  }
}
.shot-phone img {
  border-radius: 1.25rem;
}
.shot-notch {
  display: block;
  width: 40%;
  height: 5px;
  margin: 0 auto 0.5rem;
  border-radius: 9999px;
  background: var(--color-border);
}

/* =============================================
   Sections
   ============================================= */
.section-heading {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 1.25rem;
}
@media (min-width: 768px) {
  .section-heading {
    font-size: 2rem;
  }
}

.overview-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}
.overview-card:hover {
  border-color: var(--color-border-glow);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.04),
    0 0 0 1px var(--color-border-glow);
}
.overview-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-accent);
  margin-bottom: 0.875rem;
}

/* Features */
.feature-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}
@media (min-width: 640px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1100px) {
  .feature-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.feature-card {
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    transform 0.5s ease,
    opacity 0.5s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}
@media (hover: hover) and (pointer: fine) {
  .feature-card:hover {
    transform: translateY(-4px);
    border-color: var(--color-border-glow);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  }
}
.feature-icon {
  width: 1.35rem;
  height: 1.35rem;
  color: var(--color-accent);
  margin-bottom: 0.75rem;
}
.feature-title {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.4rem;
}
.feature-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

/* Scroll reveal */
/* Only hidden once JS has armed the observer — see mounted(). */
.reveal.reveal-armed {
  opacity: 0;
  transform: translateY(18px);
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .terminal-cursor {
    animation: none;
  }
  .reveal,
  .reveal.reveal-armed {
    opacity: 1;
    transform: none;
  }
}
</style>
