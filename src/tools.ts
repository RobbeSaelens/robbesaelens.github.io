/**
 * The tools Robbe made to look after his projects, as the tools page shows them
 * (src/screens/Tools.vue), in its order. /llms.txt (src/llms.ts) and the page's JSON-LD
 * (src/seo/jsonld.ts) are written from the same data. Texts come through `t`, from
 * `tools.*` in the locale files, so one builder serves both languages.
 *
 * Both repositories are private for now. When one goes public, its `repository` is the
 * one line to add: the page then links to it ("View on GitHub"), and /llms.txt names it.
 */
import { indexItems, type IndexItem, type ProjectShotData, type Translate } from './components/project/project'

export interface ToolData {
  /** Its section's id on the page (/tools#sift), and its key under `tools` in the locale files */
  id: 'project-updater' | 'sift'
  name: string
  /** One line under the name */
  tagline: string
  /** What it is for, in the list at the top of the page */
  role: string
  /** The current release; update with each one (its CHANGELOG.md) */
  version: string
  platform: string
  /** The public repository, once there is one. Private for now: no link. */
  repository?: string
  /** What it is and does, in a paragraph */
  about: string
  /** Why I built it, in paragraphs; none when the page's intro says it */
  why: string[]
  features: IndexItem[]
  /** What it's made with, the main parts first */
  stack: string[]
  /**
   * A real screenshot of its window (public/, 1600 × 1000, from a capture of a 1200 × 750
   * window). Its caption, "Name — what it shows", is also the line under it on the page.
   */
  shot: ProjectShotData
}

export function projectUpdater(t: Translate): ToolData {
  return {
    id: 'project-updater',
    name: 'Project Updater',
    tagline: t('tools.updater.tagline'),
    role: t('tools.updater.role'),
    version: '0.16.0',
    platform: 'macOS',
    about: t('tools.updater.about'),
    why: [],
    features: indexItems(t, 'tools.updater', 'feature', ['Scan', 'Run', 'Review', 'Majors', 'Sentry', 'Guard']),
    stack: ['Electron', 'Node.js', 'TypeScript', 'Claude Code', 'npm', 'Composer', 'Sentry API', 'Vitest', 'esbuild', 'GitHub Actions'],
    shot: {
      src: '/project-updater-home.jpg',
      width: 1600,
      height: 1000,
      alt: t('tools.updater.alt'),
      caption: `Project Updater — ${t('tools.updater.shotLabel')}`,
    },
  }
}

export function sift(t: Translate): ToolData {
  return {
    id: 'sift',
    name: 'Sift',
    tagline: t('tools.sift.tagline'),
    role: t('tools.sift.role'),
    version: '0.9.1',
    platform: 'macOS',
    about: t('tools.sift.about'),
    why: [t('tools.sift.why1'), t('tools.sift.why2')],
    features: indexItems(t, 'tools.sift', 'feature', ['Diff', 'Edit', 'Stage', 'Commit', 'Branches', 'Terminal']),
    stack: ['Tauri 2', 'Rust', 'Svelte 5', 'TypeScript', 'Monaco Editor', 'libgit2', 'Vite', 'Vitest'],
    shot: {
      src: '/sift-home.jpg',
      width: 1600,
      height: 1000,
      alt: t('tools.sift.alt'),
      caption: `Sift — ${t('tools.sift.shotLabel')}`,
    },
  }
}

/** The tools, in the page's order. */
export function tools(t: Translate): ToolData[] {
  return [projectUpdater(t), sift(t)]
}
