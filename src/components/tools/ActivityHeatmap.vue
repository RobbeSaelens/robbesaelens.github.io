<!--
  The activity grid on the tools page: commits per day over the last year, in every
  project, both tools and this site, summed (src/data/repo-stats.json `activity`, written
  by npm run stats: per-day totals only). A week a column, Monday at the top, today in the
  last one; five teal steps, the four above "none" by the quartiles of the busy days.

  Read out as one picture with its numbers (the total, the busy days, the busiest one);
  a mouse gets each day's count in a title. It fits the column it is given (cells from
  about 5px on a phone to 13px), so it never scrolls. Its columns fade in once, left to
  right, with the header's entrance (tools-page.css): CSS only, like .hero-in, and not
  with reduced motion. Styled in tools-page.css, global: it is in the first screen.
-->
<template>
  <figure v-if="grid" class="heat" :style="{ '--weeks': grid.weeks.length }">
    <div class="heat-graph" role="img" :aria-label="summary">
      <div class="heat-months hero-in" :style="{ '--i': step }">
        <span v-for="m in grid.months" :key="m.col" class="heat-month" :style="{ gridColumnStart: m.col + 1 }">{{
          m.label
        }}</span>
      </div>
      <div class="heat-grid">
        <span
          v-for="(week, c) in grid.weeks"
          :key="c"
          class="heat-col"
          :style="{ '--d': `${delay(c, grid.weeks.length)}ms`, '--i': step }"
        >
          <span
            v-for="d in week"
            :key="d.i"
            class="heat-day"
            :class="`l${d.level}`"
            :title="titles ? $t('activity.day', { n: d.n, date: longDay(d.ms) }, d.n) : undefined"
          ></span>
        </span>
      </div>
    </div>
    <figcaption class="heat-caption hero-in" :style="{ '--i': step }">
      <span class="heat-text">
        <strong class="heat-total">{{ $t('activity.total', { n: count(grid.total) }, grid.total) }}</strong>
        <span class="heat-note">{{ $t('activity.note', { date: longDay(Date.parse(generatedAt)) }) }}</span>
      </span>
      <span class="heat-legend" aria-hidden="true">
        {{ $t('activity.less') }}
        <span v-for="l in 5" :key="l" class="heat-day" :class="`l${l - 1}`"></span>
        {{ $t('activity.more') }}
      </span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import data from '../../data/repo-stats.json'

withDefaults(
  defineProps<{
    /** Its place in the header's entrance (--i of .hero-in): its labels rise then, its columns follow */
    step?: number
  }>(),
  { step: 0 },
)

interface Activity {
  /** The first day, a Monday: "2025-11-17" */
  from: string
  /** Commits per day from then to the day of the numbers, oldest first */
  days: number[]
}
interface Day {
  i: number
  n: number
  ms: number
  level: number
}

const DAY = 24 * 60 * 60 * 1000
const { locale, t } = useI18n({ useScope: 'global' })
const activity = (data as { activity?: Activity | null }).activity
const generatedAt = data.generatedAt

const tag = () => (locale.value === 'nl' ? 'nl-BE' : 'en-GB')
const count = (n: number) => n.toLocaleString(tag())
/** Days are calendar days (Belgian): written in UTC, so a time zone can't move them */
const longDay = (ms: number) =>
  new Date(ms).toLocaleDateString(tag(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** The level of each day: 0 for none, then 1–4 by the quartiles of the days with commits */
function levels(days: number[]): (n: number) => number {
  const busy = days.filter(Boolean).sort((a, b) => a - b)
  if (!busy.length) return () => 0
  const at = (q: number) => busy[Math.min(busy.length - 1, Math.floor(q * busy.length))]
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)]
  return (n) => (n === 0 ? 0 : n <= q1 ? 1 : n <= q2 ? 2 : n <= q3 ? 3 : 4)
}

const grid = computed(() => {
  if (!activity?.days.length) return null
  const from = Date.parse(`${activity.from}T00:00:00Z`)
  const level = levels(activity.days)
  const weeks: Day[][] = []
  activity.days.forEach((n, i) => {
    if (i % 7 === 0) weeks.push([])
    weeks[weeks.length - 1].push({ i, n, ms: from + i * DAY, level: level(n) })
  })
  // A month's name over the first week that starts in it; the first column's only when
  // its month lasts long enough for the name to fit before the next one
  const month = (ms: number) => new Date(ms).getUTCMonth()
  const months: { col: number; label: string }[] = []
  weeks.forEach((week, col) => {
    const named =
      col === 0
        ? month(week[0].ms) === month(week[0].ms + 21 * DAY)
        : month(week[0].ms) !== month(weeks[col - 1][0].ms)
    if (named) {
      // Three letters ("Sept" is en-GB's one longer name): a month is four columns, on a phone 26px
      const label = new Date(week[0].ms).toLocaleDateString(tag(), { month: 'short', timeZone: 'UTC' })
      months.push({ col, label: label.replace('.', '').slice(0, 3) })
    }
  })
  const total = activity.days.reduce((a, b) => a + b, 0)
  return { weeks, months, total, busy: activity.days.filter(Boolean).length, max: Math.max(...activity.days) }
})

const summary = computed(() =>
  grid.value
    ? t('activity.summary', { total: count(grid.value.total), days: count(grid.value.busy), max: count(grid.value.max) })
    : '',
)

/** Each column's wait, left to right in 300ms, easing out: the year sweeps in, today lands last */
const delay = (c: number, n: number) => Math.round(300 * Math.sin(((c / Math.max(1, n - 1)) * Math.PI) / 2))

/** Each day's count in a title, for a mouse only (a touch screen never shows titles) */
const titles = ref(false)
onMounted(() => {
  titles.value = !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
})
</script>
