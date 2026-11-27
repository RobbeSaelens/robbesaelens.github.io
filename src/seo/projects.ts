// Structured project registry. Feeds the JSON-LD of the project pages (jsonld.ts)
// with what the pages' own meta (title, description, og:image) doesn't hold.
export interface SeoProject {
  path: string
  name: string
  /** The schema.org type of the work: a site, or an app people sign in to */
  type: 'WebSite' | 'WebApplication'
  /** For a WebApplication: one of Google's application categories */
  applicationCategory?: string
  /** The live site, where it is public */
  liveUrl?: string
  /** Its repository's numbers in src/data/repo-stats.json (dateCreated: the first commit) */
  stats: string
  tech: string[]
  /** The programming languages of its code (the repository is private) */
  languages: string[]
  /** Open-source code that is part of the project. */
  sourceCode?: {
    name: string
    description: string
    repository: string
    language: string
    platform: string
    stats: string
  }
}

export const PROJECTS: SeoProject[] = [
  {
    path: '/exultadetail',
    name: 'Exulta',
    type: 'WebSite',
    liveUrl: 'https://exulta.be',
    stats: 'exulta',
    tech: ['Laravel', 'React', 'Inertia.js', 'Filament', 'PHP', 'Tailwind CSS', 'MySQL'],
    languages: ['PHP', 'JavaScript'],
  },
  {
    path: '/stablemanagerdetail',
    name: 'Stable Manager',
    type: 'WebApplication',
    applicationCategory: 'FinanceApplication',
    stats: 'stableManager',
    tech: ['Next.js', 'React', 'TypeScript', 'Prisma', 'PostgreSQL', 'PWA'],
    languages: ['TypeScript'],
  },
  {
    path: '/vhsdetail',
    name: 'VHS Service',
    type: 'WebSite',
    stats: 'vhs',
    tech: ['Next.js', 'React', 'TypeScript', 'GSAP', 'Tailwind CSS', 'Vercel'],
    languages: ['TypeScript'],
  },
  {
    path: '/scan2talkdetail',
    name: 'Scan2Talk',
    type: 'WebApplication',
    applicationCategory: 'EducationalApplication',
    liveUrl: 'https://scan2talk.be',
    stats: 'scan2talk',
    tech: ['Laravel', 'Vue.js', 'Inertia.js', 'PWA', 'PHP', 'PostgreSQL', 'Chart.js'],
    languages: ['PHP', 'JavaScript'],
  },
]

export const SKILLS: string[] = [
  'Vue.js',
  'Nuxt',
  'TypeScript',
  'JavaScript',
  'React',
  'Next.js',
  'Laravel',
  'PHP',
  'NestJS',
  'Node.js',
  'Drupal',
  'GraphQL',
  'Prisma',
  'PostgreSQL',
  'MongoDB',
  'TailwindCSS',
  'UnoCSS',
  'Azure',
  'Full-stack web development',
]
