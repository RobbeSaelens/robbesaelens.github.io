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
| `npm run stats` | Refresh the repository numbers on the project pages, from the GitHub API with `REPO_STATS_TOKEN` (below) |
| `npm run drupal` | Refresh the Drupal contributions page from drupal.org (below) |

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
case to `test-results/responsive/<page>/<width>x<height>-<theme>.png` (the whole page,
top to bottom, because the document is what scrolls; see Conventions).

The assertions can't tell whether a layout looks right. **Open the screenshots of every
page you touched, at every size**, and check for: text that wraps badly or is cut off,
elements that overlap (the fixed chat button in the bottom-right corner is a usual
suspect), content that doesn't line up with the header logo, large empty areas, and
dark-mode contrast.

When you add a page: add it to `tests/routes.ts` (the smoke test's sitemap check
fails otherwise), and to `FIT_ROUTES` if its route has `meta.fit`.

When you change a page's URL, keep the old one working: add it to `REDIRECTS` in
`src/bootstrap/router.ts` and to `MOVED` in `tests/routes.ts`.

## Content changes: keep the chatbot in step

The chatbot answers from four places. When content on the site changes and is
relevant to a visitor's questions (a project is added, renamed, finished or gets a
new feature; a page is added or moves; skills, experience, education or contact
details change; the Drupal contributions change in kind), update the ones that apply
in the same change:

| What | Where | Notes |
|---|---|---|
| What the AI answers from | `public/llms.txt` | The `status-worker` fetches `/llms.txt` live and caches it for an hour, so it follows the site after a deploy, without a worker deploy. Keep it factual and short: the worker only reads the first 12,000 characters. |
| Built-in answers (used when the AI is off, rate-limited or down) | `src/components/ChatBot.vue` (keywords) and the `chat.*` strings in both `src/locales/en.json` and `nl.json` | New project: a keyword entry plus a `chat.project-<name>` answer, and the project count and names in `chat.projects` and `chat.help`. A renamed project keeps its old name as an extra keyword. |
| The worker's fallback facts | `../status-worker/src/knowledge.ts` (`FALLBACK_FACTS`) | Only used when `llms.txt` can't be fetched, so it may lag. Update it for renames and new projects, run its tests, and deploy it from that repo with `npm run deploy` (needs a Cloudflare login). |
| Tests | `tests/chat.spec.ts` | Add or adjust the case for the new answer, in English and Dutch. |

Not relevant: layout, styling and copy tweaks that don't change facts. After changing
`llms.txt`, ask the live chatbot a question about the change once the site has
deployed (a plain `POST /chat`, see the `status-worker` README) to check the answer.

## Conventions

- Every visible string exists in both `src/locales/en.json` and `src/locales/nl.json`;
  the smoke tests check that the keys match.
- English lives at the root, Dutch under `/nl` (`src/localePath.ts`); the URL decides the
  language. Internal links go through `$lp('/path')` (or `$ln('Name')` for named routes),
  never a bare path, and each page in `src/bootstrap/router.ts` has a Dutch title and
  description in `meta.nl`.
- The "Repository activity" block on each project page reads `src/data/repo-stats.json`.
  The project repos are private, so the browser can't fetch it. The deploy workflow
  refreshes it before every build with `npm run stats`, which asks the GitHub API with
  `REPO_STATS_TOKEN` (a repository secret: a fine-grained token with read-only Contents
  access to those repos; it expires within a year, then the step only warns and the
  committed JSON is used). Deploys also run every morning, so the numbers follow the repos
  without a push. By hand: `REPO_STATS_TOKEN=$(gh auth token) npm run stats`. The committed
  JSON is only the fallback when that fails, so it may lag. It holds counts and dates only,
  never commit messages, names or e-mail addresses, and the script's log names pages, not
  repositories (CI logs of this public repo are public).
- The Drupal contributions page (`/drupal`) reads `src/data/drupal.json`, written by
  `npm run drupal` (`scripts/drupal-stats.mjs`) from the public drupal.org and
  git.drupalcode.org APIs. drupal.org asks API users for a descriptive User-Agent, one
  request at a time and cached results, so the browser never calls it: the script runs
  before every deploy (`deploy.yml`, keeping the committed JSON when it fails; deploys
  also run every morning and from the "Run workflow" button, so the page follows
  drupal.org without a push), and the JSON is committed like repo-stats.json (the CI copy is fresh; the repo's lags). Public metadata only: titles, projects,
  statuses, dates, links. Never comment text or e-mail addresses.
- Errors go to Sentry (`src/sentry.ts`, project `portfolio`, EU region), only from the live
  site. Errors only: no tracing, session replay or session pings, and `dataCollection`
  keeps IP, headers, cookies, query strings and local variables out. Changing that means
  changing the privacy page. To test reporting locally, build with
  `VITE_SENTRY_ENVIRONMENT=local`.
- Statistics are Cloudflare Web Analytics: cookieless, so there is no cookie banner.
  Don't add anything that sets cookies or tracks visitors without revisiting the privacy page.
- Effects from Vue Bits (https://vue-bits.dev). Each Vue Bits file is kept as published,
  with its licence header and any site change marked in it, and is used through a small
  site wrapper:

  | Wrapper | Vue Bits | Where |
  |---|---|---|
  | `HeroWordmark.vue` | `TechText.vue` | the hero name |
  | `SiteBackground.vue` | `DarkVeil.vue` | the animated background behind every page (`App.vue`) |
  | `TerminalCommand.vue` (registered globally) | `DecryptedText.vue` | the `$ …` line under page titles |
  | `CountUpNumber.vue` | `CountUp.vue` | the commit counts in `RepoActivity.vue` |
  | `ChatThinking.vue` | `LatticeLoader.vue` | the chat's thinking line, ending in a check with the time |
  | `ButtonMagnet.vue` | `Magnet.vue` | the chat button and "Say hello" |
  | `GlowCard.vue` | `SpotlightCard.vue` | the project, Drupal and About cards |
  | `ShotGlare.vue` | `GlareHover.vue` | the screenshot buttons on the project pages |
  | `PhotoRipple.vue` | `RippleDistortion.vue` | water ripples under the mouse on the two About photos |

  Rules they all follow: the real text, numbers and images stay in the prerendered HTML
  and are what screen readers get (the effect copies are `aria-hidden`); nothing plays with
  reduced motion; the pointer effects (magnet, glow, glare, ripples) need a mouse
  (`(hover: hover) and (pointer: fine)`). Their tests are `tests/vue-bits-*.spec.ts`.
  Colours come from theme tokens (`--color-spotlight` in `terminal-theme.css`).

  The two WebGL ones (background, photos) need a real GPU (`src/gpu.ts`: software WebGL
  is skipped), and headless Chrome is software WebGL, so the Playwright tests and their
  screenshots never show them (the ripple tests pretend a GPU to check how the canvas
  behaves, not how it looks). To see them headless, launch Chromium with
  `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. The ripple canvas lies over the
  real `<img>`, see-through and hidden between ripples, and draws only while a ripple
  fades: at rest the photo must look exactly as without it. Text over the background must
  still pass contrast at its brightest band, so keep its opacity low when changing colours.
  Tests that read an animated value wait for it to finish: the commit counts take a few
  seconds, and a chat answer also holds the (hidden) "Answered in" line, so match answers
  with `toContainText` or a pattern. Responsive screenshots may catch a count mid-way.
- The document scrolls, at every size: the wrapper in `App.vue` only clips sideways
  overflow (`overflow-x-clip`). Don't make a page wrapper a scroll container: the
  router's scroll reset, keyboard scrolling (Space, Page Down), the phone browsers'
  toolbars and the responsive test's full-page screenshots all rely on the window
  scrolling. The one-screen pages are `100dvh` tall (`AppHolder.vue`), not a scroller.
- Page content lines up with the header: `mx-auto max-w-screen-2xl px-6` (1536px), on
  phones too (`px-6`, not `px-4`). The project pages are a narrower centred column
  (`max-w-screen-xl px-6`).
- Phone-only CSS uses `@media (max-width: 639px)`, the exact complement of UnoCSS `sm:`
  (`min-width: 640px`). Never `max-width: 640px`: at exactly 640 px (a 1280 px laptop at
  200 % zoom) both apply and a page gets the phone layout under the desktop header.
- Screenshots of projects are real ones from the live sites, never mockups. The project
  slides show `public/<project>-home.jpg` (1600 × 1000) on a MacBook built in CSS 3D
  (`src/components/MacBook3D.vue`, posed by `Projects.vue`): a new screenshot is all it
  takes to update one.
- No secrets or private tooling in this repo: it is public.
