<!--
  The tools page: how Robbe keeps his projects up to date, with the two Mac apps he
  built for it (src/tools.ts). Two chapters behind a switch, each its own page in all but
  the URL: the hash picks one (/tools#sift), and the page opens at its top with that
  tool shown. The article is a .detail-page, so it speaks the project pages' vocabulary
  (bands, labels, chips, screenshots that open in the lightbox, the "next" card).

  First screen: the title, one line, what maintaining the projects amounts to (the activity
  grid: every commit of the last year, ActivityHeatmap.vue), and the switch
  (ToolSwitch.vue), which sticks under the header. A chapter, in the tool's own colour
  (tools-page.css):
  - its name and icon, status chips, a headline and one sentence, then a few points with
    an icon each, beside its captures as a deck of cards (ToolShots.vue, CardSwap);
  - its story in motion: how an update runs (UpdatePipeline.vue), or why Sift exists
    (SiftStory.vue);
  - what it's made with, the other tool as a card, and the way on to the projects.

  Its styles are global, in src/assets/tools-page.css, like project-page.css's: the
  prerendered HTML links only the main stylesheet. That is also where the prerendered
  page shows the tool the URL's hash names, before the app runs.
-->
<template>
  <article ref="root" class="detail-page tools-page" :class="{ 'is-ready': ready }">
    <div class="project-page mx-auto max-w-screen-2xl px-6">
      <header class="tools-hero">
        <h1 class="hero-in terminal-title text-3xl font-bold sm:text-4xl xl:text-5xl" style="--i: 0">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('tools.title').toLowerCase() }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="hero-in terminal-subtitle mt-2 text-sm tracking-wide md:text-base" style="--i: 1">
          <span class="opacity-50">$</span> <TerminalCommand text="cat ./tools.md" />
        </p>
        <p class="hero-in hero-tagline" style="--i: 2">{{ $t('tools.tagline') }}</p>
        <!-- What maintaining them amounts to: every commit of the last year, per day -->
        <ActivityHeatmap class="tools-activity" :step="3" />
        <p class="hero-in tools-intro" style="--i: 4">{{ $t('tools.intro') }}</p>
      </header>

      <ToolSwitch class="hero-in" style="--i: 5" :tools="list" :active="active" @select="pick" />

      <section
        v-for="tool in list"
        :id="`${tool.id}-panel`"
        :key="tool.id"
        role="tabpanel"
        class="tool-chapter"
        :data-tool="tool.id"
        :aria-labelledby="`${tool.id}-title`"
        :hidden="tool.id !== active || undefined"
      >
        <div class="tool-intro">
          <div class="tool-head reveal">
            <h2 :id="`${tool.id}-title`" class="tool-name" tabindex="-1">
              <ToolIcon :tool="tool.id" class="tool-name-icon" />
              {{ tool.name }}
            </h2>
            <div class="project-status tool-status">
              <span class="status-badge tool-version">v{{ tool.version }}</span>
              <span class="status-note">
                <Laptop class="h-3.5 w-3.5" aria-hidden="true" />
                {{ tool.platform }}
              </span>
              <a v-if="tool.repository" class="live-link" :href="tool.repository" target="_blank" rel="noopener noreferrer">
                <Github class="h-3.5 w-3.5" aria-hidden="true" />
                {{ $t('tools.viewOnGithub') }}
                <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <span v-else class="status-note">
                <Lock class="h-3.5 w-3.5" aria-hidden="true" />
                {{ $t('tools.private') }}
              </span>
            </div>
            <p class="tool-headline">{{ tool.headline }}</p>
            <p class="project-text tool-summary">{{ tool.summary }}</p>
          </div>

          <div class="tool-shots reveal">
            <ToolShots :name="tool.name" :shots="tool.shots" :eager="tool.id === list[0].id" @open="openShot" />
          </div>

          <ul class="tool-points">
            <li v-for="point in tool.points" :key="point.text" class="tool-point reveal">
              <span class="tool-point-icon" aria-hidden="true"><component :is="ICONS[point.icon]" /></span>
              {{ point.text }}
            </li>
          </ul>
        </div>

        <section class="project-band tool-story" :aria-labelledby="`${tool.id}-story`">
          <h3 :id="`${tool.id}-story`" class="project-label reveal">{{ tool.story.title }}</h3>
          <UpdatePipeline v-if="tool.story.kind === 'pipeline'" :steps="tool.story.steps" :or="tool.story.or" />
          <SiftStory v-else :from="tool.story.from" :to="tool.story.to" :caption="tool.story.caption" />
        </section>

        <div class="project-band tool-end">
          <div class="tool-stack reveal">
            <h3 class="project-label">{{ $t('project.builtWith') }}</h3>
            <ul class="project-chips">
              <li v-for="part in tool.stack" :key="part" class="tag-pill">{{ part }}</li>
            </ul>
          </div>

          <!-- The way on: the other tool, as a card with its first capture, then the projects -->
          <nav class="project-end" :aria-label="$t('tools.nextTool')">
            <a
              v-for="other in list.filter((t) => t.id !== tool.id)"
              :key="other.id"
              class="project-next tool-next reveal"
              :data-tool="other.id"
              :href="`#${other.id}`"
              @click.prevent="pick(other.id, true)"
            >
              <span class="next-text">
                <span class="next-label">{{ $t('tools.nextTool') }}</span>
                <span class="next-name">
                  <ToolIcon :tool="other.id" class="next-icon" />
                  {{ other.name }}
                </span>
                <span class="next-tagline">{{ other.headline }}</span>
                <ArrowRight class="next-go" aria-hidden="true" />
              </span>
              <span class="next-shot" aria-hidden="true">
                <ShotPicture
                  :src="other.shots[0].src"
                  :alt="other.shots[0].alt"
                  :width="other.shots[0].width"
                  :height="other.shots[0].height"
                  :sizes="SHOT_SIZES.next"
                  loading="lazy"
                />
              </span>
            </a>
            <div class="project-end-links reveal">
              <router-link class="project-all group" :to="$lp('/projects')">
                <span class="project-all-dots" aria-hidden="true">./</span>
                <span>{{ $t('tools.viewProjects') }}</span>
                <ArrowRight class="link-arrow h-4 w-4" aria-hidden="true" />
              </router-link>
            </div>
          </nav>
        </div>
      </section>
    </div>

    <ImageLightbox v-model="lightbox" :images="shots" />
  </article>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, ExternalLink, Github, Laptop, Lock } from 'lucide-vue-next'
import ImageLightbox, { type LightboxImage } from '../components/ImageLightbox.vue'
import ShotPicture from '../components/ShotPicture.vue'
import ActivityHeatmap from '../components/tools/ActivityHeatmap.vue'
import SiftStory from '../components/tools/SiftStory.vue'
import { TOOL_ICONS as ICONS } from '../components/tools/icons'
import ToolIcon from '../components/tools/ToolIcon.vue'
import ToolShots from '../components/tools/ToolShots.vue'
import ToolSwitch from '../components/tools/ToolSwitch.vue'
import UpdatePipeline from '../components/tools/UpdatePipeline.vue'
import { SHOT_SIZES } from '../images'
import { watchReveal } from '../reveal'
import { toolOfHash, tools, type ToolId } from '../tools'


const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

const list = computed(() => tools(t))

/** The tool shown: the URL's hash picks it (none: the first) */
const active = ref<ToolId>(toolOfHash(route.hash))
const ready = ref(false)

// Back, forward, or a hash typed in the address bar
watch(
  () => route.hash,
  (hash) => (active.value = toolOfHash(hash)),
)

/**
 * Shows `id`, and says so in the URL (replaced: switching isn't a page to go back to).
 * When the switch is stuck under the header (the page is scrolled into a chapter), or
 * from the card at a chapter's end (`toTop`), the new chapter starts just under the
 * switch, at once; its title then takes the focus from that card.
 */
async function pick(id: ToolId, toTop = false) {
  if (id !== active.value) {
    active.value = id
    router.replace({ hash: `#${id}` })
  }
  await nextTick()
  const bar = root.value?.querySelector<HTMLElement>('.tool-switch-bar')
  const panel = document.getElementById(`${id}-panel`)
  if (!bar || !panel) return
  const below = bar.getBoundingClientRect().bottom + 24
  const top = panel.getBoundingClientRect().top
  if (toTop || top < below) window.scrollTo({ top: window.scrollY + top - below, behavior: 'instant' })
  if (toTop) document.getElementById(`${id}-title`)?.focus({ preventScroll: true })
}

/** The shown tool's captures in the lightbox, in their order */
const shots = computed<LightboxImage[]>(() =>
  (list.value.find((tool) => tool.id === active.value) ?? list.value[0]).shots.map(({ src, alt, caption }) => ({
    src,
    alt,
    caption,
  })),
)
const lightbox = ref<number | null>(null)
const openShot = (index: number) => (lightbox.value = index)

const root = ref<HTMLElement | null>(null)
let stopReveal = () => {}
onMounted(() => {
  ready.value = true
  if (root.value) stopReveal = watchReveal(root.value)
})
onBeforeUnmount(() => stopReveal())
</script>
