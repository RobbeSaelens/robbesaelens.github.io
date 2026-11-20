<template>
  <!-- The live site's Lighthouse scores, from src/data/pagespeed.json (npm run pagespeed, before
       every deploy). Four rings in Lighthouse's own bands, in the theme's colours; each says
       "Performance, 98 of 100" to a screen reader (the ring itself is a picture of that).
       The arcs fill as the numbers count, once in view (CountUpNumber); the prerendered page
       and reduced motion show them full. Laid out by its own width: a row of four from
       26rem of room, two by two below. -->
  <section v-if="run && liveUrl" class="speed reveal" :aria-labelledby="titleId">
    <h2 :id="titleId" class="speed-heading" :aria-label="`${$t('speed.title')}: ${host}`">
      {{ $t('speed.title') }}
      <span class="speed-host">{{ host }}</span>
    </h2>

    <ul class="speed-scores">
      <li v-for="c in categories" :key="c.key" class="speed-score" :class="`is-${c.band}`">
        <span class="speed-ring" :class="{ 'is-armed': armed, 'is-drawn': drawn.has(c.key) }" aria-hidden="true">
          <svg class="speed-svg" viewBox="0 0 48 48" focusable="false">
            <circle class="speed-track" cx="24" cy="24" r="21" pathLength="100" />
            <circle class="speed-arc" cx="24" cy="24" r="21" pathLength="100" :style="{ '--score': c.value }" />
          </svg>
          <span class="speed-n">
            <CountUpNumber :value="c.value" :format="String" @armed="armed = true" @start="drawn.add(c.key)" />
          </span>
        </span>
        <span class="speed-label">{{ $t(`speed.${c.key}`) }}</span>
        <span class="sr-only">{{ $t('speed.score', { n: c.value }) }}</span>
      </li>
    </ul>

    <p class="speed-note">
      <span>{{ $t(`speed.measured.${strategy}`, { date: day(run.measuredAt) }) }}</span>
      <a class="speed-link" :href="report" target="_blank" rel="noopener noreferrer">
        {{ $t('speed.report') }}
        <ExternalLink class="speed-link-icon" aria-hidden="true" />
      </a>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExternalLink } from 'lucide-vue-next'
import data from '../data/pagespeed.json'
import { PROJECTS } from '../seo/projects'
import CountUpNumber from './CountUpNumber.vue'

/** Lighthouse's four categories, in its order */
const KEYS = ['performance', 'accessibility', 'bestPractices', 'seo'] as const
type Key = (typeof KEYS)[number]
type Strategy = 'mobile' | 'desktop'
type Run = Record<Key, number> & { measuredAt: string }

const props = defineProps<{
  /** The project's key: its `stats` in src/seo/projects.ts, which holds the live site */
  site: string
}>()

/** The run shown: mobile, Lighthouse's stricter one, where there is one */
const strategy: Strategy = 'mobile'

const { locale } = useI18n({ useScope: 'global' })
const titleId = computed(() => `speed-title-${props.site}`)
const run = computed(() => (data.sites as Record<string, Partial<Record<Strategy, Run>> | undefined>)[props.site]?.[strategy])
const liveUrl = computed(() => PROJECTS.find((p) => p.stats === props.site)?.liveUrl)
const host = computed(() => (liveUrl.value ? new URL(liveUrl.value).host : ''))
/** PageSpeed Insights' own page for the site: it runs the test again, on the same strategy */
const report = computed(
  () => `https://pagespeed.web.dev/report?url=${encodeURIComponent(new URL(liveUrl.value!).href)}&form_factor=${strategy}`,
)

/** Lighthouse's bands: 90–100 good, 50–89 average, 0–49 poor */
const band = (n: number) => (n >= 90 ? 'good' : n >= 50 ? 'average' : 'poor')
const categories = computed(() => KEYS.map((key) => ({ key, value: run.value![key], band: band(run.value![key]) })))

/** The arcs start empty once the numbers will count, and fill as each one starts */
const armed = ref(false)
const drawn = reactive(new Set<Key>())

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'nl' ? 'nl-BE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<style scoped>
/* Sized by its container: the column under "Built with", or the page's width on a phone */
.speed {
  container-type: inline-size;
  min-width: 0;
}
/* A label like "Built with" and "Repository activity" beside it, with the site as a chip */
.speed-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.6rem;
  margin-bottom: 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
}
.speed-host {
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  letter-spacing: 0.04em;
  text-transform: none;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border-glow);
}

/* ── The rings: two by two, a row of four from 26rem of room ── */
.speed-scores {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
@container (min-width: 26rem) {
  .speed-scores {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.speed-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  text-align: center;
}
.speed-score.is-good {
  --score-color: var(--color-score-good);
}
.speed-score.is-average {
  --score-color: var(--color-score-average);
}
.speed-score.is-poor {
  --score-color: var(--color-score-poor);
}
.speed-ring {
  position: relative;
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
}
.speed-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* The arc starts at the top and runs clockwise, like Lighthouse's */
  transform: rotate(-90deg);
}
.speed-track,
.speed-arc {
  fill: none;
  stroke-width: 4;
}
.speed-track {
  stroke: color-mix(in srgb, var(--score-color) 16%, transparent);
  fill: color-mix(in srgb, var(--score-color) 6%, transparent);
}
.speed-arc {
  stroke: var(--score-color);
  stroke-linecap: round;
  stroke-dasharray: 100;
  stroke-dashoffset: calc(100 - var(--score));
}
/* Once the number will count, the arc waits empty, then fills with it: the same 0.9 s and
   the same quartic ease-out as CountUp (CountUpNumber.vue), so they land together. An arc
   has no transform to do it with; four small circles repaint, nothing lays out again. */
.speed-ring.is-armed .speed-arc {
  stroke-dashoffset: 100;
}
.speed-ring.is-armed.is-drawn .speed-arc {
  stroke-dashoffset: calc(100 - var(--score));
  transition: stroke-dashoffset 0.9s cubic-bezier(0.25, 1, 0.5, 1);
}
.speed-n {
  position: relative;
  font-family: var(--font-mono);
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
  color: var(--score-color);
  font-variant-numeric: tabular-nums;
}
.speed-label {
  max-width: 100%;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

/* ── When, on what, and where to see it ── */
.speed-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 1rem;
  margin: 1.25rem 0 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}
.speed-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 1.5rem;
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.speed-link-icon {
  width: 0.8rem;
  height: 0.8rem;
}
.speed-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

@media (prefers-reduced-motion: reduce) {
  .speed-ring.is-armed .speed-arc {
    stroke-dashoffset: calc(100 - var(--score));
    transition: none;
  }
}
</style>
