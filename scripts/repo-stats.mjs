// Repository activity for the project detail pages.
//
// Why a script: most project repos are private, so the static site can't ask
// GitHub itself, and CI has no access to them. Run `npm run stats` before a
// deploy: it reads the local clones next to this repo with git and writes
// src/data/repo-stats.json, which is committed and imported by the detail pages.
//
// Public on the site: counts and dates only. No commit messages, author
// names or e-mail addresses.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PROJECTS_DIR = process.env.PROJECTS_DIR ?? resolve(ROOT, '..')
const OUT = resolve(ROOT, 'src/data/repo-stats.json')

/**
 * Repository → folder of its clone in PROJECTS_DIR. sharedCosts is the public
 * Drupal version of Stal Manager, shown on the Stal Manager page.
 */
const PROJECTS = {
  exulta: 'exulta-v2.0',
  scan2talk: 'scan2talk',
  stalManager: 'stal-manager',
  vhs: 'VHS',
  sharedCosts: 'shared_costs',
}

const WEEKS = 26
const DAY = 24 * 60 * 60 * 1000

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

function tryRun(cmd, args, cwd) {
  try {
    return run(cmd, args, cwd)
  } catch {
    return null
  }
}

function stats(dir) {
  const git = (...args) => run('git', args, dir)
  // Count what was pushed: the remote's default branch, after a fetch.
  tryRun('git', ['fetch', '--quiet', 'origin'], dir)
  const ref = tryRun('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], dir) ?? 'HEAD'

  // Commits per week, oldest first; the last bucket is the current week.
  const now = Date.now()
  const perWeek = Array(WEEKS).fill(0)
  for (const ts of git('log', ref, `--since=${WEEKS * 7}.days.ago`, '--format=%at').split('\n').filter(Boolean)) {
    const age = Math.floor((now - Number(ts) * 1000) / (7 * DAY))
    if (age >= 0 && age < WEEKS) perWeek[WEEKS - 1 - age]++
  }

  const roots = git('log', ref, '--max-parents=0', '--format=%aI').split('\n').filter(Boolean).sort()
  return {
    commits: Number(git('rev-list', '--count', ref)),
    commitsLast30Days: Number(git('rev-list', '--count', `--since=30.days.ago`, ref)),
    firstCommit: roots[0] ?? null,
    lastCommit: git('log', '-1', ref, '--format=%aI') || null,
    commitsPerWeek: perWeek,
  }
}

const projects = {}
for (const [page, folder] of Object.entries(PROJECTS)) {
  const dir = resolve(PROJECTS_DIR, folder)
  if (!existsSync(resolve(dir, '.git'))) {
    console.warn(`skip ${page}: no git repo at ${dir}`)
    continue
  }
  projects[page] = stats(dir)
  const s = projects[page]
  console.log(`${page}: ${s.commits} commits, ${s.commitsLast30Days} in the last 30 days`)
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), projects }, null, 2)}\n`)
console.log(`wrote ${OUT.replace(`${ROOT}/`, '')}`)
