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

      <!-- The numbers, like the repository activity on the project pages -->
      <section class="stats hero-in" style="--i: 3" aria-labelledby="drupal-stats-title">
        <h2 id="drupal-stats-title" class="sr-only">{{ $t('drupal.statsTitle') }}</h2>
        <dl class="stats-numbers">
          <div v-for="stat in stats" :key="stat.key" class="stats-number">
            <dt>{{ $t(`drupal.stats.${stat.key}`) }}</dt>
            <dd>
              <component :is="stat.icon" class="stats-icon" aria-hidden="true" />
              {{ stat.value }}
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

      <!-- Where the contributions went: under the intro on wide screens -->
      <section class="drupal-projects hero-in" style="--i: 4" aria-labelledby="drupal-projects-title">
        <h2 id="drupal-projects-title" class="drupal-projects-title">{{ $t('drupal.projectsTitle') }}</h2>
        <ul class="drupal-chips">
          <li v-for="project in projectChips" :key="project.id">
            <a
              class="chip"
              :href="project.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="chip-name">{{ project.name }}</span>
              <span class="chip-count"
                ><span aria-hidden="true">{{ project.count }}</span
                ><span class="sr-only">, {{ $t('drupal.projectIssues', project.count) }}</span></span
              >
            </a>
          </li>
        </ul>
      </section>
    </div>

    <div class="drupal-lists">
      <div v-for="(column, c) in columns" :key="c" class="drupal-column">
        <section
          v-for="list in column"
          :key="list.key"
          class="panel reveal"
          :aria-labelledby="`drupal-${list.key}-title`"
        >
          <header class="panel-head">
            <component :is="list.icon" class="panel-icon" aria-hidden="true" />
            <h2 :id="`drupal-${list.key}-title`" class="panel-title">{{ $t(`drupal.${list.key}`) }}</h2>
            <span class="panel-count" aria-hidden="true">{{ list.rows.length }}</span>
          </header>
          <p class="panel-intro">{{ $t(`drupal.${list.key}Text`) }}</p>

          <ul v-if="list.rows.length" class="rows">
            <li v-for="(row, i) in list.rows" :key="row.url" class="rows-item" :style="{ '--d': `${i * 70}ms` }">
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
          <p v-else class="panel-empty">{{ $t('drupal.empty') }}</p>
        </section>
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
          class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
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
  { key: 'opened', icon: markRaw(CircleDot) as Component, value: created.length },
  { key: 'credits', icon: markRaw(Award) as Component, value: data.credits.length },
  {
    key: 'merged',
    icon: markRaw(GitMerge) as Component,
    value: data.mergeRequests.filter((mr) => mr.state === 'merged').length,
  },
  { key: 'joined', icon: markRaw(MessageSquare) as Component, value: joined.length },
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
  { key: 'issuesOpened', icon: markRaw(CircleDot) as Component, rows: created.map((i) => issueRow(i, 'opened')) },
  {
    key: 'credits',
    icon: markRaw(Award) as Component,
    rows: data.credits.map(
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
    rows: data.mergeRequests.map(
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
  { key: 'issuesJoined', icon: markRaw(MessageSquare) as Component, rows: joined.map((i) => issueRow(i, 'updated')) },
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
/* The title stays on one line on phones */
@media (max-width: 639px) {
  .drupal-page :deep(.terminal-title) {
    font-size: min(1.5rem, 6vw);
  }
}

/* =============================================
   Intro and numbers: side by side from 1024px
   ============================================= */
.drupal-top {
  display: grid;
  gap: 2rem;
  margin-bottom: 3rem;
}
/* Wide: the intro and the projects on the left, the card of numbers next to them. */
@media (min-width: 1024px) {
  .drupal-top {
    grid-template-columns: minmax(0, 1fr) minmax(0, 30rem);
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'intro stats'
      'projects stats';
    align-items: start;
    column-gap: clamp(3rem, 6vw, 6rem);
  }
  .drupal-intro {
    grid-area: intro;
  }
  .stats {
    grid-area: stats;
  }
  .drupal-projects {
    grid-area: projects;
  }
}

/* ── The projects he contributed to ── */
.drupal-projects {
  max-width: 70ch;
}
.drupal-projects-title {
  margin: 0 0 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-text-muted);
}
.drupal-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0.25rem 0.4rem 0.25rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}
.chip:hover {
  border-color: var(--color-border-glow);
  background: var(--color-surface-hover);
  transform: translateY(-1px);
}
.chip:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
.chip-count {
  display: inline-grid;
  place-items: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.35rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.drupal-intro {
  max-width: 70ch;
}
.drupal-lead {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--color-text-primary);
}
.text-link {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: var(--color-border-glow);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.2s ease;
}
.text-link:hover {
  text-decoration-color: currentColor;
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
    transform 0.2s ease;
}
.pill-link:hover {
  border-color: var(--color-border-glow);
  background: var(--color-surface-hover);
  transform: translateY(-1px);
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

/* ── Numbers: 2 × 2, one row with dividers where the card is wide enough ── */
.stats {
  container-type: inline-size;
  padding: 1.5rem;
  border: 1px solid var(--color-border-glow);
  border-radius: 1rem;
  background:
    radial-gradient(120% 80% at 100% 0%, var(--color-accent-soft), transparent 60%),
    var(--color-surface);
}
@media (min-width: 768px) {
  .stats {
    padding: 1.75rem 2rem;
  }
}
.stats-numbers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem 1rem;
  margin: 0;
}
@container (min-width: 40rem) {
  .stats-numbers {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
  }
  .stats-number + .stats-number {
    padding-left: 2rem;
    border-left: 1px solid var(--color-border);
  }
}
.stats-number {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: 0.3rem;
  min-width: 0;
}
.stats-number dd {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-accent);
}
@media (min-width: 1024px) {
  .stats-number dd {
    font-size: 2.25rem;
  }
}
.stats-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  color: var(--color-text-muted);
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
  margin: 1.5rem 0 0;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--color-border);
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
  animation: row-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--reveal-delay, 0ms) + 250ms + var(--d));
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
.row:hover {
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
.row:hover .row-title {
  color: var(--color-accent);
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
.row:hover .row-arrow,
.row:focus-visible .row-arrow {
  opacity: 1;
  transform: translate(2px, -2px);
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
  .pill-link,
  .row,
  .row-arrow {
    transition: none;
  }
}
</style>
