<template>
  <!-- Real screenshots of the running app -->
  <ProjectPage :project="project">
    <!-- Its own block: the Drupal version, an open-source module and recipes that rebuild
         this app, in the same pattern as the page (split, index, stack and activity) -->
    <template #after-evidence="{ open }">
      <section class="project-band" aria-labelledby="drupal-title">
        <h2 id="drupal-title" class="project-h2 reveal">{{ $t('stableManager.drupalTitle') }}</h2>

        <div class="project-split">
          <div class="reveal">
            <h3 class="project-label">{{ $t('stableManager.drupalName') }}</h3>
            <div class="project-status">
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
            <p class="project-text mt-5">{{ $t('stableManager.drupalIntro') }}</p>
          </div>

          <!-- A real screenshot of the demo site (the stable_manager_demo recipe) -->
          <div class="reveal">
            <ProjectShot v-bind="drupalShot" url="Stable Manager in Drupal" :sizes="SHOT_SIZES.wide" @click="open(2)" />
          </div>
        </div>

        <div class="drupal-points">
          <ProjectIndex :items="points" pairs />
        </div>

        <div class="drupal-facts project-split project-split--top">
          <section class="reveal" aria-labelledby="drupal-stack-title">
            <h3 id="drupal-stack-title" class="project-label">{{ $t('stableManager.drupalStack') }}</h3>
            <ul class="project-chips">
              <li v-for="t in drupalStack" :key="t" class="tag-pill">{{ t }}</li>
            </ul>
          </section>
          <RepoActivity project="sharedCosts" :repository="DRUPAL_REPO" :label="$t('stableManager.repoDrupal')" />
        </div>
      </section>
    </template>
  </ProjectPage>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight, ExternalLink, Github } from 'lucide-vue-next'
import DrupalIcon from '../../components/DrupalIcon.vue'
import RepoActivity from '../../components/RepoActivity.vue'
import ProjectIndex from '../../components/project/ProjectIndex.vue'
import ProjectPage from '../../components/project/ProjectPage.vue'
import ProjectShot from '../../components/project/ProjectShot.vue'
import { indexItems, type ProjectData, type ProjectShotData } from '../../components/project/project'
import { SHOT_SIZES } from '../../images'

/** The Drupal version, open source */
const DRUPAL_REPO = 'https://github.com/RobbeSaelens/shared_costs'

const { t } = useI18n({ useScope: 'global' })

const drupalShot = computed<ProjectShotData>(() => ({
  src: '/shared-costs-home.jpg',
  width: 1600,
  height: 1000,
  alt: t('stableManager.drupalAlt'),
  caption: `Stable Manager in Drupal — ${t('projects.shotDashboard')}`,
}))

const project = computed<ProjectData>(() => ({
  id: 'stable-manager',
  name: t('stableManager.title'),
  file: 'stable-manager-project.md',
  status: { kind: 'private', label: t('project.live'), note: t('stableManager.privateNote'), lock: true },
  links: [],
  about: t('stableManager.aboutText'),
  tags: ['Next.js 16', 'React 19', 'TypeScript', 'Prisma 7', 'PostgreSQL', 'PWA'],
  languages: ['TypeScript', 'Next.js 16', 'React 19', 'Tailwind CSS 4', 'Prisma 7', 'PostgreSQL 16'],
  tools: ['Better Auth', 'shadcn/ui', 'Recharts', 'date-fns', 'Vitest', 'Docker', 'Vercel'],
  url: 'Stable Manager',
  desktop: {
    src: '/stable-manager-home.jpg',
    width: 1600,
    height: 1000,
    alt: t('stableManager.alt'),
    caption: `Stable Manager — ${t('projects.shotDesktop')}`,
  },
  phone: {
    src: '/stable-manager-mobile.jpg',
    width: 470,
    height: 800,
    alt: t('stableManager.alt'),
    caption: `Stable Manager — ${t('projects.shotMobile')}`,
  },
  // The Drupal screenshot is the third in the lightbox: open(2)
  more: [drupalShot.value],
  features: indexItems(t, 'stableManager', 'feature', ['Split', 'Quick', 'Offline', 'Insights', 'Auth', 'Quality']),
  repo: { key: 'stableManager', label: t('stableManager.repoApp') },
}))

const points = computed(() => indexItems(t, 'stableManager', 'drupal', ['Field', 'Recipes', 'App', 'Quality']))

const drupalStack = [
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
]
</script>

<style scoped>
.drupal-points {
  margin-top: 3rem;
}
.drupal-facts {
  margin-top: 3rem;
}
</style>
