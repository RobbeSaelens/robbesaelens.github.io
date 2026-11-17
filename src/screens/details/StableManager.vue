<template>
  <!-- Real screenshots of the running app -->
  <ProjectPage :project="project">
    <!-- Its own block: the Drupal version, an open-source module and recipes that rebuild
         this app, in the same pattern as the page (split, index, stack and activity) -->
    <template #after-evidence="{ open }">
      <section class="project-band" aria-labelledby="drupal-title">
        <h2 id="drupal-title" class="project-h2 reveal">{{ drupal.title }}</h2>

        <div class="project-split">
          <div class="reveal">
            <h3 class="project-label">{{ drupal.name }}</h3>
            <div class="project-status">
              <span class="status-badge">{{ drupal.badge }}</span>
              <a class="live-link" :href="drupal.repository" target="_blank" rel="noopener noreferrer">
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
            <p class="project-text mt-5">{{ drupal.intro }}</p>
          </div>

          <!-- A real screenshot of the demo site (the stable_manager_demo recipe) -->
          <div class="reveal">
            <ProjectShot v-bind="drupal.shot" url="Stable Manager in Drupal" :sizes="SHOT_SIZES.wide" @click="open(2)" />
          </div>
        </div>

        <div class="drupal-points">
          <ProjectIndex :items="drupal.points" pairs />
        </div>

        <div class="drupal-facts project-split project-split--top">
          <section class="reveal" aria-labelledby="drupal-stack-title">
            <h3 id="drupal-stack-title" class="project-label">{{ $t('stableManager.drupalStack') }}</h3>
            <ul class="project-chips">
              <li v-for="t in drupal.stack" :key="t" class="tag-pill">{{ t }}</li>
            </ul>
          </section>
          <RepoActivity project="sharedCosts" :repository="drupal.repository" :label="drupal.repoLabel" />
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
import { SHOT_SIZES } from '../../images'
import { stableManager, stableManagerDrupal } from './data'

const { t } = useI18n({ useScope: 'global' })

const project = computed(() => stableManager(t))

/** The Drupal version, open source */
const drupal = computed(() => stableManagerDrupal(t))
</script>

<style scoped>
.drupal-points {
  margin-top: 3rem;
}
.drupal-facts {
  margin-top: 3rem;
}
</style>
