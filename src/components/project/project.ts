/**
 * What a project page (src/screens/details) hands the shared template, ProjectPage.vue:
 * its texts (from the locale files), links, screenshots, stack, repository and status.
 * The layout, the "next project" band and the lightbox are the template's.
 */
import type { ProjectEntry, ProjectStatus } from '../../projects'

/** One entry of a numbered index (ProjectIndex.vue): a feature, a Drupal point */
export interface IndexItem {
  title: string
  text: string
}

export interface ProjectShotData {
  /** The JPG in public/ */
  src: string
  /** Its real size */
  width: number
  height: number
  alt: string
  /** Names it in the button's label and the lightbox */
  caption: string
}

export interface ProjectData {
  /** Its entry in src/projects.ts: the tagline and the next project come from there */
  id: ProjectEntry['id']
  name: string
  /** The file in the "$ cat ./…" line under the title */
  file: string
  status: {
    kind: ProjectStatus
    label: string
    /** What the badge doesn't say: "Private app, login only" */
    note?: string
    lock?: boolean
  }
  /** External links beside the status: the live site first */
  links: { label: string; href: string }[]
  about: string
  /** The few that sum it up, under the overview */
  tags: string[]
  languages: string[]
  tools: string[]
  /** The text in the desktop screenshot's browser bar */
  url: string
  desktop: ProjectShotData
  phone: ProjectShotData
  /** Further screenshots in the lightbox, after the two at the top (a page's own block opens them) */
  more?: ProjectShotData[]
  features: IndexItem[]
  repo: {
    key: 'exulta' | 'scan2talk' | 'stableManager' | 'vhs'
    /** Which repository it is, when the page shows a second one */
    label?: string
  }
}

type T = (key: string) => string

/** The items of an index from `<ns>.<prefix><Key>` and `<ns>.<prefix><Key>Text`. */
export function indexItems(t: T, ns: string, prefix: string, keys: string[]): IndexItem[] {
  return keys.map((key) => ({ title: t(`${ns}.${prefix}${key}`), text: t(`${ns}.${prefix}${key}Text`) }))
}
