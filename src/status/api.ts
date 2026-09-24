// Client for the private status worker behind /status (see README, "Private
// status page").
//
// Pure functions only: nothing here touches window, document or storage at
// import time, so it is safe to import from a prerendered component. Storage
// helpers guard for the server themselves and are only called from onMounted
// or event handlers.
//
// Everything the worker returns is treated as untrusted and normalized field
// by field before it reaches the template, which only ever uses text
// interpolation (never v-html). URLs are only kept when they are http(s), and
// Sentry permalinks only when they are https.

export const SESSION_STORAGE_KEY = 'status-session'

const AUTH_TIMEOUT_MS = 15_000
// The worker fans out to every upstream (health, stats, Sentry, uptime) with
// ~8 s timeouts each, so give /summary comfortably more than that.
const SUMMARY_TIMEOUT_MS = 25_000
// Treat a token as expired slightly early so a request never races its expiry.
const EXPIRY_SKEW_MS = 30_000
const DEFAULT_RETRY_AFTER_SECONDS = 15 * 60
const MAX_PROBLEMS = 20
const MAX_ISSUES = 20
const MAX_TEXT = 500

// ---------------------------------------------------------------------------
// Types (mirror the worker contract, after normalization)
// ---------------------------------------------------------------------------

export type LiveStatus = 'ok' | 'degraded' | 'down' | 'unknown'
export type UptimeStatus = 'up' | 'down' | 'paused' | 'unknown'
export type OverallStatus = 'ok' | 'degraded' | 'down' | 'unknown'
export type CheckName = 'database' | 'queue' | 'scheduler'
export type CheckinColor = 'green' | 'yellow' | 'orange' | 'red'
export type Section = 'uptime' | 'errors' | 'stats'

export const CHECK_NAMES: readonly CheckName[] = ['database', 'queue', 'scheduler']
export const CHECKIN_COLORS: readonly CheckinColor[] = ['green', 'yellow', 'orange', 'red']
export const KNOWN_REASONS: readonly string[] = [
  'database_unreachable',
  'queue_stuck',
  'scheduler_stale',
]

const LIVE_STATUSES: readonly LiveStatus[] = ['ok', 'degraded', 'down', 'unknown']
const UPTIME_STATUSES: readonly UptimeStatus[] = ['up', 'down', 'paused', 'unknown']

export interface StatusSession {
  token: string
  expiresAt: string
}

export interface LiveSummary {
  status: LiveStatus
  httpStatus: number | null
  responseTimeMs: number | null
  checks: Record<CheckName, boolean> | null
  reasons: string[]
  checkedAt: string | null
}

export interface UptimeSummary {
  provider: string
  status: UptimeStatus
  /** Percentages, 0-100. */
  uptime24h: number | null
  uptime7d: number | null
  uptime30d: number | null
  avgResponseMs: number | null
}

export interface ErrorIssue {
  id: string
  title: string
  culprit: string | null
  level: string
  count: number
  userCount: number
  lastSeen: string | null
  /** Only ever an https:// URL, otherwise null (rendered as plain text). */
  permalink: string | null
}

export interface ErrorsSummary {
  unresolvedCount: number
  countIsCapped: boolean
  newLast24h: number | null
  topIssues: ErrorIssue[]
}

/** The scan2talk /api/monitor/stats body. Aggregate counts only. */
export interface ProjectStats {
  generated_at: string | null
  timezone: string
  checkins: {
    today: number | null
    yesterday: number | null
    last_7_days: number | null
    today_by_color: Record<CheckinColor, number | null>
    urgent_today: number | null
    open: number | null
  }
  queue: {
    pending: number | null
    oldest_pending_minutes: number | null
    failed_last_24h: number | null
  }
  scheduler: {
    last_run_at: string | null
    minutes_ago: number | null
  }
}

export interface ProjectSummary {
  id: string
  name: string
  /** http(s) URL of the project, or null when missing/unsafe. */
  url: string | null
  live: LiveSummary
  uptime: UptimeSummary | null
  errors: ErrorsSummary | null
  stats: ProjectStats | null
  problems: string[]
}

export interface Summary {
  generatedAt: string | null
  projects: ProjectSummary[]
}

export type AuthResult =
  | { kind: 'ok'; session: StatusSession }
  | { kind: 'invalid-credentials' }
  | { kind: 'rate-limited'; retryAfterSeconds: number }
  | { kind: 'bad-request' }
  | { kind: 'network' }
  | { kind: 'http'; status: number }
  | { kind: 'invalid-response' }

export type SummaryResult =
  | { kind: 'ok'; summary: Summary }
  | { kind: 'unauthorized' }
  | { kind: 'network' }
  | { kind: 'http'; status: number }
  | { kind: 'invalid-response' }
  | { kind: 'aborted' }

// ---------------------------------------------------------------------------
// Small, strict coercion helpers
// ---------------------------------------------------------------------------

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function obj(value: unknown): JsonObject {
  return isObject(value) ? value : {}
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, MAX_TEXT) : fallback
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value.slice(0, MAX_TEXT) : null
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** A non-negative integer count; anything invalid becomes 0. */
function count(value: unknown): number {
  const n = numberOrNull(value)
  return n !== null && n >= 0 ? Math.floor(n) : 0
}

function countOrNull(value: unknown): number | null {
  const n = numberOrNull(value)
  return n !== null && n >= 0 ? Math.floor(n) : null
}

function isoOrNull(value: unknown): string | null {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

function strings(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item !== '')
    .slice(0, max)
    .map((item) => item.slice(0, MAX_TEXT))
}

/** Returns the URL only when it parses and uses one of the given protocols. */
function safeUrl(value: unknown, protocols: readonly string[]): string | null {
  if (typeof value !== 'string' || value === '') return null
  try {
    const url = new URL(value)
    return protocols.includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Normalization of the /summary body
// ---------------------------------------------------------------------------

function normalizeLive(raw: unknown): LiveSummary {
  const live = obj(raw)
  let checks: LiveSummary['checks'] = null
  if (isObject(live.checks)) {
    const c = live.checks
    checks = {
      database: c.database === true,
      queue: c.queue === true,
      scheduler: c.scheduler === true,
    }
  }
  return {
    status: oneOf(live.status, LIVE_STATUSES, 'unknown'),
    httpStatus: countOrNull(live.httpStatus),
    responseTimeMs: countOrNull(live.responseTimeMs),
    checks,
    reasons: strings(live.reasons, 10),
    checkedAt: isoOrNull(live.checkedAt),
  }
}

function normalizeUptime(raw: unknown): UptimeSummary | null {
  if (!isObject(raw)) return null
  return {
    provider: text(raw.provider),
    status: oneOf(raw.status, UPTIME_STATUSES, 'unknown'),
    uptime24h: numberOrNull(raw.uptime24h),
    uptime7d: numberOrNull(raw.uptime7d),
    uptime30d: numberOrNull(raw.uptime30d),
    avgResponseMs: countOrNull(raw.avgResponseMs),
  }
}

function normalizeIssue(raw: unknown, index: number): ErrorIssue {
  const issue = obj(raw)
  return {
    id: text(issue.id) || `issue-${index}`,
    title: text(issue.title) || '—',
    culprit: textOrNull(issue.culprit),
    level: text(issue.level) || 'error',
    count: count(issue.count),
    userCount: count(issue.userCount),
    lastSeen: isoOrNull(issue.lastSeen),
    permalink:
      typeof issue.permalink === 'string' && issue.permalink.startsWith('https://')
        ? safeUrl(issue.permalink, ['https:'])
        : null,
  }
}

function normalizeErrors(raw: unknown): ErrorsSummary | null {
  if (!isObject(raw)) return null
  const issues = Array.isArray(raw.topIssues) ? raw.topIssues.slice(0, MAX_ISSUES) : []
  return {
    unresolvedCount: count(raw.unresolvedCount),
    countIsCapped: raw.countIsCapped === true,
    newLast24h: countOrNull(raw.newLast24h),
    topIssues: issues.map(normalizeIssue),
  }
}

function normalizeStats(raw: unknown): ProjectStats | null {
  if (!isObject(raw)) return null
  const checkins = obj(raw.checkins)
  const byColor = obj(checkins.today_by_color)
  const queue = obj(raw.queue)
  const scheduler = obj(raw.scheduler)
  return {
    generated_at: isoOrNull(raw.generated_at),
    timezone: text(raw.timezone) || 'Europe/Brussels',
    checkins: {
      today: countOrNull(checkins.today),
      yesterday: countOrNull(checkins.yesterday),
      last_7_days: countOrNull(checkins.last_7_days),
      today_by_color: {
        green: countOrNull(byColor.green),
        yellow: countOrNull(byColor.yellow),
        orange: countOrNull(byColor.orange),
        red: countOrNull(byColor.red),
      },
      urgent_today: countOrNull(checkins.urgent_today),
      open: countOrNull(checkins.open),
    },
    queue: {
      pending: countOrNull(queue.pending),
      oldest_pending_minutes: countOrNull(queue.oldest_pending_minutes),
      failed_last_24h: countOrNull(queue.failed_last_24h),
    },
    scheduler: {
      last_run_at: isoOrNull(scheduler.last_run_at),
      minutes_ago: countOrNull(scheduler.minutes_ago),
    },
  }
}

function normalizeProject(raw: unknown, index: number): ProjectSummary {
  const project = obj(raw)
  const id = text(project.id) || `project-${index}`
  return {
    id,
    name: text(project.name) || id,
    url: safeUrl(project.url, ['https:', 'http:']),
    live: normalizeLive(project.live),
    uptime: normalizeUptime(project.uptime),
    errors: normalizeErrors(project.errors),
    stats: normalizeStats(project.stats),
    problems: strings(project.problems, MAX_PROBLEMS),
  }
}

/** Normalizes a /summary body, or returns null when it is not one at all. */
export function normalizeSummary(raw: unknown): Summary | null {
  if (!isObject(raw) || !Array.isArray(raw.projects)) return null
  return {
    generatedAt: isoOrNull(raw.generatedAt),
    projects: raw.projects.map(normalizeProject),
  }
}

// ---------------------------------------------------------------------------
// Derived values used by the dashboard
// ---------------------------------------------------------------------------

/**
 * One status per project: down if the live check or the uptime monitor says
 * down, degraded if the live check is degraded, ok if the live check is ok,
 * unknown otherwise.
 */
export function overallStatus(project: ProjectSummary): OverallStatus {
  if (project.live.status === 'down' || project.uptime?.status === 'down') return 'down'
  if (project.live.status === 'degraded') return 'degraded'
  if (project.live.status === 'ok') return 'ok'
  return 'unknown'
}

// problems[] entries look like "stats: HTTP 401" or "sentry: timeout". A null
// section with a matching entry was configured but failed; a null section
// without one is simply not configured for that project.
const PROBLEM_PREFIXES: Record<Section, readonly string[]> = {
  uptime: ['uptime', 'uptimerobot', 'ohdear'],
  errors: ['errors', 'sentry'],
  stats: ['stats'],
}

export function sectionHasProblem(problems: readonly string[], section: Section): boolean {
  return problems.some((problem) => {
    const head = problem.split(':', 1)[0].trim().toLowerCase()
    return PROBLEM_PREFIXES[section].includes(head)
  })
}

// ---------------------------------------------------------------------------
// Session storage (sessionStorage: gone when the tab closes)
// ---------------------------------------------------------------------------

function parseSession(raw: unknown): StatusSession | null {
  if (!isObject(raw)) return null
  const { token, expiresAt } = raw
  if (typeof token !== 'string' || token === '') return null
  if (typeof expiresAt !== 'string' || Number.isNaN(Date.parse(expiresAt))) return null
  return { token, expiresAt }
}

export function isSessionExpired(session: StatusSession, now: number = Date.now()): boolean {
  return Date.parse(session.expiresAt) - EXPIRY_SKEW_MS <= now
}

/** Reads a still-valid session, discarding a stale or malformed one. Client only. */
export function readStoredSession(): StatusSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const session = parseSession(JSON.parse(raw))
    if (!session || isSessionExpired(session)) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

/** Best effort: if storage is unavailable the session simply lives in memory. */
export function storeSession(session: StatusSession): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage disabled or full: nothing to do.
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Storage disabled: nothing stored to clear.
  }
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

type FetchOutcome =
  | { kind: 'response'; response: Response }
  | { kind: 'network' }
  | { kind: 'aborted' }

/**
 * fetch with a timeout and an optional caller signal. Never throws: a caller
 * abort is reported as 'aborted' (to be ignored), everything else that keeps
 * a response from arriving (offline, DNS, CORS rejection, timeout) as
 * 'network'. The browser cannot tell a CORS rejection from a network error.
 */
async function send(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<FetchOutcome> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const forwardAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', forwardAbort, { once: true })
  }

  try {
    const response = await fetch(url, {
      ...init,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    })
    return { kind: 'response', response }
  } catch {
    return signal?.aborted ? { kind: 'aborted' } : { kind: 'network' }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

function retryAfterSeconds(body: unknown, response: Response): number {
  const fromBody = numberOrNull(obj(body).retryAfter)
  const fromHeader = Number.parseInt(response.headers.get('Retry-After') ?? '', 10)
  const seconds =
    fromBody ?? (Number.isFinite(fromHeader) ? fromHeader : DEFAULT_RETRY_AFTER_SECONDS)
  return Math.min(Math.max(Math.ceil(seconds), 1), 24 * 60 * 60)
}

/** POST /auth with the passphrase. The passphrase only ever goes in the JSON body. */
export async function authenticate(baseUrl: string, passphrase: string): Promise<AuthResult> {
  const outcome = await send(
    `${baseUrl}/auth`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ passphrase }),
    },
    AUTH_TIMEOUT_MS,
  )
  if (outcome.kind !== 'response') return { kind: 'network' }

  const { response } = outcome
  const body = await readJson(response)

  if (response.status === 200) {
    const session = parseSession(body)
    return session ? { kind: 'ok', session } : { kind: 'invalid-response' }
  }
  if (response.status === 401) return { kind: 'invalid-credentials' }
  if (response.status === 429)
    return { kind: 'rate-limited', retryAfterSeconds: retryAfterSeconds(body, response) }
  if (response.status === 400) return { kind: 'bad-request' }
  return { kind: 'http', status: response.status }
}

/** GET /summary with the bearer token from /auth. */
export async function fetchSummary(
  baseUrl: string,
  token: string,
  signal?: AbortSignal,
): Promise<SummaryResult> {
  const outcome = await send(
    `${baseUrl}/summary`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    SUMMARY_TIMEOUT_MS,
    signal,
  )
  if (outcome.kind === 'aborted') return { kind: 'aborted' }
  if (outcome.kind === 'network') return { kind: 'network' }

  const { response } = outcome
  if (response.status === 401) return { kind: 'unauthorized' }
  if (response.status !== 200) return { kind: 'http', status: response.status }

  const summary = normalizeSummary(await readJson(response))
  return summary ? { kind: 'ok', summary } : { kind: 'invalid-response' }
}
