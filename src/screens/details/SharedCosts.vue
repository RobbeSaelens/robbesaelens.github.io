<template>
  <article class="detail-page fade-out pb-10">
    <div class="mx-auto max-w-screen-xl px-4 pt-10 sm:px-6">
      <!-- Header -->
      <header class="text-center">
        <!-- A size down on phones (text-xl), so the longer name stays on one line -->
        <h1 class="hero-in terminal-title justify-center text-xl font-bold sm:text-3xl lg:text-5xl" style="--i: 0">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('sharedCosts.title') }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="hero-in terminal-subtitle mt-3 text-sm tracking-wide md:text-base" style="--i: 1">
          <span class="opacity-50">$</span> cat ./shared-costs-project.md
        </p>

        <!-- The one public repository in the portfolio: link it right away -->
        <div class="hero-in mt-5 flex flex-wrap items-center justify-center gap-2" style="--i: 2">
          <span class="status-badge">{{ $t('sharedCosts.openSourceBadge') }}</span>
          <a class="live-link" :href="REPO" target="_blank" rel="noopener noreferrer">
            <Github class="h-3.5 w-3.5" aria-hidden="true" />
            {{ $t('sharedCosts.viewOnGithub') }}
            <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div class="hero-in mt-5 flex flex-wrap justify-center gap-2" style="--i: 3">
          <span v-for="tag in heroTags" :key="tag" class="tag-pill">{{ tag }}</span>
        </div>
      </header>

      <!-- A real screenshot of the demo site (the stal_manager_demo recipe) -->
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
            <span class="shot-url">Stal Manager in Drupal</span>
          </span>
          <img
            src="/shared-costs-home.jpg"
            :alt="$t('sharedCosts.alt')"
            width="1600"
            height="1000"
            loading="lazy"
          />
        </button>
      </div>

      <div class="mx-5 pt-4 md:mx-10">
        <!-- Overview -->
        <h2 class="section-heading reveal">{{ $t('sharedCosts.overview') }}</h2>
        <div class="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div class="reveal overview-card px-6 py-8 md:px-8 lg:col-span-3">
            <h3 class="overview-label">{{ $t('sharedCosts.about') }}</h3>
            <p class="text-lg leading-relaxed" style="color: var(--color-text-secondary)">
              {{ $t('sharedCosts.aboutText') }}
            </p>
          </div>
          <div class="reveal overview-card px-6 py-8 md:px-8 lg:col-span-2">
            <h3 class="overview-label">{{ $t('sharedCosts.relationTitle') }}</h3>
            <i18n-t
              keypath="sharedCosts.relationText"
              tag="p"
              class="text-lg leading-relaxed"
              style="color: var(--color-text-secondary)"
            >
              <template #link>
                <router-link class="text-link" :to="{ name: $ln('StalManagerDetail') }">Stal Manager</router-link>
              </template>
            </i18n-t>
          </div>
        </div>

        <!-- Features -->
        <h2 class="section-heading reveal">{{ $t('sharedCosts.featuresTitle') }}</h2>
        <div class="feature-grid mb-10">
          <article v-for="f in features" :key="f.title" class="feature-card reveal">
            <component :is="f.icon" class="feature-icon" />
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-text">{{ f.text }}</p>
          </article>
        </div>

        <div class="reveal mb-14 flex justify-center">
          <a class="live-link" :href="`${REPO}#the-stal-manager-recipes`" target="_blank" rel="noopener noreferrer">
            <Github class="h-3.5 w-3.5" aria-hidden="true" />
            {{ $t('sharedCosts.tryDemo') }}
            <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <!-- Stack -->
        <div class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="reveal overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('sharedCosts.languages') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackLanguages" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
          <div class="reveal overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('sharedCosts.tools') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackTools" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
        </div>

        <RepoActivity project="sharedCosts" :repository="REPO" />

        <div class="reveal mt-4 inline-block">
          <router-link class="group flex items-center gap-2" :to="$lp('/projects')">
            <span class="text-sm" style="color: var(--color-accent); opacity: 0.6">./</span>
            <span
              class="font-medium transition-colors"
              style="color: var(--color-accent); font-family: var(--font-mono)"
              >{{ $t('sharedCosts.viewOther') }}</span
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
import ImageLightbox, { type LightboxImage } from '../../components/ImageLightbox.vue'
import RepoActivity from '../../components/RepoActivity.vue'
import { watchReveal } from '../../reveal'
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  Coins,
  ExternalLink,
  FlaskConical,
  Github,
  LayoutDashboard,
  Percent,
} from 'lucide-vue-next'

const REPO = 'https://github.com/RobbeSaelens/shared_costs'

export default defineComponent({
  components: { ArrowRight, ExternalLink, Github, ImageLightbox, RepoActivity },

  data() {
    return {
      REPO,
      lightboxIndex: null as number | null,
      stopReveal: () => {},
      heroTags: ['Drupal 11', 'PHP 8.3+', 'HTMX', 'Views', 'Recipes', 'Twig/SDC'],
      stackLanguages: ['PHP 8.3+', 'Drupal 11', 'Twig', 'SDC', 'HTMX', 'JavaScript', 'CSS', 'MariaDB', 'PostgreSQL', 'SQLite'],
      stackTools: [
        'Views',
        'Recipes',
        'Charts (Chart.js)',
        'Gin',
        'Admin Toolbar',
        'PHPUnit',
        'Selenium',
        'axe-core',
        'PHPStan',
        'PHP_CodeSniffer',
        'stylelint',
        'ESLint',
        'GitHub Actions',
        'DDEV',
      ],
    }
  },

  computed: {
    shotList(): LightboxImage[] {
      return [
        {
          src: '/shared-costs-home.jpg',
          alt: this.$t('sharedCosts.alt') as string,
          caption: 'Stal Manager in Drupal — dashboard',
        },
      ]
    },

    features(): { icon: unknown; title: string; text: string }[] {
      const map = [
        ['Field', Percent],
        ['Cents', Coins],
        ['Views', BarChart3],
        ['Recipes', ChefHat],
        ['Theme', LayoutDashboard],
        ['Quality', FlaskConical],
      ] as const
      return map.map(([key, icon]) => ({
        icon: markRaw(icon),
        title: this.$t(`sharedCosts.feature${key}`) as string,
        text: this.$t(`sharedCosts.feature${key}Text`) as string,
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

/* Status badge and the link to the repository */
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
.live-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.25rem;
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
.live-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

/* A link inside running text */
.text-link {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* =============================================
   Real screenshot
   ============================================= */
.shots {
  display: flex;
  justify-content: center;
  margin: 2rem auto 2.5rem;
}
@media (min-width: 900px) {
  .shots {
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
/* The shot is a button that opens the lightbox. */
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

/* One screenshot, no phone beside it: about as wide as the pair on the other pages. */
.shot-desktop {
  max-width: 880px;
}

/* Touch devices get no hover cue, so mark the capture as zoomable. */
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

@media (prefers-reduced-motion: reduce) {
  .terminal-cursor {
    animation: none;
  }
}
</style>
