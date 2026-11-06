// Drupal contributions for the /drupal page.
//
// Why a script: drupal.org asks API users to send a descriptive User-Agent, make
// requests one at a time and cache what they get. So the page never asks
// drupal.org itself: `npm run drupal` fetches everything here, one request after
// the other, and writes src/data/drupal.json, which is committed and imported by
// the page. The deploy workflow runs it before every build and keeps the
// committed file when it fails.
//
// Sources, all public and without a token:
// - drupal.org's REST API (api-d7): the issues he opened, and the issues he
//   commented on (his comments, of which only the issue is used)
// - git.drupalcode.org (GitLab): his merge requests, his comments on issues of
//   projects whose issue queue moved to GitLab (drupal.org then answers with a
//   new_url), and issues he opened there
// - new.drupal.org: his contribution records (credits)
//
// Public on the site: titles, projects, statuses, dates and URLs. No comment
// text, no e-mail addresses, nothing about other people.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src/data/drupal.json')

const USERNAME = 'robbesaelens'
/** His drupal.org user id (https://www.drupal.org/u/robbesaelens); the api-d7 filters need it. */
const UID = 3841307

const DRUPAL = 'https://www.drupal.org'
const GITLAB = 'https://git.drupalcode.org'
const CREDITS = `https://new.drupal.org/contribution-records-by-user?username=${USERNAME}`

const USER_AGENT = 'robbesaelens-portfolio (+https://robbesaelens.github.io)'
const TIMEOUT_MS = 20_000
/** Pause between two requests: one at a time, and not in a hurry. */
const PAUSE_MS = 300
/** Safety net for pagination. */
const MAX_PAGES = 20

// ── drupal.org's numbers → the keys the page translates ──
const STATUS = {
  1: 'active',
  2: 'fixed',
  3: 'closed-duplicate',
  4: 'postponed',
  5: 'closed-wont-fix',
  6: 'closed-works-as-designed',
  7: 'closed-fixed',
  8: 'needs-review',
  13: 'needs-work',
  14: 'rtbc',
  15: 'patch-to-be-ported',
  16: 'postponed-needs-info',
  17: 'closed-outdated',
  18: 'closed-cannot-reproduce',
}
const PRIORITY = { 400: 'critical', 300: 'major', 200: 'normal', 100: 'minor' }
const CATEGORY = { 1: 'bug', 2: 'task', 3: 'feature', 4: 'support', 5: 'plan' }

/** GitLab's state:: labels on drupal.org projects, for open issues. */
const GITLAB_STATE = {
  new: 'active',
  accepted: 'active',
  needsWork: 'needs-work',
  needsReview: 'needs-review',
  rtbc: 'rtbc',
  fixed: 'fixed',
  postponed: 'postponed',
  needsInfo: 'postponed-needs-info',
  waitingConfirmation: 'postponed-needs-info',
}

// ── HTTP: one request at a time, with a time limit and one retry ──

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastRequest = 0

/**
 * GETs JSON. With `missing: true`, a 403 or 404 returns null instead of failing
 * (an unpublished or deleted issue). Anything else that goes wrong throws, with
 * the URL in the message.
 */
async function get(url, { missing = false } = {}) {
  for (let attempt = 1; ; attempt++) {
    const wait = lastRequest + PAUSE_MS - Date.now()
    if (wait > 0) await sleep(wait)
    let res
    let body
    try {
      res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (missing && (res.status === 403 || res.status === 404)) return { body: null, headers: res.headers }
      if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`)
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { final: true })
      const text = await res.text()
      try {
        body = JSON.parse(text)
      } catch {
        throw Object.assign(new Error(`not JSON (starts with ${JSON.stringify(text.slice(0, 40))})`), { final: true })
      }
    } catch (error) {
      const reason = error.name === 'TimeoutError' ? `no answer within ${TIMEOUT_MS / 1000} s` : error.message
      if (!error.final && attempt < 2) {
        console.warn(`  retrying ${url}: ${reason}`)
        lastRequest = Date.now() + 2000
        continue
      }
      throw new Error(`${url}: ${reason}`)
    } finally {
      lastRequest = Math.max(lastRequest, Date.now())
    }
    return { body, headers: res.headers }
  }
}

/** Every item of a paged list: api-d7 (`next`), GitLab (`x-next-page`) or JSON:API (`links.next`). */
async function getAll(url, pick) {
  const items = []
  for (let page = 0, next = url; next; page++) {
    if (page === MAX_PAGES) throw new Error(`${url}: more than ${MAX_PAGES} pages`)
    const { body, headers } = await get(next)
    items.push(...pick(body))
    if (body?.next) {
      // api-d7 leaves the .json off its next link, which then answers in HTML
      next = body.next.replace(/\/api-d7\/(\w+)\?/, '/api-d7/$1.json?')
    } else if (body?.links?.next?.href) {
      next = body.links.next.href
    } else if (headers.get('x-next-page')) {
      const u = new URL(next)
      u.searchParams.set('page', headers.get('x-next-page'))
      next = u.href
    } else {
      next = null
    }
  }
  return items
}

// ── Projects: machine name → name and drupal.org page ──

const projects = new Map()

function addProject(node) {
  const id = node.field_project_machine_name
  if (id && !projects.has(id)) projects.set(id, { name: node.title.trim(), url: node.url })
  return id
}

/** A drupal.org project by its node id (api-d7 issues point at it that way). */
const projectsByNid = new Map()
async function projectByNid(nid) {
  if (!projectsByNid.has(nid)) {
    const { body } = await get(`${DRUPAL}/api-d7/node/${nid}.json`)
    projectsByNid.set(nid, addProject(body))
  }
  return projectsByNid.get(nid)
}

/** A drupal.org project by its machine name; a GitLab-only one keeps its GitLab page. */
async function projectByName(id, fallbackUrl) {
  if (!projects.has(id)) {
    const { body } = await get(`${DRUPAL}/api-d7/node.json?field_project_machine_name=${encodeURIComponent(id)}`)
    const node = body.list?.find((n) => n.field_project_machine_name === id)
    if (node) addProject(node)
    else projects.set(id, { name: id, url: fallbackUrl ?? `${GITLAB}/project/${id}` })
  }
  return id
}

/** A GitLab project id → the drupal.org machine name ("project/teamleader" → "teamleader"). */
const gitlabProjects = new Map()
async function projectByGitlabId(projectId) {
  if (!gitlabProjects.has(projectId)) {
    const { body } = await get(`${GITLAB}/api/v4/projects/${projectId}`)
    const id = body.path_with_namespace.replace(/^project\//, '')
    gitlabProjects.set(projectId, await projectByName(id, body.web_url))
  }
  return gitlabProjects.get(projectId)
}

// ── Issues, from either side, in one shape ──

const iso = (seconds) => new Date(Number(seconds) * 1000).toISOString()

async function fromDrupal(node) {
  return {
    id: Number(node.nid),
    title: node.title.trim(),
    url: node.url,
    project: await projectByNid(node.field_project.id),
    status: STATUS[node.field_issue_status] ?? 'active',
    priority: PRIORITY[node.field_issue_priority] ?? 'normal',
    category: CATEGORY[node.field_issue_category] ?? 'task',
    version: node.field_issue_version || null,
    created: iso(node.created),
    updated: iso(node.changed),
  }
}

async function fromGitlab(issue) {
  const label = (prefix) => issue.labels.find((l) => l.startsWith(prefix))?.slice(prefix.length)
  const state = label('state::')
  const status =
    issue.state === 'closed' ? (state === 'fixed' ? 'closed-fixed' : 'closed') : GITLAB_STATE[state] ?? 'active'
  const version = issue.labels.find((l) => /^v?\d+\.(\d+|x)/.test(l))?.replace(/^v/, '') ?? null
  const category = label('category::')
  return {
    id: issue.iid,
    title: issue.title.trim(),
    url: issue.web_url,
    project: await projectByGitlabId(issue.project_id),
    status,
    priority: label('priority::') ?? 'normal',
    category: ['bug', 'task', 'feature', 'support', 'plan'].includes(category) ? category : 'task',
    version,
    created: new Date(issue.created_at).toISOString(),
    updated: new Date(issue.updated_at).toISOString(),
  }
}

/** An issue that moved to GitLab, by the new_url drupal.org gives for it. */
async function movedIssue(newUrl) {
  const match = newUrl.match(/git\.drupalcode\.org\/(.+?)\/-\/(?:work_items|issues)\/(\d+)/)
  if (!match) return null
  const { body } = await get(`${GITLAB}/api/v4/projects/${encodeURIComponent(match[1])}/issues/${match[2]}`, {
    missing: true,
  })
  return body ? fromGitlab(body) : null
}

/**
 * An issue by number. Drupal.org first, unless the GitLab project is known; a
 * project whose queue moved to GitLab answers with a new_url pointing there.
 */
async function issue(number, gitlabProjectId) {
  if (gitlabProjectId) {
    const { body } = await get(`${GITLAB}/api/v4/projects/${gitlabProjectId}/issues/${number}`, { missing: true })
    if (body) return fromGitlab(body)
  }
  const { body } = await get(`${DRUPAL}/api-d7/node/${number}.json`, { missing: true })
  if (!body) return null
  if (body.new_url) return movedIssue(body.new_url)
  return body.type === 'project_issue' ? fromDrupal(body) : null
}

/** The issue number in a merge request ("Issue #3519846: …", branch "3519846-…"). */
const issueOfMergeRequest = (mr) =>
  Number(mr.title.match(/#(\d{5,})/)?.[1] ?? mr.source_branch.match(/^(\d{5,})-/)?.[1]) || null

/** The issue number in a link to it (drupal.org node, issue page or GitLab work item). */
const issueOfLink = (url) => Number(url?.match(/\/(?:node|issues|work_items)\/(\d+)/)?.[1]) || null

// ── Fetch, then write ──

async function main() {
  console.log(`Drupal contributions of ${USERNAME}`)

  // Issues he opened: on drupal.org, and on GitLab for projects that moved there
  const createdNodes = await getAll(
    `${DRUPAL}/api-d7/node.json?type=project_issue&author=${UID}&sort=created&direction=DESC&limit=100`,
    (b) => b.list ?? [],
  )
  const createdOnGitlab = await getAll(
    `${GITLAB}/api/v4/issues?author_username=${USERNAME}&scope=all&state=all&per_page=100`,
    (b) => b,
  )
  console.log(`  ${createdNodes.length + createdOnGitlab.length} issues opened`)

  // Everything he took part in: comments, merge requests, credits
  const comments = await getAll(
    `${DRUPAL}/api-d7/comment.json?author=${UID}&sort=created&direction=DESC&limit=100`,
    (b) => b.list ?? [],
  )
  const events = await getAll(`${GITLAB}/api/v4/users/${USERNAME}/events?per_page=100`, (b) => b)
  const mergeRequests = await getAll(
    `${GITLAB}/api/v4/merge_requests?author_username=${USERNAME}&scope=all&state=all&per_page=100`,
    (b) => b,
  )
  const records = await getAll(CREDITS, (b) => b.data ?? [])
  console.log(`  ${comments.length} comments, ${mergeRequests.length} merge requests, ${records.length} credits`)

  const created = new Map()
  for (const node of createdNodes) {
    // A node that moved to GitLab has no fields here: look it up there
    const item = node.new_url ? await movedIssue(node.new_url) : await fromDrupal(node)
    if (item) created.set(item.id, item)
  }
  for (const gl of createdOnGitlab) {
    const item = await fromGitlab(gl)
    created.set(item.id, item)
  }

  /** Issue number → GitLab project id, where known; drupal.org otherwise. */
  const joinedNumbers = new Map()
  const join = (number, gitlabProjectId = null) => {
    if (number && !created.has(number) && !joinedNumbers.get(number)) joinedNumbers.set(number, gitlabProjectId)
  }
  for (const c of comments) join(Number(c.node?.id))
  for (const e of events) {
    const note = e.note
    if (e.action_name === 'commented on' && ['Issue', 'WorkItem'].includes(note?.noteable_type)) {
      join(note.noteable_iid, e.project_id)
    }
  }
  for (const mr of mergeRequests) join(issueOfMergeRequest(mr), mr.project_id)
  for (const r of records) join(issueOfLink(r.attributes.field_source_link?.uri))

  const joined = new Map()
  for (const [number, gitlabProjectId] of joinedNumbers) {
    const item = await issue(number, gitlabProjectId)
    if (item) joined.set(item.id, item)
    else console.warn(`  skipped #${number}: not an issue, or not public`)
  }
  console.log(`  ${joined.size} other issues taken part in`)

  const allIssues = new Map([...joined, ...created])

  const credits = []
  for (const r of records) {
    const a = r.attributes
    const number = issueOfLink(a.field_source_link?.uri)
    const known = allIssues.get(number)
    credits.push({
      title: a.title.trim(),
      project: known?.project ?? (await projectByName(a.field_project_name)),
      url: known?.url ?? a.field_source_link?.uri ?? `https://new.drupal.org${a.path?.alias ?? ''}`,
      issue: number,
      date: new Date(a.field_last_status_change ?? a.changed).toISOString(),
    })
  }

  const merges = []
  for (const mr of mergeRequests) {
    const number = issueOfMergeRequest(mr)
    merges.push({
      title: allIssues.get(number)?.title ?? mr.title.trim(),
      ref: mr.references?.short ?? `!${mr.iid}`,
      project: await projectByGitlabId(mr.project_id),
      state: mr.state,
      url: mr.web_url,
      issue: number,
      created: new Date(mr.created_at).toISOString(),
      merged: mr.merged_at ? new Date(mr.merged_at).toISOString() : null,
    })
  }

  // ── Write: sorted, so a refresh only shows what changed ──

  const newestFirst = (key) => (a, b) => b[key].localeCompare(a[key]) || String(a.url).localeCompare(String(b.url))
  const data = {
    generatedAt: new Date().toISOString(),
    user: USERNAME,
    credits: credits.sort(newestFirst('date')),
    mergeRequests: merges.sort(newestFirst('created')),
    issuesCreated: [...created.values()].sort(newestFirst('created')),
    issuesJoined: [...joined.values()].sort(newestFirst('updated')),
    projects: Object.fromEntries([...projects].sort(([a], [b]) => a.localeCompare(b))),
  }

  // Every list empty means an API changed or answered nonsense: keep the old file.
  if (!data.credits.length && !data.mergeRequests.length && !data.issuesCreated.length && !data.issuesJoined.length) {
    throw new Error('found no contributions at all: not overwriting src/data/drupal.json')
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`)
  const counts = [
    `${data.issuesCreated.length} opened`,
    `${data.issuesJoined.length} joined`,
    `${data.credits.length} credits`,
    `${data.mergeRequests.length} merge requests`,
  ]
  console.log(`wrote ${OUT.replace(`${ROOT}/`, '')}: ${counts.join(', ')}`)
}

main().catch((error) => {
  console.error(`npm run drupal failed, src/data/drupal.json is unchanged: ${error.message}`)
  process.exit(1)
})
