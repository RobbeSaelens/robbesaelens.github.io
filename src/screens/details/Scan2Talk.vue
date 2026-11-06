<template>
  <article class="detail-page fade-out pb-10">
    <div class="mx-auto max-w-screen-xl px-4 pt-10 sm:px-6">
      <!-- Header -->
      <header class="text-center">
        <h1 class="hero-in terminal-title justify-center text-2xl font-bold sm:text-3xl lg:text-5xl" style="--i: 0">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('scan2talk.title') }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="hero-in terminal-subtitle mt-3 text-sm tracking-wide md:text-base" style="--i: 1">
          <span class="opacity-50">$</span> cat ./scan2talk-project.md
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

      <!-- Real screenshots of the live site at scan2talk.be -->
      <div class="hero-in shots" style="--i: 4">
        <button
          type="button"
          class="shot shot-desktop"
          :aria-label="`Open ${shotList[0].caption} screenshot full screen`"
          @click="lightboxIndex = 0">
          <span class="shot-bar" aria-hidden="true">
            <span class="shot-dot"></span>
            <span class="shot-dot"></span>
            <span class="shot-dot"></span>
            <span class="shot-url">scan2talk.be</span>
          </span>
          <img
            src="/scan2talk-home.jpg"
            :alt="$t('scan2talk.alt')"
            width="1600"
            height="1000"
            loading="lazy"
          />
        </button>

        <button
          type="button"
          class="shot shot-phone"
          :aria-label="`Open ${shotList[1].caption} screenshot full screen`"
          @click="lightboxIndex = 1">
          <span class="shot-notch" aria-hidden="true"></span>
          <img
            src="/scan2talk-mobile.jpg"
            :alt="$t('scan2talk.alt')"
            width="369"
            height="800"
            loading="lazy"
          />
        </button>
      </div>

      <div class="mx-5 pt-4 md:mx-10">
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
               Plays only while on screen; never on its own for reduced-motion users. -->
          <figure class="flow-phone reveal">
            <span class="shot-notch" aria-hidden="true"></span>
            <video
              ref="flowVideo"
              :aria-label="$t('scan2talk.flowVideo')"
              poster="/scan2talk-checkin-poster.jpg"
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
          <article v-for="f in features" :key="f.title" class="feature-card reveal">
            <component :is="f.icon" class="feature-icon" />
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-text">{{ f.text }}</p>
          </article>
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
import RepoActivity from '../../components/RepoActivity.vue'
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
  components: { ArrowRight, ExternalLink, ImageLightbox, RepoActivity },

  data() {
    return {
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
        { src: '/scan2talk-mobile.jpg', alt: this.$t('scan2talk.alt') as string, caption: 'scan2talk.be — mobile' },
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

/* Live badge + link */
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
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
.live-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background: var(--color-accent);
  animation: pulse-dot 1.8s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.75);
  }
}
.live-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  border: 1px solid var(--color-border);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}
.live-link:hover {
  border-color: var(--color-border-glow);
  background: var(--color-surface-hover);
  transform: translateY(-1px);
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
.flow-item:hover {
  border-color: var(--color-border-glow);
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

@media (prefers-reduced-motion: reduce) {
  .terminal-cursor,
  .live-dot {
    animation: none;
  }
}
</style>
