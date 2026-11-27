/**
 * The project pages' data, one builder per page: the pages next to this file hand it to
 * the template (ProjectPage.vue), and src/llms.ts writes it into /llms.txt for the
 * chatbot. Texts come through `t`, so the same builder serves both languages.
 */
import type { ProjectEntry } from '../../projects'
import { indexItems, type IndexItem, type ProjectData, type ProjectShotData, type Translate } from '../../components/project/project'

export function exulta(t: Translate): ProjectData {
  return {
    id: 'exulta',
    name: t('exulta.title'),
    file: 'exulta-project.md',
    status: { kind: 'live', label: t('project.live') },
    links: [
      { label: t('exulta.visitSite'), href: 'https://exulta.be' },
      { label: t('exulta.tryCalculator'), href: 'https://exulta.be/tentcalculator' },
    ],
    about: t('exulta.aboutText'),
    tags: ['Laravel 13', 'React 19', 'Inertia.js', 'Filament 5', 'Tailwind CSS 4', 'MySQL'],
    languages: ['PHP 8.4', 'Laravel 13', 'React 19', 'Inertia.js 3', 'Filament 5', 'Tailwind CSS 4', 'SCSS', 'MySQL'],
    tools: [
      'Vite 8',
      'GitHub Actions',
      'Playwright',
      'Lighthouse',
      'Spatie Media Library',
      'Spatie Backup',
      'Filament Shield',
      'Ziggy',
      'Pint',
    ],
    url: 'exulta.be',
    desktop: { src: '/exulta-home.jpg', width: 1600, height: 1000, alt: t('exulta.alt'), caption: 'exulta.be' },
    phone: {
      src: '/exulta-mobile.jpg',
      width: 369,
      height: 800,
      alt: t('exulta.alt'),
      caption: `exulta.be — ${t('projects.shotMobile')}`,
    },
    features: indexItems(t, 'exulta', 'feature', ['Catalog', 'Calculator', 'Admin', 'Content', 'Seo', 'Perf']),
    repo: { key: 'exulta' },
  }
}

export function scan2talk(t: Translate): ProjectData {
  return {
    id: 'scan2talk',
    name: t('scan2talk.title'),
    file: 'scan2talk-project.md',
    status: { kind: 'live', label: t('project.live') },
    links: [{ label: t('scan2talk.visitSite'), href: 'https://scan2talk.be' }],
    about: t('scan2talk.aboutText'),
    tags: ['Laravel', 'Vue.js', 'Inertia.js', 'PWA', 'PostgreSQL', 'Chart.js'],
    languages: ['PHP 8.3', 'Laravel 13', 'Vue.js 3', 'Inertia.js 2', 'PostgreSQL', 'Tailwind CSS 3', 'Chart.js'],
    tools: [
      'Laravel Cloud',
      'Vite 8',
      'Laravel Breeze',
      'Spatie Permissions',
      'Google2FA',
      'Simple QR Code',
      'Ziggy',
      'Larastan',
      'Pint',
    ],
    url: 'scan2talk.be',
    desktop: { src: '/scan2talk-home.jpg', width: 1600, height: 1000, alt: t('scan2talk.alt'), caption: 'scan2talk.be' },
    phone: {
      src: '/scan2talk-mobile.jpg',
      width: 738,
      height: 1600,
      alt: t('scan2talk.alt'),
      caption: `scan2talk.be — ${t('projects.shotMobile')}`,
    },
    features: indexItems(t, 'scan2talk', 'feature', ['Qr', 'Chat', 'Dashboard', 'Roles', 'Pwa', 'Privacy']),
    repo: { key: 'scan2talk' },
  }
}

/** Scan2Talk's own block: how a check-in works, in three steps. */
export function scan2talkCheckIn(t: Translate): { title: string; steps: IndexItem[] } {
  return { title: t('scan2talk.flowTitle'), steps: indexItems(t, 'scan2talk', 'flowStep', ['1', '2', '3']) }
}

export function stableManager(t: Translate): ProjectData {
  return {
    id: 'stable-manager',
    name: t('stableManager.title'),
    file: 'stable-manager-project.md',
    status: { kind: 'private', label: t('project.live'), note: t('stableManager.privateNote'), lock: true },
    links: [],
    about: t('stableManager.aboutText'),
    tags: ['Next.js 16', 'React 19', 'TypeScript', 'Prisma 7', 'PostgreSQL', 'PWA'],
    languages: ['TypeScript', 'Next.js 16', 'React 19', 'Tailwind CSS 4', 'Prisma 7', 'PostgreSQL 16'],
    tools: ['Better Auth', 'shadcn/ui', 'Recharts', 'date-fns', 'Vitest', 'Docker', 'Vercel'],
    url: 'Stable Manager',
    desktop: {
      src: '/stable-manager-home.jpg',
      width: 1600,
      height: 1000,
      alt: t('stableManager.alt'),
      caption: `Stable Manager — ${t('projects.shotDesktop')}`,
    },
    phone: {
      src: '/stable-manager-mobile.jpg',
      width: 470,
      height: 800,
      alt: t('stableManager.alt'),
      caption: `Stable Manager — ${t('projects.shotMobile')}`,
    },
    features: indexItems(t, 'stableManager', 'feature', ['Split', 'Quick', 'Offline', 'Insights', 'Auth', 'Quality']),
    repo: { key: 'stableManager' },
  }
}

export function vhs(t: Translate): ProjectData {
  return {
    id: 'vhs',
    name: t('vhs.title'),
    file: 'vhs-project.md',
    status: { kind: 'rebranding', label: t('vhs.rebrandingBadge'), note: t('vhs.notLiveYet') },
    links: [],
    about: t('vhs.aboutText'),
    tags: ['Next.js 16', 'React 19', 'TypeScript', 'GSAP', 'Tailwind CSS', 'i18n'],
    languages: ['TypeScript', 'Next.js 16', 'React 19', 'Tailwind CSS 4', 'GSAP', 'Motion'],
    tools: ['Vercel', 'Turbopack', 'Lenis', 'Resend', 'Vercel Analytics', 'Speed Insights', 'Sentry', 'Playwright', 'ESLint'],
    url: 'VHS Service',
    desktop: {
      src: '/vhs-home.jpg',
      width: 1600,
      height: 1000,
      alt: t('vhs.alt'),
      caption: `VHS Service — ${t('projects.shotDesktop')}`,
    },
    phone: {
      src: '/vhs-mobile.jpg',
      width: 738,
      height: 1600,
      alt: t('vhs.alt'),
      caption: `VHS Service — ${t('projects.shotMobile')}`,
    },
    features: indexItems(t, 'vhs', 'feature', ['Motion', 'I18n', 'Services', 'Seo', 'Forms', 'Gallery']),
    repo: { key: 'vhs' },
  }
}

/** Every project page's data, by its id in src/projects.ts. */
export const PROJECT_DATA: Record<ProjectEntry['id'], (t: Translate) => ProjectData> = {
  exulta,
  scan2talk,
  'stable-manager': stableManager,
  vhs,
}
