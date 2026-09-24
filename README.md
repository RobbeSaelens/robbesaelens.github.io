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
| `npm run sitemap`      | Regenerates `dist/sitemap.xml` from the router (`sitemapRoutes`)   |
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

## Private status page (`/status`)

`/status` is a private dashboard with the live health, uptime, Sentry errors and aggregate
check-in stats of my projects (currently Scan2Talk). It is served by the separate
`status-worker` Cloudflare Worker.

- **The page is public, the data is not.** The page itself holds no data and no secrets.
  It asks for a passphrase, trades it at the worker (`POST /auth`) for a 12-hour token kept
  in `sessionStorage`, and then fetches everything from the worker's authenticated
  `GET /summary`. API data is rendered as text only (no `v-html`).
- **Configuration:** the worker's base URL comes from `VITE_STATUS_API_URL` at build time
  (no trailing slash). In CI it is the repository **variable** `STATUS_API_URL`
  (Settings → Secrets and variables → Actions → Variables), passed to the Build step in
  `deploy.yml`. It is a public URL, not a secret. When it is unset, the page shows a
  "not configured" message. For local development copy `.env.local.example` to
  `.env.local` (`VITE_STATUS_API_URL=http://localhost:8787`); the worker's
  `ALLOWED_ORIGINS` must then include the exact origin Vite prints (`http://localhost:5173`,
  or `5174`+ when 5173 is already taken — a mismatch shows up as a network error). Vite also reads
  `.env.local` during a local `npm run build`.
- **Not advertised:** not linked from the navigation, footer, `llms.txt` or JSON-LD, and
  left out of `sitemap.xml` (`meta.sitemap: false`, via `sitemapRoutes` in
  `src/entry-server.ts`). It is still prerendered as an empty shell, so it returns a real
  200 with `<meta name="robots" content="noindex, follow">` and
  `<meta name="referrer" content="no-referrer">`. There is deliberately no `Disallow` in
  `robots.txt`, because that would advertise the path and stop crawlers from seeing the
  `noindex`.

| Concern                         | File                        |
| ------------------------------- | --------------------------- |
| Dashboard UI                    | `src/screens/Status.vue`    |
| Worker client, response checks  | `src/status/api.ts`         |
| Worker base URL                 | `src/site.ts` (`STATUS_API_URL`) |
| Strings (en/nl)                 | `status` in `src/locales/*.json` |

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to
`main`.
