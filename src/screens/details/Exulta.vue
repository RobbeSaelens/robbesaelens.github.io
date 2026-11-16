<template>
  <article class="detail-page pb-10 fade-out">
    <div class="mx-auto max-w-screen-xl px-6 pt-10">
      <header class="text-center">
        <h1 class="hero-in terminal-title justify-center text-2xl font-bold sm:text-3xl lg:text-5xl" style="--i: 0">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('exulta.title') }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="hero-in terminal-subtitle mt-3 text-sm tracking-wide md:text-base" style="--i: 1">
          <span class="opacity-50">$</span> <TerminalCommand text="cat ./exulta-project.md" />
        </p>
        <div class="hero-in mt-5 flex flex-wrap items-center justify-center gap-2" style="--i: 2">
          <span class="live-badge">
            <span class="live-dot" aria-hidden="true"></span>
            {{ $t('exulta.liveBadge') }}
          </span>
          <a class="live-link" href="https://exulta.be" target="_blank" rel="noopener noreferrer">
            {{ $t('exulta.visitSite') }}
            <ExternalLink class="h-3.5 w-3.5" />
          </a>
        </div>

        <div class="hero-in mt-5 flex flex-wrap justify-center gap-2" style="--i: 3">
          <span v-for="tag in heroTags" :key="tag" class="tag-pill">{{ tag }}</span>
        </div>
      </header>
      <!-- Real screenshots of the running v2.0 site -->
      <div class="hero-in shots" style="--i: 4">
        <button
          type="button"
          class="shot shot-desktop"
          :aria-label="`Open ${shotList[0].caption} screenshot full screen`"
          @click="lightboxIndex = 0">
          <ShotGlare>
            <span class="shot-bar" aria-hidden="true">
              <span class="shot-dot"></span>
              <span class="shot-dot"></span>
              <span class="shot-dot"></span>
              <span class="shot-url">exulta.be</span>
            </span>
            <img
              src="/exulta-home.jpg"
              :alt="$t('exulta.alt')"
              width="1600"
              height="1000"
              loading="lazy"
            />
          </ShotGlare>
        </button>

        <button
          type="button"
          class="shot shot-phone"
          :aria-label="`Open ${shotList[1].caption} screenshot full screen`"
          @click="lightboxIndex = 1">
          <ShotGlare radius="1.25rem">
            <span class="shot-notch" aria-hidden="true"></span>
            <img
              src="/exulta-mobile.jpg"
              :alt="$t('exulta.alt')"
              width="400"
              height="800"
              loading="lazy"
            />
          </ShotGlare>
        </button>
      </div>
      <div class="pt-4 md:mx-10">
        <!-- Overview -->
        <h2 class="section-heading reveal">{{ $t('exulta.overview') }}</h2>
        <div class="reveal overview-card mb-14 px-6 py-8 md:px-8">
          <h3 class="overview-label">{{ $t('exulta.about') }}</h3>
          <p class="text-lg leading-relaxed" style="color: var(--color-text-secondary)">
            {{ $t('exulta.aboutText') }}
          </p>
        </div>

        <!-- Features -->
        <h2 class="section-heading reveal">{{ $t('exulta.featuresTitle') }}</h2>
        <div class="feature-grid mb-14">
          <GlowCard v-for="f in features" :key="f.title" as="article" class="feature-card reveal">
            <component :is="f.icon" class="feature-icon" />
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-text">{{ f.text }}</p>
          </GlowCard>
        </div>

        <div class="mb-14 flex justify-center">
          <a
            class="live-link"
            href="https://exulta.be/tentcalculator"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('exulta.tryCalculator') }}
            <ExternalLink class="h-3.5 w-3.5" />
          </a>
        </div>

        <div class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="reveal overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('exulta.languages') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackLanguages" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
          <div class="reveal overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('exulta.tools') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackTools" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
        </div>

        <RepoActivity project="exulta" />

        <div class="mt-4 inline-block" style="color: var(--color-accent)">
          <router-link class="group flex items-center gap-2" :to="$lp('/projects')">
            <span class="text-sm" style="color: var(--color-accent); opacity: 0.6">./</span>
            <span
              class="font-medium transition-colors"
              style="color: var(--color-accent); font-family: var(--font-mono)"
              >{{ $t('exulta.viewOther') }}</span
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
import ImageLightbox, { type LightboxImage } from '../../components/ImageLightbox.vue'
import RepoActivity from '../../components/RepoActivity.vue'
import ShotGlare from '../../components/ShotGlare.vue'
import { watchReveal } from '../../reveal'
import {
  ArrowRight,
  ExternalLink,
  Package,
  Calculator,
  LayoutDashboard,
  Languages,
  Search,
  Gauge,
} from 'lucide-vue-next'

export default defineComponent({
  components: { ArrowRight, ExternalLink, GlowCard, ImageLightbox, RepoActivity, ShotGlare },

  data() {
    return {
      lightboxIndex: null as number | null,
      stopReveal: () => {},
      heroTags: ['Laravel 13', 'React 19', 'Inertia.js', 'Filament 5', 'Tailwind CSS 4', 'MySQL'],
      stackLanguages: [
        'PHP 8.4',
        'Laravel 13',
        'React 19',
        'Inertia.js 3',
        'Filament 5',
        'Tailwind CSS 4',
        'SCSS',
        'MySQL',
      ],
      stackTools: [
        'Vite 8',
        'GitHub Actions',
        'Playwright',
        'Lighthouse',
        'Spatie Media Library',
        'Spatie Backup',
        'Filament Shield',
        'Ziggy',
        'Pint',
      ],
    }
  },

  computed: {
    shotList(): LightboxImage[] {
      return [
        { src: '/exulta-home.jpg', alt: this.$t('exulta.alt') as string, caption: 'exulta.be' },
        { src: '/exulta-mobile.jpg', alt: this.$t('exulta.alt') as string, caption: 'exulta.be — mobile' },
      ]
    },

    features(): { icon: unknown; title: string; text: string }[] {
      const map = [
        ['Catalog', Package],
        ['Calculator', Calculator],
        ['Admin', LayoutDashboard],
        ['Content', Languages],
        ['Seo', Search],
        ['Perf', Gauge],
      ] as const
      return map.map(([key, icon]) => ({
        icon: markRaw(icon),
        title: this.$t(`exulta.feature${key}`) as string,
        text: this.$t(`exulta.feature${key}Text`) as string,
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
