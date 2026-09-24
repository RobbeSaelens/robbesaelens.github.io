<template>
  <div class="status-page mx-auto w-full max-w-screen-xl px-4 pb-12 sm:px-6">
    <TerminalHeader :title="t('status.title').toLowerCase()" subtitle="watch -n 60 ./status.sh" />

    <div class="terminal-window">
      <div class="terminal-chrome" aria-hidden="true">
        <div class="chrome-dots">
          <span class="dot dot--red"></span>
          <span class="dot dot--yellow"></span>
          <span class="dot dot--green"></span>
        </div>
        <span class="chrome-title">status.sh</span>
        <div class="chrome-spacer"></div>
      </div>

      <div class="terminal-body">
        <!-- Announcements for sign-in, loading, refresh and errors. Always in
             the DOM so assistive tech notices when its content changes. -->
        <p
          id="status-message"
          class="status-line"
          :class="message ? `status-line--${message.tone}` : 'status-line--empty'"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <template v-if="message">
            <span class="status-line__glyph" aria-hidden="true">{{
              TONE_GLYPH[message.tone]
            }}</span>
            <span>{{ message.text() }}</span>
          </template>
        </p>

        <!-- Not configured: this build has no VITE_STATUS_API_URL -->
        <section
          v-if="phase === 'unconfigured'"
          class="panel"
          aria-labelledby="status-unconfigured-title"
        >
          <Lock class="panel-icon" :size="40" :stroke-width="1.5" aria-hidden="true" />
          <h2 id="status-unconfigured-title" class="panel-title">
            {{ t('status.notConfigured.title') }}
          </h2>
          <p class="panel-text">{{ t('status.notConfigured.text') }}</p>
          <p class="panel-hint">{{ t('status.notConfigured.hint') }}</p>
        </section>

        <!-- Prerendered shell: the real state is only known in the browser -->
        <p v-else-if="phase === 'booting'" class="boot-line">
          <span class="terminal-prompt" aria-hidden="true">&gt;</span>
          {{ t('status.booting') }}
        </p>

        <!-- Sign in -->
        <section v-else-if="phase === 'login'" class="panel" aria-labelledby="status-login-title">
          <Lock class="panel-icon" :size="40" :stroke-width="1.5" aria-hidden="true" />
          <h2 id="status-login-title" class="panel-title">{{ t('status.login.title') }}</h2>
          <p class="panel-text">{{ t('status.login.intro') }}</p>

          <!-- method="post" so that even a submit without JS could never put
               the passphrase in a URL; the handler always prevents it. -->
          <form class="login-form" method="post" @submit.prevent="submitLogin">
            <label for="status-passphrase" class="field-label">{{ t('status.login.label') }}</label>
            <div class="field-row" :class="{ 'field-row--invalid': passphraseInvalid }">
              <span class="terminal-prompt" aria-hidden="true">$</span>
              <input
                id="status-passphrase"
                ref="passphraseInput"
                v-model="passphrase"
                class="field-input"
                type="password"
                name="passphrase"
                autocomplete="current-password"
                autocapitalize="off"
                spellcheck="false"
                required
                :aria-invalid="passphraseInvalid ? 'true' : undefined"
                :aria-describedby="message ? 'status-message' : undefined"
              />
            </div>
            <button type="submit" class="btn btn--primary" :disabled="submitting || isLocked">
              <Loader2 v-if="submitting" class="btn-icon spin" aria-hidden="true" />
              <Unlock v-else class="btn-icon" aria-hidden="true" />
              {{ submitting ? t('status.login.submitting') : t('status.login.submit') }}
            </button>
          </form>
        </section>

        <!-- Dashboard -->
        <section v-else class="dashboard" aria-labelledby="status-dashboard-title">
          <div class="toolbar">
            <div class="toolbar-info">
              <h2
                id="status-dashboard-title"
                ref="dashboardHeading"
                class="dashboard-title"
                tabindex="-1"
              >
                {{ t('status.dashboard.title') }}
              </h2>
              <p class="toolbar-meta">
                {{ t('status.dashboard.lastUpdated') }}:
                <time v-if="lastUpdatedIso" :datetime="lastUpdatedIso">{{ lastUpdatedLabel }}</time>
                <span v-else>{{ t('status.dashboard.never') }}</span>
                <span aria-hidden="true"> · </span>
                {{ t('status.dashboard.autoRefresh', { seconds: AUTO_REFRESH_MS / 1000 }) }}
              </p>
            </div>
            <div class="toolbar-actions">
              <button type="button" class="btn" :disabled="loading" @click="refresh('manual')">
                <RefreshCw class="btn-icon" :class="{ spin: loading }" aria-hidden="true" />
                {{ loading ? t('status.dashboard.refreshing') : t('status.dashboard.refresh') }}
              </button>
              <button type="button" class="btn btn--ghost" @click="logout">
                <LogOut class="btn-icon" aria-hidden="true" />
                {{ t('status.dashboard.logout') }}
              </button>
            </div>
          </div>

          <ul v-if="overview.length" class="overview" :aria-label="t('status.dashboard.overview')">
            <li
              v-for="item in overview"
              :key="item.status"
              class="badge"
              :class="`badge--${item.status}`"
            >
              <span aria-hidden="true">{{ STATUS_GLYPH[item.status] }}</span>
              {{ item.count }} {{ t(`status.overall.${item.status}`) }}
            </li>
          </ul>

          <p v-if="summary && summary.projects.length === 0" class="muted">
            {{ t('status.dashboard.noProjects') }}
          </p>

          <div v-if="projectViews.length > 1" class="list-controls">
            <button type="button" class="btn btn--ghost btn--sm" @click="toggleAll">
              <component
                :is="anyExpanded ? ChevronsDownUp : ChevronsUpDown"
                class="btn-icon"
                aria-hidden="true"
              />
              {{ anyExpanded ? t('status.card.collapseAll') : t('status.card.expandAll') }}
            </button>
          </div>

          <div v-if="summary" class="project-list" :aria-busy="loading ? 'true' : 'false'">
            <article
              v-for="p in projectViews"
              :key="p.domId"
              class="project-card"
              :class="[`project-card--${p.overall}`, { 'project-card--collapsed': p.collapsed }]"
              :aria-labelledby="`${p.domId}-title`"
            >
              <header class="project-header">
                <div class="project-heading">
                  <h3 :id="`${p.domId}-title`" class="project-name">
                    <button
                      type="button"
                      class="project-toggle"
                      :aria-expanded="p.collapsed ? 'false' : 'true'"
                      :aria-controls="`${p.domId}-body`"
                      @click="toggleProject(p.id)"
                    >
                      <ChevronDown class="toggle-icon" aria-hidden="true" />
                      {{ p.name }}
                      <span class="sr-only">
                        ({{ p.collapsed ? t('status.card.expand') : t('status.card.collapse') }})
                      </span>
                    </button>
                  </h3>
                  <a
                    v-if="p.url"
                    :href="p.url"
                    class="project-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ p.host }}
                    <ExternalLink class="link-icon" aria-hidden="true" />
                    <span class="sr-only">({{ t('status.card.newTab') }})</span>
                  </a>
                </div>
                <p class="badge badge--lg" :class="`badge--${p.overall}`">
                  <span aria-hidden="true">{{ STATUS_GLYPH[p.overall] }}</span>
                  <span class="sr-only">{{ t('status.card.overall') }}:</span>
                  {{ t(`status.overall.${p.overall}`) }}
                </p>
              </header>

              <p v-if="p.collapsed" class="collapsed-summary">
                <template v-if="p.stats">
                  {{ t('status.stats.today') }}:
                  <strong>{{ formatNumber(p.stats.checkins.today) }}</strong>
                  <span aria-hidden="true"> · </span>
                </template>
                <span :class="{ 'collapsed-warnings': p.problems.length }">
                  {{ t('status.card.warningCount', p.problems.length) }}
                </span>
              </p>

              <div v-show="!p.collapsed" :id="`${p.domId}-body`" class="project-body">
                <ul
                  v-if="p.problems.length"
                  class="problems"
                  :aria-label="t('status.card.problems')"
                >
                  <li v-for="(problem, index) in p.problems" :key="index" class="problem">
                    <AlertTriangle class="problem-icon" aria-hidden="true" />
                    <span
                      ><span class="sr-only">{{ t('status.card.warning') }}:</span>
                      {{ problem }}</span
                    >
                  </li>
                </ul>

                <div class="sections">
                  <!-- Check-ins (aggregate counts only) -->
                  <section
                    v-if="p.stats"
                    class="section section--wide"
                    :aria-labelledby="`${p.domId}-stats`"
                  >
                    <h4 :id="`${p.domId}-stats`" class="section-title">
                      <span class="hash" aria-hidden="true">#</span> {{ t('status.stats.title') }}
                    </h4>

                    <div class="stats-hero">
                      <div>
                        <p class="hero-label">{{ t('status.stats.today') }}</p>
                        <p class="hero-value">{{ formatNumber(p.stats.checkins.today) }}</p>
                      </div>
                      <div class="hero-colors">
                        <p :id="`${p.domId}-colors`" class="hero-label">
                          {{ t('status.stats.byColor') }}
                        </p>
                        <ul class="chips" :aria-labelledby="`${p.domId}-colors`">
                          <li
                            v-for="color in CHECKIN_COLORS"
                            :key="color"
                            class="chip"
                            :class="`chip--${color}`"
                          >
                            <span
                              class="chip-dot"
                              :class="`chip-dot--${color}`"
                              aria-hidden="true"
                            ></span>
                            {{ t(`status.stats.colors.${color}`) }}
                            <strong>{{
                              formatNumber(p.stats.checkins.today_by_color[color])
                            }}</strong>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <dl class="metrics">
                      <div class="metric">
                        <dt>{{ t('status.stats.yesterday') }}</dt>
                        <dd>{{ formatNumber(p.stats.checkins.yesterday) }}</dd>
                      </div>
                      <div class="metric">
                        <dt>{{ t('status.stats.last7Days') }}</dt>
                        <dd>{{ formatNumber(p.stats.checkins.last_7_days) }}</dd>
                      </div>
                      <div
                        class="metric"
                        :class="{
                          'metric--danger':
                            p.stats.checkins.urgent_today !== null &&
                            p.stats.checkins.urgent_today > 0,
                        }"
                      >
                        <dt>{{ t('status.stats.urgentToday') }}</dt>
                        <dd>
                          <AlertTriangle
                            v-if="
                              p.stats.checkins.urgent_today !== null &&
                              p.stats.checkins.urgent_today > 0
                            "
                            class="metric-icon"
                            aria-hidden="true"
                          />
                          {{ formatNumber(p.stats.checkins.urgent_today) }}
                        </dd>
                        <dd
                          v-if="
                            p.stats.checkins.urgent_today !== null &&
                            p.stats.checkins.urgent_today > 0
                          "
                          class="metric-note"
                        >
                          {{ t('status.card.attention') }}
                        </dd>
                      </div>
                      <div class="metric">
                        <dt>{{ t('status.stats.open') }}</dt>
                        <dd>{{ formatNumber(p.stats.checkins.open) }}</dd>
                      </div>
                      <div class="metric">
                        <dt>{{ t('status.stats.queuePending') }}</dt>
                        <dd>{{ formatNumber(p.stats.queue.pending) }}</dd>
                      </div>
                      <div class="metric">
                        <dt>{{ t('status.stats.oldestPending') }}</dt>
                        <dd>
                          {{
                            p.stats.queue.oldest_pending_minutes === null
                              ? DASH
                              : t('status.stats.minutes', {
                                  n: formatNumber(p.stats.queue.oldest_pending_minutes),
                                })
                          }}
                        </dd>
                      </div>
                      <div
                        class="metric"
                        :class="{
                          'metric--warning':
                            p.stats.queue.failed_last_24h !== null &&
                            p.stats.queue.failed_last_24h > 0,
                        }"
                      >
                        <dt>{{ t('status.stats.failed24h') }}</dt>
                        <dd>
                          <AlertTriangle
                            v-if="
                              p.stats.queue.failed_last_24h !== null &&
                              p.stats.queue.failed_last_24h > 0
                            "
                            class="metric-icon"
                            aria-hidden="true"
                          />
                          {{ formatNumber(p.stats.queue.failed_last_24h) }}
                        </dd>
                        <dd
                          v-if="
                            p.stats.queue.failed_last_24h !== null &&
                            p.stats.queue.failed_last_24h > 0
                          "
                          class="metric-note"
                        >
                          {{ t('status.card.attention') }}
                        </dd>
                      </div>
                      <div class="metric" :class="{ 'metric--warning': p.schedulerStale }">
                        <dt>{{ t('status.stats.schedulerLastRun') }}</dt>
                        <dd>
                          <AlertTriangle
                            v-if="p.schedulerStale"
                            class="metric-icon"
                            aria-hidden="true"
                          />
                          {{
                            p.stats.scheduler.minutes_ago === null
                              ? t('status.stats.schedulerNever')
                              : t('status.stats.minutesAgo', {
                                  n: formatNumber(p.stats.scheduler.minutes_ago),
                                })
                          }}
                        </dd>
                        <dd v-if="p.schedulerStale" class="metric-note">
                          {{ t('status.card.attention') }}
                        </dd>
                      </div>
                    </dl>

                    <p class="footnote">
                      {{ t('status.stats.timezone', { tz: p.stats.timezone }) }}
                    </p>
                  </section>

                  <!-- Live health check, fetched by the worker -->
                  <section class="section" :aria-labelledby="`${p.domId}-live`">
                    <h4 :id="`${p.domId}-live`" class="section-title">
                      <span class="hash" aria-hidden="true">#</span> {{ t('status.live.title') }}
                    </h4>
                    <dl class="kv">
                      <div>
                        <dt>{{ t('status.live.status') }}</dt>
                        <dd :class="`tone--${LIVE_TONE[p.live.status]}`">
                          <span aria-hidden="true">{{ STATUS_GLYPH[p.live.status] }}</span>
                          {{ t(`status.live.statusValue.${p.live.status}`) }}
                        </dd>
                      </div>
                      <div>
                        <dt>{{ t('status.live.http') }}</dt>
                        <dd>{{ p.live.httpStatus ?? DASH }}</dd>
                      </div>
                      <div>
                        <dt>{{ t('status.live.responseTime') }}</dt>
                        <dd>{{ formatMs(p.live.responseTimeMs) }}</dd>
                      </div>
                      <div>
                        <dt>{{ t('status.live.checkedAt') }}</dt>
                        <dd>
                          <time v-if="p.live.checkedAt" :datetime="p.live.checkedAt">
                            {{ formatRelative(p.live.checkedAt) }}
                          </time>
                          <template v-else>{{ DASH }}</template>
                        </dd>
                      </div>
                    </dl>

                    <h5 class="subsection-title">{{ t('status.live.checks') }}</h5>
                    <ul v-if="p.live.checks" class="checks">
                      <li
                        v-for="name in CHECK_NAMES"
                        :key="name"
                        class="check"
                        :class="p.live.checks[name] ? 'check--pass' : 'check--fail'"
                      >
                        <span aria-hidden="true">{{ p.live.checks[name] ? '✓' : '✗' }}</span>
                        {{ t(`status.live.checkNames.${name}`) }}
                        <span class="sr-only">
                          ({{
                            p.live.checks[name] ? t('status.live.pass') : t('status.live.fail')
                          }})
                        </span>
                      </li>
                    </ul>
                    <p v-else class="muted">{{ t('status.live.noChecks') }}</p>

                    <template v-if="p.live.reasons.length">
                      <h5 class="subsection-title">{{ t('status.live.reasons') }}</h5>
                      <ul class="reasons">
                        <li v-for="reason in p.live.reasons" :key="reason" class="reason">
                          <AlertTriangle class="problem-icon" aria-hidden="true" />
                          {{ reasonLabel(reason) }}
                        </li>
                      </ul>
                    </template>
                  </section>

                  <!-- Uptime monitor -->
                  <section class="section" :aria-labelledby="`${p.domId}-uptime`">
                    <h4 :id="`${p.domId}-uptime`" class="section-title">
                      <span class="hash" aria-hidden="true">#</span> {{ t('status.uptime.title') }}
                    </h4>
                    <dl v-if="p.uptime" class="kv">
                      <div>
                        <dt>{{ t('status.uptime.monitor') }}</dt>
                        <dd :class="`tone--${UPTIME_TONE[p.uptime.status]}`">
                          <span aria-hidden="true">{{ UPTIME_GLYPH[p.uptime.status] }}</span>
                          {{ t(`status.uptime.statusValue.${p.uptime.status}`) }}
                          <span v-if="p.uptime.provider" class="provider">
                            ({{ providerLabel(p.uptime.provider) }})
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>{{ t('status.uptime.last24h') }}</dt>
                        <dd>{{ formatPercent(p.uptime.uptime24h) }}</dd>
                      </div>
                      <div>
                        <dt>{{ t('status.uptime.last7d') }}</dt>
                        <dd>{{ formatPercent(p.uptime.uptime7d) }}</dd>
                      </div>
                      <div>
                        <dt>{{ t('status.uptime.last30d') }}</dt>
                        <dd>{{ formatPercent(p.uptime.uptime30d) }}</dd>
                      </div>
                      <div>
                        <dt>{{ t('status.uptime.avgResponse') }}</dt>
                        <dd>{{ formatMs(p.uptime.avgResponseMs) }}</dd>
                      </div>
                    </dl>
                    <p v-else class="muted">
                      {{
                        p.uptimeFailed
                          ? t('status.card.unavailable')
                          : t('status.card.notConfigured')
                      }}
                    </p>
                  </section>

                  <!-- Errors (Sentry) -->
                  <section
                    class="section"
                    :class="{ 'section--wide': p.errors && p.errors.topIssues.length > 0 }"
                    :aria-labelledby="`${p.domId}-errors`"
                  >
                    <h4 :id="`${p.domId}-errors`" class="section-title">
                      <span class="hash" aria-hidden="true">#</span> {{ t('status.errors.title') }}
                      <span class="section-title__muted">(Sentry)</span>
                    </h4>
                    <template v-if="p.errors">
                      <dl class="kv">
                        <div>
                          <dt>{{ t('status.errors.unresolved') }}</dt>
                          <dd :class="{ 'tone--warning': p.errors.unresolvedCount > 0 }">
                            {{ formatNumber(p.errors.unresolvedCount)
                            }}{{ p.errors.countIsCapped ? '+' : '' }}
                          </dd>
                        </div>
                        <div>
                          <dt>{{ t('status.errors.new24h') }}</dt>
                          <dd>
                            {{
                              p.errors.newLast24h === null
                                ? DASH
                                : formatNumber(p.errors.newLast24h)
                            }}
                          </dd>
                        </div>
                      </dl>

                      <template v-if="p.errors.topIssues.length">
                        <h5 class="subsection-title">{{ t('status.errors.topIssues') }}</h5>
                        <ol class="issues">
                          <li v-for="issue in p.errors.topIssues" :key="issue.id" class="issue">
                            <span class="level" :class="`level--${levelTone(issue.level)}`">{{
                              issue.level
                            }}</span>
                            <div class="issue-main">
                              <a
                                v-if="issue.permalink"
                                :href="issue.permalink"
                                class="issue-title"
                                :title="issue.title"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {{ issue.title }}
                                <span class="sr-only">({{ t('status.card.newTab') }})</span>
                              </a>
                              <span v-else class="issue-title" :title="issue.title">{{
                                issue.title
                              }}</span>
                              <span v-if="issue.culprit" class="issue-culprit">{{
                                issue.culprit
                              }}</span>
                              <!-- Separators are plain text on purpose: whitespace
                                 around elements next to a <template> gets condensed
                                 away, which would glue words together. -->
                              <span class="issue-meta"
                                >{{
                                  t(
                                    'status.errors.events',
                                    { n: formatNumber(issue.count) },
                                    issue.count,
                                  )
                                }}
                                ·
                                {{
                                  t(
                                    'status.errors.users',
                                    { n: formatNumber(issue.userCount) },
                                    issue.userCount,
                                  )
                                }}<template v-if="issue.lastSeen">
                                  ·
                                  <time :datetime="issue.lastSeen">{{
                                    t('status.errors.lastSeen', {
                                      time: formatRelative(issue.lastSeen),
                                    })
                                  }}</time></template
                                ></span
                              >
                            </div>
                          </li>
                        </ol>
                      </template>
                      <p v-else-if="p.errors.unresolvedCount === 0" class="muted">
                        {{ t('status.errors.none') }}
                      </p>
                    </template>
                    <p v-else class="muted">
                      {{
                        p.errorsFailed
                          ? t('status.card.unavailable')
                          : t('status.card.notConfigured')
                      }}
                    </p>
                  </section>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Private status dashboard. The page itself is public and holds no data or
// secrets: it asks for a passphrase, trades it for a short-lived token at the
// status worker (POST /auth) and then reads GET /summary with that token.
//
// Prerender-safe: nothing below touches window, document or storage during
// setup or render. All of that happens in onMounted and event handlers.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import {
  AlertTriangle,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  Unlock,
} from 'lucide-vue-next'
import TerminalHeader from '../components/TerminalHeader.vue'
import { STATUS_API_URL } from '../site'
import {
  CHECK_NAMES,
  CHECKIN_COLORS,
  KNOWN_REASONS,
  authenticate,
  clearStoredSession,
  fetchSummary,
  isSessionExpired,
  overallStatus,
  readStoredSession,
  sectionHasProblem,
  storeSession,
} from '../status/api'
import type {
  LiveStatus,
  OverallStatus,
  ProjectSummary,
  StatusSession,
  Summary,
  UptimeStatus,
} from '../status/api'

type Phase = 'unconfigured' | 'booting' | 'login' | 'dashboard'
type Tone = 'info' | 'success' | 'warning' | 'error'
type RefreshMode = 'initial' | 'manual' | 'auto'
type Failure = { kind: 'network' } | { kind: 'http'; status: number } | { kind: 'invalid-response' }

interface Message {
  tone: Tone
  /** Evaluated at render time so a language switch re-translates it. */
  text: () => string
}

interface ProjectView extends ProjectSummary {
  domId: string
  host: string | null
  overall: OverallStatus
  uptimeFailed: boolean
  errorsFailed: boolean
  schedulerStale: boolean
  collapsed: boolean
}

const AUTO_REFRESH_MS = 60_000
// Coming back to the tab refreshes right away, unless the data is fresher
// than this. Keeps quick tab switching from hammering upstream API limits.
const MIN_RESUME_AGE_MS = 10_000
// Mirrors MONITOR_SCHEDULER_STALE_MINUTES' default on the scan2talk side.
const SCHEDULER_STALE_MINUTES = 3
const DASH = '—'
// Per-browser UI preference only (which project cards are folded); no data.
const COLLAPSED_STORAGE_KEY = 'status-collapsed'

const TONE_GLYPH: Record<Tone, string> = { info: '>', success: '✓', warning: '!', error: '✗' }
const STATUS_GLYPH: Record<OverallStatus, string> = {
  ok: '✓',
  degraded: '!',
  down: '✗',
  unknown: '?',
}
const UPTIME_GLYPH: Record<UptimeStatus, string> = { up: '✓', down: '✗', paused: '‖', unknown: '?' }
const LIVE_TONE: Record<LiveStatus, string> = {
  ok: 'ok',
  degraded: 'warning',
  down: 'danger',
  unknown: 'muted',
}
const UPTIME_TONE: Record<UptimeStatus, string> = {
  up: 'ok',
  down: 'danger',
  paused: 'muted',
  unknown: 'muted',
}
const PROVIDER_NAMES: Record<string, string> = { uptimerobot: 'UptimeRobot', ohdear: 'Oh Dear' }

// Never send this page's URL as a Referer, neither on outbound links nor on
// requests to the worker.
useHead({ meta: [{ name: 'referrer', content: 'no-referrer' }] })

const { t, locale } = useI18n({ useScope: 'global' })

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const phase = ref<Phase>(STATUS_API_URL ? 'booting' : 'unconfigured')
const message = shallowRef<Message | null>(null)

const passphrase = ref('')
const passphraseInput = ref<HTMLInputElement | null>(null)
const passphraseInvalid = ref(false)
const submitting = ref(false)
const lockedUntil = ref<number | null>(null)
const isLocked = computed(() => lockedUntil.value !== null)

const session = shallowRef<StatusSession | null>(null)
const summary = shallowRef<Summary | null>(null)
const loading = ref(false)
const lastUpdated = ref<number | null>(null)
const dashboardHeading = ref<HTMLElement | null>(null)

let refreshTimer: number | undefined
let unlockTimer: number | undefined
let inflight: AbortController | null = null
let requestSeq = 0
let unmounted = false

// ---------------------------------------------------------------------------
// Formatting (only evaluated in the browser; the dashboard is never prerendered)
// ---------------------------------------------------------------------------

const intlLocale = computed(() => (locale.value === 'nl' ? 'nl-BE' : 'en-GB'))
const numberFormat = computed(() => new Intl.NumberFormat(intlLocale.value))
const percentFormat = computed(
  () => new Intl.NumberFormat(intlLocale.value, { style: 'percent', maximumFractionDigits: 2 }),
)
const clockFormat = computed(
  () =>
    new Intl.DateTimeFormat(intlLocale.value, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
)
const shortClockFormat = computed(
  () => new Intl.DateTimeFormat(intlLocale.value, { hour: '2-digit', minute: '2-digit' }),
)
const relativeFormat = computed(
  () => new Intl.RelativeTimeFormat(intlLocale.value, { numeric: 'auto' }),
)

/** Relative times are measured against the snapshot, not the ticking clock. */
const referenceTime = computed(() => {
  const generated = summary.value?.generatedAt ? Date.parse(summary.value.generatedAt) : Number.NaN
  return Number.isNaN(generated) ? lastUpdated.value ?? 0 : generated
})

function formatNumber(value: number | null): string {
  return value === null ? DASH : numberFormat.value.format(value)
}

function formatPercent(value: number | null): string {
  return value === null ? DASH : percentFormat.value.format(value / 100)
}

function formatMs(value: number | null): string {
  return value === null ? DASH : `${formatNumber(value)} ms`
}

function formatRelative(iso: string): string {
  // Clamp to "now" so a little clock skew never reads as "in 3 seconds".
  const seconds = Math.min(0, Math.round((Date.parse(iso) - referenceTime.value) / 1000))
  const abs = Math.abs(seconds)
  if (abs < 60) return relativeFormat.value.format(seconds, 'second')
  if (abs < 3600) return relativeFormat.value.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return relativeFormat.value.format(Math.round(seconds / 3600), 'hour')
  return relativeFormat.value.format(Math.round(seconds / 86400), 'day')
}

function formatDuration(seconds: number): string {
  const [value, unit]: [number, string] =
    seconds < 90
      ? [seconds, 'second']
      : seconds < 90 * 60
      ? [Math.ceil(seconds / 60), 'minute']
      : [Math.ceil(seconds / 3600), 'hour']
  return new Intl.NumberFormat(intlLocale.value, {
    style: 'unit',
    unit,
    unitDisplay: 'long',
  }).format(value)
}

const lastUpdatedIso = computed(() =>
  lastUpdated.value === null ? null : new Date(lastUpdated.value).toISOString(),
)
const lastUpdatedLabel = computed(() =>
  lastUpdated.value === null ? '' : clockFormat.value.format(lastUpdated.value),
)

function reasonLabel(reason: string): string {
  return KNOWN_REASONS.includes(reason) ? t(`status.reasons.${reason}`) : reason
}

function providerLabel(provider: string): string {
  return PROVIDER_NAMES[provider] ?? provider
}

function levelTone(level: string): 'danger' | 'warning' | 'info' | 'muted' {
  switch (level.toLowerCase()) {
    case 'fatal':
    case 'error':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'info':
    case 'debug':
      return 'info'
    default:
      return 'muted'
  }
}

function failureText(failure: Failure): string {
  if (failure.kind === 'network') return t('status.failure.network')
  if (failure.kind === 'http') return t('status.failure.http', { status: failure.status })
  return t('status.failure.invalidResponse')
}

// ---------------------------------------------------------------------------
// Derived view data
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Collapse / expand (remembered per browser in localStorage)
// ---------------------------------------------------------------------------

const collapsedIds = ref<Set<string>>(new Set())

function readCollapsed(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(COLLAPSED_STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

function setCollapsed(ids: Set<string>): void {
  collapsedIds.value = ids
  try {
    if (ids.size) localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...ids]))
    else localStorage.removeItem(COLLAPSED_STORAGE_KEY)
  } catch {
    // Storage blocked (private mode, disabled site data): keep it in memory only.
  }
}

function toggleProject(id: string): void {
  const ids = new Set(collapsedIds.value)
  if (!ids.delete(id)) ids.add(id)
  setCollapsed(ids)
}

const anyExpanded = computed(() => projectViews.value.some((p) => !p.collapsed))

function toggleAll(): void {
  setCollapsed(anyExpanded.value ? new Set(projectViews.value.map((p) => p.id)) : new Set())
}

const projectViews = computed<ProjectView[]>(() =>
  (summary.value?.projects ?? []).map((project, index) => {
    const minutesAgo = project.stats?.scheduler.minutes_ago ?? null
    return {
      ...project,
      domId: `project-${index}-${project.id.replace(/[^A-Za-z0-9_-]/g, '')}`,
      host: project.url ? new URL(project.url).host : null,
      overall: overallStatus(project),
      uptimeFailed: sectionHasProblem(project.problems, 'uptime'),
      errorsFailed: sectionHasProblem(project.problems, 'errors'),
      schedulerStale:
        project.stats !== null && (minutesAgo === null || minutesAgo > SCHEDULER_STALE_MINUTES),
      collapsed: collapsedIds.value.has(project.id),
    }
  }),
)

const overview = computed(() => {
  const order: OverallStatus[] = ['down', 'degraded', 'ok', 'unknown']
  return order
    .map((status) => ({
      status,
      count: projectViews.value.filter((p) => p.overall === status).length,
    }))
    .filter((item) => item.count > 0)
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setMessage(tone: Tone, text: () => string): void {
  message.value = { tone, text }
}

function focusPassphrase(): void {
  void nextTick(() => passphraseInput.value?.focus())
}

function focusDashboard(): void {
  void nextTick(() => dashboardHeading.value?.focus())
}

function clearRefreshTimer(): void {
  if (refreshTimer !== undefined) {
    window.clearTimeout(refreshTimer)
    refreshTimer = undefined
  }
}

function clearUnlockTimer(): void {
  if (unlockTimer !== undefined) {
    window.clearTimeout(unlockTimer)
    unlockTimer = undefined
  }
}

/** Cancels the timer and any in-flight request; a late response is ignored. */
function stopRefreshing(): void {
  clearRefreshTimer()
  requestSeq++
  inflight?.abort()
  inflight = null
  loading.value = false
}

// ---------------------------------------------------------------------------
// Sign in / out
// ---------------------------------------------------------------------------

function lockLogin(seconds: number): void {
  clearUnlockTimer()
  lockedUntil.value = Date.now() + seconds * 1000
  unlockTimer = window.setTimeout(() => {
    unlockTimer = undefined
    lockedUntil.value = null
    if (phase.value === 'login') setMessage('info', () => t('status.login.unlocked'))
  }, seconds * 1000)
}

async function submitLogin(): Promise<void> {
  if (submitting.value || isLocked.value) return
  if (passphrase.value === '') {
    passphraseInvalid.value = true
    setMessage('error', () => t('status.login.empty'))
    focusPassphrase()
    return
  }

  submitting.value = true
  passphraseInvalid.value = false
  setMessage('info', () => t('status.login.submitting'))

  const result = await authenticate(STATUS_API_URL, passphrase.value)
  submitting.value = false
  if (unmounted || phase.value !== 'login') return

  switch (result.kind) {
    case 'ok':
      passphrase.value = ''
      storeSession(result.session)
      startDashboard(result.session)
      focusDashboard()
      return
    case 'invalid-credentials':
      passphrase.value = ''
      passphraseInvalid.value = true
      setMessage('error', () => t('status.login.wrongPassphrase'))
      focusPassphrase()
      return
    case 'rate-limited': {
      const seconds = result.retryAfterSeconds
      const until = Date.now() + seconds * 1000
      lockLogin(seconds)
      setMessage('error', () =>
        t('status.login.tooManyAttempts', {
          time: formatDuration(seconds),
          clock: shortClockFormat.value.format(until),
        }),
      )
      return
    }
    case 'bad-request':
      setMessage('error', () => t('status.login.badRequest'))
      return
    case 'http': {
      const failure: Failure = { kind: 'http', status: result.status }
      setMessage('error', () => failureText(failure))
      return
    }
    default: {
      const failure: Failure = { kind: result.kind }
      setMessage('error', () => failureText(failure))
    }
  }
}

function endSession(reason: 'expired' | 'logout'): void {
  stopRefreshing()
  clearStoredSession()
  session.value = null
  summary.value = null
  lastUpdated.value = null
  phase.value = 'login'
  if (reason === 'expired') setMessage('warning', () => t('status.login.sessionExpired'))
  else setMessage('info', () => t('status.login.loggedOut'))
  focusPassphrase()
}

function logout(): void {
  endSession('logout')
}

// ---------------------------------------------------------------------------
// Dashboard data
// ---------------------------------------------------------------------------

function startDashboard(next: StatusSession): void {
  session.value = next
  summary.value = null
  lastUpdated.value = null
  phase.value = 'dashboard'
  void refresh('initial')
}

function scheduleNext(delay: number): void {
  clearRefreshTimer()
  if (unmounted || phase.value !== 'dashboard' || document.visibilityState !== 'visible') return
  refreshTimer = window.setTimeout(() => void refresh('auto'), delay)
}

async function refresh(mode: RefreshMode): Promise<void> {
  const current = session.value
  if (unmounted || phase.value !== 'dashboard' || !current) return
  if (isSessionExpired(current)) {
    endSession('expired')
    return
  }

  stopRefreshing()
  const seq = requestSeq
  const controller = new AbortController()
  inflight = controller
  loading.value = true
  if (mode === 'initial') setMessage('info', () => t('status.dashboard.loading'))
  else if (mode === 'manual') setMessage('info', () => t('status.dashboard.refreshing'))

  const result = await fetchSummary(STATUS_API_URL, current.token, controller.signal)
  if (unmounted || seq !== requestSeq) return
  inflight = null
  loading.value = false

  switch (result.kind) {
    case 'aborted':
      return
    case 'unauthorized':
      endSession('expired')
      return
    case 'ok': {
      const at = Date.now()
      const count = result.summary.projects.length
      summary.value = result.summary
      lastUpdated.value = at
      if (mode === 'initial') setMessage('success', () => t('status.dashboard.loaded', count))
      else if (mode === 'manual')
        setMessage('success', () =>
          t('status.dashboard.updated', { time: clockFormat.value.format(at) }),
        )
      // A background refresh stays quiet, but clears any stale error line.
      else message.value = null
      break
    }
    default: {
      const failure: Failure =
        result.kind === 'http' ? { kind: 'http', status: result.status } : { kind: result.kind }
      const since = lastUpdated.value
      if (summary.value && since !== null)
        setMessage('error', () =>
          t('status.dashboard.refreshFailed', {
            reason: failureText(failure),
            time: clockFormat.value.format(since),
          }),
        )
      else
        setMessage('error', () =>
          t('status.dashboard.loadFailed', { reason: failureText(failure) }),
        )
    }
  }

  scheduleNext(AUTO_REFRESH_MS)
}

function onVisibilityChange(): void {
  if (phase.value !== 'dashboard') return
  if (document.visibilityState !== 'visible') {
    clearRefreshTimer()
    return
  }
  // An in-flight request schedules the next one itself when it finishes.
  if (loading.value) return
  const age = lastUpdated.value === null ? Number.POSITIVE_INFINITY : Date.now() - lastUpdated.value
  if (age >= MIN_RESUME_AGE_MS) void refresh('auto')
  else scheduleNext(AUTO_REFRESH_MS - age)
}

// ---------------------------------------------------------------------------
// Lifecycle (browser only)
// ---------------------------------------------------------------------------

onMounted(() => {
  if (phase.value === 'unconfigured') return
  collapsedIds.value = readCollapsed()
  document.addEventListener('visibilitychange', onVisibilityChange)
  const stored = readStoredSession()
  if (stored) startDashboard(stored)
  else phase.value = 'login'
})

onBeforeUnmount(() => {
  unmounted = true
  document.removeEventListener('visibilitychange', onVisibilityChange)
  stopRefreshing()
  clearUnlockTimer()
})
</script>

<style scoped>
/* =============================================
   Tokens (status colours, contrast-checked on both themes)
   ============================================= */

.status-page {
  --status-ok: #15803d;
  --status-warn: #b45309;
  --status-down: #b91c1c;
  --status-info: #0f766e;
  --status-label: #446965;
  --status-ok-bg: rgba(21, 128, 61, 0.09);
  --status-warn-bg: rgba(180, 83, 9, 0.09);
  --status-down-bg: rgba(185, 28, 28, 0.08);
  --status-muted-bg: rgba(100, 116, 139, 0.1);
  --status-primary-bg: #0f766e;
  --status-primary-text: #ffffff;

  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.dark .status-page {
  --status-ok: #4ade80;
  --status-warn: #fbbf24;
  --status-down: #f87171;
  --status-info: #5eead4;
  --status-label: #94a3b8;
  --status-ok-bg: rgba(74, 222, 128, 0.1);
  --status-warn-bg: rgba(251, 191, 36, 0.1);
  --status-down-bg: rgba(248, 113, 113, 0.1);
  --status-muted-bg: rgba(148, 163, 184, 0.1);
  --status-primary-bg: #2dd4bf;
  --status-primary-text: #042f2e;
}

/* =============================================
   Terminal window (same chrome as error.sh)
   ============================================= */

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
  width: 54px; /* balances the dots */
}

.terminal-body {
  padding: 1.5rem;
}

/* =============================================
   Status line (aria-live region)
   ============================================= */

.status-line {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0 0 1.25rem;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.status-line--empty {
  margin: 0;
}

.status-line__glyph {
  flex-shrink: 0;
  font-weight: 700;
}

.status-line--info {
  color: var(--status-label);
}

.status-line--info .status-line__glyph {
  color: var(--color-prompt);
}

.status-line--success {
  color: var(--status-ok);
}

.status-line--warning {
  color: var(--status-warn);
}

.status-line--error {
  color: var(--status-down);
}

/* =============================================
   Panels (not configured, sign in)
   ============================================= */

.boot-line {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.875rem;
  color: var(--status-label);
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 30rem;
  margin: 0 auto;
  padding: 1.5rem 0 1rem;
  text-align: center;
}

.panel-icon {
  color: var(--color-accent);
  margin-bottom: 1rem;
}

.panel-title {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
}

.panel-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--status-label);
}

.panel-hint {
  margin: 1rem 0 0;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--status-label);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow-wrap: anywhere;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 100%;
  max-width: 24rem;
  margin-top: 1.5rem;
  text-align: left;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--status-label);
}

.field-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-glow);
  border-radius: 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* The input drops its own outline; the row carries a clearly visible ring. */
.field-row:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-border-glow);
}

.field-row--invalid {
  border-color: var(--status-down);
}

.field-input {
  flex: 1;
  min-width: 0;
  padding: 0;
  font: inherit;
  font-size: 1rem; /* >= 16px keeps iOS from zooming in */
  color: var(--color-text-primary);
  background: transparent;
  border: 0;
  outline: none;
}

/* =============================================
   Buttons
   ============================================= */

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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  color: var(--status-primary-text);
  background: var(--status-primary-bg);
  border-color: var(--status-primary-bg);
}

.btn--primary:hover:not(:disabled) {
  color: var(--status-primary-text);
  background: var(--status-primary-bg);
  filter: brightness(1.08);
}

.btn--ghost {
  color: var(--status-label);
  border-color: var(--color-border);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.btn:focus-visible,
.project-link:focus-visible,
.issue-title:focus-visible,
.dashboard-title:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 4px;
}

.spin {
  animation: status-spin 1s linear infinite;
}

@keyframes status-spin {
  to {
    transform: rotate(360deg);
  }
}

/* =============================================
   Dashboard toolbar + overview
   ============================================= */

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dashboard-title {
  display: inline-block; /* focus ring (after sign-in) hugs the text */
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.toolbar-meta {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--status-label);
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.overview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 1.25rem;
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

.badge--lg {
  padding: 0.3rem 0.875rem;
  font-size: 0.875rem;
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

.badge--unknown {
  color: var(--status-label);
  background: var(--status-muted-bg);
}

/* =============================================
   Project card
   ============================================= */

.project-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.project-card--degraded {
  border-left-color: var(--status-warn);
}

.project-card--down {
  border-left-color: var(--status-down);
}

.project-card--unknown {
  border-left-color: var(--color-border-glow);
}

.list-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
}

.btn--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.project-card--collapsed .project-header {
  margin-bottom: 0.5rem;
}

.project-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
}

.project-toggle:hover {
  color: var(--color-accent);
}

.project-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 4px;
}

.toggle-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.project-card--collapsed .toggle-icon {
  transform: rotate(-90deg);
}

.collapsed-summary {
  margin: 0;
  font-size: 0.875rem;
  color: var(--status-label);
}

.collapsed-summary strong {
  color: var(--color-text-primary);
}

.collapsed-warnings {
  color: var(--status-warn);
  font-weight: 600;
}

.project-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.project-heading {
  min-width: 0;
}

.project-name {
  margin: 0;
  font-size: clamp(1.125rem, 1rem + 0.5vw, 1.375rem);
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.project-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--status-info);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.project-link:hover {
  text-decoration: underline;
}

.link-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.problems {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0 0 1rem;
  padding: 0.625rem 0.875rem;
  list-style: none;
  background: var(--status-warn-bg);
  border: 1px solid var(--status-warn);
  border-radius: 8px;
}

.problem,
.reason {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--status-warn);
  overflow-wrap: anywhere;
}

.problem-icon {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;
}

/* =============================================
   Sections
   ============================================= */

.sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 1rem;
}

.section {
  min-width: 0;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.section--wide {
  grid-column: 1 / -1;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--status-label);
}

.section-title .hash {
  color: var(--color-prompt);
}

.section-title__muted {
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
}

.subsection-title {
  margin: 1rem 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--status-label);
}

.muted {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--status-label);
}

.footnote {
  margin: 0.75rem 0 0;
  font-size: 0.75rem;
  color: var(--status-label);
}

/* Key/value rows */
.kv {
  margin: 0;
  font-size: 0.875rem;
}

.kv > div {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  padding: 0.375rem 0;
  border-bottom: 1px dashed var(--color-border);
}

.kv > div:last-child {
  border-bottom: 0;
}

.kv dt {
  color: var(--status-label);
}

.kv dd {
  margin: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.provider {
  font-weight: 400;
  color: var(--status-label);
}

.tone--ok {
  color: var(--status-ok);
}

.tone--warning {
  color: var(--status-warn);
}

.tone--danger {
  color: var(--status-down);
}

.tone--muted {
  color: var(--status-label);
}

/* Checks */
.checks,
.reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.reasons {
  flex-direction: column;
  gap: 0.25rem;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.2rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid currentColor;
  border-radius: 6px;
}

.check--pass {
  color: var(--status-ok);
  background: var(--status-ok-bg);
}

.check--fail {
  color: var(--status-down);
  background: var(--status-down-bg);
}

/* =============================================
   Check-in stats
   ============================================= */

.stats-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 2rem;
  margin-bottom: 1rem;
}

.hero-label {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--status-label);
}

.hero-value {
  margin: 0.25rem 0 0;
  font-size: clamp(3rem, 2rem + 5vw, 4.75rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent);
}

.hero-colors {
  min-width: 0;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
  border: 1px solid var(--color-border-glow);
  border-radius: 999px;
  background: var(--color-bg);
}

.chip strong {
  font-variant-numeric: tabular-nums;
}

.chip-dot {
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.chip-dot--green {
  background: #22c55e;
}

.chip-dot--yellow {
  background: #eab308;
}

.chip-dot--orange {
  background: #f97316;
}

.chip-dot--red {
  background: #ef4444;
}

.chip--green {
  border-color: rgba(34, 197, 94, 0.5);
}

.chip--yellow {
  border-color: rgba(234, 179, 8, 0.55);
}

.chip--orange {
  border-color: rgba(249, 115, 22, 0.5);
}

.chip--red {
  border-color: rgba(239, 68, 68, 0.5);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 11.5rem), 1fr));
  gap: 0.75rem;
  margin: 0;
}

.metric {
  min-width: 0;
  padding: 0.75rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.metric dt {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--status-label);
}

.metric dd {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0.25rem 0 0;
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.metric dd.metric-note {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.metric-icon {
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
}

.metric--danger {
  background: var(--status-down-bg);
  border-color: var(--status-down);
}

.metric--danger dd {
  color: var(--status-down);
}

.metric--warning {
  background: var(--status-warn-bg);
  border-color: var(--status-warn);
}

.metric--warning dd {
  color: var(--status-warn);
}

/* =============================================
   Sentry issues
   ============================================= */

.issues {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.issue {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.level {
  flex-shrink: 0;
  margin-top: 0.125rem;
  padding: 0.05rem 0.4rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid currentColor;
  border-radius: 4px;
}

.level--danger {
  color: var(--status-down);
}

.level--warning {
  color: var(--status-warn);
}

.level--info {
  color: var(--status-info);
}

.level--muted {
  color: var(--status-label);
}

.issue-main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.issue-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.45;
  color: var(--color-text-primary);
  overflow-wrap: anywhere;
}

a.issue-title {
  color: var(--status-info);
  text-decoration: none;
}

a.issue-title:hover {
  text-decoration: underline;
}

.issue-culprit,
.issue-meta {
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--status-label);
  overflow-wrap: anywhere;
}
/* =============================================
   Mobile
   ============================================= */

@media (max-width: 640px) {
  .terminal-body {
    padding: 1rem;
  }

  .chrome-title {
    font-size: 0.75rem;
  }

  .project-card {
    padding: 1rem;
  }

  .section {
    padding: 0.875rem;
  }

  .toolbar-actions {
    width: 100%;
  }

  .toolbar-actions .btn {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin {
    animation: none;
  }

  .toggle-icon {
    transition: none;
  }
}
</style>
