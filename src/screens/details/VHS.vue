<template>
  <article class="detail-page fade-out pb-10">
    <div class="mx-auto max-w-screen-xl px-6 pt-10">
      <!-- Header -->
      <header class="text-center">
        <h1 class="hero-in terminal-title justify-center text-2xl font-bold sm:text-3xl lg:text-5xl" style="--i: 0">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('vhs.title') }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="hero-in terminal-subtitle mt-3 text-sm tracking-wide md:text-base" style="--i: 1">
          <span class="opacity-50">$</span> <TerminalCommand text="cat ./vhs-project.md" />
        </p>

        <div class="hero-in mt-5 flex flex-wrap items-center justify-center gap-2" style="--i: 2">
          <span class="status-badge">{{ $t('vhs.rebrandingBadge') }}</span>
          <span class="status-note">{{ $t('vhs.notLiveYet') }}</span>
        </div>

        <div class="hero-in mt-5 flex flex-wrap justify-center gap-2" style="--i: 3">
          <span v-for="tag in heroTags" :key="tag" class="tag-pill">{{ tag }}</span>
        </div>
      </header>

      <!-- Real screenshots of the running site.
           Above the fold, so not lazy: the desktop one is the largest paint (LCP). -->
      <div class="hero-in shots" style="--i: 4">
        <button
          type="button"
          class="shot shot-desktop"
          :aria-label="$t('aria.openScreenshot', { name: shotList[0].caption })"
          @click="lightboxIndex = 0">
          <ShotGlare>
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
              loading="eager"
              fetchpriority="high"
            />
          </ShotGlare>
        </button>

        <button
          type="button"
          class="shot shot-phone"
          :aria-label="$t('aria.openScreenshot', { name: shotList[1].caption })"
          @click="lightboxIndex = 1">
          <ShotGlare radius="1.25rem">
            <span class="shot-notch" aria-hidden="true"></span>
            <img
              src="/vhs-mobile.jpg"
              :alt="$t('vhs.alt')"
              width="400"
              height="800"
              loading="eager"
            />
          </ShotGlare>
        </button>
      </div>

      <div class="pt-4 md:mx-10">
        <!-- Overview -->
        <h2 class="section-heading reveal">{{ $t('vhs.overview') }}</h2>
        <div class="reveal overview-card mb-14 px-6 py-8 md:px-8">
          <h3 class="overview-label">{{ $t('vhs.about') }}</h3>
          <p class="text-lg leading-relaxed" style="color: var(--color-text-secondary)">
            {{ $t('vhs.aboutText') }}
          </p>
        </div>

        <!-- Features -->
        <h2 class="section-heading reveal">{{ $t('vhs.featuresTitle') }}</h2>
        <div class="feature-grid mb-14">
          <GlowCard v-for="f in features" :key="f.title" as="article" class="feature-card reveal">
            <component :is="f.icon" class="feature-icon" />
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-text">{{ f.text }}</p>
          </GlowCard>
        </div>



        <!-- Stack -->
        <div class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="reveal overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('vhs.languages') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackLanguages" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
          <div class="reveal overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('vhs.tools') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackTools" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
        </div>

        <RepoActivity project="vhs" />

        <div class="reveal mt-4 inline-block">
          <router-link class="group flex items-center gap-2" :to="$lp('/projects')">
            <span class="text-sm" style="color: var(--color-accent); opacity: 0.6">./</span>
            <span
              class="font-medium transition-colors"
              style="color: var(--color-accent); font-family: var(--font-mono)"
              >{{ $t('vhs.viewOther') }}</span
            >
            <ArrowRight
              class="link-arrow h-4 w-4 transition-transform duration-200"
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
import GlowCard from '../../components/GlowCard.vue'
import ImageLightbox from '../../components/ImageLightbox.vue'
import RepoActivity from '../../components/RepoActivity.vue'
import ShotGlare from '../../components/ShotGlare.vue'
import { watchReveal } from '../../reveal'
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
  components: { ArrowRight, GlowCard, ImageLightbox, RepoActivity, ShotGlare },

  data() {
    return {
      lightboxIndex: null as number | null,
      stopReveal: () => {},
      heroTags: ['Next.js 16', 'React 19', 'TypeScript', 'GSAP', 'Tailwind CSS', 'i18n'],
      stackLanguages: ['TypeScript', 'Next.js 16', 'React 19', 'Tailwind CSS 4', 'GSAP', 'Motion'],
      stackTools: [
        'Vercel',
        'Turbopack',
        'Lenis',
        'Resend',
        'Vercel Analytics',
        'Speed Insights',
        'Sentry',
        'Playwright',
        'ESLint',
      ],
    }
  },

  computed: {
    shotList(): { src: string; alt: string; caption: string }[] {
      return [
        { src: '/vhs-home.jpg', alt: this.$t('vhs.alt') as string, caption: `VHS Service — ${this.$t('projects.shotDesktop')}` },
        { src: '/vhs-mobile.jpg', alt: this.$t('vhs.alt') as string, caption: `VHS Service — ${this.$t('projects.shotMobile')}` },
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
    this.stopReveal = watchReveal(this.$el)
  },

  beforeUnmount() {
    this.stopReveal()
  },
})
</script>

<style scoped>
.status-note {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
