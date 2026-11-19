<!--
  The tools page: how Robbe keeps his projects up to date, with the two Mac apps he
  built for it (src/tools.ts). The project pages' vocabulary (the article is a
  .detail-page too): bands far apart, the 5 : 7 split, the numbered index, chips and
  screenshots that open in the lightbox.

  First screen: the title and the intro, with the list of the tools beside it from
  1024px (each a link to its section, under it below 1024px). Then a band per tool: its
  name, tagline and status, its window on the right (below the status on smaller
  screens), what it is and why I built it, what it's made with, and what it does as a
  numbered index. At the end, the way on to the projects.

  Its styles are global, in src/assets/tools-page.css, like project-page.css's: the
  prerendered HTML links only the main stylesheet.
-->
<template>
  <article ref="root" class="detail-page tools-page">
    <div class="project-page mx-auto max-w-screen-2xl px-6">
      <header class="tools-hero">
        <div class="tools-hero-intro">
          <h1 class="hero-in terminal-title text-3xl font-bold sm:text-4xl xl:text-5xl" style="--i: 0">
            <span class="terminal-prompt">&gt;</span>
            <span class="terminal-text">{{ $t('tools.title').toLowerCase() }}</span>
            <span class="terminal-cursor" aria-hidden="true"></span>
          </h1>
          <p class="hero-in terminal-subtitle mt-2 text-sm tracking-wide md:text-base" style="--i: 1">
            <span class="opacity-50">$</span> <TerminalCommand text="cat ./tools.md" />
          </p>
          <p class="hero-in hero-tagline" style="--i: 2">{{ $t('tools.tagline') }}</p>
          <p class="hero-in project-text tools-intro" style="--i: 3">{{ $t('tools.intro') }}</p>
        </div>

        <!-- The tools on this page, each a link to its section -->
        <nav class="hero-in tools-list" style="--i: 4" :aria-label="$t('tools.listLabel')">
          <ol>
            <li v-for="(tool, i) in list" :key="tool.id">
              <a class="tools-link" :href="`#${tool.id}`">
                <span class="index-n" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="tools-link-main">
                  <span class="tools-link-name">{{ tool.name }}</span>
                  <span class="tools-link-role">{{ tool.role }}</span>
                  <span class="tools-link-meta">{{ tool.platform }} · v{{ tool.version }}</span>
                </span>
                <ArrowDown class="tools-link-go" aria-hidden="true" />
              </a>
            </li>
          </ol>
        </nav>
      </header>

      <section
        v-for="(tool, i) in list"
        :id="tool.id"
        :key="tool.id"
        class="project-band tool"
        :aria-labelledby="`${tool.id}-title`"
      >
        <div class="tool-grid">
          <div class="tool-head reveal">
            <h2 :id="`${tool.id}-title`" class="project-h2 tool-name">{{ tool.name }}</h2>
            <p class="tool-tagline">{{ tool.tagline }}</p>
            <div class="project-status tool-status">
              <span class="status-badge tool-version">v{{ tool.version }}</span>
              <span class="status-note">
                <Laptop class="h-3.5 w-3.5" aria-hidden="true" />
                {{ tool.platform }}
              </span>
              <a
                v-if="tool.repository"
                class="live-link"
                :href="tool.repository"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github class="h-3.5 w-3.5" aria-hidden="true" />
                {{ $t('tools.viewOnGithub') }}
                <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <span v-else class="status-note">
                <Lock class="h-3.5 w-3.5" aria-hidden="true" />
                {{ $t('tools.private') }}
              </span>
            </div>
          </div>

          <!-- A real capture of its window. The first is the largest paint: not lazy. -->
          <div class="tool-shot reveal">
            <ProjectShot
              v-bind="tool.shot"
              kind="app"
              :url="tool.shot.caption"
              :sizes="SHOT_SIZES.wide"
              :eager="i === 0"
              :priority="i === 0"
              @click="openShot(i)"
            />
          </div>

          <div class="tool-body reveal">
            <p class="project-text">{{ tool.about }}</p>
            <template v-if="tool.why.length">
              <h3 class="project-label tool-label">{{ $t('tools.whyTitle') }}</h3>
              <p v-for="text in tool.why" :key="text" class="project-text tool-why">{{ text }}</p>
            </template>
            <h3 class="project-label tool-label">{{ $t('project.builtWith') }}</h3>
            <ul class="project-chips">
              <li v-for="part in tool.stack" :key="part" class="tag-pill">{{ part }}</li>
            </ul>
          </div>
        </div>

        <div class="tool-features">
          <h3 class="project-label reveal">{{ $t('tools.featuresTitle') }}</h3>
          <ProjectIndex :items="tool.features" :level="4" />
        </div>
      </section>

      <nav class="project-band tools-end" :aria-label="$t('tools.viewProjects')">
        <router-link class="project-all group reveal" :to="$lp('/projects')">
          <span class="project-all-dots" aria-hidden="true">./</span>
          <span>{{ $t('tools.viewProjects') }}</span>
          <ArrowRight class="link-arrow h-4 w-4" aria-hidden="true" />
        </router-link>
      </nav>
    </div>

    <ImageLightbox v-model="lightbox" :images="shots" />
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown, ArrowRight, ExternalLink, Github, Laptop, Lock } from 'lucide-vue-next'
import ImageLightbox, { type LightboxImage } from '../components/ImageLightbox.vue'
import ProjectIndex from '../components/project/ProjectIndex.vue'
import ProjectShot from '../components/project/ProjectShot.vue'
import { SHOT_SIZES } from '../images'
import { watchReveal } from '../reveal'
import { tools } from '../tools'

const { t } = useI18n({ useScope: 'global' })

const list = computed(() => tools(t))

/** Both windows in the lightbox, in the page's order */
const shots = computed<LightboxImage[]>(() =>
  list.value.map(({ shot: { src, alt, caption } }) => ({ src, alt, caption })),
)
const lightbox = ref<number | null>(null)
const openShot = (index: number) => (lightbox.value = index)

const root = ref<HTMLElement | null>(null)
let stopReveal = () => {}
onMounted(() => {
  if (root.value) stopReveal = watchReveal(root.value)
})
onBeforeUnmount(() => stopReveal())
</script>
