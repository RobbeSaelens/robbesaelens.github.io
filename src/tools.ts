/**
 * The tools Robbe made to look after his projects, as the tools page shows them
 * (src/screens/Tools.vue), in its order: one chapter each, behind a switch. /llms.txt
 * (src/llms.ts) and the page's JSON-LD (src/seo/jsonld.ts) are written from the same data.
 * Texts come through `t`, from `tools.*` in the locale files, so one builder serves both
 * languages.
 *
 * Both repositories are private for now. When one goes public, its `repository` is the
 * one line to add: the page then links to it ("View on GitHub"), and /llms.txt names it.
 */
import type { ProjectShotData, Translate } from './components/project/project'
import repoStats from './data/repo-stats.json'

/**
 * A tool's current version: its latest GitHub release, which `npm run stats` reads before
 * every deploy (the daily one too) into repo-stats.json. The version given here is only the
 * fallback, for a build without that data; it needn't be bumped by hand.
 */
function released(key: 'projectUpdater' | 'sift', fallback: string): string {
  const tools = (repoStats as { tools?: Record<string, { version?: string }> }).tools
  return tools?.[key]?.version || fallback
}

export type ToolId = 'project-updater' | 'sift'

/** The icon in front of a point (Tools.vue picks the lucide icon for it) */
export type ToolIcon = 'scan' | 'bot' | 'checks' | 'review' | 'diff' | 'stage' | 'branches' | 'ai' | 'teamwork' | 'terminal' | 'ide'

/** A point under the chapter's sentence: an icon and a few words (four to six a tool) */
export interface ToolPoint {
  icon: ToolIcon
  text: string
}

/** A step or a card of a chapter's story: a name and a few words */
export interface ToolStep {
  title: string
  text: string
  /** An icon for what it does (Sift's story: the two apps, by what they did, not their logos) */
  icon?: ToolIcon
  /** What it holds, as chips (Sift's card: what it took from both apps, and what's new) */
  tags?: { text: string; isNew?: boolean }[]
}

/**
 * A chapter's story, told in motion under its first screen:
 * - pipeline: how an update runs, step by step (Project Updater), ending in a choice
 * - merge: the two apps it replaced, coming together as this one (Sift), and why
 */
export type ToolStory =
  | { kind: 'pipeline'; title: string; steps: ToolStep[]; or: string }
  | { kind: 'merge'; title: string; from: ToolStep[]; to: ToolStep; caption: string }

/**
 * A real capture of one of its windows (public/, 1600 × 1000, from a capture of the
 * 1200 × 750 window): `label` says what it shows, under the cards; the caption, "Name —
 * label", names it in the button and the lightbox. Never with a version number in it (the
 * version is `version` here): recapture only when the interface visibly changes.
 */
export interface ToolShot extends ProjectShotData {
  label: string
}

export interface ToolData {
  /** The URL's hash that selects it (/tools#sift), and its tab's id */
  id: ToolId
  name: string
  /** A few words, in the switch */
  role: string
  /** The chapter's headline */
  headline: string
  /** One sentence under it */
  summary: string
  /** What it is and does, in a few sentences: for /llms.txt and the JSON-LD, not the page */
  description: string
  points: ToolPoint[]
  story: ToolStory
  /** The current release: from its latest GitHub release (see `released`), not bumped by hand */
  version: string
  platform: string
  /** The public repository, once there is one. Private for now: no link. */
  repository?: string
  /** What it's made with, the main parts first */
  stack: string[]
  /** Its captures, the first in front */
  shots: ToolShot[]
}

/** Captures of `name`'s windows, from `tools.<ns>.shot<Key>` (label) and `tools.<ns>.alt<Key>` */
function shots(t: Translate, name: string, ns: string, list: [key: string, file: string][]): ToolShot[] {
  return list.map(([key, file]) => {
    const label = t(`tools.${ns}.shot${key}`)
    return {
      src: `/${file}-home.jpg`,
      width: 1600,
      height: 1000,
      alt: t(`tools.${ns}.alt${key}`),
      label,
      caption: `${name} — ${label}`,
    }
  })
}

const steps = (t: Translate, ns: string, keys: string[]): ToolStep[] =>
  keys.map((key) => ({ title: t(`tools.${ns}.${key}`), text: t(`tools.${ns}.${key}Text`) }))

export function projectUpdater(t: Translate): ToolData {
  return {
    id: 'project-updater',
    name: 'Project Updater',
    role: t('tools.updater.role'),
    headline: t('tools.updater.headline'),
    summary: t('tools.updater.summary'),
    description: t('tools.updater.description'),
    points: [
      { icon: 'scan', text: t('tools.updater.pointScan') },
      { icon: 'bot', text: t('tools.updater.pointClaude') },
      { icon: 'checks', text: t('tools.updater.pointChecks') },
      { icon: 'review', text: t('tools.updater.pointReview') },
    ],
    story: {
      kind: 'pipeline',
      title: t('tools.updater.storyTitle'),
      steps: steps(t, 'updater', ['stepScan', 'stepUpdate', 'stepChecks', 'stepReview', 'stepPublish']),
      or: t('tools.updater.stepDiscard'),
    },
    version: released('projectUpdater', '0.16.0'),
    platform: 'macOS',
    stack: ['Electron', 'Node.js', 'TypeScript', 'Claude Code', 'npm', 'Composer', 'Sentry API', 'Vitest', 'esbuild', 'GitHub Actions'],
    shots: shots(t, 'Project Updater', 'updater', [
      ['Projects', 'project-updater-projects'],
      ['Updates', 'project-updater-updates'],
      ['Security', 'project-updater-security'],
      ['Review', 'project-updater-review'],
    ]),
  }
}

export function sift(t: Translate): ToolData {
  return {
    id: 'sift',
    name: 'Sift',
    role: t('tools.sift.role'),
    headline: t('tools.sift.headline'),
    summary: t('tools.sift.summary'),
    description: t('tools.sift.description'),
    points: [
      { icon: 'diff', text: t('tools.sift.pointDiff') },
      { icon: 'stage', text: t('tools.sift.pointStage') },
      { icon: 'branches', text: t('tools.sift.pointBranches') },
      { icon: 'ai', text: t('tools.sift.pointAi') },
      { icon: 'teamwork', text: t('tools.sift.pointTeamwork') },
      { icon: 'terminal', text: t('tools.sift.pointTerminal') },
    ],
    story: {
      kind: 'merge',
      title: t('tools.sift.storyTitle'),
      from: [
        { title: 'PhpStorm', text: t('tools.sift.fromPhpstorm'), icon: 'ide' },
        { title: 'Sublime Merge', text: t('tools.sift.fromMerge'), icon: 'branches' },
      ],
      to: {
        title: 'Sift',
        text: t('tools.sift.toSift'),
        tags: [
          { text: t('tools.sift.tagDiffs') },
          { text: t('tools.sift.tagStaging') },
          { text: t('tools.sift.tagCommits') },
          { text: t('tools.sift.tagBranches') },
          { text: t('tools.sift.tagHistory') },
          { text: t('tools.sift.tagAi'), isNew: true },
          { text: t('tools.sift.tagTeamwork'), isNew: true },
        ],
      },
      caption: t('tools.sift.storyCaption'),
    },
    version: released('sift', '0.9.1'),
    platform: 'macOS',
    stack: ['Tauri 2', 'Rust', 'Svelte 5', 'TypeScript', 'Monaco Editor', 'libgit2', 'Vite', 'Vitest'],
    shots: shots(t, 'Sift', 'sift', [
      ['Diff', 'sift-diff'],
      ['Stage', 'sift-stage'],
      ['Branches', 'sift-branches'],
      ['Commit', 'sift-commit'],
    ]),
  }
}

/** The tools, in the page's order. */
export function tools(t: Translate): ToolData[] {
  return [projectUpdater(t), sift(t)]
}

/** The tool a URL's hash selects (/tools#sift); the first without one. */
export function toolOfHash(hash: string): ToolId {
  return hash === '#sift' ? 'sift' : 'project-updater'
}
