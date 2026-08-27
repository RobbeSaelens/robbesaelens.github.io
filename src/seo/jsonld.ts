// JSON-LD graph builders. The base graph (Person + WebSite) is emitted on every
// page; each route adds the node that best describes it so search engines and
// LLM crawlers get an explicit, unambiguous entity for "Robbe Saelens".
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

function projectNode(site: string, path: string) {
  const project = PROJECTS.find((p) => p.path === path)
  if (!project) return null
  return {
    '@type': 'CreativeWork',
    '@id': `${site}${path}#project`,
    name: project.name,
    headline: project.headline,
    description: project.description,
    url: `${site}${path}`,
    image: `${site}${project.image}`,
    keywords: project.tech.join(', '),
    creator: { '@id': `${site}/${PERSON_ID}` },
    author: { '@id': `${site}/${PERSON_ID}` },
    isPartOf: { '@id': `${site}/${WEBSITE_ID}` },
  }
}

function breadcrumbNode(site: string, path: string, title: string) {
  if (path === '/') return null
  const isProject = PROJECTS.some((p) => p.path === path)
  const items = [{ name: 'Home', item: `${site}/` }]
  if (isProject) items.push({ name: 'Projects', item: `${site}/projects` })
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

function pageNode(site: string, path: string, title: string, description: string) {
  const isHome = path === '/'
  const isAbout = path === '/contact'
  const type = isHome || isAbout ? 'ProfilePage' : 'WebPage'

  return {
    '@type': type,
    '@id': `${site}${path === '/' ? '/' : path}#webpage`,
    url: `${site}${path === '/' ? '/' : path}`,
    name: `${title} | Robbe Saelens`,
    description,
    isPartOf: { '@id': `${site}/${WEBSITE_ID}` },
    about: { '@id': `${site}/${PERSON_ID}` },
    ...(isHome || isAbout ? { mainEntity: { '@id': `${site}/${PERSON_ID}` } } : {}),
    inLanguage: 'en',
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

/** Full @graph for a route, ready to be JSON.stringify'd into a script tag. */
export function routeJsonLd(path: string, title: string, description: string, site: string) {
  const graph: unknown[] = [personNode(site), websiteNode(site)]

  graph.push(pageNode(site, path, title, description))

  const breadcrumb = breadcrumbNode(site, path, title)
  if (breadcrumb) graph.push(breadcrumb)

  if (path === '/projects') graph.push(projectListNode(site))

  const project = projectNode(site, path)
  if (project) graph.push(project)

  return { '@context': 'https://schema.org', '@graph': graph }
}
