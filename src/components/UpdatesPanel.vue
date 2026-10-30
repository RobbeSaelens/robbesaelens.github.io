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

        <form v-if="phase === 'ready' && runsEnabled && !token" class="notice token-form" @submit.prevent="saveToken">
          <label for="upd-token" class="notice-title">{{ t('token.title') }}</label>
          <p class="muted">{{ t('token.hint') }}</p>
          <code class="command">pbcopy &lt; ~/.config/project-updater/token</code>
          <div class="token-row">
            <input
              id="upd-token"
              v-model.trim="tokenInput"
              class="input"
              type="password"
              autocomplete="off"
              spellcheck="false"
              :placeholder="t('token.placeholder')"
            />
            <button type="submit" class="btn btn--sm" :disabled="!tokenLooksValid">{{ t('token.save') }}</button>
          </div>
        </form>

        <section v-if="run" class="run" :class="`run--${RUN_TONE[run.status]}`" aria-labelledby="upd-run-title">
          <header class="project-header">
            <div class="project-heading">
              <h3 id="upd-run-title" class="project-name">{{ t('run.title', { name: run.projectName }) }}</h3>
              <p class="project-meta">
                <template v-if="run.branch">{{ run.branch }}<span aria-hidden="true"> · </span></template>
                {{ t('run.started', { time: formatTime(run.startedAt) }) }}
                <template v-if="run.claude?.costUsd != null"> · ${{ run.claude.costUsd.toFixed(2) }}</template>
              </p>
            </div>
            <div class="run-actions">
              <p class="badge" :class="`badge--${RUN_TONE[run.status]}`">
                <span aria-hidden="true">{{ RUN_GLYPH[run.status] }}</span>
                {{ t(`run.status.${RUN_STATUS_KEY[run.status]}`) }}
              </p>
              <button
                v-if="run.status === 'running'"
                type="button"
                class="btn btn--ghost btn--sm"
                :disabled="cancelling"
                @click="cancelRun"
              >
                {{ cancelling ? t('run.cancelling') : t('run.cancel') }}
              </button>
              <button v-else-if="!runActive" type="button" class="btn btn--ghost btn--sm" @click="closeRun">
                {{ t('run.close') }}
              </button>
            </div>
          </header>

          <p class="sr-only" aria-live="polite">{{ t(`run.status.${RUN_STATUS_KEY[run.status]}`) }}</p>

          <ol class="steps">
            <li v-for="s in STEPS" :key="s" class="step" :class="`step--${stepState(s)}`">
              <span aria-hidden="true">{{ STEP_GLYPH[stepState(s)] }}</span>
              {{ t(`run.step.${s}`) }}
              <span class="sr-only">({{ t(`run.stepState.${stepState(s)}`) }})</span>
            </li>
          </ol>

          <ul v-if="run.problems.length" class="plain-list problems">
            <li v-for="(problem, i) in run.problems" :key="i" class="error-text">{{ problem }}</li>
          </ul>

          <div v-if="run.status !== 'running'" class="details">
            <section v-if="run.claude?.summary" class="detail-section">
              <h4 class="detail-title">{{ t('run.summary') }}</h4>
              <p class="summary">{{ run.claude.summary }}</p>
            </section>

            <section v-if="checkRows.length" class="detail-section">
              <h4 class="detail-title">{{ t('run.checks') }}</h4>
              <table class="checks">
                <thead>
                  <tr>
                    <th scope="col">{{ t('run.check') }}</th>
                    <th scope="col">{{ t('run.before') }}</th>
                    <th scope="col">{{ t('run.after') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in checkRows" :key="row.name" :class="{ 'is-regression': run.regressions.includes(row.name) }">
                    <th scope="row">{{ row.name }}</th>
                    <td v-for="(c, i) in [row.before, row.after]" :key="i" :class="c ? (c.passed ? 'pass' : 'fail') : ''">
                      <template v-if="c">{{ c.passed ? t('run.passed') : t('run.failed') }}</template>
                      <template v-else>–</template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section v-if="run.before.counts" class="detail-section">
              <h4 class="detail-title">{{ t('section.security') }}</h4>
              <p class="summary">
                {{ t('run.findings', { before: findingTotal(run.before.counts), after: run.after.counts ? findingTotal(run.after.counts) : '–' }) }}
              </p>
              <p v-if="run.newAdvisories.length" class="error-text">
                {{ t('run.newAdvisories', { packages: run.newAdvisories.join(', ') }) }}
              </p>
            </section>

            <section class="detail-section">
              <h4 class="detail-title">{{ t('run.changes') }} ({{ run.changes.length }})</h4>
              <p v-if="!run.changes.length" class="muted">{{ t('none') }}</p>
              <ul v-else class="version-list">
                <li v-for="c in run.changes" :key="`${c.ecosystem}:${c.package}`">
                  <span class="pkg">{{ c.package }}</span>
                  <span class="ver">{{ c.from ?? t('run.added') }} → {{ c.to ?? t('run.removed') }}</span>
                  <span v-if="c.type" class="type">{{ c.type }}</span>
                  <span v-if="c.downgrade" class="type is-dirty">{{ t('run.downgrade') }}</span>
                </li>
              </ul>
            </section>

            <section v-if="run.claude?.skipped.length" class="detail-section">
              <h4 class="detail-title">{{ t('run.skipped') }}</h4>
              <ul class="plain-list">
                <li v-for="s in run.claude.skipped" :key="s.package"><span class="pkg">{{ s.package }}</span> · {{ s.reason }}</li>
              </ul>
            </section>

            <section v-if="run.claude?.denials.length" class="detail-section">
              <h4 class="detail-title">{{ t('run.denials') }}</h4>
              <ul class="plain-list">
                <li v-for="(d, i) in run.claude.denials" :key="i"><span class="pkg">{{ d.tool }}</span> · {{ d.detail }}</li>
              </ul>
            </section>

            <section v-if="canPublish" class="detail-section">
              <h4 class="detail-title">{{ t('run.files') }} ({{ run.files.length }})</h4>
              <ul class="version-list">
                <li v-for="f in run.files" :key="f"><span class="pkg">{{ f }}</span></li>
              </ul>
              <p class="muted review-hint">
                {{ t('run.review', { branch: run.branch, base: run.baseBranch }) }}
              </p>
            </section>

            <section v-if="canPublish" class="detail-section">
              <label for="upd-message" class="detail-title">{{ t('run.message') }}</label>
              <textarea
                id="upd-message"
                v-model="message"
                class="input message"
                rows="8"
                spellcheck="false"
                :disabled="run.status === 'committed' || runActive"
              ></textarea>
              <p v-if="run.status === 'committed'" class="why">{{ t('run.retryHint') }}</p>
            </section>

            <p v-if="run.status === 'pushed'" class="summary outcome outcome--ok">
              {{ t('run.pushed', { commit: run.commit?.slice(0, 7), base: run.baseBranch, branch: run.originalBranch ?? run.baseBranch }) }}
            </p>
            <p v-if="run.status === 'discarded'" class="summary outcome">
              {{ t('run.discarded', { branch: run.originalBranch ?? run.baseBranch }) }}
            </p>

            <div v-if="canPublish || canDiscard" class="card-actions">
              <button v-if="canPublish" type="button" class="btn btn--sm" :disabled="runActive || !message.trim()" @click="publishRun">
                {{ run.status === 'committed' ? t('run.retryPush', { base: run.baseBranch }) : t('run.publish', { base: run.baseBranch }) }}
              </button>
              <button v-if="canDiscard" type="button" class="btn btn--ghost btn--sm btn--danger" :disabled="runActive" @click="discardRun">
                {{ t('run.discard', { branch: run.originalBranch ?? run.baseBranch }) }}
              </button>
            </div>
          </div>

          <details class="log" :open="runActive">
            <summary>{{ t('run.log', { count: events.length }) }}</summary>
            <ol class="log-lines">
              <li v-for="e in visibleEvents" :key="e.seq" :class="`log--${e.kind}`">
                <span class="log-time">{{ clock(e.at) }}</span>
                {{ describe(e) }}
              </li>
            </ol>
          </details>
        </section>

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

            <div class="card-actions">
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
              <button
                v-if="runsEnabled && p.status !== 'up-to-date'"
                type="button"
                class="btn btn--sm"
                :disabled="!!updateBlock(p)"
                :aria-describedby="updateBlock(p) ? `upd-${p.id}-why` : undefined"
                @click="startRun(p)"
              >
                <Wand class="btn-icon" aria-hidden="true" />
                {{ t('update') }}
              </button>
            </div>
            <p v-if="runsEnabled && p.status !== 'up-to-date' && updateBlock(p)" :id="`upd-${p.id}-why`" class="why">
              {{ t(`blocked.${updateBlock(p)}`) }}
            </p>

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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, RefreshCw, Wand } from 'lucide-vue-next'

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

type RunStep = 'prepare' | 'baseline' | 'update' | 'verify'
type RunStatus =
  | 'running'
  | 'ready'
  | 'no-changes'
  | 'failed'
  | 'cancelled'
  | 'publishing'
  | 'committed'
  | 'pushed'
  | 'discarding'
  | 'discarded'
type StepState = 'pending' | 'active' | 'done' | 'failed'
type RunEvent = { seq: number; at: string } & (
  | { kind: 'step'; step: RunStep; state: 'started' | 'done' }
  | { kind: 'log'; text: string }
  | { kind: 'check'; phase: 'before' | 'after'; name: string; passed: boolean; durationMs: number }
  | { kind: 'text'; text: string }
  | { kind: 'tool'; tool: string; detail: string }
  | { kind: 'tool-error'; detail: string }
)
interface CheckResult {
  name: string
  passed: boolean
}
interface RunRecord {
  id: string
  projectId: string
  projectName: string
  status: RunStatus
  startedAt: string
  finishedAt: string | null
  branch: string | null
  before: { checks: CheckResult[]; counts: ProjectScan['counts'] | null }
  after: { checks: CheckResult[]; counts: ProjectScan['counts'] | null }
  regressions: string[]
  newAdvisories: string[]
  changes: { ecosystem: string; package: string; from: string | null; to: string | null; type: string | null; downgrade: boolean }[]
  claude: {
    summary: string
    skipped: { package: string; reason: string }[]
    costUsd: number | null
    denials: { tool: string; detail: string }[]
  } | null
  problems: string[]
  files: string[]
  commitMessage: string
  commit: string | null
  baseBranch: string
  baseCommit: string | null
  originalBranch: string | null
}
type BlockReason = 'token' | 'busy' | 'scanning' | 'dirty' | 'error'

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
  update: 'Update',
  confirm:
    'Update {name}?\n\nThis creates branch updater/… from {base}, runs the checks, lets Claude apply security fixes and minor/patch updates (max ${budget}), then runs the checks again. Nothing is committed or pushed.',
  confirmSelf: '\n\nThis is the portfolio itself: reinstalling its packages stops this dev server. Restart it with npm run dev and the run shows up again.',
  blocked: {
    token: 'Paste the updater token above first.',
    busy: 'Another update is running.',
    scanning: 'Wait for the check to finish.',
    dirty: 'Commit or stash the uncommitted changes first.',
    error: 'The last check of this project failed.',
  },
  token: {
    title: 'Updater token',
    hint: 'Starting updates needs the token the updater created. Copy it with:',
    placeholder: '64 characters',
    save: 'Save',
    rejected: 'The updater rejected the token. Paste it again.',
  },
  run: {
    title: 'Update run: {name}',
    started: 'started {time}',
    cancel: 'Cancel',
    cancelling: 'Cancelling…',
    close: 'Close',
    status: {
      running: 'Running',
      ready: 'Ready for review',
      noChanges: 'Nothing changed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      publishing: 'Committing and pushing…',
      committed: 'Committed, not pushed',
      pushed: 'Pushed',
      discarding: 'Discarding…',
      discarded: 'Discarded',
    },
    step: { prepare: 'Prepare branch', baseline: 'Checks before', update: 'Claude updates', verify: 'Checks after' },
    stepState: { pending: 'waiting', active: 'running', done: 'done', failed: 'stopped' },
    summary: 'Summary',
    checks: 'Checks',
    check: 'Check',
    before: 'Before',
    after: 'After',
    passed: 'pass',
    failed: 'fail',
    findings: 'Findings: {before} before, {after} after.',
    newAdvisories: 'New advisories: {packages}',
    changes: 'Package changes',
    added: 'added',
    removed: 'removed',
    downgrade: 'downgrade',
    skipped: 'Skipped by Claude',
    denials: 'Refused actions',
    review: 'Uncommitted on {branch}. Review them in your editor or with git diff before you push to {base}.',
    files: 'Files to commit',
    message: 'Commit message',
    publish: 'Commit & push to {base}',
    retryPush: 'Retry push to {base}',
    retryHint: 'The commit exists on the update branch; only the push is retried.',
    discard: 'Discard, back to {branch}',
    pushed: 'Pushed {commit} to origin/{base}. Back on {branch}.',
    discarded: 'Thrown away. Back on {branch}.',
    confirmPublish: 'Commit these {count} file(s) and push to origin/{base}?\n\nThe push is never forced: if someone pushed to {base} meanwhile, it stops and keeps the commit.',
    confirmDiscard: 'Throw this update away?\n\nThis resets {branch} (uncommitted edits on it are lost), goes back to {original}, deletes the branch and reinstalls the dependencies.',
    log: 'Log ({count})',
  },
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
  update: 'Update',
  confirm:
    '{name} updaten?\n\nDit maakt branch updater/… vanaf {base}, draait de checks, laat Claude beveiligingsfixes en minor/patch-updates toepassen (max ${budget}) en draait de checks opnieuw. Er wordt niets gecommit of gepusht.',
  confirmSelf: '\n\nDit is het portfolio zelf: het herinstalleren van de packages stopt deze dev-server. Start hem opnieuw met npm run dev en de run verschijnt terug.',
  blocked: {
    token: 'Plak eerst hierboven het updater-token.',
    busy: 'Er loopt al een update.',
    scanning: 'Wacht tot de controle klaar is.',
    dirty: 'Commit of stash eerst de niet-gecommitte wijzigingen.',
    error: 'De laatste controle van dit project is mislukt.',
  },
  token: {
    title: 'Updater-token',
    hint: 'Om updates te starten is het token nodig dat de updater aanmaakte. Kopieer het met:',
    placeholder: '64 tekens',
    save: 'Bewaren',
    rejected: 'De updater weigerde het token. Plak het opnieuw.',
  },
  run: {
    title: 'Update-run: {name}',
    started: 'gestart om {time}',
    cancel: 'Annuleren',
    cancelling: 'Bezig met annuleren…',
    close: 'Sluiten',
    status: {
      running: 'Bezig',
      ready: 'Klaar voor review',
      noChanges: 'Niets gewijzigd',
      failed: 'Mislukt',
      cancelled: 'Geannuleerd',
      publishing: 'Bezig met committen en pushen…',
      committed: 'Gecommit, niet gepusht',
      pushed: 'Gepusht',
      discarding: 'Bezig met verwerpen…',
      discarded: 'Verworpen',
    },
    step: { prepare: 'Branch voorbereiden', baseline: 'Checks vooraf', update: 'Claude update', verify: 'Checks achteraf' },
    stepState: { pending: 'wacht', active: 'bezig', done: 'klaar', failed: 'gestopt' },
    summary: 'Samenvatting',
    checks: 'Checks',
    check: 'Check',
    before: 'Vooraf',
    after: 'Achteraf',
    passed: 'ok',
    failed: 'faalt',
    findings: 'Bevindingen: {before} vooraf, {after} achteraf.',
    newAdvisories: 'Nieuwe advisories: {packages}',
    changes: 'Packagewijzigingen',
    added: 'toegevoegd',
    removed: 'verwijderd',
    downgrade: 'downgrade',
    skipped: 'Overgeslagen door Claude',
    denials: 'Geweigerde acties',
    review: 'Niet-gecommit op {branch}. Bekijk ze in je editor of met git diff voor je naar {base} pusht.',
    files: 'Te committen bestanden',
    message: 'Commitbericht',
    publish: 'Commit & push naar {base}',
    retryPush: 'Push naar {base} opnieuw proberen',
    retryHint: 'De commit staat al op de update-branch; enkel de push wordt opnieuw geprobeerd.',
    discard: 'Verwerpen, terug naar {branch}',
    pushed: '{commit} gepusht naar origin/{base}. Terug op {branch}.',
    discarded: 'Weggegooid. Terug op {branch}.',
    confirmPublish: 'Deze {count} bestand(en) committen en naar origin/{base} pushen?\n\nEr wordt nooit geforceerd: heeft iemand intussen naar {base} gepusht, dan stopt het en blijft de commit bewaard.',
    confirmDiscard: 'Deze update weggooien?\n\nDit reset {branch} (niet-gecommitte aanpassingen erop gaan verloren), gaat terug naar {original}, verwijdert de branch en herinstalleert de dependencies.',
    log: 'Log ({count})',
  },
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

const TOKEN_KEY = 'project-updater-token'
const POLL_MS = 1500
const STEPS: RunStep[] = ['prepare', 'baseline', 'update', 'verify']
const STEP_GLYPH: Record<StepState, string> = { pending: '·', active: '▸', done: '✓', failed: '✗' }
const RUN_STATUS_KEY: Record<RunStatus, string> = {
  running: 'running',
  ready: 'ready',
  'no-changes': 'noChanges',
  failed: 'failed',
  cancelled: 'cancelled',
  publishing: 'publishing',
  committed: 'committed',
  pushed: 'pushed',
  discarding: 'discarding',
  discarded: 'discarded',
}
const RUN_TONE: Record<RunStatus, string> = {
  running: 'info',
  ready: 'ok',
  'no-changes': 'ok',
  failed: 'down',
  cancelled: 'degraded',
  publishing: 'info',
  committed: 'degraded',
  pushed: 'ok',
  discarding: 'info',
  discarded: 'info',
}
const RUN_GLYPH: Record<RunStatus, string> = {
  running: '▸',
  ready: '✓',
  'no-changes': '✓',
  failed: '✗',
  cancelled: '!',
  publishing: '▸',
  committed: '!',
  pushed: '✓',
  discarding: '▸',
  discarded: '·',
}
// Mirrors the updater: while these last, the run holds the one-at-a-time slot.
const BUSY: RunStatus[] = ['running', 'publishing', 'discarding']
const PUBLISHABLE: RunStatus[] = ['ready', 'committed']
const DISCARDABLE: RunStatus[] = ['ready', 'committed', 'no-changes', 'failed', 'cancelled']

const phase = ref<'connecting' | 'ready' | 'offline'>('connecting')
const scanning = ref(false)
const error = ref('')
const latest = ref<LatestScan | null>(null)
const open = ref(new Set<string>())

const runsEnabled = ref(false)
const token = ref(readToken())
const tokenInput = ref('')
const projects = ref<{ id: string; baseBranch: string }[]>([])
const runId = ref<string | null>(null)
const run = ref<RunRecord | null>(null)
const events = ref<RunEvent[]>([])
const cancelling = ref(false)
const budgetUsd = ref(3)
let pollTimer: ReturnType<typeof setTimeout> | undefined

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
  if (res.status === 401 && token.value) {
    forgetToken()
    throw new Error(t('token.rejected'))
  }
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
  return body as T
}

/** Run routes need the token the updater prints at startup. */
function runApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  return api<T>(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/json' },
  })
}

// Storage can be unavailable (private window, blocked site data); the panel
// then just asks for the token again on the next visit.
function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}
const tokenLooksValid = computed(() => /^[0-9a-f]{64}$/.test(tokenInput.value))
function saveToken() {
  if (!tokenLooksValid.value) return
  token.value = tokenInput.value
  tokenInput.value = ''
  try {
    localStorage.setItem(TOKEN_KEY, token.value)
  } catch {
    // kept in memory for this visit
  }
  loadRuns()
}
function forgetToken() {
  token.value = ''
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // nothing stored
  }
}

const runActive = computed(() => !!run.value && BUSY.includes(run.value.status))
const canPublish = computed(() => !!run.value && PUBLISHABLE.includes(run.value.status))
const canDiscard = computed(() => !!run.value && DISCARDABLE.includes(run.value.status))
const message = ref('')

function updateBlock(p: ProjectScan): BlockReason | '' {
  if (!token.value) return 'token'
  if (runActive.value) return 'busy'
  if (scanning.value) return 'scanning'
  if (p.git && p.git.dirty > 0) return 'dirty'
  if (p.status === 'error') return 'error'
  return ''
}

function stepState(step: RunStep): StepState {
  let state: StepState = 'pending'
  for (const e of events.value) {
    if (e.kind === 'step' && e.step === step) state = e.state === 'done' ? 'done' : 'active'
  }
  if (state === 'active' && run.value && run.value.status !== 'running') return 'failed'
  return state
}

const checkRows = computed(() => {
  if (!run.value) return []
  const names = [...new Set([...run.value.before.checks, ...run.value.after.checks].map((c) => c.name))]
  return names.map((name) => ({
    name,
    before: run.value!.before.checks.find((c) => c.name === name),
    after: run.value!.after.checks.find((c) => c.name === name),
  }))
})

const findingTotal = (counts: ProjectScan['counts']) => SEVERITIES.reduce((sum, s) => sum + counts[s], 0)

// The full log can run to thousands of tool calls; the tail is what matters.
const visibleEvents = computed(() => events.value.slice(-300))

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString(locale.value === 'nl' ? 'nl-BE' : 'en-GB')
}

function describe(e: RunEvent): string {
  switch (e.kind) {
    case 'step':
      return `${t(`run.step.${e.step}`)}: ${t(`run.stepState.${e.state === 'done' ? 'done' : 'active'}`)}`
    case 'check':
      return `[${t(`run.${e.phase}`)}] ${e.name}: ${e.passed ? t('run.passed') : t('run.failed')} (${(e.durationMs / 1000).toFixed(1)} s)`
    case 'tool':
      return `${e.tool} ${e.detail}`
    case 'tool-error':
      return `✗ ${e.detail}`
    default:
      return e.text
  }
}

async function poll() {
  const id = runId.value
  if (!id) return
  try {
    const after = events.value.at(-1)?.seq ?? 0
    const data = await runApi<{ run: RunRecord; events: RunEvent[] }>(`/api/runs/${id}?after=${after}`)
    if (runId.value !== id) return // closed or replaced meanwhile
    const wasBusy = !!run.value && BUSY.includes(run.value.status)
    const finished = wasBusy && !BUSY.includes(data.run.status)
    // Prefill once per run; never overwrite what you typed.
    if (run.value?.id !== data.run.id) message.value = data.run.commitMessage
    run.value = data.run
    events.value = [...events.value, ...data.events]
    // The run moved the project to its update branch: show that in the cards.
    if (finished) scan()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  if (runId.value === id && runActive.value && token.value) pollTimer = setTimeout(poll, POLL_MS)
}

async function showRun(id: string) {
  clearTimeout(pollTimer)
  runId.value = id
  run.value = null
  events.value = []
  cancelling.value = false
  await poll()
}

async function startRun(p: ProjectScan) {
  if (updateBlock(p)) return
  const base = projects.value.find((x) => x.id === p.id)?.baseBranch ?? 'develop'
  const message = t('confirm', { name: p.name, base, budget: budgetUsd.value }) + (p.id === 'portfolio' ? t('confirmSelf') : '')
  if (!window.confirm(message)) return
  error.value = ''
  try {
    const { id } = await runApi<{ id: string }>('/api/runs', { method: 'POST', body: JSON.stringify({ projectId: p.id }) })
    await showRun(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

async function cancelRun() {
  if (!runId.value) return
  cancelling.value = true
  try {
    await runApi(`/api/runs/${runId.value}/cancel`, { method: 'POST', body: '{}' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    cancelling.value = false
  }
}

async function runAction(action: 'publish' | 'discard', body: object) {
  if (!runId.value) return
  error.value = ''
  try {
    await runApi(`/api/runs/${runId.value}/${action}`, { method: 'POST', body: JSON.stringify(body) })
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    return
  }
  clearTimeout(pollTimer)
  await poll() // picks up the busy status and keeps polling until it settles
  if (!runActive.value) scan() // it was done before the first poll
}

function publishRun() {
  const r = run.value
  if (!r || !window.confirm(t('run.confirmPublish', { count: r.files.length, base: r.baseBranch }))) return
  runAction('publish', r.status === 'ready' ? { message: message.value } : {})
}

function discardRun() {
  const r = run.value
  if (!r) return
  const original = r.originalBranch ?? r.baseBranch
  if (!window.confirm(t('run.confirmDiscard', { branch: r.branch ?? original, original }))) return
  runAction('discard', {})
}

function closeRun() {
  clearTimeout(pollTimer)
  runId.value = null
  run.value = null
  events.value = []
}

/** Picks up a run that is still going (or just ended) after a page reload. */
async function loadRuns() {
  if (!token.value) return
  try {
    const { runs, maxBudgetUsd } = await runApi<{ runs: RunRecord[]; maxBudgetUsd: number }>('/api/runs')
    budgetUsd.value = maxBudgetUsd
    const newest = runs[0]
    if (!newest) return
    await showRun(newest.id)
    // A run that ended after the last check changed branches and files.
    if (newest.finishedAt && latest.value && newest.finishedAt > latest.value.finishedAt) scan()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
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
    runsEnabled.value = (await api<{ runs?: boolean }>('/api/health')).runs === true
  } catch {
    phase.value = 'offline'
    return
  }
  phase.value = 'ready'
  try {
    latest.value = await api<LatestScan | null>('/api/scan/latest')
    if (runsEnabled.value) projects.value = (await api<{ projects: typeof projects.value }>('/api/projects')).projects
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  if (runsEnabled.value) await loadRuns()
})

onBeforeUnmount(() => clearTimeout(pollTimer))
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
.btn--danger {
  color: var(--status-down);
}
.btn--danger:hover:not(:disabled) {
  border-color: var(--status-down);
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

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.why {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--status-label);
}

.token-form {
  margin-bottom: 1rem;
}
.token-form .notice-title {
  display: block;
}
.token-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.input {
  flex: 1 1 16rem;
  min-width: 0;
  padding: 0.375rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-text-primary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}
.input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.run {
  margin-bottom: 1rem;
  padding: 1.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-glow);
  border-left-width: 4px;
  border-radius: 12px;
}
.run--ok {
  border-left-color: var(--status-ok);
}
.run--down {
  border-left-color: var(--status-down);
}
.run--degraded {
  border-left-color: var(--status-warn);
}
.run--info {
  border-left-color: var(--status-info);
}
.run-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.25rem;
  margin: 0 0 0.75rem;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
  color: var(--status-label);
}
.step--active {
  color: var(--status-info);
  font-weight: 700;
}
.step--done {
  color: var(--status-ok);
}
.step--failed {
  color: var(--status-down);
  font-weight: 700;
}
.problems {
  margin-bottom: 0.75rem;
}
.summary {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  white-space: pre-wrap;
}
.checks {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
.checks th,
.checks td {
  padding: 0.3rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
.checks thead th {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--status-label);
}
.checks tbody th {
  font-weight: 600;
}
.checks .pass {
  color: var(--status-ok);
}
.checks .fail {
  color: var(--status-down);
  font-weight: 700;
}
.checks .is-regression {
  background: var(--status-down-bg);
}
.message {
  display: block;
  width: 100%;
  box-sizing: border-box;
  line-height: 1.5;
  resize: vertical;
}
.message:disabled {
  opacity: 0.7;
}
label.detail-title {
  display: block;
}
.review-hint {
  margin-top: 0.5rem;
}
.outcome {
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}
.outcome--ok {
  color: var(--status-ok);
  border-color: currentColor;
  background: var(--status-ok-bg);
}
.log {
  margin-top: 1rem;
  font-size: 0.8125rem;
}
.log summary {
  cursor: pointer;
  color: var(--status-label);
}
.log-lines {
  max-height: 20rem;
  overflow: auto;
  margin: 0.5rem 0 0;
  padding: 0.75rem;
  list-style: none;
  font-size: 0.75rem;
  line-height: 1.5;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow-wrap: anywhere;
}
.log-time {
  margin-right: 0.5rem;
  color: var(--status-label);
}
.log--step {
  color: var(--status-info);
  font-weight: 700;
}
.log--tool-error {
  color: var(--status-down);
}
.log--text {
  color: var(--color-text-primary);
}

@media (max-width: 640px) {
  .terminal-body {
    padding: 1rem;
  }
  .run {
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
