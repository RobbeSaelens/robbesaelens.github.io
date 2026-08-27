// Structured project registry. Feeds JSON-LD, the sitemap and llms.txt so
// machine-readable descriptions of the work stay in one place.
export interface SeoProject {
  path: string
  name: string
  headline: string
  description: string
  tech: string[]
  image: string
}

export const PROJECTS: SeoProject[] = [
  {
    path: '/exultadetail',
    name: 'Exulta',
    headline: 'Stretch tent rental website',
    description:
      'A stretch tent rental website with a product catalog of tent specifications, a Filament admin panel, interactive Leaflet maps and Playwright end-to-end tests. Built with Laravel, React and Inertia.js.',
    tech: ['Laravel', 'React', 'Inertia.js', 'Filament', 'PHP', 'Playwright', 'Leaflet'],
    image: '/ExultaTeaser.png',
  },
  {
    path: '/stalmanagerdetail',
    name: 'Stal Manager',
    headline: 'Horse stable financial dashboard',
    description:
      'A financial management dashboard for horse stable owners: income and expenses per horse, plus interactive financial reports. Built with the Next.js App Router, TypeScript, Prisma, Auth0 and shadcn/ui.',
    tech: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'React', 'Auth0', 'shadcn/ui'],
    image: '/stalDashboard.png',
  },
  {
    path: '/scan2talkdetail',
    name: 'Scan2Talk',
    headline: 'QR-code student wellbeing check-in',
    description:
      'A progressive web app for schools where students check in on their emotional wellbeing by scanning a QR code, rating their feelings and optionally requesting help, with a staff dashboard of class wellbeing trends. Built with Laravel, Vue.js and Inertia.js.',
    tech: ['Laravel', 'Vue.js', 'Inertia.js', 'PWA', 'PHP'],
    image: '/Fav.png',
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
