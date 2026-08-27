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
  {
    path: '/binancedetail',
    name: 'Binance App',
    headline: 'Smartwatch crypto companion concept',
    description:
      'A concept for a companion smartwatch app that lets cryptocurrency users monitor their portfolio, track live prices and receive alerts from their wrist. Prototyped in Adobe XD with After Effects animations delivered through LottieFiles.',
    tech: ['Adobe XD', 'LottieFiles', 'After Effects', 'UI Design', 'Motion Design'],
    image: '/Mockup.jpg',
  },
  {
    path: '/azuredetail',
    name: 'Azure Search',
    headline: 'Netflix-style search over unstructured data',
    description:
      'A bachelor thesis project exploring Search as a Service on unstructured data: a Netflix-style browsing and search experience over a dataset of more than 8,000 movies and TV shows, indexed with Azure Cognitive Search and Amazon OpenSearch. Built with Vue.js and TailwindCSS.',
    tech: ['Vue.js', 'TailwindCSS', 'Azure', 'OpenSearch', 'TypeScript'],
    image: '/ResearchMockup.jpg',
  },
  {
    path: '/vitaldetail',
    name: 'Vital Cities',
    headline: 'Website for a city liveability organization',
    description:
      'A group project building a highly interactive public website for Vital Cities, an organization helping cities become more sustainable and liveable, with rich animations and smooth page transitions. Built with Gatsby and TypeScript, deployed on Netlify.',
    tech: ['Gatsby', 'TypeScript', 'Netlify', 'React'],
    image: '/VitalCitiesMockup.png',
  },
  {
    path: '/bikerentaldetail',
    name: 'BikeRental',
    headline: 'Bike sharing progressive web app',
    description:
      'A full-stack progressive web app for renting bikes, with real-time bike locations on an interactive map, a mobile-first rental flow and an operator admin panel for managing the fleet. Built with Vue.js and a NestJS GraphQL API.',
    tech: ['Vue.js', 'NestJS', 'GraphQL', 'MongoDB', 'TypeScript', 'PWA'],
    image: '/BikeRental.jpg',
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
