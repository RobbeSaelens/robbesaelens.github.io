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
      'The second version of the Exulta stretch tent rental website, currently in rebranding: a product catalog, realisations, blog and FAQ on a Laravel 13 back end with a React 19 front end over Inertia, plus a Filament 5 admin panel the client runs themselves.',
    tech: ['Laravel', 'React', 'Inertia.js', 'Filament', 'PHP', 'Tailwind CSS', 'MySQL'],
    image: '/exulta-home.jpg',
  },
  {
    path: '/vhsdetail',
    name: 'VHS Service',
    headline: 'Website for an equestrian arena builder',
    description:
      'A trilingual marketing site for VHS Service, who build and renovate riding arenas in Geluwe, Belgium. The site is in rebranding and not public yet. Built with Next.js 16 and React 19, with GSAP and Motion for scroll-driven animation, an OGL WebGL hero, Resend-backed quote forms and local SEO.',
    tech: ['Next.js', 'React', 'TypeScript', 'GSAP', 'WebGL', 'Vercel'],
    image: '/vhs-home.jpg',
  },
  {
    path: '/scan2talkdetail',
    name: 'Scan2Talk',
    headline: 'QR-code student wellbeing check-in',
    description:
      'A wellbeing check-in tool for schools, live at scan2talk.be. Students scan a printed QR poster and share how they feel in under a minute; educators get trends over time and an anonymous chat with students who ask for help. Built with Laravel, Vue.js and Inertia.js.',
    tech: ['Laravel', 'Vue.js', 'Inertia.js', 'PWA', 'PHP', 'PostgreSQL', 'Chart.js'],
    image: '/scan2talk-home.jpg',
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
