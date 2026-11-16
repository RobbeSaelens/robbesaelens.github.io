<template>
  <article class="detail-page fade-out pb-10">
    <div class="mx-auto max-w-screen-xl px-6 pt-10">
      <!-- Header -->
      <header class="text-center">
        <h1 class="hero-in terminal-title justify-center text-2xl font-bold sm:text-3xl lg:text-5xl" style="--i: 0">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('scan2talk.title') }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="hero-in terminal-subtitle mt-3 text-sm tracking-wide md:text-base" style="--i: 1">
          <span class="opacity-50">$</span> <TerminalCommand text="cat ./scan2talk-project.md" />
        </p>

        <div class="hero-in mt-5 flex flex-wrap items-center justify-center gap-2" style="--i: 2">
          <span class="live-badge">
            <span class="live-dot" aria-hidden="true"></span>
            {{ $t('scan2talk.liveBadge') }}
          </span>
          <a
            class="live-link"
            href="https://scan2talk.be"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('scan2talk.visitSite') }}
            <ExternalLink class="h-3.5 w-3.5" />
          </a>
        </div>

        <div class="hero-in mt-5 flex flex-wrap justify-center gap-2" style="--i: 3">
          <span v-for="tag in heroTags" :key="tag" class="tag-pill">{{ tag }}</span>
        </div>
      </header>

      <!-- Real screenshots of the live site at scan2talk.be.
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
              <span class="shot-url">scan2talk.be</span>
            </span>
            <ShotPicture
              src="/scan2talk-home.jpg"
              :alt="$t('scan2talk.alt')"
              width="1600"
              height="1000"
              :sizes="SHOT_SIZES.desktop"
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
            <ShotPicture
              src="/scan2talk-mobile.jpg"
              :alt="$t('scan2talk.alt')"
              width="738"
              height="1600"
              :sizes="SHOT_SIZES.phone"
              loading="eager"
            />
          </ShotGlare>
        </button>
      </div>

      <div class="pt-4 md:mx-10">
        <!-- Overview -->
        <h2 class="section-heading reveal">{{ $t('scan2talk.overview') }}</h2>
        <div class="reveal overview-card mb-14 px-6 py-8 md:px-8">
          <h3 class="overview-label">{{ $t('scan2talk.about') }}</h3>
          <p class="text-lg leading-relaxed" style="color: var(--color-text-secondary)">
            {{ $t('scan2talk.aboutText') }}
          </p>
        </div>

        <!-- Flow -->
        <h2 class="section-heading reveal">{{ $t('scan2talk.flowTitle') }}</h2>
        <div class="flow-wrap mb-14">
          <!-- A real check-in, recorded in the app's demo mode (nothing is saved).
               Plays only while on screen; never on its own for reduced-motion users.
               The poster is the WebP copy of scan2talk-checkin-poster.jpg (scripts/images.mjs):
               a poster takes one URL, and every browser this site supports shows WebP. -->
          <figure class="flow-phone reveal">
            <span class="shot-notch" aria-hidden="true"></span>
            <video
              ref="flowVideo"
              :aria-label="$t('scan2talk.flowVideo')"
              poster="/img/scan2talk-checkin-poster.webp"
              width="600"
              height="1298"
              muted
              loop
              playsinline
              preload="none"
              :controls="reduceMotion"
            >
              <source src="/scan2talk-checkin.webm" type="video/webm" />
              <source src="/scan2talk-checkin.mp4" type="video/mp4" />
            </video>
          </figure>

          <ol class="flow-list">
            <li v-for="(s, i) in flowSteps" :key="s.title" class="flow-item reveal">
              <span class="flow-index">{{ String(i + 1).padStart(2, '0') }}</span>
              <div>
                <h3 class="flow-title">{{ s.title }}</h3>
                <p class="flow-text">{{ s.text }}</p>
              </div>
            </li>
          </ol>
        </div>


        <!-- Features -->
        <h2 class="section-heading reveal">{{ $t('scan2talk.featuresTitle') }}</h2>
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
            <h3 class="overview-label">{{ $t('scan2talk.languages') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackLanguages" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
          <div class="reveal overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('scan2talk.tools') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackTools" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
        </div>

        <RepoActivity project="scan2talk" />

        <div class="reveal mt-4 inline-block">
          <router-link class="group flex items-center gap-2" :to="$lp('/projects')">
            <span class="text-sm" style="color: var(--color-accent); opacity: 0.6">./</span>
            <span
              class="font-medium transition-colors"
              style="color: var(--color-accent); font-family: var(--font-mono)"
              >{{ $t('scan2talk.viewOther') }}</span
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
import ShotPicture from '../../components/ShotPicture.vue'
import { SHOT_SIZES } from '../../images'
import { watchReveal } from '../../reveal'
import {
  ArrowRight,
  ExternalLink,
  QrCode,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Lock,
} from 'lucide-vue-next'

export default defineComponent({
  components: { ArrowRight, ExternalLink, GlowCard, ImageLightbox, RepoActivity, ShotGlare, ShotPicture },

  data() {
    return {
      SHOT_SIZES,
      lightboxIndex: null as number | null,
      stopReveal: () => {},
      videoObserver: null as IntersectionObserver | null,
      reduceMotion: false,
      heroTags: ['Laravel', 'Vue.js', 'Inertia.js', 'PWA', 'PostgreSQL', 'Chart.js'],
      stackLanguages: [
        'PHP 8.3',
        'Laravel 13',
        'Vue.js 3',
        'Inertia.js 2',
        'PostgreSQL',
        'Tailwind CSS 3',
        'Chart.js',
      ],
      stackTools: [
        'Laravel Cloud',
        'Vite 8',
        'Laravel Breeze',
        'Spatie Permissions',
        'Google2FA',
        'Simple QR Code',
        'Ziggy',
        'Larastan',
        'Pint',
      ],
    }
  },

  computed: {
    shotList(): { src: string; alt: string; caption: string }[] {
      return [
        { src: '/scan2talk-home.jpg', alt: this.$t('scan2talk.alt') as string, caption: 'scan2talk.be' },
        { src: '/scan2talk-mobile.jpg', alt: this.$t('scan2talk.alt') as string, caption: `scan2talk.be — ${this.$t('projects.shotMobile')}` },
      ]
    },

    flowSteps(): { title: string; text: string }[] {
      return [1, 2, 3].map((n) => ({
        title: this.$t(`scan2talk.flowStep${n}`) as string,
        text: this.$t(`scan2talk.flowStep${n}Text`) as string,
      }))
    },
    features(): { icon: unknown; title: string; text: string }[] {
      const map = [
        ['Qr', QrCode],
        ['Chat', MessageSquare],
        ['Dashboard', BarChart3],
        ['Roles', ShieldCheck],
        ['Pwa', Smartphone],
        ['Privacy', Lock],
      ] as const
      return map.map(([key, icon]) => ({
        icon: markRaw(icon),
        title: this.$t(`scan2talk.feature${key}`) as string,
        text: this.$t(`scan2talk.feature${key}Text`) as string,
      }))
    },
  },

  mounted() {
    this.watchFlowVideo()

    this.stopReveal = watchReveal(this.$el)
  },

  beforeUnmount() {
    this.stopReveal()
    this.videoObserver?.disconnect()
  },

  methods: {
    /** Plays the check-in video while it is on screen. */
    watchFlowVideo() {
      const video = this.$refs.flowVideo as HTMLVideoElement | undefined
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!video || this.reduceMotion || typeof IntersectionObserver === 'undefined') return

      this.videoObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) video.play().catch(() => {})
          else video.pause()
        },
        { threshold: 0.35 },
      )
      this.videoObserver.observe(video)
    },
  },
})
</script>

<style scoped>
/* Flow: the recorded check-in next to the steps */
.flow-wrap {
  display: grid;
  gap: 2rem;
  justify-items: center;
}
@media (min-width: 900px) {
  .flow-wrap {
    grid-template-columns: 250px minmax(0, 1fr);
    align-items: center;
    gap: 3rem;
  }
}
.flow-phone {
  width: min(250px, 72%);
  margin: 0;
  padding: 0.6rem;
  border-radius: 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}
@media (min-width: 900px) {
  .flow-phone {
    width: 100%;
  }
}
.flow-phone video {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1.25rem;
  background: #e8f6f5;
}
.flow-list {
  display: grid;
  gap: 1rem;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}
.flow-item {
  display: flex;
  gap: 0.85rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    transform 0.5s ease,
    opacity 0.5s ease,
    border-color 0.3s ease;
}
@media (hover: hover) and (pointer: fine) {
  .flow-item:hover {
    border-color: var(--color-border-glow);
  }
}
.flow-index {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-accent);
}
.flow-title {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.3rem;
}
.flow-text {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
}
</style>
