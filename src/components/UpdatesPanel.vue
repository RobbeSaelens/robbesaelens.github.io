<template>
  <section class="updates" aria-labelledby="updates-title">
    <div class="terminal-window">
      <div class="terminal-chrome" aria-hidden="true">
        <div class="chrome-dots">
          <span class="dot dot--red"></span>
          <span class="dot dot--yellow"></span>
          <span class="dot dot--green"></span>
        </div>
        <span class="chrome-title">updates.sh</span>
        <div class="chrome-spacer"></div>
      </div>

      <div class="terminal-body">
        <div class="toolbar">
          <div>
            <h2 id="updates-title" class="updates-title">{{ t('title') }}</h2>
            <p class="toolbar-meta">{{ t('subtitle') }}</p>
            <p v-if="latest" class="toolbar-meta">
              <time :datetime="latest.finishedAt">{{
                t('lastChecked', { time: formatTime(latest.finishedAt), seconds: slowestSeconds })
              }}</time>
            </p>
          </div>
          <div class="toolbar-actions">
            <button type="button" class="btn" :disabled="phase !== 'ready' || scanning" @click="scan">
              <RefreshCw class="btn-icon" :class="{ spin: scanning }" aria-hidden="true" />
              {{ scanning ? t('checking') : t('check') }}
            </button>
          </div>
        </div>

        <p class="sr-only" aria-live="polite">{{ scanning ? t('checking') : '' }}</p>

        <p v-if="phase === 'connecting'" class="muted">{{ t('connecting') }}</p>

        <div v-else-if="phase === 'offline'" class="notice" role="status">
          <p class="notice-title">{{ t('offline') }}</p>
          <p class="muted">{{ t('offlineHint') }}</p>
          <code class="command">cd ~/projects/project-updater &amp;&amp; npm start</code>
        </div>

        <p v-if="error" class="error-line" role="alert">{{ t('failed', { error }) }}</p>

        <p v-if="phase === 'ready' && !latest && !scanning" class="muted">{{ t('neverChecked') }}</p>

        <ul v-if="latest" class="overview" :aria-label="t('projects')">
          <li v-for="item in overview" :key="item.status" class="badge" :class="`badge--${TONE[item.status]}`">
            <span aria-hidden="true">{{ GLYPH[item.status] }}</span>
            {{ item.count }} {{ t(`status.${item.status}`) }}
          </li>
        </ul>

        <div v-if="latest" class="project-list" :aria-busy="scanning ? 'true' : 'false'">
          <article
            v-for="p in latest.results"
            :key="p.id"
            class="project-card"
            :class="`project-card--${toneFor(p)}`"
            :aria-labelledby="`upd-${p.id}-title`"
          >
            <header class="project-header">
              <div class="project-heading">
                <h3 :id="`upd-${p.id}-title`" class="project-name">{{ p.name }}</h3>
                <p v-if="p.git" class="project-meta">
                  {{ p.git.branch ? t('branch', { branch: p.git.branch }) : t('detached') }}
                  <span aria-hidden="true"> · </span>
                  <span :class="{ 'is-dirty': p.git.dirty > 0 }">
                    {{ p.git.dirty > 0 ? t('dirty', { count: p.git.dirty }) : t('clean') }}
                  </span>
                </p>
              </div>
              <p class="badge" :class="`badge--${toneFor(p)}`">
                <span aria-hidden="true">{{ GLYPH[statusKey(p)] }}</span>
                {{ t(`status.${statusKey(p)}`) }}
              </p>
            </header>

            <ul class="counts">
              <template v-for="s in SEVERITIES" :key="s">
                <li v-if="p.counts[s] > 0" class="count" :class="`count--${s}`">
                  {{ p.counts[s] }} {{ t(`severity.${s}`) }}
                </li>
              </template>
              <li v-if="p.counts.recommended > 0" class="count count--updates">
                {{ t('recommended', { count: p.counts.recommended }) }}
              </li>
              <li v-if="p.counts.major > 0" class="count count--major">
                {{ t('major', { count: p.counts.major }) }}
              </li>
            </ul>

            <button
              type="button"
              class="btn btn--ghost btn--sm details-toggle"
              :aria-expanded="isOpen(p.id) ? 'true' : 'false'"
              :aria-controls="`upd-${p.id}-details`"
              @click="toggle(p.id)"
            >
              <ChevronDown class="btn-icon toggle-icon" :class="{ open: isOpen(p.id) }" aria-hidden="true" />
              {{ isOpen(p.id) ? t('hideDetails') : t('showDetails') }}
            </button>

            <div v-if="isOpen(p.id)" :id="`upd-${p.id}-details`" class="details">
              <section v-if="p.errors.length" class="detail-section">
                <h4 class="detail-title detail-title--error">{{ t('section.errors') }}</h4>
                <ul class="plain-list">
                  <li v-for="(e, i) in p.errors" :key="i" class="error-text">{{ e }}</li>
                </ul>
              </section>

              <section class="detail-section">
                <h4 class="detail-title">{{ t('section.security') }} ({{ p.security.length }})</h4>
                <p v-if="!p.security.length" class="muted">{{ t('none') }}</p>
                <ul v-else class="plain-list">
                  <li v-for="f in p.security" :key="`${f.ecosystem}:${f.package}`" class="finding">
                    <div class="finding-head">
                      <span class="sev" :class="`sev--${f.severity}`">{{ t(`severity.${f.severity}`) }}</span>
                      <span class="pkg">{{ f.package }}</span>
                      <span class="eco">{{ f.ecosystem }}</span>
                    </div>
                    <p class="finding-meta">
                      {{ t(`fix.${f.fix}`) }}
                      <template v-if="f.direct"> · {{ t('direct') }}</template>
                      <template v-else-if="f.via.length"> · {{ t('via', { packages: f.via.join(', ') }) }}</template>
                    </p>
                    <ul v-if="f.advisories.length" class="advisories">
                      <li v-for="(a, i) in f.advisories" :key="i">
                        <a v-if="a.url" :href="a.url" target="_blank" rel="noopener noreferrer">{{ a.title }}</a>
                        <span v-else>{{ a.title }}</span>
                      </li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section class="detail-section">
                <h4 class="detail-title">{{ t('section.updates') }} ({{ p.updates.length }})</h4>
                <p v-if="!p.updates.length" class="muted">{{ t('none') }}</p>
                <ul v-else class="version-list">
                  <li v-for="u in p.updates" :key="`${u.ecosystem}:${u.package}`">
                    <span class="pkg">{{ u.package }}</span>
                    <span class="ver">{{ u.current }} → {{ u.target }}</span>
                    <span class="type">{{ u.type }}</span>
                  </li>
                </ul>
              </section>

              <section class="detail-section">
                <h4 class="detail-title">{{ t('section.majors') }} ({{ p.majors.length }})</h4>
                <p v-if="!p.majors.length" class="muted">{{ t('none') }}</p>
                <ul v-else class="version-list">
                  <li v-for="u in p.majors" :key="`${u.ecosystem}:${u.package}`">
                    <span class="pkg">{{ u.package }}</span>
                    <span class="ver">{{ u.current }} → {{ u.target }}</span>
                  </li>
                </ul>
              </section>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Dev-only panel for the local project-updater service (~/projects/project-updater).
// Status.vue only loads it when import.meta.env.DEV is true, so production
// builds never include it. Its strings live here, not in the shared locale
// files, for the same reason.
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, RefreshCw } from 'lucide-vue-next'

type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'info' | 'unknown'
type ProjectStatus = 'security' | 'updates' | 'up-to-date' | 'error'
type StatusKey = 'security' | 'updates' | 'upToDate' | 'error'

interface Finding {
  ecosystem: string
  package: string
  severity: Severity
  direct: boolean | null
  advisories: { title: string; url: string | null; severity: Severity }[]
  via: string[]
  fix: 'in-range' | 'major' | 'none' | 'unknown'
}
interface Update {
  ecosystem: string
  package: string
  current: string
  target: string
  type: 'major' | 'minor' | 'patch'
}
interface ProjectScan {
  id: string
  name: string
  durationMs: number
  git: { branch: string | null; dirty: number } | null
  security: Finding[]
  updates: Update[]
  majors: Update[]
  counts: Record<Severity | 'recommended' | 'major', number>
  status: ProjectStatus
  errors: string[]
}
interface LatestScan {
  finishedAt: string
  results: ProjectScan[]
}

const en = {
  title: 'Updates',
  subtitle: 'Security and dependency check of your local projects. Only visible in development.',
  check: 'Check for updates',
  checking: 'Checking…',
  connecting: 'Connecting to the local updater…',
  lastChecked: 'Last checked {time} ({seconds} s)',
  neverChecked: 'Not checked yet.',
  offline: "The local updater isn't running.",
  offlineHint: 'Start it, then reload this page:',
  failed: 'Check failed: {error}',
  projects: 'Projects',
  branch: 'on {branch}',
  detached: 'detached HEAD',
  dirty: '{count} uncommitted',
  clean: 'clean',
  recommended: '{count} recommended',
  major: '{count} major',
  showDetails: 'Show details',
  hideDetails: 'Hide details',
  status: { security: 'Security fixes', updates: 'Updates available', upToDate: 'Up to date', error: 'Check failed' },
  severity: { critical: 'critical', high: 'high', moderate: 'moderate', low: 'low', info: 'info', unknown: 'unknown' },
  section: {
    security: 'Security',
    updates: 'Recommended updates (minor and patch)',
    majors: 'Major updates (never applied automatically)',
    errors: 'Problems',
  },
  fix: {
    'in-range': 'fixable within the current major',
    major: 'fix needs a major upgrade',
    none: 'no fix released yet',
    unknown: 'fix is worked out during the update',
  },
  direct: 'direct dependency',
  via: 'via {packages}',
  none: 'None.',
}

// `typeof en` makes TypeScript reject a missing or extra Dutch key.
const nl: typeof en = {
  title: 'Updates',
  subtitle: 'Beveiligings- en dependencycontrole van je lokale projecten. Enkel zichtbaar in development.',
  check: 'Controleer op updates',
  checking: 'Bezig met controleren…',
  connecting: 'Verbinden met de lokale updater…',
  lastChecked: 'Laatst gecontroleerd om {time} ({seconds} s)',
  neverChecked: 'Nog niet gecontroleerd.',
  offline: 'De lokale updater draait niet.',
  offlineHint: 'Start hem en herlaad deze pagina:',
  failed: 'Controle mislukt: {error}',
  projects: 'Projecten',
  branch: 'op {branch}',
  detached: 'losgekoppelde HEAD',
  dirty: '{count} niet gecommit',
  clean: 'proper',
  recommended: '{count} aanbevolen',
  major: '{count} major',
  showDetails: 'Toon details',
  hideDetails: 'Verberg details',
  status: { security: 'Beveiligingsfixes', updates: 'Updates beschikbaar', upToDate: 'Up-to-date', error: 'Controle mislukt' },
  severity: { critical: 'kritiek', high: 'hoog', moderate: 'matig', low: 'laag', info: 'info', unknown: 'onbekend' },
  section: {
    security: 'Beveiliging',
    updates: 'Aanbevolen updates (minor en patch)',
    majors: 'Major-updates (nooit automatisch toegepast)',
    errors: 'Problemen',
  },
  fix: {
    'in-range': 'te fixen binnen de huidige major',
    major: 'fix vereist een major-upgrade',
    none: 'nog geen fix uitgebracht',
    unknown: 'fix wordt bepaald tijdens de update',
  },
  direct: 'directe dependency',
  via: 'via {packages}',
  none: 'Geen.',
}

const { t, locale } = useI18n({ useScope: 'local', messages: { en, nl } })

const UPDATER_URL = (import.meta.env.VITE_UPDATER_URL as string | undefined) || 'http://127.0.0.1:8795'
const SEVERITIES: Severity[] = ['critical', 'high', 'moderate', 'low', 'unknown']
const STATUS_KEY: Record<ProjectStatus, StatusKey> = {
  security: 'security',
  updates: 'updates',
  'up-to-date': 'upToDate',
  error: 'error',
}
const GLYPH: Record<StatusKey, string> = { security: '✗', updates: '↑', upToDate: '✓', error: '!' }
const TONE: Record<StatusKey, string> = { security: 'down', updates: 'info', upToDate: 'ok', error: 'degraded' }

const phase = ref<'connecting' | 'ready' | 'offline'>('connecting')
const scanning = ref(false)
const error = ref('')
const latest = ref<LatestScan | null>(null)
const open = ref(new Set<string>())

const statusKey = (p: ProjectScan): StatusKey => STATUS_KEY[p.status]

/** Security findings that are only moderate or low are amber, not red. */
function toneFor(p: ProjectScan): string {
  if (p.status === 'security' && p.counts.critical + p.counts.high === 0) return 'degraded'
  return TONE[statusKey(p)]
}

const overview = computed(() => {
  const counts = new Map<StatusKey, number>()
  for (const p of latest.value?.results ?? []) counts.set(statusKey(p), (counts.get(statusKey(p)) ?? 0) + 1)
  return (['security', 'updates', 'error', 'upToDate'] as StatusKey[])
    .filter((s) => counts.has(s))
    .map((status) => ({ status, count: counts.get(status)! }))
})

const slowestSeconds = computed(() =>
  Math.max(0, ...(latest.value?.results ?? []).map((p) => p.durationMs / 1000)).toFixed(1),
)

const isOpen = (id: string) => open.value.has(id)
function toggle(id: string) {
  const next = new Set(open.value)
  if (!next.delete(id)) next.add(id)
  open.value = next
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(locale.value === 'nl' ? 'nl-BE' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${UPDATER_URL}${path}`, { ...init, cache: 'no-store' })
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
  return body as T
}

async function scan() {
  scanning.value = true
  error.value = ''
  try {
    latest.value = await api<LatestScan>('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    scanning.value = false
  }
}

onMounted(async () => {
  try {
    await api('/api/health')
  } catch {
    phase.value = 'offline'
    return
  }
  phase.value = 'ready'
  try {
    latest.value = await api<LatestScan | null>('/api/scan/latest')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
})
</script>

<style scoped>
.updates {
  margin-top: 2rem;
}

/* Same window, buttons and badges as the status dashboard above. */
.terminal-window {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 20px 40px -4px rgba(0, 0, 0, 0.08),
    0 0 0 1px var(--color-border), 0 0 60px -10px var(--color-accent-soft);
}
.terminal-chrome {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.chrome-dots {
  display: flex;
  gap: 6px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  opacity: 0.85;
}
.dot--red {
  background: #ef4444;
}
.dot--yellow {
  background: #f59e0b;
}
.dot--green {
  background: #22c55e;
}
.chrome-title {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-align: center;
}
.chrome-spacer {
  width: 54px;
}
.terminal-body {
  padding: 1.5rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.updates-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.toolbar-meta {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--status-label);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-accent);
  background: var(--color-surface);
  border: 1px solid var(--color-border-glow);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
}
.btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn--ghost {
  color: var(--status-label);
  border-color: var(--color-border);
}
.btn--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}
.btn-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
.spin {
  animation: updates-spin 1s linear infinite;
}
@keyframes updates-spin {
  to {
    transform: rotate(360deg);
  }
}

.muted {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--status-label);
}
.notice {
  padding: 1rem;
  border: 1px dashed var(--color-border-glow);
  border-radius: 10px;
}
.notice-title {
  margin: 0 0 0.25rem;
  font-weight: 700;
}
.command {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.8125rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
.error-line {
  margin: 0 0 1rem;
  color: var(--status-down);
  font-size: 0.875rem;
}

.overview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0;
  padding: 0.2rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid currentColor;
  border-radius: 999px;
}
.badge--ok {
  color: var(--status-ok);
  background: var(--status-ok-bg);
}
.badge--degraded {
  color: var(--status-warn);
  background: var(--status-warn-bg);
}
.badge--down {
  color: var(--status-down);
  background: var(--status-down-bg);
}
.badge--info {
  color: var(--status-info);
  background: var(--status-muted-bg);
}

.project-list {
  display: grid;
  gap: 1rem;
}
.project-card {
  padding: 1.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-left-width: 4px;
  border-radius: 12px;
}
.project-card--ok {
  border-left-color: var(--status-ok);
}
.project-card--down {
  border-left-color: var(--status-down);
}
.project-card--degraded {
  border-left-color: var(--status-warn);
}
.project-card--info {
  border-left-color: var(--status-info);
}
.project-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}
.project-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}
.project-meta {
  margin: 0.2rem 0 0;
  font-size: 0.8125rem;
  color: var(--status-label);
}
.is-dirty {
  color: var(--status-warn);
  font-weight: 700;
}

.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0 0 0.85rem;
  padding: 0;
  list-style: none;
}
.count {
  padding: 0.15rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  background: var(--status-muted-bg);
  color: var(--status-label);
}
.count--critical,
.count--high {
  color: var(--status-down);
  background: var(--status-down-bg);
}
.count--moderate,
.count--low {
  color: var(--status-warn);
  background: var(--status-warn-bg);
}
.count--updates {
  color: var(--status-info);
}

.toggle-icon {
  transition: transform 0.2s ease;
}
.toggle-icon.open {
  transform: rotate(180deg);
}

.details {
  display: grid;
  gap: 1.25rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--color-border);
}
.detail-title {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--status-label);
}
.detail-title--error,
.error-text {
  color: var(--status-down);
}
.plain-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
}
.finding-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}
.sev {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.sev--critical,
.sev--high {
  color: var(--status-down);
}
.sev--moderate,
.sev--low {
  color: var(--status-warn);
}
.sev--info,
.sev--unknown {
  color: var(--status-label);
}
.pkg {
  font-weight: 700;
  word-break: break-all;
}
.eco,
.type {
  font-size: 0.7rem;
  color: var(--status-label);
}
.finding-meta {
  margin: 0.15rem 0 0;
  color: var(--status-label);
}
.advisories {
  margin: 0.3rem 0 0;
  padding-left: 1.1rem;
}
.advisories a {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.version-list {
  display: grid;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
}
.version-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
}
.ver {
  color: var(--status-label);
}

@media (max-width: 640px) {
  .terminal-body {
    padding: 1rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .spin,
  .toggle-icon {
    animation: none;
    transition: none;
  }
}
</style>
