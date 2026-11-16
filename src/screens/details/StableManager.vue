<template>
  <article class="detail-page fade-out pb-10">
    <div class="mx-auto max-w-screen-xl px-6 pt-10">
      <!-- Header -->
      <header class="text-center">
        <h1 class="hero-in terminal-title justify-center text-2xl font-bold sm:text-3xl lg:text-5xl" style="--i: 0">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('stableManager.title') }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="hero-in terminal-subtitle mt-3 text-sm tracking-wide md:text-base" style="--i: 1">
          <span class="opacity-50">$</span> <TerminalCommand text="cat ./stable-manager-project.md" />
        </p>

        <div class="hero-in mt-5 flex flex-wrap items-center justify-center gap-2" style="--i: 2">
          <span class="status-badge">{{ $t('stableManager.privateBadge') }}</span>
          <span class="status-note">
            <Lock class="h-3.5 w-3.5" aria-hidden="true" />
            {{ $t('stableManager.privateNote') }}
          </span>
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
              <span class="shot-url">Stable Manager</span>
            </span>
            <ShotPicture
              src="/stable-manager-home.jpg"
              :alt="$t('stableManager.alt')"
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
              src="/stable-manager-mobile.jpg"
              :alt="$t('stableManager.alt')"
              width="470"
              height="800"
              :sizes="SHOT_SIZES.phone"
              loading="eager"
            />
          </ShotGlare>
        </button>
      </div>

      <div class="pt-4 md:mx-10">
        <!-- Overview -->
        <h2 class="section-heading reveal">{{ $t('stableManager.overview') }}</h2>
        <div class="reveal overview-card mb-14 px-6 py-8 md:px-8">
          <h3 class="overview-label">{{ $t('stableManager.about') }}</h3>
          <p class="text-lg leading-relaxed" style="color: var(--color-text-secondary)">
            {{ $t('stableManager.aboutText') }}
          </p>
        </div>

        <!-- Features -->
        <h2 class="section-heading reveal">{{ $t('stableManager.featuresTitle') }}</h2>
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
            <h3 class="overview-label">{{ $t('stableManager.languages') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackLanguages" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
          <div class="reveal overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('stableManager.tools') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in stackTools" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
        </div>

        <RepoActivity project="stableManager" :label="$t('stableManager.repoApp')" />

        <!-- The Drupal version: an open-source module, and recipes that rebuild this app with it -->
        <section class="mb-14" aria-labelledby="drupal-title">
          <h2 id="drupal-title" class="section-heading reveal">{{ $t('stableManager.drupalTitle') }}</h2>

          <div class="drupal-intro mb-6">
            <div class="reveal overview-card px-6 py-8 md:px-8">
              <h3 class="overview-label">{{ $t('stableManager.drupalName') }}</h3>
              <div class="mb-5 flex flex-wrap items-center gap-2">
                <span class="status-badge">{{ $t('stableManager.openSourceBadge') }}</span>
                <a class="live-link" :href="DRUPAL_REPO" target="_blank" rel="noopener noreferrer">
                  <Github class="h-3.5 w-3.5" aria-hidden="true" />
                  {{ $t('stableManager.viewOnGithub') }}
                  <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <router-link class="live-link" :to="$lp('/drupal')">
                  <DrupalIcon class="h-3.5 w-3.5" />
                  {{ $t('stableManager.drupalContributions') }}
                  <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
                </router-link>
              </div>
              <p class="text-lg leading-relaxed" style="color: var(--color-text-secondary)">
                {{ $t('stableManager.drupalIntro') }}
              </p>
            </div>

            <!-- A real screenshot of the demo site (the stable_manager_demo recipe) -->
            <button
              type="button"
              class="reveal shot shot-drupal"
              :aria-label="$t('aria.openScreenshot', { name: shotList[2].caption })"
              @click="lightboxIndex = 2">
              <ShotGlare>
                <span class="shot-bar" aria-hidden="true">
                  <span class="shot-dot"></span>
                  <span class="shot-dot"></span>
                  <span class="shot-dot"></span>
                  <span class="shot-url">Stable Manager in Drupal</span>
                </span>
                <ShotPicture
                  src="/shared-costs-home.jpg"
                  :alt="$t('stableManager.drupalAlt')"
                  width="1600"
                  height="1000"
                  :sizes="SHOT_SIZES.desktop"
                  loading="lazy"
                />
              </ShotGlare>
            </button>
          </div>

          <ul class="drupal-points mb-6">
            <li v-for="point in drupalPoints" :key="point.title" class="drupal-point reveal">
              <component :is="point.icon" class="drupal-point-icon" aria-hidden="true" />
              <div>
                <h3 class="feature-title">{{ point.title }}</h3>
                <p class="feature-text">{{ point.text }}</p>
              </div>
            </li>
          </ul>

          <div class="reveal overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('stableManager.drupalStack') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in drupalStack" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
        </section>

        <!-- Stays on the page: the panel beside the content holds the app's -->
        <RepoActivity
          project="sharedCosts"
          :repository="DRUPAL_REPO"
          :label="$t('stableManager.repoDrupal')"
          :float="false"
        />

        <div class="reveal mt-4 inline-block">
          <router-link class="group flex items-center gap-2" :to="$lp('/projects')">
            <span class="text-sm" style="color: var(--color-accent); opacity: 0.6">./</span>
            <span
              class="font-medium transition-colors"
              style="color: var(--color-accent); font-family: var(--font-mono)"
              >{{ $t('stableManager.viewOther') }}</span
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
import DrupalIcon from '../../components/DrupalIcon.vue'
import ShotGlare from '../../components/ShotGlare.vue'
import ShotPicture from '../../components/ShotPicture.vue'
import { SHOT_SIZES } from '../../images'
import { watchReveal } from '../../reveal'
import {
  ArrowRight,
  Percent,
  Zap,
  WifiOff,
  BarChart3,
  Lock,
  FlaskConical,
  ChefHat,
  Coins,
  ExternalLink,
  Github,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-vue-next'

/** The Drupal version, open source */
const DRUPAL_REPO = 'https://github.com/RobbeSaelens/shared_costs'

export default defineComponent({
  components: { ArrowRight, DrupalIcon, ExternalLink, Github, GlowCard, Lock, ImageLightbox, RepoActivity, ShotGlare, ShotPicture },

  data() {
    return {
      SHOT_SIZES,
      DRUPAL_REPO,
      lightboxIndex: null as number | null,
      stopReveal: () => {},
      heroTags: ['Next.js 16', 'React 19', 'TypeScript', 'Prisma 7', 'PostgreSQL', 'PWA'],
      stackLanguages: ['TypeScript', 'Next.js 16', 'React 19', 'Tailwind CSS 4', 'Prisma 7', 'PostgreSQL 16'],
      stackTools: [
        'Better Auth',
        'shadcn/ui',
        'Recharts',
        'date-fns',
        'Vitest',
        'Docker',
        'Vercel',
      ],
      drupalStack: [
        'Drupal 11',
        'PHP 8.3+',
        'HTMX',
        'Views',
        'Recipes',
        'Twig/SDC',
        'Chart.js',
        'PHPUnit',
        'axe-core',
        'Playwright',
        'PHPStan',
        'GitHub Actions',
      ],
    }
  },

  computed: {
    shotList(): LightboxImage[] {
      return [
        { src: '/stable-manager-home.jpg', alt: this.$t('stableManager.alt') as string, caption: `Stable Manager — ${this.$t('projects.shotDesktop')}` },
        { src: '/stable-manager-mobile.jpg', alt: this.$t('stableManager.alt') as string, caption: `Stable Manager — ${this.$t('projects.shotMobile')}` },
        {
          src: '/shared-costs-home.jpg',
          alt: this.$t('stableManager.drupalAlt') as string,
          caption: `Stable Manager in Drupal — ${this.$t('projects.shotDashboard')}`,
        },
      ]
    },

    drupalPoints(): { icon: unknown; title: string; text: string }[] {
      const map = [
        ['Field', Coins],
        ['Recipes', ChefHat],
        ['App', LayoutDashboard],
        ['Quality', ShieldCheck],
      ] as const
      return map.map(([key, icon]) => ({
        icon: markRaw(icon),
        title: this.$t(`stableManager.drupal${key}`) as string,
        text: this.$t(`stableManager.drupal${key}Text`) as string,
      }))
    },

    features(): { icon: unknown; title: string; text: string }[] {
      const map = [
        ['Split', Percent],
        ['Quick', Zap],
        ['Offline', WifiOff],
        ['Insights', BarChart3],
        ['Auth', Lock],
        ['Quality', FlaskConical],
      ] as const
      return map.map(([key, icon]) => ({
        icon: markRaw(icon),
        title: this.$t(`stableManager.feature${key}`) as string,
        text: this.$t(`stableManager.feature${key}Text`) as string,
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
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.live-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

/* Touch devices get no hover cue: the Drupal capture is zoomable too (the desktop
   capture's mark is in project-page.css). */
@media (hover: none) {
  button.shot-drupal::after {
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
   Also in Drupal
   ============================================= */
/* The text and the screenshot side by side once both have room */
.drupal-intro {
  display: grid;
  gap: 1.5rem;
  justify-items: center;
}
.drupal-intro > .overview-card {
  justify-self: stretch;
}
@media (min-width: 1100px) {
  .drupal-intro {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    align-items: center;
  }
}
.shot-drupal {
  max-width: 720px;
}
@media (min-width: 1100px) {
  .shot-drupal {
    max-width: none;
  }
}

/* Four points, smaller than the app's feature cards: two by two once there is room */
.drupal-points {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  margin: 0 0 1.5rem;
  padding: 0;
  list-style: none;
}
@media (min-width: 640px) {
  .drupal-points {
    grid-template-columns: repeat(2, 1fr);
  }
}
.drupal-point {
  display: flex;
  gap: 0.875rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.drupal-point-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.1rem;
  color: var(--color-accent);
}
</style>
