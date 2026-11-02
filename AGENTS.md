# AGENTS.md

Notes for coding agents (and people) working on this portfolio: a Vue 3 + Vite site,
prerendered to static HTML and deployed to GitHub Pages from `main`.

## Commands

| | |
|---|---|
| `npm run dev` | Dev server. Port 5173 can be taken by ddev's router (Exulta); the `.claude/launch.json` preview uses `127.0.0.1:5180` |
| `npm run build` | Client build, SSR build, prerender, sitemap |
| `npm test` | Smoke + accessibility tests (Playwright, desktop + mobile) against the production build |
| `npm run test:responsive` | Every page at every breakpoint, with screenshots (below) |

Run both test suites with `CI=1` so Playwright starts its own server instead of reusing
a stale one. GitHub Actions runs both on every push to `develop` (`.github/workflows/test.yml`),
not on `main`.

The accessibility tests (`tests/a11y.spec.ts`) run axe-core (WCAG 2.1 A/AA) on every
page in light and dark mode, and on the open chatbot. Fix contrast at the theme tokens
in `src/assets/terminal-theme.css`, not per element.

## After every frontend change: responsive check

Any change that can affect what a page looks like (templates, styles, layout, copy,
images) needs the responsive check, not just the smoke tests:

```bash
CI=1 npm run test:responsive
```

It opens every page in `tests/routes.ts` at these sizes:

| Name | Size | Stands for |
|---|---|---|
| phone-small | 360 × 740 | small Android phones |
| phone | 390 × 844 | iPhone (also in dark mode) |
| tablet | 768 × 1024 | iPad portrait |
| tablet-landscape | 1024 × 768 | iPad landscape, small laptops |
| laptop-small | 1280 × 720 | 13" laptops, short screens |
| laptop | 1440 × 900 | common laptop (also in dark mode) |
| desktop | 1920 × 1080 | full HD monitor |

It fails when a page scrolls sideways, or when a one-screen page (`FIT_ROUTES`: the
projects and about pages) scrolls vertically. It also writes a full-page screenshot per
case to `test-results/responsive/<page>/<width>x<height>-<theme>.png`.

The assertions can't tell whether a layout looks right. **Open the screenshots of every
page you touched, at every size**, and check for: text that wraps badly or is cut off,
elements that overlap (the fixed chat button in the bottom-right corner is a usual
suspect), content that doesn't line up with the header logo, large empty areas, and
dark-mode contrast.

When you add a page: add it to `tests/routes.ts` (the smoke test's sitemap check
fails otherwise), and to `FIT_ROUTES` if its route has `meta.fit`.

## Conventions

- Every visible string exists in both `src/locales/en.json` and `src/locales/nl.json`;
  the smoke tests check that the keys match.
- English lives at the root, Dutch under `/nl` (`src/localePath.ts`); the URL decides the
  language. Internal links go through `$lp('/path')` (or `$ln('Name')` for named routes),
  never a bare path, and each page in `src/bootstrap/router.ts` has a Dutch title and
  description in `meta.nl`.
- Statistics are Cloudflare Web Analytics: cookieless, so there is no cookie banner.
  Don't add anything that sets cookies or tracks visitors without revisiting the privacy page.
- Page content lines up with the header: `mx-auto max-w-screen-2xl px-6` (1536px).
- Screenshots of projects are real ones from the live sites, never mockups.
- No secrets or private tooling in this repo: it is public.
