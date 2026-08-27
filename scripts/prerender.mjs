// Renders every static route to real HTML in dist/ after the client build.
//
// Why: the site is a Vue SPA. Google can execute JavaScript, but most AI
// crawlers (GPTBot, ClaudeBot, PerplexityBot, ...) cannot, so without this they
// would only ever see an empty <div id="app">. Prerendering ships crawlable
// content and per-route head tags while keeping the SPA behaviour intact.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')

if (!existsSync(ssrEntry)) {
  console.error('[prerender] missing SSR bundle at dist-ssr/entry-server.js')
  process.exit(1)
}

const { render, prerenderRoutes } = await import(ssrEntry)

const template = readFileSync(join(distDir, 'index.html'), 'utf-8')

// The template carries a static <title> as a no-JS fallback; unhead emits the
// real per-route one, so drop it here to avoid two <title> elements.
const baseTemplate = template.replace(/\n?\s*<title>[\s\S]*?<\/title>/, '')

function injectHead(html, headTags) {
  // The template already declares charset and viewport (charset must stay in the
  // first bytes of the document), so drop unhead's duplicates.
  const tags = headTags
    .split('\n')
    .filter((line) => !/^<meta (charset|name="viewport")/.test(line.trim()))
    .join('\n')
  return html.replace('</head>', `${tags}\n  </head>`)
}

function injectApp(html, appHtml, bodyTags) {
  let out = html.replace('<div id="app"><!--app-html--></div>', `<div id="app">${appHtml}</div>`)
  if (bodyTags) out = out.replace('</body>', `${bodyTags}\n  </body>`)
  return out
}

const written = []

for (const route of prerenderRoutes) {
  let rendered
  try {
    rendered = await render(route)
  } catch (error) {
    console.error(`[prerender] failed for ${route}:`, error)
    process.exit(1)
  }

  const html = injectApp(injectHead(baseTemplate, rendered.head), rendered.html, rendered.bodyTags)

  if (route === '/') {
    writeFileSync(join(distDir, 'index.html'), html)
  } else {
    const slug = route.slice(1)
    // Written twice on purpose: `<slug>/index.html` serves "/slug/" and
    // `<slug>.html` serves "/slug" directly, so GitHub Pages never has to issue
    // a 301 between the two. Both declare the same canonical URL.
    const dirFile = join(distDir, slug, 'index.html')
    mkdirSync(dirname(dirFile), { recursive: true })
    writeFileSync(dirFile, html)
    writeFileSync(join(distDir, `${slug}.html`), html)
  }

  written.push(route)
}

// SPA fallback for any unknown deep link on GitHub Pages. Rendered from the
// catch-all route so the fallback is a real, noindex 404 page rather than a
// duplicate of the home page (which search engines would treat as a soft 404).
const notFound = await render('/__not-found__')
writeFileSync(
  join(distDir, '404.html'),
  injectApp(injectHead(baseTemplate, notFound.head), notFound.html, notFound.bodyTags),
)

console.log(`[prerender] wrote ${written.length} routes: ${written.join(', ')}`)
