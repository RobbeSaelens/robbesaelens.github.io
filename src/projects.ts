/**
 * The projects with a page of their own, in the order of the /projects carousel
 * (Projects.vue shows them in this order, then "coming soon"). Each project page ends
 * with the next one in this list, the last with the first.
 */
export type ProjectStatus = 'live' | 'private' | 'rebranding'

export interface ProjectEntry {
  /** Its key under projects.items in the locale files (the tagline) */
  id: 'exulta' | 'scan2talk' | 'stable-manager' | 'vhs'
  name: string
  /** A real 16:10 screenshot of the site (public/, 1600 × 1000) */
  screenshot: string
  /** The locale key of the screenshot's alt text */
  alt: string
  /** The project page's route name (the Dutch one adds "-nl": $ln) */
  route: string
  status: ProjectStatus
}

export const PROJECT_PAGES: ProjectEntry[] = [
  {
    id: 'exulta',
    name: 'Exulta',
    screenshot: '/exulta-home.jpg',
    alt: 'exulta.alt',
    route: 'ExultaDetail',
    status: 'live',
  },
  {
    id: 'scan2talk',
    name: 'Scan2Talk',
    screenshot: '/scan2talk-home.jpg',
    alt: 'scan2talk.alt',
    route: 'Scan2TalkDetail',
    status: 'live',
  },
  {
    id: 'stable-manager',
    name: 'Stable Manager',
    screenshot: '/stable-manager-home.jpg',
    alt: 'stableManager.alt',
    route: 'StableManagerDetail',
    status: 'private',
  },
  {
    id: 'vhs',
    name: 'VHS Service',
    screenshot: '/vhs-home.jpg',
    alt: 'vhs.alt',
    route: 'VHSDetail',
    status: 'rebranding',
  },
]

/** The project after `id`, wrapping around from the last to the first. */
export function nextProject(id: ProjectEntry['id']): ProjectEntry {
  const index = PROJECT_PAGES.findIndex((project) => project.id === id)
  return PROJECT_PAGES[(index + 1) % PROJECT_PAGES.length]
}
