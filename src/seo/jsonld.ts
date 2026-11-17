// JSON-LD graph builders. The base graph (Person + WebSite) is emitted on every
// page; each route adds the node that best describes it so search engines and
// LLM crawlers get an explicit, unambiguous entity for "Robbe Saelens".
import { localizedPath, stripLocale, type Locale } from '../localePath'
import REPO_STATS from '../data/repo-stats.json'
import { PROJECTS, SKILLS } from './projects'

const PERSON_ID = '#person'
const WEBSITE_ID = '#website'

export function personNode(site: string) {
  return {
    '@type': 'Person',
    '@id': `${site}/${PERSON_ID}`,
    name: 'Robbe Saelens',
    alternateName: ['Robbe Saelens developer', 'RobbeSaelens'],
    givenName: 'Robbe',
    familyName: 'Saelens',
    jobTitle: 'Full-Stack Web Developer',
    description:
      'Full-stack web developer based in Geluwe, Belgium, specializing in Vue.js, TypeScript, React, Laravel, Next.js and modern web technologies.',
    url: `${site}/`,
    mainEntityOfPage: { '@id': `${site}/${WEBSITE_ID}` },
    image: {
      '@type': 'ImageObject',
      url: `${site}/pf2.jpg`,
      caption: 'Robbe Saelens, full-stack web developer',
    },
    sameAs: [
      'https://github.com/RobbeSaelens',
      'https://linkedin.com/in/robbe-saelens-1a14511b8',
      'https://instagram.com/robbe.saelens',
      'https://facebook.com/robbe.saelens',
      'https://www.drupal.org/u/robbesaelens',
      'https://git.drupalcode.org/robbesaelens',
    ],
    knowsAbout: SKILLS,
    knowsLanguage: [
      { '@type': 'Language', name: 'Dutch', alternateName: 'nl' },
      { '@type': 'Language', name: 'English', alternateName: 'en' },
    ],
    worksFor: {
      '@type': 'Organization',
      name: 'Dynamate',
      url: 'https://dynamate.be',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Geluwe',
      addressRegion: 'West Flanders',
      addressCountry: 'BE',
    },
    nationality: { '@type': 'Country', name: 'Belgium' },
  }
}

export function websiteNode(site: string) {
  return {
    '@type': 'WebSite',
    '@id': `${site}/${WEBSITE_ID}`,
    url: `${site}/`,
    name: 'Robbe Saelens - Portfolio',
    description:
      'Portfolio of Robbe Saelens, full-stack web developer, showcasing projects in Vue, TypeScript, React, Laravel and Next.js.',
    author: { '@id': `${site}/${PERSON_ID}` },
    publisher: { '@id': `${site}/${PERSON_ID}` },
    inLanguage: ['en', 'nl'],
  }
}

/** The day a repository got its first commit (src/data/repo-stats.json), if it is known. */
function firstCommitDay(key: string): string | undefined {
  const stats = (REPO_STATS.projects as Record<string, { firstCommit?: string | null } | undefined>)[key]
  return stats?.firstCommit?.slice(0, 10) || undefined
}

/**
 * The work a project page is about: the site (WebSite) or the app (WebApplication)
 * itself, in the page's language. Name, headline, description and image are the
 * page's own (title, meta description, og:image); the live site, the stack and the
 * code come from PROJECTS; dateCreated is the first commit of its repository.
 */
function projectNode(site: string, path: string, title: string, description: string, image: string) {
  const project = PROJECTS.find((p) => p.path === stripLocale(path))
  if (!project) return null
  const person = { '@id': `${site}/${PERSON_ID}` }
  const created = firstCommitDay(project.stats)
  const code = project.sourceCode
  const codeCreated = code && firstCommitDay(code.stats)

  return {
    '@type': project.type,
    '@id': `${site}${path}#project`,
    name: project.name,
    headline: title,
    description,
    url: `${site}${path}`,
    mainEntityOfPage: { '@id': `${site}${path}#webpage` },
    ...(project.liveUrl ? { sameAs: project.liveUrl } : {}),
    image,
    keywords: project.tech.join(', '),
    ...(created ? { dateCreated: created } : {}),
    ...(project.type === 'WebApplication'
      ? { applicationCategory: project.applicationCategory, operatingSystem: 'Any' }
      : {}),
    // The code: programmingLanguage only exists on SoftwareSourceCode. The repositories
    // are private, except the Drupal version of Stable Manager.
    hasPart: [
      {
        '@type': 'SoftwareSourceCode',
        name: `${project.name} source code`,
        programmingLanguage: project.languages,
        author: person,
      },
      ...(code
        ? [
            {
              '@type': 'SoftwareSourceCode',
              name: code.name,
              description: code.description,
              codeRepository: code.repository,
              programmingLanguage: code.language,
              runtimePlatform: code.platform,
              ...(codeCreated ? { dateCreated: codeCreated } : {}),
              author: person,
            },
          ]
        : []),
    ],
    creator: person,
    author: person,
  }
}

function breadcrumbNode(site: string, path: string, title: string, lang: Locale) {
  const base = stripLocale(path)
  if (base === '/') return null
  const isProject = PROJECTS.some((p) => p.path === base)
  const home = localizedPath('/', lang)
  const items = [{ name: 'Home', item: `${site}${home === '/' ? '/' : home}` }]
  if (isProject) items.push({ name: lang === 'nl' ? 'Projecten' : 'Projects', item: `${site}${localizedPath('/projects', lang)}` })
  items.push({ name: title, item: `${site}${path}` })

  return {
    '@type': 'BreadcrumbList',
    '@id': `${site}${path}#breadcrumb`,
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  }
}

function pageNode(site: string, path: string, title: string, description: string, lang: Locale) {
  const isHome = stripLocale(path) === '/'
  const isAbout = stripLocale(path) === '/contact'
  const isProject = PROJECTS.some((p) => p.path === stripLocale(path))
  const type = isHome || isAbout ? 'ProfilePage' : isProject ? 'ItemPage' : 'WebPage'

  return {
    '@type': type,
    '@id': `${site}${path === '/' ? '/' : path}#webpage`,
    url: `${site}${path === '/' ? '/' : path}`,
    name: `${title} | Robbe Saelens`,
    description,
    isPartOf: { '@id': `${site}/${WEBSITE_ID}` },
    about: { '@id': `${site}/${PERSON_ID}` },
    ...(isHome || isAbout ? { mainEntity: { '@id': `${site}/${PERSON_ID}` } } : {}),
    ...(isProject ? { mainEntity: { '@id': `${site}${path}#project` } } : {}),
    inLanguage: lang,
  }
}

function projectListNode(site: string) {
  return {
    '@type': 'ItemList',
    '@id': `${site}/projects#list`,
    name: 'Projects by Robbe Saelens',
    numberOfItems: PROJECTS.length,
    itemListElement: PROJECTS.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${site}${project.path}`,
      name: project.name,
    })),
  }
}

/**
 * The Drupal contributions page adds its credited contributions (src/data/drupal.json)
 * itself, so that data stays in the page's own bundle.
 */
export function drupalCreditsJsonLd(
  site: string,
  path: string,
  credits: { title: string; project: string; url: string }[],
  projects: Record<string, { name: string } | undefined>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${site}${path}#credits`,
    name: 'Credited Drupal contributions by Robbe Saelens',
    author: { '@id': `${site}/${PERSON_ID}` },
    numberOfItems: credits.length,
    itemListElement: credits.map((credit, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: credit.url,
      name: `${credit.title} (${projects[credit.project]?.name ?? credit.project})`,
    })),
  }
}

/**
 * Full @graph for a route, ready to be JSON.stringify'd into a script tag. `image` is
 * the page's og:image, as an absolute URL.
 */
export function routeJsonLd(
  path: string,
  title: string,
  description: string,
  site: string,
  lang: Locale = 'en',
  image = `${site}/pf2.jpg`,
) {
  const graph: unknown[] = [personNode(site), websiteNode(site)]

  graph.push(pageNode(site, path, title, description, lang))

  const breadcrumb = breadcrumbNode(site, path, title, lang)
  if (breadcrumb) graph.push(breadcrumb)

  if (stripLocale(path) === '/projects') graph.push(projectListNode(site))

  const project = projectNode(site, path, title, description, image)
  if (project) graph.push(project)

  return { '@context': 'https://schema.org', '@graph': graph }
}
