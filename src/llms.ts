/**
 * /llms.txt (https://llmstxt.org): what the site's AI chatbot answers from. The
 * status-worker fetches it live, caches it for an hour and reads the first
 * LLMS_MAX_CHARS characters, so it follows the site with every deploy.
 *
 * Written at build time from the SSR bundle (scripts/llms.mjs), and served live by
 * `npm run dev` (vite.config.ts), from the site's own data, each from one place:
 * - src/data/llms-profile.md: the hand-written part (who Robbe is, what the pages don't say)
 * - the router's meta: the pages, their URLs and descriptions
 * - src/projects.ts and the project pages' data (src/screens/details/data.ts), with their
 *   English texts from src/locales/en.json: every project, its status, stack and features
 * - src/tools.ts: the tools Robbe built to keep his projects up to date (the tools page)
 * - src/data/repo-stats.json and src/data/drupal.json: the numbers the daily deploy refreshes
 *
 * Most important first: the profile, the projects, the tools, then the Drupal contributions. To fit
 * the budget, numbered lists (a project's features, Stable Manager's Drupal points,
 * Scan2Talk's steps) go by title, their texts stay on the pages; and the Drupal issues,
 * which grow every day, fill what is left, latest first, pointing to /drupal for the rest.
 * Anything else over the budget fails the build.
 *
 * English only: the chatbot answers in the visitor's language.
 */
import { createI18n, type Composer } from 'vue-i18n'
import type { RouteRecordRaw } from 'vue-router'
import profile from './data/llms-profile.md?raw'
import repoStats from './data/repo-stats.json'
import drupal from './data/drupal.json'
import en from './locales/en.json'
import { routes } from './bootstrap/router'
import { PROJECT_PAGES, type ProjectEntry } from './projects'
import { PROJECT_DATA, scan2talkCheckIn, stableManagerDrupal } from './screens/details/data'
import { tools as toolData } from './tools'
import type { IndexItem } from './components/project/project'
import { absoluteUrl } from './site'

/** What the status-worker reads (MAX_CHARS in its src/knowledge.ts); the build fails above it. */
export const LLMS_MAX_CHARS = 12_000

const english = createI18n({ legacy: false, locale: 'en', messages: { en } }).global as unknown as Composer

/** The English text of `key`, as the pages show it; a missing key fails the build. */
function t(key: string): string {
  if (!english.te(key, 'en')) throw new Error(`[llms] no English text for "${key}"`)
  return english.t(key)
}

// Dates as on the pages: in Belgium, also when built on a server elsewhere
const date = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString('en-GB', { ...options, timeZone: 'Europe/Brussels' })
const day = (iso: string) => date(iso, { day: 'numeric', month: 'short', year: 'numeric' })
const longDay = (iso: string) => date(iso, { day: 'numeric', month: 'long', year: 'numeric' })
const monthYear = (iso: string) => date(iso, { month: 'long', year: 'numeric' })

const list = (items: string[]) => items.map((item) => `- ${item}`).join('\n')
/** A numbered list by its titles (a title may hold a comma) */
const titles = (items: IndexItem[]) => items.map((item) => item.title).join('; ')
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** The English pages, in the router's order. */
const pageRoutes = routes
  .flatMap((route) => route.children ?? [route])
  .filter(
    (route): route is RouteRecordRaw & { meta: { title: string; description: string } } =>
      route.meta?.locale === 'en',
  )
const pageUrl = (route: RouteRecordRaw) => absoluteUrl(`/${route.path}`)

/**
 * The pages but the projects' (those are under Projects). The home page and a page with
 * a section of its own here (Projects, Tools, Drupal contributions: by title or by route
 * name) go without their description.
 */
function pages(sections: Set<string>): string {
  const projectRoutes = new Set(PROJECT_PAGES.map((project) => project.route))
  const rows = pageRoutes
    .filter((route) => !projectRoutes.has(String(route.name)))
    .map((route) => {
      const link = `[${route.path ? route.meta.title : String(route.name)}](${pageUrl(route)})`
      const ownSection = sections.has(route.meta.title) || sections.has(String(route.name))
      return route.path && !ownSection ? `${link}: ${route.meta.description}` : link
    })
  return `${list(rows)}\n\nEvery page is also in Dutch, under /nl (${absoluteUrl('/nl/projects')}).`
}

type RepoKey = keyof typeof repoStats.projects

/** "378 commits, 28 in the last 30 days, active since March 2026, last commit 6 Nov 2026" */
function activity(key: RepoKey): string {
  const stats = repoStats.projects[key]
  return [
    `${stats.commits} ${t('repo.commits')}`,
    `${stats.commitsLast30Days} ${t('repo.last30')}`,
    stats.firstCommit && `${t('repo.since')} ${monthYear(stats.firstCommit)}`,
    stats.lastCommit && `${t('repo.lastCommit')} ${day(stats.lastCommit)}`,
  ]
    .filter(Boolean)
    .join(', ')
}

/** A project page's own block, as text. */
const EXTRA: Partial<Record<ProjectEntry['id'], () => string>> = {
  scan2talk() {
    const { title, steps } = scan2talkCheckIn(t)
    return `${title}: ${steps.map((step, i) => `${i + 1}. ${step.title}`).join('; ')}.`
  },
  'stable-manager'() {
    const block = stableManagerDrupal(t)
    return [
      `${block.title}: ${block.name} (${block.repository}). ${block.intro}`,
      list([
        `${t('project.featuresTitle')}: ${titles(block.points)}`,
        `Built with: ${block.stack.join(', ')}`,
        `Repository (public): ${activity('sharedCosts')}`,
      ]),
    ].join('\n')
  },
}

function project(entry: ProjectEntry): string {
  const data = PROJECT_DATA[entry.id](t)
  const route = pageRoutes.find((page) => page.name === entry.route)
  if (!route) throw new Error(`[llms] ${entry.name}: no English route named ${entry.route}`)
  const status = [data.status.label, data.status.note && lowerFirst(data.status.note)]
    .filter(Boolean)
    .join(', ')
  const links = data.links.map((link) => `[${link.label}](${link.href})`).join(', ')

  return [
    [
      `### ${data.name}`,
      `${t(`projects.items.${entry.id}.tagline`)}: ${pageUrl(route)}`,
      list([
        `Status: ${status}${links ? `. ${links}` : ''}`,
        `Built with: ${data.languages.join(', ')}`,
        `Tools: ${data.tools.join(', ')}`,
        `Repository${data.repo.label ? ` (${data.repo.label})` : ''}: ${activity(data.repo.key)}`,
        `${t('project.featuresTitle')}: ${titles(data.features)}`,
      ]),
    ].join('\n'),
    data.about,
    EXTRA[entry.id]?.(),
  ]
    .filter(Boolean)
    .join('\n\n')
}

function projects(): string {
  return [
    "In the order of the projects page. The texts are Robbe's own, in the first person; each page explains the features in full. " +
      `Repositories are private unless noted, numbers as of ${longDay(repoStats.generatedAt)}.`,
    ...PROJECT_PAGES.map(project),
  ].join('\n\n')
}

/** The tools page: each tool, what it is, why, and what it does by title. */
function tools(): string {
  const route = pageRoutes.find((page) => page.name === 'Tools')
  if (!route) throw new Error('[llms] no English route named Tools')
  return [
    `Two Mac apps Robbe built to keep his projects up to date, on the tools page: ${pageUrl(route)}. The texts are his own, in the first person.`,
    ...toolData(t).map((tool) =>
      [
        [
          `### ${tool.name}`,
          `${tool.tagline}.`,
          list([
            `Status: ${tool.platform} app, version ${tool.version}, ${
              tool.repository ? `open source: ${tool.repository}` : 'private repository for now'
            }`,
            `Built with: ${tool.stack.join(', ')}`,
            `${t('tools.featuresTitle')}: ${titles(tool.features)}`,
          ]),
        ].join('\n'),
        tool.about,
        tool.why.length ? `${t('tools.whyTitle')}: ${tool.why.join(' ')}` : null,
      ]
        .filter(Boolean)
        .join('\n\n'),
    ),
  ].join('\n\n')
}

interface Issue {
  id: number
  title: string
  url: string
  project: string
  status: string
  created: string
  updated: string
}

/** What he did on one drupal.org issue: opened it, took part, was credited, sent a merge request. */
interface Contribution {
  title: string
  url: string
  project: string
  status?: string
  latest: string
  opened?: string
  updated?: string
  credited?: string
  mergeRequest?: string
}

/** One line per issue, latest first: credits and merge requests go with their issue. */
function drupalIssues(): string[] {
  const projects = drupal.projects as Record<string, { name: string } | undefined>
  const byIssue = new Map<number, Contribution>()
  const add = (
    id: number,
    item: { title: string; url: string; project: string },
    when: string,
    facts: Partial<Contribution>,
  ) => {
    const entry = byIssue.get(id) ?? { title: item.title, url: item.url, project: item.project, latest: when }
    byIssue.set(id, {
      ...facts,
      ...entry,
      status: entry.status ?? facts.status,
      latest: when > entry.latest ? when : entry.latest,
    })
  }
  for (const issue of drupal.issuesCreated as Issue[]) {
    add(issue.id, issue, issue.created, { opened: issue.created, status: issue.status })
  }
  for (const issue of drupal.issuesJoined as Issue[]) {
    add(issue.id, issue, issue.updated, { updated: issue.updated, status: issue.status })
  }
  for (const credit of drupal.credits) add(credit.issue, credit, credit.date, { credited: credit.date })
  for (const mr of drupal.mergeRequests) {
    const state = mr.merged
      ? `merged ${day(mr.merged)}`
      : `${lowerFirst(t(`drupal.mrState.${mr.state}`))}, opened ${day(mr.created)}`
    add(mr.issue, mr, mr.merged ?? mr.created, { mergeRequest: `merge request ${mr.ref} ${state}` })
  }

  return [...byIssue.values()]
    .sort((a, b) => b.latest.localeCompare(a.latest))
    .map((item) => {
      const facts = [
        projects[item.project]?.name ?? item.project,
        item.status && t(`drupal.status.${item.status}`),
        item.opened && `opened ${day(item.opened)}`,
        // Taking part goes without saying for an issue he opened or was credited for
        item.updated && !item.opened && !item.credited && `took part, updated ${day(item.updated)}`,
        item.credited && `credited ${day(item.credited)}`,
        item.mergeRequest,
      ]
      return `[${item.title}](${item.url}): ${facts.filter(Boolean).join(', ')}`
    })
}

/** The counts, and the first `shown` issues; the others are on the Drupal page. */
function drupalContributions(issues: string[], shown: number): string {
  const merged = drupal.mergeRequests.filter((mr) => mr.state === 'merged').length
  const counts = [
    `${drupal.issuesCreated.length} ${t('drupal.stats.opened')}`,
    `${drupal.credits.length} ${t('drupal.stats.credits')}`,
    `${merged} ${t('drupal.stats.merged')}`,
    `${drupal.issuesJoined.length} ${t('drupal.stats.joined')}`,
  ]
  const rest = issues.length - shown
  return [
    `As of ${longDay(drupal.generatedAt)}: ${counts.join(', ')}. Each issue, latest first:`,
    list(issues.slice(0, shown)),
    rest > 0 && `- ${rest} older ones: ${absoluteUrl('/drupal')}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * "Born: 2000" gets the age it means at build time ("25 or 26 years old as of November
 * 2026"): the AI doesn't know today's date, so it can't work that out itself. Deploys run
 * every morning, so it stays current.
 */
function withAge(text: string): string {
  const now = new Date()
  const year = Number(now.toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'Europe/Brussels' }))
  const asOf = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/Brussels' })
  return text.replace(/^- Born: (\d{4})$/m, (line, born) => {
    const age = year - Number(born)
    return `${line} (${age - 1} or ${age} years old as of ${asOf})`
  })
}

/** The profile without its comments: the part before its first section, and its sections by heading. */
function profileParts() {
  const [head, ...parts] = profile.replace(/<!--[\s\S]*?-->/g, '').split(/^(?=## )/m)
  const sections = new Map<string, string>()
  for (const part of parts) {
    const [heading, ...body] = part.split('\n')
    sections.set(heading.slice(3).trim(), body.join('\n').trim())
  }
  return { head: head.trim(), sections }
}

export interface Llms {
  text: string
  /** What the chatbot counts: the whole text, trimmed */
  size: number
  /** The Drupal issues listed, of all of them */
  issuesShown: number
  issues: number
}

/**
 * The whole of /llms.txt: the profile's sections, then the generated ones. A profile
 * section with a generated section's heading (Drupal contributions) opens that section.
 */
export function llms(): Llms {
  const { head, sections } = profileParts()
  const headings = ['Pages', 'Projects', 'Tools', 'Drupal contributions']
  const fixed = new Map([
    ['Pages', pages(new Set(headings))],
    ['Projects', projects()],
    ['Tools', tools()],
  ])
  const issues = drupalIssues()

  const write = (shown: number): Llms => {
    const generated = new Map(fixed).set('Drupal contributions', drupalContributions(issues, shown))
    const out = [head]
    for (const [heading, body] of sections) {
      if (body && !generated.has(heading)) out.push(`## ${heading}\n\n${body}`)
    }
    for (const heading of headings) {
      const body = [sections.get(heading), generated.get(heading)].filter(Boolean).join('\n\n')
      out.push(`## ${heading}\n\n${body}`)
    }
    const text = withAge(`${out.join('\n\n')}\n`)
    return { text, size: text.trim().length, issuesShown: shown, issues: issues.length }
  }

  // As many Drupal issues as fit, latest first. If not even the first fits, the size is
  // over the budget with none, and the build fails on it.
  let result = write(issues.length)
  for (let shown = issues.length - 1; shown >= 0 && result.size > LLMS_MAX_CHARS; shown--) {
    result = write(shown)
  }
  return result
}
