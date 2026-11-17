<!--
  The project pages' one template (src/screens/details/*.vue hand it their data).
  The work leads: the first screen is the whole pitch, the title, tagline, status and
  links, the overview and its tags on the left, in line with the header's logo, and the
  two screenshots as one picture on the right (the phone over the desktop capture).
  Below it, the proof in bands: what's in it as a numbered index, what it's built with
  beside how active its repository is, and a closing band with the next project's real
  screenshot, plus all projects. Phones: the screenshots right under the title, the
  index folded into rows that open (ProjectIndex.vue).

  A page's own block goes in a slot: `after-hero` (Scan2Talk's check-in) or
  `after-evidence` (Stable Manager's Drupal version). Its slot gets `open(i)`, which
  opens screenshot i in the lightbox (0 and 1 are the two at the top, then `more`).

  Its styles, and ProjectIndex's and ProjectShot's, are global, in
  src/assets/project-page.css: they lay out the prerendered page before the app runs.
-->
<template>
  <article ref="root" class="detail-page">
    <div class="project-page mx-auto max-w-screen-2xl px-6">
      <header class="hero">
        <div class="hero-intro">
          <h1 class="hero-in terminal-title text-3xl font-bold sm:text-4xl xl:text-5xl" style="--i: 0">
            <span class="terminal-prompt">&gt;</span>
            <span class="terminal-text">{{ project.name }}</span>
            <span class="terminal-cursor" aria-hidden="true"></span>
          </h1>
          <p class="hero-in terminal-subtitle mt-2 text-sm tracking-wide md:text-base" style="--i: 1">
            <span class="opacity-50">$</span> <TerminalCommand :text="`cat ./${project.file}`" />
          </p>
          <p class="hero-in hero-tagline" style="--i: 2">{{ $t(`projects.items.${project.id}.tagline`) }}</p>
          <div class="hero-in project-status hero-status" style="--i: 3">
            <span v-if="project.status.kind === 'live'" class="live-badge">
              <span class="live-dot" aria-hidden="true"></span>
              {{ project.status.label }}
            </span>
            <span v-else class="status-badge">{{ project.status.label }}</span>
            <span v-if="project.status.note" class="status-note">
              <Lock v-if="project.status.lock" class="h-3.5 w-3.5" aria-hidden="true" />
              {{ project.status.note }}
            </span>
            <a
              v-for="link in project.links"
              :key="link.href"
              class="live-link"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ link.label }}
              <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <!-- Real screenshots: one picture, the phone landing on the desktop just after it.
             Above the fold, so not lazy: the desktop one is the largest paint (LCP). -->
        <div class="hero-stage">
          <div class="hero-in stage-desktop" style="--i: 2">
            <ProjectShot
              v-bind="project.desktop"
              :url="project.url"
              :sizes="SHOT_SIZES.desktop"
              eager
              priority
              @click="openShot(0)"
            />
          </div>
          <div class="hero-in stage-phone" style="--i: 4">
            <ProjectShot v-bind="project.phone" kind="phone" :sizes="SHOT_SIZES.phone" eager @click="openShot(1)" />
          </div>
        </div>

        <div class="hero-more">
          <h2 class="sr-only">{{ $t('project.overview') }}</h2>
          <p class="hero-in project-text" style="--i: 4">{{ project.about }}</p>
          <ul class="hero-in project-chips hero-tags" style="--i: 5" :aria-label="$t('project.builtWith')">
            <li v-for="tag in project.tags" :key="tag" class="tag-pill">{{ tag }}</li>
          </ul>
        </div>
      </header>

      <slot name="after-hero" :open="openShot" />

      <section class="project-band" aria-labelledby="features-title">
        <h2 id="features-title" class="project-h2 reveal">{{ $t('project.featuresTitle') }}</h2>
        <ProjectIndex :items="project.features" />
      </section>

      <!-- The evidence: what it's built with, beside how active it is -->
      <div class="project-band project-split project-split--top">
        <section class="reveal" aria-labelledby="built-with-title">
          <h2 id="built-with-title" class="project-label">{{ $t('project.builtWith') }}</h2>
          <h3 class="stack-label">{{ $t('project.languages') }}</h3>
          <ul class="project-chips">
            <li v-for="t in project.languages" :key="t" class="tag-pill">{{ t }}</li>
          </ul>
          <h3 class="stack-label">{{ $t('project.tools') }}</h3>
          <ul class="project-chips">
            <li v-for="t in project.tools" :key="t" class="tag-pill">{{ t }}</li>
          </ul>
        </section>
        <RepoActivity :project="project.repo.key" :label="project.repo.label" />
      </div>

      <slot name="after-evidence" :open="openShot" />

      <!-- The way on: the next project (in the order of the projects page), as a picture.
           The picture only once the band is near: on a short page the browser's own lazy
           loading would fetch it with the screenshots at the top. -->
      <nav ref="end" class="project-band project-end" :aria-label="$t('projects.next')">
        <router-link class="project-next reveal" :to="{ name: $ln(next.route) }">
          <span class="next-text">
            <span class="next-label">{{ $t('projects.next') }}</span>
            <span class="next-name">
              <span class="terminal-prompt" aria-hidden="true">&gt;</span>
              {{ next.name }}
            </span>
            <span class="next-tagline">{{ $t(`projects.items.${next.id}.tagline`) }}</span>
            <ArrowRight class="next-go" aria-hidden="true" />
          </span>
          <span class="next-shot" aria-hidden="true">
            <ShotPicture
              v-if="nearEnd"
              :src="next.screenshot"
              :alt="$t(next.alt)"
              width="1600"
              height="1000"
              :sizes="SHOT_SIZES.next"
              loading="lazy"
            />
          </span>
        </router-link>
        <router-link class="project-all group reveal" :to="$lp('/projects')">
          <span class="project-all-dots" aria-hidden="true">./</span>
          <span>{{ $t('project.allProjects') }}</span>
          <ArrowRight class="link-arrow h-4 w-4" aria-hidden="true" />
        </router-link>
      </nav>
    </div>

    <ImageLightbox v-model="lightbox" :images="shots" />
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, ExternalLink, Lock } from 'lucide-vue-next'
import ImageLightbox, { type LightboxImage } from '../ImageLightbox.vue'
import RepoActivity from '../RepoActivity.vue'
import ShotPicture from '../ShotPicture.vue'
import ProjectIndex from './ProjectIndex.vue'
import ProjectShot from './ProjectShot.vue'
import { SHOT_SIZES } from '../../images'
import { nextProject } from '../../projects'
import { watchReveal } from '../../reveal'
import type { ProjectData } from './project'

const props = defineProps<{ project: ProjectData }>()

const next = computed(() => nextProject(props.project.id))

/** Every screenshot of the page in the lightbox: the two at the top, then `more` */
const shots = computed<LightboxImage[]>(() =>
  [props.project.desktop, props.project.phone, ...(props.project.more ?? [])].map(({ src, alt, caption }) => ({
    src,
    alt,
    caption,
  })),
)
const lightbox = ref<number | null>(null)
const openShot = (index: number) => (lightbox.value = index)

/** The next project's picture, from 600px before its band scrolls into view */
const end = ref<HTMLElement | null>(null)
const nearEnd = ref(false)
let endObserver: IntersectionObserver | undefined

const root = ref<HTMLElement | null>(null)
let stopReveal = () => {}
onMounted(() => {
  if (root.value) stopReveal = watchReveal(root.value)
  if (typeof IntersectionObserver === 'undefined' || !end.value) {
    nearEnd.value = true
    return
  }
  endObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      nearEnd.value = true
      endObserver?.disconnect()
    },
    { rootMargin: '0px 0px 600px 0px' },
  )
  endObserver.observe(end.value)
})
onBeforeUnmount(() => {
  stopReveal()
  endObserver?.disconnect()
})
</script>
