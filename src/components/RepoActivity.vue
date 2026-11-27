<template>
  <!-- Activity of the project's repository (private, unless `repository` links to it), from
       src/data/repo-stats.json (npm run stats), ending with how it's kept up to date: when
       its dependencies were updated and its open security alerts. Laid out by the width it
       is given, not the screen's: the numbers two by two, in one row from 600px of room. -->
  <section v-if="stats" class="repo reveal" :aria-labelledby="titleId">
    <!-- Read out as "Repository activity: Next.js app" -->
    <h2 :id="titleId" class="repo-heading" :aria-label="label ? `${$t('repo.title')}: ${label}` : undefined">
      {{ $t('repo.title') }}
      <span v-if="label" class="repo-label">{{ label }}</span>
    </h2>

    <div class="repo-card">
      <dl class="repo-numbers">
        <!-- The counts count up when they come into view (CountUpNumber.vue) -->
        <div class="repo-number">
          <dt>{{ $t('repo.commits') }}</dt>
          <dd><CountUpNumber :value="stats.commits" :format="count" /></dd>
        </div>
        <div class="repo-number">
          <dt>{{ $t('repo.last30') }}</dt>
          <dd><CountUpNumber :value="stats.commitsLast30Days" :format="count" /></dd>
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
            :style="{ height: n ? `${Math.max(8, (n / weeklyMax) * 100)}%` : undefined, '--d': `${i * 8}ms` }"
            :title="$t('repo.weekBar', n)"
          ></span>
        </div>
        <figcaption>{{ $t('repo.weekly') }}</figcaption>
      </figure>

      <!-- How it's kept up to date: when a lockfile last changed, and the open Dependabot
           alerts (null when the token can't read them: then only the first) -->
      <ul v-if="stats.dependenciesUpdated || alerts !== null" class="repo-upkeep">
        <li v-if="stats.dependenciesUpdated" class="repo-upkeep-item">
          <PackageCheck class="repo-note-icon" aria-hidden="true" />
          <i18n-t keypath="repo.dependencies" tag="span">
            <template #ago>
              <time :datetime="stats.dependenciesUpdated" :title="dayTime(stats.dependenciesUpdated)">{{
                ago(stats.dependenciesUpdated)
              }}</time>
            </template>
          </i18n-t>
        </li>
        <li v-if="alerts !== null" class="repo-upkeep-item">
          <ShieldCheck v-if="alerts === 0" class="repo-note-icon" aria-hidden="true" />
          <ShieldAlert v-else class="repo-note-icon" aria-hidden="true" />
          <span>
            {{ $t('repo.alerts', alerts) }}<template v-if="severities"> ({{ severities }})</template>
          </span>
        </li>
      </ul>

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
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Github, Lock, PackageCheck, ShieldAlert, ShieldCheck } from 'lucide-vue-next'
import data from '../data/repo-stats.json'
import CountUpNumber from './CountUpNumber.vue'

/** Dependabot's severities, the most serious first */
const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const

interface RepoStats {
  commits: number
  commitsLast30Days: number
  firstCommit: string | null
  lastCommit: string | null
  commitsPerWeek: number[]
  /** The newest commit that touched a lockfile; null without one */
  dependenciesUpdated?: string | null
  /** Open Dependabot alerts; null when the token can't read them */
  openAlerts?: number | null
  openAlertsBySeverity?: Record<(typeof SEVERITIES)[number], number> | null
}

const props = defineProps<{
  project: 'exulta' | 'scan2talk' | 'stableManager' | 'vhs'
  /** The repository's public URL, for an open-source project */
  repository?: string
  /** Which repository this is, on a page that shows more than one */
  label?: string
}>()
const titleId = computed(() => `repo-title-${props.project}`)

const { locale, t } = useI18n({ useScope: 'global' })
const stats = computed(() => (data.projects as Record<string, RepoStats | undefined>)[props.project])
const alerts = computed(() => stats.value?.openAlerts ?? null)
/** "1 high, 2 medium": only when there are any */
const severities = computed(() => {
  const counts = stats.value?.openAlertsBySeverity
  if (!alerts.value || !counts) return ''
  return SEVERITIES.filter((s) => counts[s]).map((s) => t(`repo.severity.${s}`, { n: counts[s] })).join(', ')
})
const weeklyTotal = computed(() => stats.value?.commitsPerWeek.reduce((a, b) => a + b, 0) ?? 0)
const weeklyMax = computed(() => Math.max(1, ...(stats.value?.commitsPerWeek ?? [])))

const tag = () => (locale.value === 'nl' ? 'nl-BE' : 'en-GB')
const count = (n: number) => n.toLocaleString(tag())
const monthYear = (iso: string) => new Date(iso).toLocaleDateString(tag(), { month: 'short', year: 'numeric' })
const day = (iso: string) => new Date(iso).toLocaleDateString(tag(), { day: 'numeric', month: 'long', year: 'numeric' })
/** "6 November 2026, 12:12", in Belgian time: the exact moment behind "2 weeks ago" */
const dayTime = (iso: string) =>
  new Date(iso).toLocaleString(tag(), { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Brussels' })

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
/* Sized by its container: a column beside the stack, or the page's width on a phone */
.repo {
  container-type: inline-size;
  min-width: 0;
}
/* A label over the card, like the "Built with" beside it */
.repo-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.6rem;
  margin-bottom: 0.875rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
}
/* Which repository, when a page shows more than one */
.repo-label {
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border-glow);
}

.repo-card {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
}

/* ── Numbers: 2 × 2, one row with dividers from 600px of room ── */
.repo-numbers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}
.repo-number {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: 0.2rem;
  min-width: 0;
}
.repo-number dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}
/* Dates and "2 days ago" are longer than a count: smaller, so they stay on one or two lines. */
.repo-number--text dd {
  font-size: 1.05rem;
  line-height: 1.3;
}
.repo-number dt {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
@container (min-width: 600px) {
  .repo-card {
    padding: 1.5rem 1.75rem;
  }
  .repo-numbers {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
  }
  .repo-number + .repo-number {
    padding-left: 1.25rem;
    border-left: 1px solid var(--color-border);
  }
  .repo-number dd {
    font-size: 2rem;
  }
  .repo-number--text dd {
    font-size: 1.3rem;
  }
  .repo-number dt {
    font-size: 0.8125rem;
  }
}

/* ── Commits per week ── */
.repo-chart {
  margin: 1.25rem 0 0;
}
.repo-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 3rem;
  border-bottom: 1px solid var(--color-border);
}
@container (min-width: 600px) {
  .repo-bars {
    gap: 4px;
    height: 4rem;
  }
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
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ── How it's kept up to date: one line where it fits, the two parts under each other where not ── */
.repo-upkeep {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem 1.5rem;
  margin: 1rem 0 0;
  padding: 0.875rem 0 0;
  list-style: none;
  border-top: 1px dashed var(--color-border);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}
.repo-upkeep-item {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  min-width: 0;
}
.repo-upkeep time {
  color: var(--color-text-primary);
  font-weight: 600;
}
/* The note follows the upkeep line under the same rule */
.repo-upkeep + .repo-note {
  margin-top: 0.5rem;
  padding-top: 0;
  border-top: 0;
}

/* ── Where the numbers come from ── */
.repo-note {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 1rem 0 0;
  padding-top: 0.875rem;
  border-top: 1px dashed var(--color-border);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}
.repo-note-icon {
  width: 0.85rem;
  height: 0.85rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
}
.repo-note-link {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .repo.reveal-armed .repo-bar,
  .repo.is-visible .repo-bar {
    transform: none;
    transition: none;
  }
}
</style>
