<template>
  <div ref="root" class="drupal-page mx-auto w-full max-w-screen-2xl px-6 pb-12">
    <TerminalHeader :title="$t('drupal.title').toLowerCase()" subtitle="cat ./drupal-contributions.md" />

    <div class="drupal-top">
      <div class="drupal-intro hero-in" style="--i: 2">
        <i18n-t keypath="drupal.intro" tag="p" class="drupal-lead">
          <template #dynamate>
            <a class="text-link" href="https://www.dynamate.be/" target="_blank" rel="noopener noreferrer"
              >Dynamate</a
            >
          </template>
        </i18n-t>

        <div class="drupal-profiles">
          <a class="pill-link" :href="PROFILE" target="_blank" rel="noopener noreferrer">
            <DrupalIcon class="pill-icon" />
            {{ $t('drupal.profile') }}
            <ExternalLink class="pill-icon" aria-hidden="true" />
          </a>
          <a class="pill-link" :href="GITLAB_PROFILE" target="_blank" rel="noopener noreferrer">
            <Gitlab class="pill-icon" aria-hidden="true" />
            {{ $t('drupal.gitlab') }}
            <ExternalLink class="pill-icon" aria-hidden="true" />
          </a>
        </div>
      </div>

      <!-- The drop on its own stage beside the intro: it turns as the page scrolls -->
      <div class="drupal-stage hero-in" style="--i: 2" aria-hidden="true">
        <DrupalDrop3D class="drupal-drop" />
      </div>
    </div>

    <!-- The numbers: one tile each, in the order of the lists below -->
    <section class="stats hero-in" style="--i: 3" aria-labelledby="drupal-stats-title">
      <h2 id="drupal-stats-title" class="sr-only">{{ $t('drupal.statsTitle') }}</h2>
      <dl class="stats-numbers">
        <div v-for="stat in stats" :key="stat.key" class="stats-number">
          <span class="stats-badge" aria-hidden="true"><component :is="stat.icon" class="stats-icon" /></span>
          <component :is="stat.icon" class="stats-watermark" aria-hidden="true" />
          <dt>{{ $t(`drupal.stats.${stat.key}`) }}</dt>
          <dd>
            <CountUpNumber :key="`${selected ?? 'all'}-${stat.key}`" :value="stat.value" :format="formatNumber" />
          </dd>
        </div>
      </dl>
      <p class="stats-note">
        <RefreshCw class="stats-note-icon" aria-hidden="true" />
        <i18n-t keypath="drupal.asOf" tag="span">
          <template #date>
            <time class="whitespace-nowrap" :datetime="data.generatedAt">{{ longDay(data.generatedAt) }}</time>
          </template>
        </i18n-t>
      </p>
    </section>

    <!-- Where the contributions went: a small bar chart that filters the lists under it -->
    <section class="drupal-projects hero-in" style="--i: 4" aria-labelledby="drupal-projects-title">
      <div class="filter-head">
        <h2 id="drupal-projects-title" class="drupal-projects-title">{{ $t('drupal.projectsTitle') }}</h2>
        <p class="drupal-filter-note">
          <Transition name="note" mode="out-in">
            <a
              v-if="current"
              :key="current.id"
              class="text-link"
              :href="current.url"
              target="_blank"
              rel="noopener noreferrer"
              >{{ $t('drupal.onDrupalOrg', { project: current.name }) }}</a
            >
            <span v-else key="all">{{ $t('drupal.filterHint') }}</span>
          </Transition>
        </p>
      </div>
      <div role="group" aria-labelledby="drupal-projects-title">
        <ul class="drupal-chips">
          <li v-for="(project, i) in filterChips" :key="project.id ?? 'all'" :style="{ '--i': i }">
            <button
              type="button"
              class="chip"
              :class="{ 'is-on': selected === project.id, 'is-all': project.id === null }"
              :aria-pressed="selected === project.id ? 'true' : 'false'"
              :style="{ '--share': project.count / allCount }"
              @click="pick(project.id)"
            >
              <DrupalIcon v-if="project.id === null" class="chip-drop" />
              <span class="chip-name">{{ project.name }}</span>
              <span class="chip-count"
                ><span aria-hidden="true">{{ project.count }}</span
                ><span class="sr-only">, {{ $t('drupal.projectIssues', project.count) }}</span></span
              >
              <span class="chip-bar" aria-hidden="true"></span>
            </button>
          </li>
        </ul>
      </div>
      <p class="sr-only" aria-live="polite">{{ announcement }}</p>
    </section>

    <div class="drupal-lists">
      <div v-for="(column, c) in columns" :key="c" class="drupal-column">
        <GlowCard
          v-for="list in column"
          :key="list.key"
          as="section"
          class="panel reveal"
          :aria-labelledby="`drupal-${list.key}-title`"
        >
          <header class="panel-head">
            <component :is="list.icon" class="panel-icon" aria-hidden="true" />
            <h2 :id="`drupal-${list.key}-title`" class="panel-title">{{ $t(`drupal.${list.key}`) }}</h2>
            <span :key="`${selected}-${list.rows.length}`" class="panel-count" aria-hidden="true">{{ list.rows.length }}</span>
          </header>
          <p class="panel-intro">{{ $t(`drupal.${list.key}Text`) }}</p>

          <ul v-if="list.rows.length" :key="selected ?? 'all'" class="rows">
            <li v-for="(row, i) in list.rows" :key="row.url" class="rows-item" :style="{ '--d': `${Math.min(i, 8) * 40}ms` }">
              <a class="row" :href="row.url" target="_blank" rel="noopener noreferrer">
                <span class="badge" :class="`badge--${row.tone}`">{{ row.badge }}</span>
                <span class="row-main">
                  <span class="row-title">{{ row.title }}</span>
                  <span class="row-meta">{{ row.meta }}</span>
                </span>
                <ExternalLink class="row-arrow" aria-hidden="true" />
              </a>
            </li>
          </ul>
          <p v-else :key="selected ?? 'all'" class="panel-empty">
            {{ current ? $t('drupal.emptyFor', { project: current.name }) : $t('drupal.empty') }}
          </p>
        </GlowCard>
      </div>
    </div>

    <div class="reveal mt-10 inline-block">
      <router-link class="group flex items-center gap-2" :to="$lp('/projects')">
        <span class="text-sm" style="color: var(--color-accent); opacity: 0.6">./</span>
        <span
          class="font-medium transition-colors"
          style="color: var(--color-accent); font-family: var(--font-mono)"
          >{{ $t('drupal.viewProjects') }}</span
        >
        <ArrowRight
          class="link-arrow h-4 w-4 transition-transform duration-200"
          style="color: var(--color-accent)"
        />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowRight,
  Award,
  CircleDot,
  ExternalLink,
  GitMerge,
  Gitlab,
  MessageSquare,
  RefreshCw,
} from 'lucide-vue-next'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import TerminalHeader from '../components/TerminalHeader.vue'
import DrupalIcon from '../components/DrupalIcon.vue'
import DrupalDrop3D from '../components/DrupalDrop3D.vue'
import CountUpNumber from '../components/CountUpNumber.vue'
import GlowCard from '../components/GlowCard.vue'
import { watchReveal } from '../reveal'
import { drupalCreditsJsonLd } from '../seo/jsonld'
import { SITE_URL } from '../site'
import data from '../data/drupal.json'

/** From src/data/drupal.json: `npm run drupal`, and before every deploy. */
interface Issue {
  id: number
  title: string
  url: string
  project: string
  status: string
  priority: string
  category: string
  version: string | null
  created: string
  updated: string
}

const PROFILE = `https://www.drupal.org/u/${data.user}`
const GITLAB_PROFILE = `https://git.drupalcode.org/${data.user}`

const { t, locale } = useI18n({ useScope: 'global' })

// The credited contributions for search engines, next to the page's own JSON-LD (App.vue)
const route = useRoute()
useHead({
  script: () =>
    data.credits.length
      ? [
          {
            type: 'application/ld+json',
            key: 'drupal-credits-jsonld',
            innerHTML: JSON.stringify(drupalCreditsJsonLd(SITE_URL, route.path, data.credits, data.projects)),
          },
        ]
      : [],
})

const projects = data.projects as Record<string, { name: string; url: string } | undefined>
const projectName = (id: string) => projects[id]?.name ?? id
const created = data.issuesCreated as Issue[]
const joined = data.issuesJoined as Issue[]

// The projects he contributed to, most first: the issues he opened, took part in,
// was credited for or sent a merge request for (each issue counts once).
const projectChips = (() => {
  const issues: Record<string, Set<number>> = {}
  const add = (project: string, issue: number) => (issues[project] ??= new Set()).add(issue)
  for (const credit of data.credits) add(credit.project, credit.issue)
  for (const mr of data.mergeRequests) add(mr.project, mr.issue)
  for (const issue of [...created, ...joined]) add(issue.project, issue.id)
  return Object.entries(issues)
    .map(([id, set]) => ({ id, name: projectName(id), url: projects[id]?.url ?? PROFILE, count: set.size }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})()

// The chips filter the numbers and the lists to one project; "All" shows everything.
const selected = ref<string | null>(null)
const filterChips = computed(() => [
  { id: null as string | null, name: t('drupal.allProjects'), url: PROFILE, count: allCount },
  ...projectChips,
])
const current = computed(() => projectChips.find((p) => p.id === selected.value) ?? null)
const pick = (id: string | null) => (selected.value = id)
const only = <T extends { project: string }>(items: T[]) =>
  selected.value ? items.filter((item) => item.project === selected.value) : items
const allCount = new Set([
  ...data.credits.map((c) => c.issue),
  ...data.mergeRequests.map((m) => m.issue),
  ...[...created, ...joined].map((i) => i.id),
]).size
const announcement = computed(() =>
  current.value
    ? t('drupal.filtered', { project: current.value.name, count: current.value.count })
    : '',
)
const formatNumber = (n: number) => n.toLocaleString(locale.value === 'nl' ? 'nl-BE' : 'en-GB')

// Dates as in Belgium, also when prerendered on a server elsewhere
const tag = () => (locale.value === 'nl' ? 'nl-BE' : 'en-GB')
const date = (iso: string, month: 'short' | 'long') =>
  new Date(iso).toLocaleDateString(tag(), { day: 'numeric', month, year: 'numeric', timeZone: 'Europe/Brussels' })
const day = (iso: string) => date(iso, 'short')
const longDay = (iso: string) => date(iso, 'long')

/** Badge colours: still open, waiting for review, done, or closed without a fix. */
type Tone = 'open' | 'review' | 'done' | 'closed'
function tone(status: string): Tone {
  if (['fixed', 'closed-fixed', 'merged'].includes(status)) return 'done'
  if (['needs-review', 'rtbc', 'patch-to-be-ported'].includes(status)) return 'review'
  if (status.startsWith('closed') || status === 'locked') return 'closed'
  return 'open'
}

// In the order of the lists below, with their icons.
const stats = computed(() => [
  { key: 'opened', icon: markRaw(CircleDot) as Component, value: only(created).length },
  { key: 'credits', icon: markRaw(Award) as Component, value: only(data.credits).length },
  {
    key: 'merged',
    icon: markRaw(GitMerge) as Component,
    value: only(data.mergeRequests).filter((mr) => mr.state === 'merged').length,
  },
  { key: 'joined', icon: markRaw(MessageSquare) as Component, value: only(joined).length },
])

interface Row {
  url: string
  title: string
  meta: string
  badge: string
  tone: Tone
}

/** Project, kind, version, priority when it stands out, and a date. */
function issueRow(issue: Issue, when: 'opened' | 'updated'): Row {
  const meta = [
    projectName(issue.project),
    t(`drupal.category.${issue.category}`),
    issue.version,
    ['critical', 'major'].includes(issue.priority) ? t(`drupal.priority.${issue.priority}`) : null,
    t(`drupal.${when}`, { date: day(when === 'opened' ? issue.created : issue.updated) }),
  ]
  return {
    url: issue.url,
    title: issue.title,
    meta: meta.filter(Boolean).join(' · '),
    badge: t(`drupal.status.${issue.status}`),
    tone: tone(issue.status),
  }
}

const lists = computed(() => [
  { key: 'issuesOpened', icon: markRaw(CircleDot) as Component, rows: only(created).map((i) => issueRow(i, 'opened')) },
  {
    key: 'credits',
    icon: markRaw(Award) as Component,
    rows: only(data.credits).map(
      (credit): Row => ({
        url: credit.url,
        title: credit.title,
        meta: [projectName(credit.project), day(credit.date)].join(' · '),
        badge: t('drupal.credited'),
        tone: 'done',
      }),
    ),
  },
  {
    key: 'mergeRequests',
    icon: markRaw(GitMerge) as Component,
    rows: only(data.mergeRequests).map(
      (mr): Row => ({
        url: mr.url,
        title: mr.title,
        meta: [
          projectName(mr.project),
          mr.ref,
          mr.merged ? t('drupal.merged', { date: day(mr.merged) }) : t('drupal.opened', { date: day(mr.created) }),
        ].join(' · '),
        badge: t(`drupal.mrState.${mr.state}`),
        tone: tone(mr.state),
      }),
    ),
  },
  { key: 'issuesJoined', icon: markRaw(MessageSquare) as Component, rows: only(joined).map((i) => issueRow(i, 'updated')) },
])

// Two columns that stack on their own, so a short panel leaves no gap
// under it: the issues opened and the credits, then the merge requests and
// the issues taken part in (the same order as on a phone).
const columns = computed(() => [lists.value.slice(0, 2), lists.value.slice(2)])

const root = ref<HTMLElement | null>(null)
let stopReveal = () => {}
onMounted(() => {
  if (root.value) stopReveal = watchReveal(root.value)
})
onBeforeUnmount(() => stopReveal())
</script>

<style scoped>
/* Drupal's own blue as the page's accent, in place of the site's teal: links, numbers,
   icons, counts and the cards' glow. Both pass contrast as text on the page. */
.drupal-page {
  --color-accent: #0670b0;
  --color-accent-soft: rgba(6, 120, 190, 0.08);
  --color-border-glow: rgba(6, 120, 190, 0.35);
  --color-spotlight: rgba(6, 120, 190, 0.13);
}
.dark .drupal-page {
  --color-accent: #5ab4ee;
  --color-accent-soft: rgba(90, 180, 238, 0.09);
  --color-border-glow: rgba(90, 180, 238, 0.3);
  --color-spotlight: rgba(90, 180, 238, 0.18);
}

/* The title stays on one line on phones */
@media (max-width: 639px) {
  .drupal-page :deep(.terminal-title) {
    font-size: min(1.5rem, 6vw);
  }
}

/* =============================================
   Intro and numbers: side by side from 1024px
   ============================================= */
/* =============================================
   Top: the intro beside the drop's stage; under them the four number tiles, then the
   projects as a bar chart that filters the lists. Explicit columns, so a long project
   name wraps inside its bar instead of widening the page.
   ============================================= */
.drupal-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
@media (min-width: 1024px) {
  .drupal-top {
    grid-template-columns: minmax(0, 1fr) minmax(0, 26rem);
    gap: clamp(3rem, 6vw, 6rem);
    margin-bottom: 2.5rem;
  }
}
.drupal-intro {
  min-width: 0;
  max-width: 70ch;
}
.drupal-lead {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--color-text-primary);
}
@media (min-width: 1024px) {
  .drupal-lead {
    font-size: 1.25rem;
  }
}

/* The drop's stage: a soft blue light behind it, so it stands out in both themes */
.drupal-stage {
  position: relative;
  /* Its own layer under the sticky header: the 3D drop must never paint over it */
  z-index: 0;
  isolation: isolate;
  display: grid;
  place-items: center;
  align-self: start;
  width: 6.5rem;
  aspect-ratio: 1;
}
.drupal-stage::before {
  content: '';
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(6, 120, 190, 0.22), rgba(6, 120, 190, 0.06) 60%, transparent);
}
.drupal-drop {
  --drop-size: 80%;
}
@media (min-width: 640px) {
  .drupal-stage {
    width: 10rem;
    align-self: center;
  }
}
@media (min-width: 1024px) {
  .drupal-stage {
    width: min(100%, 16rem);
    justify-self: center;
  }
}

.text-link {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: var(--color-border-glow);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .text-link:hover {
    text-decoration-color: currentColor;
  }
}
.text-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Profile links: the same pills as the "View on GitHub" link on the project pages */
.drupal-profiles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.pill-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.25rem;
  padding: 0.25rem 0.85rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.12s ease-out;
}
@media (hover: hover) and (pointer: fine) {
  .pill-link:hover {
    border-color: var(--color-border-glow);
    background: var(--color-surface-hover);
  }
}
.pill-link:active {
  transform: scale(0.97);
}
.pill-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
.pill-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

/* =============================================
   The numbers: four tiles, 2 × 2 on a phone
   ============================================= */
.stats {
  margin-bottom: 3rem;
}
.stats-numbers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}
@media (min-width: 768px) {
  .stats-numbers {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }
}
.stats-number {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid var(--color-border);
  background:
    linear-gradient(160deg, var(--color-accent-soft), transparent 70%),
    var(--color-surface);
}
@media (min-width: 768px) {
  .stats-number {
    padding: 1.25rem 1.25rem 1.1rem;
  }
}
/* The icon twice: in a badge on top, and large and faint in the corner */
.stats-badge {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  margin-bottom: 0.5rem;
  border-radius: 0.65rem;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border-glow);
}
.stats-icon {
  width: 1.1rem;
  height: 1.1rem;
}
.stats-watermark {
  position: absolute;
  right: -0.9rem;
  bottom: -0.9rem;
  width: 5.5rem;
  height: 5.5rem;
  color: var(--color-accent);
  opacity: 0.07;
  pointer-events: none;
}
/* The number above its label */
.stats-number dd {
  order: -1;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-accent);
}
.stats-badge {
  order: -2;
}
@media (min-width: 1024px) {
  .stats-number dd {
    font-size: 3rem;
  }
}
.stats-number dt {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--color-text-secondary);
}
.stats-note {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0.85rem 0 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}
.stats-note-icon {
  width: 0.85rem;
  height: 0.85rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
}

/* =============================================
   The projects: a bar chart you pick from
   ============================================= */
.drupal-projects {
  margin-bottom: 2.5rem;
}
.filter-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem 1.5rem;
  margin-bottom: 0.85rem;
}
.drupal-projects-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
}
.drupal-filter-note {
  min-height: 1.25rem;
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.note-enter-active,
.note-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.note-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.note-leave-to {
  opacity: 0;
}
.drupal-chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr));
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.chip {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
  min-height: 2.75rem;
  padding: 0.55rem 0.75rem 0.85rem;
  border-radius: 0.75rem;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: left;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.12s ease-out;
}
@media (min-width: 640px) {
  .drupal-chips {
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  }
}
@media (hover: hover) and (pointer: fine) {
  .chip:not(.is-on):hover {
    border-color: var(--color-border-glow);
    background: var(--color-accent-soft);
  }
}
.chip:active {
  transform: scale(0.97);
}
.chip:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.chip.is-on {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  box-shadow: inset 0 0 0 1px var(--color-accent);
}
.chip-drop {
  width: 0.95rem;
  height: 0.95rem;
  color: var(--color-accent);
}
/* A project without a name in drupal.json shows its machine name: long, no spaces */
.chip-name {
  grid-column: 2;
  min-width: 0;
  overflow-wrap: anywhere;
}
.chip:not(.is-all) .chip-name {
  grid-column: 1 / 3;
}
.chip-count {
  grid-column: 3;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-accent);
}
/* Its share of all the issues, as a bar along the bottom; it grows in with the entrance */
.chip-bar {
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.45rem;
  height: 3px;
  border-radius: 3px;
  background: var(--color-border);
  overflow: hidden;
}
.chip-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--color-accent);
  opacity: 0.55;
  transform-origin: left;
  transform: scaleX(var(--share));
  animation: bar-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(0.35s + var(--i, 0) * 50ms);
  transition: opacity 0.2s ease;
}
.chip.is-on .chip-bar::after {
  opacity: 1;
}
@keyframes bar-in {
  from {
    transform: scaleX(0);
  }
}

/* =============================================
   The lists: two columns from 1024px
   ============================================= */
.drupal-lists,
.drupal-column {
  display: grid;
  gap: 1.5rem;
  align-content: start;
}
@media (min-width: 1024px) {
  .drupal-lists {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

.panel {
  container-type: inline-size;
  overflow: hidden;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}
@media (hover: hover) and (pointer: fine) {
  .panel:hover {
    border-color: var(--color-border-glow);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  }
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1.25rem 1.25rem 0;
}
.panel-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  color: var(--color-accent);
}
.panel-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.0625rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-text-primary);
  text-wrap: balance;
}
@media (min-width: 768px) {
  .panel-title {
    font-size: 1.1875rem;
  }
}
.panel-count {
  margin-left: auto;
  padding: 0.1rem 0.6rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border-glow);
}
/* A new count (another project picked) pops in */
.panel-count {
  animation: count-pop 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes count-pop {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
}
.panel-empty {
  animation: row-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-intro {
  margin: 0.4rem 0 0;
  padding: 0 1.25rem 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}
.panel-empty {
  margin: 0;
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* ── One row per item, the whole row a link ── */
.rows {
  margin: 0;
  padding: 0;
  list-style: none;
}
.rows-item {
  border-top: 1px solid var(--color-border);
}
/* Rows follow each other in once their panel has risen into view */
.panel.reveal-armed:not(.is-visible) .rows-item {
  opacity: 0;
}
.panel.is-visible .rows-item {
  opacity: 1;
  animation: row-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--reveal-delay, 0ms) + 150ms + var(--d));
}
@keyframes row-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
}

/* Narrow panel: badge and arrow on top, then the title. Wide: the badges get their own
   column, as wide as the widest one in the list (a subgrid), so the titles line up. */
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'badge arrow'
    'main main';
  align-items: center;
  gap: 0.5rem 0.75rem;
  padding: 0.9rem 1.25rem;
  outline: none;
  transition: background 0.2s ease;
}
@container (min-width: 34rem) {
  .rows {
    display: grid;
    grid-template-columns: minmax(5.5rem, max-content) minmax(0, 1fr) auto;
    column-gap: 1.25rem;
  }
  .rows-item,
  .row {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
  }
  .row {
    grid-template-areas: 'badge main arrow';
    align-items: start;
  }
  .row .badge {
    margin-top: 0.1rem;
    white-space: nowrap;
  }
  .row-arrow {
    margin-top: 0.2rem;
  }
}
/* A row is wide: on press it lights up rather than shrinks */
@media (hover: hover) and (pointer: fine) {
  .row:hover {
    background: var(--color-surface-hover);
  }
}
.row:active {
  background: var(--color-surface-hover);
}
.row:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-accent);
}
.row-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.row-title {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.45;
  color: var(--color-text-primary);
  overflow-wrap: anywhere;
  transition: color 0.2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .row:hover .row-title {
    color: var(--color-accent);
  }
}
.row-meta {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}
.row-arrow {
  grid-area: arrow;
  justify-self: end;
  width: 0.95rem;
  height: 0.95rem;
  color: var(--color-accent);
  opacity: 0.55;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.row:focus-visible .row-arrow {
  opacity: 1;
  transform: translate(2px, -2px);
}
@media (hover: hover) and (pointer: fine) {
  .row:hover .row-arrow {
    opacity: 1;
    transform: translate(2px, -2px);
  }
}

/* ── Status badges: colours from the theme tokens (terminal-theme.css) ── */
.badge {
  grid-area: badge;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: var(--badge-text);
  background: var(--badge-bg);
  border: 1px solid var(--badge-border);
}
.badge--open {
  --badge-text: var(--color-badge-open);
  --badge-bg: var(--color-badge-open-bg);
  --badge-border: var(--color-badge-open-border);
}
.badge--review {
  --badge-text: var(--color-badge-review);
  --badge-bg: var(--color-badge-review-bg);
  --badge-border: var(--color-badge-review-border);
}
.badge--done {
  --badge-text: var(--color-badge-done);
  --badge-bg: var(--color-badge-done-bg);
  --badge-border: var(--color-badge-done-border);
}
.badge--closed {
  --badge-text: var(--color-badge-closed);
  --badge-bg: var(--color-badge-closed-bg);
  --badge-border: var(--color-badge-closed-border);
}

@media (prefers-reduced-motion: reduce) {
  .panel.reveal-armed:not(.is-visible) .rows-item,
  .panel.is-visible .rows-item {
    opacity: 1;
    animation: none;
  }
  .panel-count,
  .panel-empty,
  .chip-bar::after {
    animation: none;
  }
  .pill-link,
  .chip,
  .chip-bar::after,
  .row,
  .row-arrow {
    transition: none;
  }
}
</style>
