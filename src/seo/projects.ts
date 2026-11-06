// Structured project registry. Feeds JSON-LD, the sitemap and llms.txt so
// machine-readable descriptions of the work stay in one place.
export interface SeoProject {
  path: string
  name: string
  headline: string
  description: string
  tech: string[]
  image: string
  /** Open-source code that is part of the project. */
  sourceCode?: {
    name: string
    description: string
    repository: string
    language: string
    platform: string
  }
}

export const PROJECTS: SeoProject[] = [
  {
    path: '/exultadetail',
    name: 'Exulta',
    headline: 'Stretch tent rental website',
    description:
      'The second version of the Exulta stretch tent rental website, live at exulta.be: a product catalog, an interactive tent calculator, realisations, blog and FAQ on a Laravel 13 back end with a React 19 front end over Inertia, plus a Filament 5 admin panel the client runs themselves.',
    tech: ['Laravel', 'React', 'Inertia.js', 'Filament', 'PHP', 'Tailwind CSS', 'MySQL'],
    image: '/exulta-home.jpg',
  },
  {
    path: '/stablemanagerdetail',
    name: 'Stable Manager',
    headline: 'Private app for tracking horse costs',
    description:
      'A private app that tracks what two horses cost, with every cost split per horse by percentage. A desktop dashboard with charts and reports, and a mobile app that keeps working offline. Built with Next.js 16, React 19, Prisma 7, PostgreSQL and Better Auth. Also rebuilt in Drupal: Shared Costs, an open-source Drupal 11 module that splits costs to the cent, with recipes and a Starterkit theme that rebuild the app with configuration only.',
    tech: ['Next.js', 'React', 'TypeScript', 'Prisma', 'PostgreSQL', 'PWA', 'Drupal', 'PHP', 'HTMX'],
    image: '/stable-manager-home.jpg',
    sourceCode: {
      name: 'Shared Costs',
      description:
        'Open-source Drupal 11 module: a field type that splits an amount over other entities, equally or by percentage, stored to the cent, with Views integration. Four recipes and a Starterkit theme rebuild Stable Manager in Drupal.',
      repository: 'https://github.com/RobbeSaelens/shared_costs',
      language: 'PHP',
      platform: 'Drupal 11',
    },
  },
  {
    path: '/vhsdetail',
    name: 'VHS Service',
    headline: 'Website for an equestrian arena builder',
    description:
      'A trilingual marketing site for VHS Service, who build and renovate riding arenas in Geluwe, Belgium. The site is in rebranding and not public yet. Built with Next.js 16, React 19 and Tailwind CSS 4: an editorial design around large photography, GSAP and Motion for scroll-driven animation, Resend-backed quote forms and local SEO.',
    tech: ['Next.js', 'React', 'TypeScript', 'GSAP', 'Tailwind CSS', 'Vercel'],
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
