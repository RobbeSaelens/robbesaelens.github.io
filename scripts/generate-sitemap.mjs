// Generates dist/sitemap.xml from the actual router table, so the sitemap can
// never drift from the routes that exist. Uses `sitemapRoutes`, not
// `prerenderRoutes`: some pages are prerendered but must not be listed (routes
// with `meta.sitemap: false` or `meta.noindex`, e.g. the private /status page).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')

if (!existsSync(ssrEntry)) {
  console.error('[sitemap] missing SSR bundle at dist-ssr/entry-server.js')
  process.exit(1)
}

const { sitemapRoutes } = await import(ssrEntry)

if (!Array.isArray(sitemapRoutes)) {
  console.error(
    '[sitemap] dist-ssr/entry-server.js does not export sitemapRoutes; rebuild with `npm run build:ssr`',
  )
  process.exit(1)
}

// Read the canonical origin straight out of src/site.ts so there is exactly one
// place to change it.
const siteSource = readFileSync(join(root, 'src', 'site.ts'), 'utf-8')
const SITE_URL = siteSource.match(/SITE_URL\s*=\s*'([^']+)'/)?.[1]
if (!SITE_URL) {
  console.error('[sitemap] could not read SITE_URL from src/site.ts')
  process.exit(1)
}

const lastmod = new Date().toISOString().slice(0, 10)

const PRIORITY = {
  '/': '1.0',
  '/projects': '0.9',
  '/contact': '0.8',
}

const urls = sitemapRoutes
  .map((route) => {
    const loc = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`
    const priority = PRIORITY[route] ?? '0.6'
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      '    <changefreq>monthly</changefreq>',
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n')
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

writeFileSync(join(root, 'dist', 'sitemap.xml'), xml)
console.log(`[sitemap] wrote ${sitemapRoutes.length} urls: ${sitemapRoutes.join(', ')}`)
