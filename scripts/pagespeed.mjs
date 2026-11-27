// Lighthouse scores of the live sites, for their project pages (PageSpeedScores.vue).
//
// Why a script: PageSpeed Insights takes half a minute a page, and the page shouldn't send
// its visitors to Google. `npm run pagespeed` asks Google's PageSpeed Insights API (v5) for
// every project with a public live site (`liveUrl` in src/seo/projects.ts, keyed by its
// `stats` key) and writes src/data/pagespeed.json, which is committed and imported by the
// project pages. The deploy workflow runs it before every build (the daily one too) and
// keeps the committed file when it fails.
//
// PAGESPEED_API_KEY, when set, is sent as the API key (an optional repository secret: a
// Google Cloud API key restricted to the PageSpeed Insights API). Without one the API
// works on a small quota per IP address, which GitHub's runners share, so it often answers
// 429. Each page is asked twice at most; a site that fails keeps its committed scores.
//
// One Lighthouse run varies a lot, the performance score most (one morning 78, an hour later
// 95, for the same page): its mobile run simulates a slow phone and network, and a page whose
// LCP sits near a threshold falls either side of it. So each page is measured RUNS times and
// each score is the median of those runs, as Lighthouse's own docs advise.
//
// Public on the site: the four category scores (0–100), when they were measured and on
// what (the strategy). Nothing else from the report is kept.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROJECTS } from '../src/seo/projects.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, process.env.PAGESPEED_OUT ?? 'src/data/pagespeed.json')

const API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
/** What the page shows: mobile, Lighthouse's stricter run. Add 'desktop' to keep that too. */
const STRATEGIES = ['mobile']
/** Lighthouse's category → its key in the JSON */
const CATEGORIES = { performance: 'performance', accessibility: 'accessibility', 'best-practices': 'bestPractices', seo: 'seo' }
const TIMEOUT_MS = 120_000
const RETRY_AFTER_MS = 15_000
/** Runs per page; each score is their median (odd, so the median is one of the runs) */
const RUNS = 3

const key = process.env.PAGESPEED_API_KEY || undefined

/** One PageSpeed Insights run: the four scores, 0–100, and when Lighthouse fetched the page. */
async function measure(url, strategy) {
  const query = new URLSearchParams({ url, strategy })
  for (const category of Object.keys(CATEGORIES)) query.append('category', category)
  if (key) query.set('key', key)
  // Errors say what went wrong, never the request's URL (it holds the key)
  const res = await fetch(`${API}?${query}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(`PageSpeed Insights answered HTTP ${res.status}${body?.error?.status ? ` ${body.error.status}` : ''}`)
  const report = body?.lighthouseResult
  const scores = {}
  for (const [id, name] of Object.entries(CATEGORIES)) {
    const score = report?.categories?.[id]?.score
    if (typeof score !== 'number') throw new Error(`the report has no ${id} score`)
    scores[name] = Math.round(score * 100)
  }
  const measuredAt = new Date(report.fetchTime ?? body.analysisUTCTimestamp)
  if (Number.isNaN(measuredAt.getTime())) throw new Error('the report has no date')
  return { ...scores, measuredAt: measuredAt.toISOString() }
}

/** Twice at most, a little apart: PageSpeed Insights sometimes fails a run that works the next time. */
async function measureTwice(url, strategy) {
  try {
    return await measure(url, strategy)
  } catch (error) {
    console.log(`${url} (${strategy}): ${error.message}, trying once more`)
    await new Promise((r) => setTimeout(r, RETRY_AFTER_MS))
    return measure(url, strategy)
  }
}

/** RUNS runs one after the other (PageSpeed Insights runs one page at a time anyway); the median of each score. */
async function measureMedian(url, strategy) {
  const runs = []
  for (let i = 0; i < RUNS; i++) {
    try {
      runs.push(await measureTwice(url, strategy))
    } catch (error) {
      console.log(`${url} (${strategy}): run ${i + 1} failed (${error.message})`)
    }
  }
  if (!runs.length) throw new Error('every run failed')
  const median = (values) => values.sort((a, b) => a - b)[Math.floor((values.length - 1) / 2)]
  const result = {}
  for (const name of Object.values(CATEGORIES)) result[name] = median(runs.map((run) => run[name]))
  result.measuredAt = runs.map((run) => run.measuredAt).sort().at(-1)
  console.log(`${url} (${strategy}): performance per run ${runs.map((run) => run.performance).join(', ')}`)
  return result
}

let previous = { sites: {} }
try {
  previous = JSON.parse(readFileSync(OUT, 'utf8'))
} catch {
  // no committed file yet
}

const sites = {}
let measured = 0
for (const project of PROJECTS.filter((p) => p.liveUrl)) {
  const url = new URL(project.liveUrl).href
  sites[project.stats] = {}
  for (const strategy of STRATEGIES) {
    try {
      const result = await measureMedian(url, strategy)
      sites[project.stats][strategy] = result
      measured++
      const { measuredAt, ...scores } = result
      console.log(`${url} (${strategy}): ${Object.entries(scores).map(([k, v]) => `${k} ${v}`).join(', ')}`)
    } catch (error) {
      const kept = previous.sites?.[project.stats]?.[strategy]
      if (kept) sites[project.stats][strategy] = kept
      console.error(`::warning::Lighthouse scores of ${url} (${strategy}) not refreshed (${error.message}), ${kept ? 'keeping the committed ones' : 'none to keep'}.`)
    }
  }
  if (!Object.keys(sites[project.stats]).length) delete sites[project.stats]
}

if (!measured) {
  console.error('npm run pagespeed measured nothing: src/data/pagespeed.json is unchanged.')
  process.exit(1)
}
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, `${JSON.stringify({ sites }, null, 2)}\n`)
console.log(`wrote ${OUT.replace(`${ROOT}/`, '')}${key ? '' : ' (without an API key)'}`)
