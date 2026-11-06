<template>
  <!-- Activity of the project's repository (private, unless `repository` links to it), from
       src/data/repo-stats.json (npm run stats).
       A section on the page; on screens with room beside the content, a panel there instead. -->
  <component
    :is="variant === 'aside' ? 'aside' : 'section'"
    v-if="stats"
    class="repo"
    :class="variant === 'aside' ? 'repo--aside' : 'repo--inline reveal'"
    :aria-labelledby="titleId"
  >
    <!-- In body: a transformed page ancestor would break position: fixed -->
    <Teleport v-if="variant !== 'aside'" to="body">
      <RepoActivity :project="project" :repository="repository" variant="aside" />
    </Teleport>

    <h2 :id="titleId" class="repo-heading">{{ $t('repo.title') }}</h2>

    <div class="repo-card">
      <dl class="repo-numbers">
        <div class="repo-number">
          <dt>{{ $t('repo.commits') }}</dt>
          <dd>{{ count(stats.commits) }}</dd>
        </div>
        <div class="repo-number">
          <dt>{{ $t('repo.last30') }}</dt>
          <dd>{{ count(stats.commitsLast30Days) }}</dd>
        </div>
        <div class="repo-number repo-number--text">
          <dt>{{ $t('repo.since') }}</dt>
          <dd>{{ stats.firstCommit ? monthYear(stats.firstCommit) : '–' }}</dd>
        </div>
        <div class="repo-number repo-number--text">
          <dt>{{ $t('repo.lastCommit') }}</dt>
          <dd>{{ stats.lastCommit ? ago(stats.lastCommit) : '–' }}</dd>
        </div>
      </dl>

      <figure class="repo-chart">
        <div class="repo-bars" role="img" :aria-label="$t('repo.weeklySummary', { total: weeklyTotal, max: weeklyMax })">
          <span
            v-for="(n, i) in stats.commitsPerWeek"
            :key="i"
            class="repo-bar"
            :class="{ 'is-empty': n === 0 }"
            :style="{ height: n ? `${Math.max(8, (n / weeklyMax) * 100)}%` : undefined, '--d': `${i * 18}ms` }"
            :title="$t('repo.weekBar', n)"
          ></span>
        </div>
        <figcaption>{{ $t('repo.weekly') }}</figcaption>
      </figure>

      <p v-if="repository" class="repo-note">
        <Github class="repo-note-icon" aria-hidden="true" />
        <i18n-t keypath="repo.public" tag="span">
          <template #link>
            <a class="repo-note-link" :href="repository" target="_blank" rel="noopener noreferrer">GitHub</a>
          </template>
          <template #date>{{ day(data.generatedAt) }}</template>
        </i18n-t>
      </p>
      <p v-else class="repo-note">
        <Lock class="repo-note-icon" aria-hidden="true" />
        {{ $t('repo.private', { date: day(data.generatedAt) }) }}
      </p>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Github, Lock } from 'lucide-vue-next'
import data from '../data/repo-stats.json'

interface RepoStats {
  commits: number
  commitsLast30Days: number
  firstCommit: string | null
  lastCommit: string | null
  commitsPerWeek: number[]
}

const props = withDefaults(
  defineProps<{
    project: 'exulta' | 'scan2talk' | 'stalManager' | 'vhs' | 'sharedCosts'
    /** The repository's public URL, for an open-source project */
    repository?: string
    variant?: 'inline' | 'aside'
  }>(),
  { variant: 'inline' },
)
const titleId = computed(() => `repo-title-${props.project}-${props.variant}`)

const { locale } = useI18n({ useScope: 'global' })
const stats = computed(() => (data.projects as Record<string, RepoStats | undefined>)[props.project])
const weeklyTotal = computed(() => stats.value?.commitsPerWeek.reduce((a, b) => a + b, 0) ?? 0)
const weeklyMax = computed(() => Math.max(1, ...(stats.value?.commitsPerWeek ?? [])))

const tag = () => (locale.value === 'nl' ? 'nl-BE' : 'en-GB')
const count = (n: number) => n.toLocaleString(tag())
const monthYear = (iso: string) => new Date(iso).toLocaleDateString(tag(), { month: 'short', year: 'numeric' })
const day = (iso: string) => new Date(iso).toLocaleDateString(tag(), { day: 'numeric', month: 'long', year: 'numeric' })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]
/** "3 days ago", "yesterday", "2 weken geleden". */
function ago(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  const format = new Intl.RelativeTimeFormat(tag(), { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return format.format(0, 'minute')
}
</script>

<style scoped>
.repo {
  margin-bottom: 2.5rem;
}
.repo-heading {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 1.25rem;
}
@media (min-width: 768px) {
  .repo-heading {
    font-size: 2rem;
  }
}

.repo-card {
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
}
@media (min-width: 768px) {
  .repo-card {
    padding: 2rem;
  }
}

/* ── Numbers: 2 × 2, one row with dividers from 1024px ── */
.repo-numbers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem 1rem;
  margin: 0;
}
@media (min-width: 1024px) {
  .repo-numbers {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
  }
  .repo-number + .repo-number {
    padding-left: 1.5rem;
    border-left: 1px solid var(--color-border);
  }
}
.repo-number {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: 0.3rem;
  min-width: 0;
}
.repo-number dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-accent);
}
/* Dates and "2 days ago" are longer than a count: smaller, so they stay on one or two lines. */
.repo-number--text dd {
  font-size: 1.25rem;
  line-height: 1.25;
}
@media (min-width: 1024px) {
  .repo-number dd {
    font-size: 2.25rem;
  }
  .repo-number--text dd {
    font-size: 1.5rem;
  }
}
.repo-number dt {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

/* ── Commits per week ── */
.repo-chart {
  margin: 2rem 0 0;
}
.repo-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 4.5rem;
  border-bottom: 1px solid var(--color-border);
}
.repo-bar {
  flex: 1;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--color-accent);
  transform-origin: bottom;
}
.repo-bar.is-empty {
  background: var(--color-border);
}
.repo.reveal-armed .repo-bar {
  transform: scaleY(0);
}
.repo.is-visible .repo-bar {
  transform: scaleY(1);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) var(--d);
}
.repo-chart figcaption {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ── Where the numbers come from ── */
.repo-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 1.5rem 0 0;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--color-border);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.repo-note-icon {
  width: 0.85rem;
  height: 0.85rem;
  flex-shrink: 0;
}
.repo-note-link {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* ── Side panel: in the free space right of the 1280px content, fixed while
   scrolling. Only where it fits; the section on the page makes way for it. ── */
.repo--aside {
  display: none;
}
@media (min-width: 1840px) and (min-height: 760px) {
  .repo--inline {
    display: none;
  }
  .repo--aside {
    display: block;
    position: fixed;
    z-index: 30;
    top: 7rem;
    right: calc((100vw - 1280px) / 2 - 240px - 16px);
    width: 240px;
    margin: 0;
    animation: repo-aside-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both;
  }
  .repo--aside .repo-heading {
    margin-bottom: 0.6rem;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-accent);
  }
  .repo--aside .repo-card {
    padding: 1.25rem;
  }
  .repo--aside .repo-numbers {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .repo--aside .repo-number + .repo-number {
    margin-top: 0.75rem;
    padding: 0.75rem 0 0;
    border-left: 0;
    border-top: 1px solid var(--color-border);
  }
  .repo--aside .repo-number dd {
    font-size: 1.5rem;
  }
  .repo--aside .repo-number--text dd {
    font-size: 1.05rem;
  }
  .repo--aside .repo-chart {
    margin-top: 1.25rem;
  }
  .repo--aside .repo-bars {
    gap: 2px;
    height: 3rem;
  }
  .repo--aside .repo-bar {
    animation: repo-bar-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) calc(0.6s + var(--d)) both;
  }
  .repo--aside .repo-note {
    align-items: flex-start;
    margin-top: 1rem;
    padding-top: 1rem;
  }
}
@keyframes repo-aside-in {
  from {
    opacity: 0;
    transform: translateX(16px);
  }
}
@keyframes repo-bar-in {
  from {
    transform: scaleY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .repo.reveal-armed .repo-bar,
  .repo.is-visible .repo-bar {
    transform: none;
    transition: none;
  }
  .repo--aside,
  .repo--aside .repo-bar {
    animation: none;
  }
}
</style>
