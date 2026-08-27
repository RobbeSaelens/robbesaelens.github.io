# robbesaelens.github.io

Personal portfolio of Robbe Saelens. Vue 3 + TypeScript + Vite, deployed to GitHub Pages
at <https://robbesaelens.github.io>.

## Scripts

| Command                | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Vite dev server                                                  |
| `npm run build`        | Full production build: client → SSR → prerender → sitemap         |
| `npm run build:client` | Client bundle only (`dist/`)                                      |
| `npm run build:ssr`    | Prerender bundle only (`dist-ssr/`)                               |
| `npm run prerender`    | Writes static HTML per route into `dist/`                          |
| `npm run sitemap`      | Regenerates `dist/sitemap.xml` from the router                     |
| `npm run preview`      | Serves the built `dist/`                                          |

## How SEO works here

The site is a client-rendered SPA, which on its own is invisible to crawlers that do not
execute JavaScript — including most AI crawlers (GPTBot, ClaudeBot, PerplexityBot). The
build therefore prerenders every route to real HTML:

1. `vite build` produces the normal client bundle.
2. `vite build --ssr src/entry-server.ts` produces a render function.
3. `scripts/prerender.mjs` renders each route with `renderToString`, injects the
   unhead-generated `<head>` into `index.html`, and writes the result to `dist/`.

Each route is written twice — `slug/index.html` and `slug.html` — so GitHub Pages can
serve both `/slug` and `/slug/` without a redirect. The catch-all route is rendered
separately to `404.html` as a real, `noindex` 404 page.

The client does **not** hydrate; it mounts a fresh app over the prerendered markup. That
sidesteps hydration mismatches entirely at the cost of a re-render on load.

### Where to change what

| Concern                                       | File                          |
| --------------------------------------------- | ----------------------------- |
| Canonical origin (single source of truth)     | `src/site.ts`                 |
| Per-route title, description, OG image        | `src/bootstrap/router.ts` (`meta`) |
| Head tag assembly (title, OG, Twitter, canonical) | `src/App.vue`             |
| JSON-LD graph (Person, WebSite, projects)     | `src/seo/jsonld.ts`           |
| Machine-readable project facts                | `src/seo/projects.ts`         |
| Crawler policy, incl. AI crawlers             | `public/robots.txt`           |
| LLM-readable site summary                     | `public/llms.txt`             |

Changing the domain means editing `src/site.ts`, `public/robots.txt` and `public/llms.txt`.
The sitemap picks the origin up from `src/site.ts` automatically.

### Known limitations

- **One URL per page for both languages.** English and Dutch are a client-side toggle, so
  there are no `/nl/` URLs and no `hreflang` alternates. Proper multilingual SEO would
  need localized routes.
- **`_redirects` and `public/_headers` are Netlify-only.** GitHub Pages ignores both, so
  the security headers in `_headers` are not applied on `robbesaelens.github.io`.

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to
`main`.
