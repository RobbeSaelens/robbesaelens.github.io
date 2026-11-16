// Repository activity for the project detail pages.
//
// Why a script: most project repos are private, so the static site can't ask
// GitHub itself. `npm run stats` asks the GitHub API with REPO_STATS_TOKEN, a
// fine-grained token with read-only (Contents) access to the repositories, and
// writes src/data/repo-stats.json, which the detail pages import. The deploy
// workflow runs it before every build, so the numbers follow the repositories
// without a push. Without a token, or when the API fails for any repository,
// nothing is written and the committed file is used.
//
// By hand: REPO_STATS_TOKEN=$(gh auth token) npm run stats
//
// Public on the site: counts and dates only. No commit messages, author
// names or e-mail addresses. (The API returns them; only dates are kept.) The
// output names projects by their page, never by repository, because a CI log
// of this public repository is public too.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, process.env.REPO_STATS_OUT ?? 'src/data/repo-stats.json')

/** The GitHub account that owns the repositories. */
const OWNER = 'RobbeSaelens'

/**
 * Page → repository. sharedCosts is the public Drupal version of Stable
 * Manager, shown on the Stable Manager page.
 */
const PROJECTS = {
  exulta: 'exulta-v2.0',
  scan2talk: 'scan2talk',
  stableManager: 'stal-manager',
  vhs: 'VHS',
  sharedCosts: 'shared_costs',
}

const WEEKS = 26
const DAY = 24 * 60 * 60 * 1000

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

/** How many commits match: with one per page, the last page's number is the count. */
async function countCommits(path, token, params) {
  const { json, link } = await api(path, token, { ...params, per_page: 1 })
  const last = linkTo(link, 'last')
  return last ? Number(new URL(last).searchParams.get('page')) : json.length
}

async function githubStats(repo, token) {
  const base = `/repos/${OWNER}/${repo}`
  const commits = `${base}/commits`
  const { json: info } = await api(base, token)
  const sha = info.default_branch

  const total = await countCommits(commits, token, { sha })
  const authored = (list) => list.map((c) => c.commit.author.date)
  const first = total ? await api(commits, token, { sha, per_page: 1, page: total }) : null
  const last = total ? await api(commits, token, { sha, per_page: 1 }) : null

  // Every commit of the last WEEKS weeks, a page of 100 at a time.
  const stamps = []
  let next = new URL(`https://api.github.com${commits}`)
  next.search = new URLSearchParams({ sha, since: new Date(Date.now() - WEEKS * 7 * DAY).toISOString(), per_page: '100' }).toString()
  for (let page = 0; next && page < 50; page++) {
    const { json, link } = await api(next.pathname, token, Object.fromEntries(next.searchParams))
    stamps.push(...authored(json).map((date) => Date.parse(date)))
    const url = linkTo(link, 'next')
    next = url ? new URL(url) : null
  }

  return {
    commits: total,
    commitsLast30Days: await countCommits(commits, token, { sha, since: new Date(Date.now() - 30 * DAY).toISOString() }),
    firstCommit: first ? authored(first.json)[0] : null,
    lastCommit: last ? authored(last.json)[0] : null,
    commitsPerWeek: perWeekBuckets(stamps),
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const token = process.env.REPO_STATS_TOKEN
if (!token) {
  console.log('REPO_STATS_TOKEN is not set: keeping the committed repository numbers.')
  process.exit(0)
}

const projects = {}
for (const [page, repo] of Object.entries(PROJECTS)) {
  try {
    projects[page] = await githubStats(repo, token)
  } catch (error) {
    // All or nothing: a half-new file would show one date over mixed numbers.
    console.error(`::warning::Repository numbers not refreshed (${page}: ${error.message}), keeping the committed ones.`)
    process.exit(1)
  }
  console.log(`${page}: ${projects[page].commits} commits, ${projects[page].commitsLast30Days} in the last 30 days`)
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), projects }, null, 2)}\n`)
console.log(`wrote ${OUT.replace(`${ROOT}/`, '')}`)
