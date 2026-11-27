// Repository activity for the project detail pages, and the activity grid on /tools.
//
// Why a script: most project repos are private, so the static site can't ask
// GitHub itself. `npm run stats` asks the GitHub API with REPO_STATS_TOKEN, a
// fine-grained token with read-only access to the repositories, and writes
// src/data/repo-stats.json, which the pages import. The deploy workflow runs it
// before every build, so the numbers follow the repositories without a push.
// Without a token, or when the API fails for any project, nothing is written and
// the committed file is used.
//
// By hand: REPO_STATS_TOKEN=$(gh auth token) npm run stats
//
// What it writes, per project page: the commit counts and dates, the commits per
// week, when its dependencies were last updated (the newest commit on the default
// branch that touched a lockfile) and how many Dependabot alerts are open. Besides:
// the tools' latest releases, and the activity grid on /tools (commits per day over
// the last year, summed over every repository below, the tools' and this site's own).
//
// The token's permissions, read-only, on every repository below: Contents (commits,
// releases), and Dependabot alerts for the open alerts. Without that one, or with
// Dependabot alerts off for a repository, its alerts are null and the page shows when
// the dependencies were updated only.
//
// Public on the site: counts and dates only. No commit messages, author names,
// e-mail addresses or advisories. (The API returns them; only dates and
// severities are kept.) The output names projects by their page, never by
// repository, because a CI log of this public repository is public too.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, process.env.REPO_STATS_OUT ?? 'src/data/repo-stats.json')

/** The GitHub account that owns the repositories. */
const OWNER = 'RobbeSaelens'

/** Page → repository. */
const PROJECTS = {
  exulta: 'exulta-v2.0',
  scan2talk: 'scan2talk',
  stableManager: 'stal-manager',
  vhs: 'VHS',
}

/** The tools on /tools (src/tools.ts) → repository: their latest release, and their commits in the grid. */
const TOOLS = {
  projectUpdater: 'Project-Updater',
  sift: 'Sift',
}

/** This site's own repository (public): counted in the activity grid on /tools, with the above. */
const SITE = 'robbesaelens.github.io'

/** The files that change when dependencies do: the newest commit touching one is "dependencies updated". */
const LOCKFILES = ['package-lock.json', 'composer.lock', 'pnpm-lock.yaml', 'yarn.lock']
/** Dependabot's severities, the most serious first. */
const SEVERITIES = ['critical', 'high', 'medium', 'low']

const WEEKS = 26
const DAY = 24 * 60 * 60 * 1000
/** The activity grid: this week and the 52 before it, weeks from Monday, in Belgian days. */
const GRID_WEEKS = 53
const ZONE = 'Europe/Brussels'

/** Commits per week, oldest first; the last bucket is the current week. */
function perWeekBuckets(timestamps) {
  const now = Date.now()
  const perWeek = Array(WEEKS).fill(0)
  for (const ts of timestamps) {
    const age = Math.floor((now - ts) / (7 * DAY))
    if (age >= 0 && age < WEEKS) perWeek[WEEKS - 1 - age]++
  }
  return perWeek
}

/** "2026-11-19": the day a moment falls on in Belgium. */
function dayOf(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms)
}

/** The grid's first day (the Monday GRID_WEEKS - 1 weeks before this week's) and today, as UTC midnights. */
function gridDays() {
  const today = Date.parse(`${dayOf(Date.now())}T00:00:00Z`)
  const monday = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY
  return { from: monday - (GRID_WEEKS - 1) * 7 * DAY, today }
}

/** One GET; retries a server error. Errors never name the repository (see the top). */
async function api(path, token, params = {}) {
  const url = new URL(`https://api.github.com${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'portfolio-repo-stats',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (res.ok) return { json: await res.json(), link: res.headers.get('link') ?? '' }
    if (res.status >= 500 && attempt < 4) {
      await new Promise((r) => setTimeout(r, attempt * 2000))
      continue
    }
    throw new Error(`GitHub answered HTTP ${res.status}`)
  }
}

/** The URL of a Link header's rel ("last", "next"), or null. */
function linkTo(link, rel) {
  const part = link.split(',').find((p) => p.includes(`rel="${rel}"`))
  return part ? (/<([^>]+)>/.exec(part)?.[1] ?? null) : null
}

/** Every page of a list, following the Link header (at most `max` pages). */
async function* pages(path, token, params, max = 50) {
  let next = new URL(`https://api.github.com${path}`)
  next.search = new URLSearchParams(params).toString()
  for (let page = 0; next && page < max; page++) {
    const { json, link } = await api(next.pathname, token, Object.fromEntries(next.searchParams))
    yield json
    const url = linkTo(link, 'next')
    next = url ? new URL(url) : null
  }
}

/** How many commits match: with one per page, the last page's number is the count. */
async function countCommits(path, token, params) {
  const { json, link } = await api(path, token, { ...params, per_page: 1 })
  const last = linkTo(link, 'last')
  return last ? Number(new URL(last).searchParams.get('page')) : json.length
}

/** The default branch of a repository. */
async function defaultBranch(repo, token) {
  const { json } = await api(`/repos/${OWNER}/${repo}`, token)
  return json.default_branch
}

/** The author dates (ms) of every commit on the default branch since the grid's first day. */
async function commitsOfTheYear(repo, sha, token) {
  const since = new Date(gridDays().from - DAY).toISOString()
  const stamps = []
  for await (const list of pages(`/repos/${OWNER}/${repo}/commits`, token, { sha, since, per_page: '100' })) {
    stamps.push(...list.map((c) => Date.parse(c.commit.author.date)))
  }
  return stamps
}

/** When a lockfile last changed on `sha` (that commit's date), or null for a repository without one. */
async function dependenciesUpdated(repo, sha, token) {
  let newest = null
  for (const path of LOCKFILES) {
    const { json } = await api(`/repos/${OWNER}/${repo}/commits`, token, { sha, path, per_page: 1 })
    const date = json[0]?.commit.committer.date ?? null
    if (date && (!newest || Date.parse(date) > Date.parse(newest))) newest = date
  }
  return newest
}

/**
 * The open Dependabot alerts that count against a project, by severity: an advisory in a
 * development dependency only counts when it is high or critical, as Project Updater counts
 * them. Null when they can't be read: the token lacks "Dependabot alerts: Read-only", or the
 * repository has them off (GitHub answers 403 or 404). That never fails the numbers around it.
 */
async function openAlerts(repo, token) {
  const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0]))
  try {
    for await (const list of pages(`/repos/${OWNER}/${repo}/dependabot/alerts`, token, { state: 'open', per_page: '100' }, 20)) {
      for (const alert of list) {
        const severity = alert.security_advisory?.severity ?? alert.security_vulnerability?.severity
        // The same rule as Project Updater's status (advisories.ts, isQuiet): an advisory in a
        // development dependency only counts when it is high or critical. The rest never reach
        // what the project ships.
        if (alert.dependency?.scope === 'development' && severity !== 'high' && severity !== 'critical') continue
        if (severity in bySeverity) bySeverity[severity]++
      }
    }
  } catch (error) {
    return { total: null, bySeverity: null, why: error.message }
  }
  return { total: SEVERITIES.reduce((sum, s) => sum + bySeverity[s], 0), bySeverity }
}

/** Each repository's commits of the year, kept for the grid: the projects' aren't fetched twice. */
const yearOfCommits = new Map()

async function githubStats(repo, token) {
  const commits = `/repos/${OWNER}/${repo}/commits`
  const sha = await defaultBranch(repo, token)

  const total = await countCommits(commits, token, { sha })
  const authored = (list) => list.map((c) => c.commit.author.date)
  const first = total ? await api(commits, token, { sha, per_page: 1, page: total }) : null
  const last = total ? await api(commits, token, { sha, per_page: 1 }) : null

  // Every commit of the last year: the last WEEKS weeks for the bars, all of them for the grid
  const stamps = await commitsOfTheYear(repo, sha, token)
  yearOfCommits.set(repo, stamps)
  const alerts = await openAlerts(repo, token)

  return {
    stats: {
      commits: total,
      commitsLast30Days: await countCommits(commits, token, { sha, since: new Date(Date.now() - 30 * DAY).toISOString() }),
      firstCommit: first ? authored(first.json)[0] : null,
      lastCommit: last ? authored(last.json)[0] : null,
      commitsPerWeek: perWeekBuckets(stamps),
      dependenciesUpdated: await dependenciesUpdated(repo, sha, token),
      openAlerts: alerts.total,
      openAlertsBySeverity: alerts.bySeverity,
    },
    alertsWhy: alerts.why,
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const token = process.env.REPO_STATS_TOKEN
if (!token) {
  console.log('REPO_STATS_TOKEN is not set: keeping the committed repository numbers.')
  process.exit(0)
}

let previous = {}
try {
  previous = JSON.parse(readFileSync(OUT, 'utf8'))
} catch {
  // no committed file yet
}

const projects = {}
for (const [page, repo] of Object.entries(PROJECTS)) {
  let alertsWhy
  try {
    ;({ stats: projects[page], alertsWhy } = await githubStats(repo, token))
  } catch (error) {
    // All or nothing: a half-new file would show one date over mixed numbers.
    console.error(`::warning::Repository numbers not refreshed (${page}: ${error.message}), keeping the committed ones.`)
    process.exit(1)
  }
  const stats = projects[page]
  const deps = stats.dependenciesUpdated ? `dependencies updated ${stats.dependenciesUpdated.slice(0, 10)}` : 'no lockfile'
  const alerts = stats.openAlerts === null ? `open alerts not readable (${alertsWhy})` : `${stats.openAlerts} open alerts`
  console.log(`${page}: ${stats.commits} commits, ${stats.commitsLast30Days} in the last 30 days, ${deps}, ${alerts}`)
}

// The tools on /tools (src/tools.ts): their latest release, so the page's version follows
// each release without an edit. On its own: when it fails, the versions from the
// committed file stay and the numbers above are still written.
const tools = {}
const previousTools = previous.tools ?? {}
for (const [page, repo] of Object.entries(TOOLS)) {
  try {
    const { json } = await api(`/repos/${OWNER}/${repo}/releases/latest`, token)
    tools[page] = { version: String(json.tag_name).replace(/^v/, ''), released: json.published_at }
    console.log(`${page}: release ${tools[page].version}`)
  } catch (error) {
    if (previousTools[page]) tools[page] = previousTools[page]
    console.error(`::warning::Latest release not fetched (${page}: ${error.message}), keeping the committed one.`)
  }
}

// The activity grid on /tools: commits per Belgian day, from a Monday 52 weeks back to
// today, summed over the projects, the tools and this site. Only the totals per day are
// kept, nothing per repository. On its own, all or nothing: when a repository fails, the
// committed grid stays (a sum without it would look like a quiet year).
let activity = previous.activity ?? null
try {
  const { from, today } = gridDays()
  const days = Array((today - from) / DAY + 1).fill(0)
  for (const repo of new Set([...Object.values(PROJECTS), ...Object.values(TOOLS), SITE])) {
    const stamps = yearOfCommits.get(repo) ?? (await commitsOfTheYear(repo, await defaultBranch(repo, token), token))
    for (const ms of stamps) {
      const i = (Date.parse(`${dayOf(ms)}T00:00:00Z`) - from) / DAY
      if (i >= 0 && i < days.length) days[i]++
    }
  }
  activity = { from: dayOf(from), days }
  const sum = days.reduce((a, b) => a + b, 0)
  console.log(`activity: ${sum} commits since ${activity.from}, on ${days.filter(Boolean).length} days`)
} catch (error) {
  console.error(`::warning::Activity grid not refreshed (${error.message}), keeping the committed one.`)
}

mkdirSync(dirname(OUT), { recursive: true })
// The grid's days on one line: a year of numbers one per line would bury the rest
const json = JSON.stringify({ generatedAt: new Date().toISOString(), projects, tools, activity }, null, 2).replace(
  /("days": \[)([^\]]*)(\])/,
  (_, open, list, close) => `${open}${list.replace(/\s+/g, '')}${close}`,
)
writeFileSync(OUT, `${json}\n`)
console.log(`wrote ${OUT.replace(`${ROOT}/`, '')}`)
