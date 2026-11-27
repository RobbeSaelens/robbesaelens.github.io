<template>
  <!-- Real screenshots of the live site at scan2talk.be -->
  <ProjectPage :project="project">
    <!-- Its own block: a one-minute film of the whole product, from the poster to the
         opvoeder, with the three steps it shows beside it -->
    <template #after-hero>
      <section class="project-band" aria-labelledby="film-title">
        <h2 id="film-title" class="project-h2 reveal">{{ $t('scan2talk.videoHeading') }}</h2>

        <div class="project-split">
          <div class="reveal">
            <h3 class="project-label">{{ checkIn.title }}</h3>
            <ol class="s2t-steps">
              <li v-for="(step, i) in checkIn.steps" :key="step.title" class="s2t-step">
                <span class="s2t-n" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
                <p class="s2t-step-title">{{ step.title }}</p>
                <p class="s2t-step-text">{{ step.text }}</p>
              </li>
            </ol>
          </div>

          <!-- The same player as the tools page (ToolVideo.vue): plays muted while in view,
               pauses out of view, with play / pause and sound buttons; never by itself with
               reduced motion. Recorded from the real app with a fictional student. -->
          <div class="s2t-film reveal">
            <ToolVideo :video="video" />
          </div>
        </div>
      </section>
    </template>
  </ProjectPage>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectPage from '../../components/project/ProjectPage.vue'
import ToolVideo from '../../components/tools/ToolVideo.vue'
import type { ToolVideo as Film } from '../../tools'
import { scan2talk, scan2talkCheckIn } from './data'

const { t } = useI18n({ useScope: 'global' })

const project = computed(() => scan2talk(t))

/** How a check-in works, in three steps: what the film shows, beside it */
const checkIn = computed(() => scan2talkCheckIn(t))

/** public/scan2talk-tour*.mp4; the poster's WebP copy comes from `npm run images` */
const video = computed<Film>(() => ({
  src: '/scan2talk-tour.mp4',
  small: '/scan2talk-tour-480.mp4',
  poster: '/img/scan2talk-tour-poster.webp',
  width: 1280,
  height: 720,
  title: t('scan2talk.videoTitle'),
  caption: t('scan2talk.videoCaption'),
  duration: 'PT58S',
  published: '2026-11-27',
}))
</script>

<style scoped>
/* The three steps the film shows, beside it (5 of 12 columns): a number and a hairline
   each, as the numbered index on the project pages has */
.s2t-steps {
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}
.s2t-step {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 0.875rem;
  padding: 1rem 0;
  border-top: 1px solid var(--color-border-glow);
}
.s2t-step:last-child {
  padding-bottom: 0;
}
.s2t-n {
  grid-row: 1 / 3;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.55;
  color: var(--color-accent);
}
.s2t-step-title {
  margin: 0;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-text-primary);
}
.s2t-step-text {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}
/* Never taller than the screen leaves room for (16 : 9, minus the header and the
   heading), so the film fits whole on short laptops too */
.s2t-film {
  max-width: calc((100svh - 12rem) * 16 / 9);
}
</style>
