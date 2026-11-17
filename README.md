# robbesaelens.github.io

Personal portfolio of Robbe Saelens. Vue 3 + TypeScript + Vite, deployed to GitHub Pages
at <https://robbesaelens.github.io>.

## Scripts

| Command                | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Vite dev server                                                  |
| `npm run build`        | Full production build: client → SSR → prerender → sitemap → llms.txt |
| `npm run build:client` | Client bundle only (`dist/`)                                      |
| `npm run build:ssr`    | Prerender bundle only (`dist-ssr/`)                               |
| `npm run prerender`    | Writes static HTML per route into `dist/`                          |
| `npm run sitemap`      | Regenerates `dist/sitemap.xml` from the router (`sitemapRoutes`)   |
| `npm run llms`         | Writes `dist/llms.txt` (the chatbot's knowledge) from the SSR bundle, and prints its size |
| `npm run preview`      | Serves the built `dist/`                                          |
| `npm run stats`        | Refreshes the repository numbers (`src/data/repo-stats.json`) from the GitHub API; needs `REPO_STATS_TOKEN` (below) |
| `npm run drupal`       | Refreshes the Drupal contributions (`src/data/drupal.json`)       |

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

Old URLs of pages that moved (`REDIRECTS` in `src/bootstrap/router.ts`) keep working.
GitHub Pages can't send a 301, so the router redirects them in the app, and the
prerenderer writes a `noindex` page for each with a canonical link and an instant meta
refresh to the new URL. They are not in the sitemap.

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
| LLM-readable site summary (`/llms.txt`)       | `src/data/llms-profile.md` (hand-written), `src/llms.ts` (the rest, from the site's data) |

Changing the domain means editing `src/site.ts`, `public/robots.txt` and the URLs in
`src/data/llms-profile.md`. The sitemap and the rest of `llms.txt` pick the origin up from
`src/site.ts` automatically.

### The chatbot

The AI chatbot answers from `/llms.txt` (fetched live by the `status-worker`, cached for
an hour), which the build writes from `src/data/llms-profile.md` and the site's own data
(`src/llms.ts`), with built-in answers in `src/components/ChatBot.vue` and the `chat.*`
locale strings as a fallback. When the site's content changes in a way a visitor might ask
about, update them too: [AGENTS.md](AGENTS.md#content-changes-keep-the-chatbot-in-step)
lists what and where.

### Known limitations

- **One URL per page for both languages.** English and Dutch are a client-side toggle, so
  there are no `/nl/` URLs and no `hreflang` alternates. Proper multilingual SEO would
  need localized routes.
- **`_redirects` and `public/_headers` are Netlify-only.** GitHub Pages ignores both, so
  the security headers in `_headers` are not applied on `robbesaelens.github.io`.

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to
`main`, every morning (05:17 UTC) and when you press **Run workflow** on the Actions tab.
Before the build it refreshes the Drupal contributions (`npm run drupal`) and the
repository numbers (`npm run stats`). When drupal.org or GitHub doesn't answer, it
deploys the committed `src/data/drupal.json` and `src/data/repo-stats.json`. The scheduled
and manual runs commit nothing: they build `main` as it is, with fresh data.

The repository numbers come from private repositories, so the workflow reads them with
`REPO_STATS_TOKEN`: a repository secret (Settings → Secrets and variables → Actions)
holding a fine-grained personal access token with read-only **Contents** access to
those repositories (and nothing else). Only that step gets it. It expires after at most a
year: when it does, the step warns and the committed numbers stay until you renew it.
By hand: `REPO_STATS_TOKEN=$(gh auth token) npm run stats`. The committed JSON files are
only the fallback for when a source doesn't answer, so they may lag behind the live site.
