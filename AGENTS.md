# AGENTS.md

Notes for coding agents (and people) working on this portfolio: a Vue 3 + Vite site,
prerendered to static HTML and deployed to GitHub Pages from `main`.

## Commands

| | |
|---|---|
| `npm run dev` | Dev server. Port 5173 can be taken by ddev's router (Exulta); the `.claude/launch.json` preview uses `127.0.0.1:5180` |
| `npm run build` | Screenshot copies (`npm run images`), client build, SSR build, prerender, sitemap, `llms.txt` (`npm run llms`, which prints its size), share images (`npm run og`) |
| `npm test` | Smoke + accessibility tests (Playwright, desktop + mobile) against the production build |
| `npm run test:responsive` | Every page at every breakpoint, with screenshots (below) |
| `npm run images` | AVIF and WebP copies of the project screenshots (Conventions); `build` and `dev` run it first |
| `npm run stats` | Refresh the repository numbers on the project pages and the activity grid on /tools, from the GitHub API with `REPO_STATS_TOKEN` (below) |
| `npm run drupal` | Refresh the Drupal contributions page from drupal.org (below) |
| `npm run og` | Draw the share images into `dist/og/` (Conventions); needs the SSR build, `build` runs it last |
| `npm run pagespeed` | Refresh the live sites' Lighthouse scores from PageSpeed Insights, with `PAGESPEED_API_KEY` when set (below) |

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
| zoom-200 | 640 × 360 | a 1280 × 720 laptop at 200 % zoom |
| tablet-landscape-safari | 1024 × 690 | iPad landscape, minus Safari's bars |
| laptop-short | 1366 × 600 | 1366 × 768 laptop, minus browser and taskbar |

It fails when a page scrolls sideways, or when a one-screen page (`FIT_ROUTES`: the
projects and about pages) scrolls vertically. It also fails when text is cut off inside
an about card, and when a tap target is under 24 × 24 px (the menu, chat and close
buttons and the carousel dots under 44 px on phones). It also writes a full-page screenshot per
case to `test-results/responsive/<page>/<width>x<height>-<theme>.png` (the whole page,
top to bottom, because the document is what scrolls; see Conventions).

The assertions can't tell whether a layout looks right. **Open the screenshots of every
page you touched, at every size**, and check for: text that wraps badly or is cut off,
elements that overlap (the fixed chat button in the bottom-right corner is a usual
suspect), content that doesn't line up with the header logo, large empty areas, and
dark-mode contrast.

When you add a page: add it to `tests/routes.ts` (the smoke test's sitemap check
fails otherwise), and to `FIT_ROUTES` if its route has `meta.fit`. A page that shows
something else by its hash (`/tools#sift`) has that state in `STATES` there, so the
accessibility and responsive checks see it too. It gets a share image by itself; give it
its header's title and `$ …` line in `PAGES` in `src/seo/shareCards.ts` (the smoke tests
compare them with the page).

When you change a page's URL, keep the old one working: add it to `REDIRECTS` in
`src/bootstrap/router.ts` and to `MOVED` in `tests/routes.ts`.

## Design and motion changes: use the skills

The site's layout and motion were audited and fixed with these agent skills, and changes
to either should follow them too. They are installed per user, not in this repo: in
`~/.claude/skills/`, from [emilkowalski/skills](https://github.com/emilkowalski/skills)
(MIT) and the layout page of [pbakaus/impeccable](https://github.com/pbakaus/impeccable/blob/main/skill/reference/layout.md)
(Apache 2.0), installed as `impeccable-layout`. If they are missing, install them from
there, or read those files directly.

| When you | Use |
|---|---|
| add or change an animation, transition or hover/press state | `animate` to build it, `review-animations` to check it against the bar |
| touch anything that runs every frame (canvas, WebGL, scroll or pointer handlers) | `animation-performance` |
| coordinate several things moving together (entrances, staggers, slides) | `choreograph` |
| change a page's structure, spacing or responsive behaviour | `impeccable-layout` |
| change anything a phone sees (touch, hover, viewport heights, inputs) | `mobile-native` |
| render data that can be long, empty or huge (lists, chips, counts, chat) | `break-ui` |
| polish a component's interaction details | `emil-design-eng` |
| review the motion of the whole site again | `improve-animations`, then `remove-animations` for what can go |

Their rules are already applied here and written down below (Motion, touch and hover,
the Vue Bits effects). The skills explain the why and the numbers; where a skill and this
file disagree, this file wins, because it records choices Robbe made (e.g. the strength
of the background, which effects stay). Taste changes, like removing or toning down an
effect he asked for, go to him first.

## Content changes: keep the chatbot in step

The chatbot answers from these places. When content on the site changes and is
relevant to a visitor's questions (a project is added, renamed, finished or gets a
new feature; a page is added or moves; skills, experience, education or contact
details change; the Drupal contributions change in kind), update the ones that apply
in the same change:

| What | Where | Notes |
|---|---|---|
| What the AI answers from | `/llms.txt`, generated by `src/llms.ts`; the hand-written part is `src/data/llms-profile.md` | The `status-worker` fetches `/llms.txt` live and caches it for an hour, so it follows the site after a deploy (the daily one too), without a worker deploy. The build writes it into `dist/` (`scripts/llms.mjs`, from the SSR bundle; `npm run dev` serves it live) from the site's own data: the pages from the router's meta; the projects from `src/projects.ts` and the pages' data (`src/screens/details/data.ts`, English texts from `en.json`: tagline, status, links, overview, stack, every feature with its text, a page's own block in full: Scan2Talk's steps, Stable Manager's Drupal version with its points); the tools from `src/tools.ts` (headline, sentence, points, story, description); `repo-stats.json`; `drupal.json` (the counts and every issue). So new projects, features, pages and numbers need nothing here. Hand-written, in `llms-profile.md`: the intro, Identity, Personal (Robbe's own facts: only he adds to them, never guess one), Not to share, Background, Core technologies and the Drupal paragraph. Budget: the worker reads the first 20,000 characters (`LLMS_MAX_CHARS` in `src/llms.ts`, `MAX_CHARS` in the worker's `src/knowledge.ts`: change both together, and deploy the worker before a bigger `llms.txt` goes live). The build prints the size and fails above it; only the Drupal issues give way, the oldest first (to the Drupal page), once the rest leaves no room. Every question sends the whole file to the AI (about 5,000 tokens at the budget), so a bigger one costs Workers AI allocation on every question: the worker's README has the numbers. |
| Built-in answers (used when the AI is off, rate-limited or down) | `src/components/ChatBot.vue` (`KEYWORDS`, matched at the start of a word; `NEXT`, the follow-up questions each answer offers, from `chat.ask`) and the `chat.*` strings in both `src/locales/en.json` and `nl.json` | New project: a keyword entry plus a `chat.project-<name>` answer (and its `NEXT`), and the project count and names in `chat.projects` and `chat.help`. A renamed project keeps its old name as an extra keyword. A `chat.ask` question must find its own answer by the keywords (a test checks each, in both languages). |
| Follow-up questions | The worker's prompt and `splitFollowUps` (`../status-worker/src/chat.ts`), `ChatBot.vue` | After each answer, two or three questions to ask next, as chips under it: the AI's (`suggestions` in the worker's answer, in the visitor's language), or a built-in answer's own (`NEXT`). None the visitor already asked, each once; gone while they type. They sit outside the conversation's `role="log"`, as a group labelled "Suggested questions", so a screen reader reads the answer once. |
| The worker's fallback facts | `../status-worker/src/knowledge.ts` (`FALLBACK_FACTS`) | Only used when `llms.txt` can't be fetched, so it may lag. Update it for renames and new projects, run its tests, and deploy it from that repo with `npm run deploy` (needs a Cloudflare login). |
| Tests | `tests/chat.spec.ts` | Add or adjust the case for the new answer, in English and Dutch. |

Not relevant: layout, styling and copy tweaks that don't change facts. After changing
what `llms.txt` says, ask the live chatbot a question about the change once the site has
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
  refreshes it before every build with `npm run stats` (`scripts/repo-stats.mjs`), which
  asks the GitHub API with `REPO_STATS_TOKEN` (a repository secret: a fine-grained token,
  read-only, on the projects' repos and `Project-Updater` and `Sift`, with the permissions
  Contents and Dependabot alerts; it expires within a year, then the step only warns and
  the committed JSON is used). Deploys also run every morning, so the numbers follow the
  repos without a push. By hand: `REPO_STATS_TOKEN=$(gh auth token) npm run stats`. The
  committed JSON is only the fallback when that fails, so it may lag. Per project (its
  page's key under `projects`): `commits`, `commitsLast30Days`, `firstCommit`,
  `lastCommit`, `commitsPerWeek` (26 weeks), `dependenciesUpdated` (the date of the newest
  commit on the default branch that touched a lockfile: `package-lock.json`,
  `composer.lock`, `pnpm-lock.yaml` or `yarn.lock`; null without one), `openAlerts` and
  `openAlertsBySeverity` (the open Dependabot alerts, a count and one per severity; both
  null when they can't be read: without the token's Dependabot permission, or with
  Dependabot alerts off for a repo, GitHub answers 403 and the page shows the dependencies
  part only; that never fails the rest). Besides: `tools` (the tools' latest releases) and
  `activity` (the grid on /tools: `from`, a Monday 52 weeks before this week's, and `days`,
  the commits per Belgian day from then to today, oldest first, summed over the projects'
  repos, the tools' and this site's; when one repo fails, the committed grid stays). It
  holds counts, dates and severities only, never commit messages, names, e-mail addresses
  or advisories, nothing per repository in the grid, and the script's log names pages,
  not repositories (CI logs of this public repo are public).
- The project pages of the live, public sites (those with a `liveUrl` in
  `src/seo/projects.ts`: Exulta and Scan2Talk) show their Lighthouse scores
  (`PageSpeedScores.vue`), from `src/data/pagespeed.json`: per site (its `stats` key) and
  strategy (`mobile`), the four category scores, 0–100 (`performance`, `accessibility`,
  `bestPractices`, `seo`), and `measuredAt`. Nothing else from the report. `npm run
  pagespeed` (`scripts/pagespeed.mjs`) asks Google's PageSpeed Insights API v5 before every
  deploy (the daily one too), with `PAGESPEED_API_KEY` when that optional repository secret
  is set (a Google Cloud API key restricted to the PageSpeed Insights API). Without a key
  the API's keyless quota is tiny and shared (GitHub's runners share IPs), so it mostly
  answers 429: each page is asked twice at most, and a site that isn't measured keeps its
  committed scores, like drupal.json. The script imports `src/seo/projects.ts` itself
  (Node's `--experimental-strip-types`, in the npm script). To add desktop, add it to
  `STRATEGIES` there; the page shows mobile.
- The Drupal contributions page (`/drupal`) reads `src/data/drupal.json`, written by
  `npm run drupal` (`scripts/drupal-stats.mjs`) from the public drupal.org and
  git.drupalcode.org APIs. drupal.org asks API users for a descriptive User-Agent, one
  request at a time and cached results, so the browser never calls it: the script runs
  before every deploy (`deploy.yml`, keeping the committed JSON when it fails; deploys
  also run every morning and from the "Run workflow" button, so the page follows
  drupal.org without a push), and the JSON is committed like repo-stats.json (the CI copy is fresh; the repo's lags). Public metadata only: titles, projects,
  statuses, dates, links. Never comment text or e-mail addresses.
  The page takes Drupal's blue as its accent (tokens at the top of `Drupal.vue`) and shows
  the drop in 3D (`DrupalDrop3D.vue`: the logo's face over a stack of its silhouette; it
  turns in once with the entrance, then only leans towards a mouse, while in view). The
  project chips are a filter (`aria-pressed` buttons, "All" first): they narrow the numbers
  (which count again) and the four lists (whose rows slide in again), and the picked
  project's drupal.org page is linked under them.
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
  | `CountUpNumber.vue` | `CountUp.vue` | the commit counts in `RepoActivity.vue`, the Lighthouse scores in `PageSpeedScores.vue` (its `armed` and `start` events fill the rings' arcs with the count) |
  | `ChatThinking.vue` | `LatticeLoader.vue` | the chat's thinking line, ending in a check with the time |
  | `ButtonMagnet.vue` | `Magnet.vue` | the chat button and "Say hello" |
  | `GlowCard.vue` | `SpotlightCard.vue` | the project pages' features, the Drupal panels and the About cards |
  | `ShotGlare.vue` | `GlareHover.vue` | the screenshot buttons on the project and tools pages |
  | `PhotoRipple.vue` | `RippleDistortion.vue` | water ripples under the mouse on the two About photos |
  | `tools/ToolShots.vue` | `CardSwap.vue` | each tool's captures on the tools page, as a deck of cards |
  | `tools/ToolSwitch.vue` | `StarBorder.vue` | the light along the picked tab of the tools page's switch |

  CardSwap needs gsap, the site's one animation library: only the tools page's chunk loads
  it. Prefer the Vue Bits effects without dependencies; a new one has to earn its weight.

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
  Nothing draws what can't be seen: the background draws 30 frames a second, once with
  reduced motion, and not at all while an opaque overlay hides the page. An overlay that
  covers the whole page (lightbox, mobile menu, easter egg) calls `setCovering(name, open)`
  from `src/covered.ts` (it also sets `is-covered` on `<html>`); the background and the
  hero name's sweep stop until it closes. A new full-screen overlay does the same.
  Tests that read an animated value wait for it to finish: the commit counts take 0.9 s
  once in view (`CountUpNumber.vue`, a time-based ease-out), and a chat answer also holds
  the (hidden) "Answered in" line, so match answers with `toContainText` or a pattern.
  Responsive screenshots may catch a count mid-way.
- The document scrolls, at every size: the wrapper in `App.vue` only clips sideways
  overflow (`overflow-x-clip`). Don't make a page wrapper a scroll container: the
  router's scroll reset, keyboard scrolling (Space, Page Down), the phone browsers'
  toolbars and the responsive test's full-page screenshots all rely on the window
  scrolling. The one-screen pages are `100dvh` tall (`AppHolder.vue`), not a scroller.
- Page content lines up with the header: `mx-auto max-w-screen-2xl px-6` (1536px), on
  phones too (`px-6`, not `px-4`). Long text keeps its own measure inside that (about
  62 characters a line: `.project-text`), rather than the page getting narrower.
- The four project pages are one template, `src/components/project/ProjectPage.vue`
  (the "Showcase" layout Robbe picked from three prototypes). A page in
  `src/screens/details` only hands it its data (built in `data.ts` beside the pages, which
  `/llms.txt` is written from too; `ProjectData` in `project.ts`: the texts through its
  locale keys, links, screenshots, stack, repository) and, in a slot, a block
  of its own: Scan2Talk's check-in (`after-hero`), Stable Manager's Drupal version
  (`after-evidence`; the slot's `open(i)` opens the page's lightbox). The layout:
  - The first screen is the whole pitch: title, `$ cat` line, tagline
    (`projects.items.<id>.tagline`), status and links, the overview and a few tags on the
    left, in line with the logo; the two screenshots as one picture on the right (5 : 7
    from 1024px), the phone over the desktop capture's corner. Below 1024px the
    screenshots come right after the status, then the overview.
  - Then bands, far apart (`.project-band`): "What's in it" as a numbered index
    (`ProjectIndex.vue`: hairlines, no boxes, three columns, two from 640px), the evidence
    ("Built with" and, for a live site, its Lighthouse scores under it, beside the
    repository's activity, which ends with how it's kept up to date: "Dependencies updated
    3 days ago" in a `<time>` with the exact moment as its title, and the open security
    alerts), and at the end the next project with its real screenshot, plus all projects. "Next" follows the order of the projects page
    (`src/projects.ts`, which `Projects.vue` shows too) and wraps from the last to the
    first.
  - Phones: the index folds into titles that open their text (a `<details>`: closed in
    the prerendered HTML, so phones get it folded before any script; from 640px CSS shows
    the text of a closed one, and the app opens them). The text stays in the HTML.
  - The "Repository activity" block (`RepoActivity.vue`) lays itself out by the width it
    is given (a container query: numbers in one row from 600px of room, else two by two),
    not by the screen. It stays in the page at every width: there is no side panel. The
    Lighthouse scores do the same (four rings in a row from 26rem of room, else two by
    two): Lighthouse's bands (90–100 good, 50–89 average, 0–49 poor) in the theme's
    `--color-score-*`, each read out as "Performance, 98 of 100", with when and on what
    they were measured and a link to PageSpeed Insights.
  The template is styled in `src/assets/project-page.css` (under `.detail-page`), global
  rather than scoped: the prerendered HTML links only the main stylesheet (a route's own
  CSS comes with its JavaScript), so that is what lays the page out, and folds the
  features on phones, before the app runs. A page's own block keeps its own styles
  scoped and uses the shared ones there (band headings, labels, chips, the 5 : 7 split).
  A new project page: an entry in `src/projects.ts` (and `src/seo/projects.ts`), a
  tagline under `projects.items`, its data in `src/screens/details/data.ts`
  (`PROJECT_DATA`), and a page beside it with its route.
- The tools page (`/tools`, `src/screens/Tools.vue`, its parts in `src/components/tools/`)
  shows the two Mac apps Robbe built to maintain his projects, Project Updater and Sift,
  one at a time: two chapters behind a switch (`ToolSwitch.vue`: a tablist of links
  that sticks under the header; beside the title from 1024px). The URL's hash picks the tool
  (`/tools#sift`, `/tools#project-updater`); the page then opens at its top (`meta.hashTabs`
  in the router), and before the app runs `:target` in `tools-page.css` shows that tool. It
  speaks the project pages' vocabulary (its article is a `.detail-page` too; its own styles
  are global, in `src/assets/tools-page.css`), and each chapter has its tool's own colour
  (`--tool-*` there: Project Updater's indigo, Sift's amber, handed to the site's accent
  tokens). A chapter is visual and short, as Robbe asked: a headline, one sentence, a few
  points with an icon (four to six), version, macOS and "Private for now" as chips; its
  captures as a deck (`ToolShots.vue`); its story in motion (`UpdatePipeline.vue`: how an
  update runs; `SiftStory.vue`: PhpStorm + Sublime Merge folding into Sift, by name only, no
  logos); what it's made with; the other tool as a card. New facts become a point, not a paragraph.
  Above the switch, between the line "How I maintain my projects" and the intro, the
  activity grid (`tools/ActivityHeatmap.vue`, from `repo-stats.json` `activity`): every
  commit of the last year per day, in all the projects, both tools and this site, the
  evidence for that line. It is here, not on the home page (a one-screen hero Robbe chose)
  and never on the About page (one screen). A week a column, five teal steps
  (`--color-heat-*`, the four above none by the quartiles of the busy days), month names, the
  total and the legend; one picture to a screen reader (`role="img"`, the total, the busy
  days and the busiest), each day's count in a title for a mouse. It fits its column at
  every width (cells from about 5px on a phone to 13px, then it stops growing), so it never
  scrolls; its styles are in `tools-page.css` (first screen). The data is
  `src/tools.ts`, which `/llms.txt` and the page's JSON-LD (a `SoftwareApplication` each, with
  its captures) are written from too; its `description` is only for those two. Its `version`
  follows each release by itself: `npm run stats` (before every deploy, the daily one too) reads
  the tools' latest GitHub release into `repo-stats.json` (`tools`), with the same
  `REPO_STATS_TOKEN`, which has read access to `Project-Updater` and `Sift`; the version written in
  `src/tools.ts` is only the fallback. A release that changes what a tool does or how it looks
  still needs its points, texts and captures updated here (both tools' AGENTS.md say so in
  their release steps). Both repositories are private for now, so the page
  says so and links to neither; when one goes public, its `repository` is the one line to add
  (the page then links to it). The nav links it next to Projects, and each project page's end
  band links to it.
- The tools' captures are real captures of the apps' windows, four each:
  `public/<tool>-<view>-home.jpg` (1200 × 750 points, focused, so the traffic lights have
  their colours, scaled to 1600 × 1000 with the corners filled), shown through `ShotPicture`
  in the deck; a line under it says what the front one shows. Captures never show a version
  number: the version lives in `src/tools.ts` (the chip on the page); nor a date where it can
  be avoided. Recapture only when the interface visibly changes. Take them from a second
  instance that can't touch Robbe's own, and hide the version (and dates) in that instance
  before capturing, never by editing pixels: Project Updater with `PROJECT_UPDATER_HOME` and
  `PROJECT_UPDATER_CONFIG` in a temp folder and `--user-data-dir`, driven through
  `--remote-debugging-port` (hide `#version` and a run's dated branch name in its page), an
  update run only on a temp clone (discard it after); Sift as a debug build of a temp copy of
  its repository whose `index.html` hides `.titlebar .version` and the commit date, in a
  bundle with its own id (its WebKit storage is per bundle id, not per `HOME`) and a temp
  `HOME`, on a temp clone of this repository. Remove the copies, their
  `~/Library/{Caches,WebKit}/<bundle id>` and the temp folders afterwards. Like every
  screenshot here, they may only show Robbe's own projects that are on the site, or the tools
  themselves: no client projects, no Sentry error texts, no tokens, no other people's names.
- Touch screens:
  - Every `:hover` style sits in `@media (hover: hover) and (pointer: fine)`: on a
    touch screen a hover state sticks after the tap. Things you press get an `:active`
    state instead (a slight `scale(0.97)`, or a background on wide rows). UnoCSS's
    `hover:` and `group-hover:` utilities compile to a bare `:hover`, so write the rule
    in the component's style instead (the "./ view my projects" arrow is `.group` on the
    link and `.link-arrow` on the arrow, from `terminal-theme.css`).
  - Tap targets are at least 24 × 24 px; the main controls (menu, close, chat, theme,
    carousel dots) are 44 px under `@media (pointer: coarse)`.
  - Text inputs are 16 px under `(pointer: coarse)`, or iOS zooms the page in on focus.
  - Heights tied to the screen use `dvh` (app-like: the chat panel, the lightbox, the
    one-screen pages) or `svh` (the minimum page height), each after a `vh` fallback line.
- Motion:
  - Things that enter or leave use the site's ease-out, `cubic-bezier(0.22, 1, 0.36, 1)`;
    never `ease-in` (it holds the start back, the moment you watch). Colour and background
    changes use `ease`, about 0.2s.
  - A press is `transform: scale(0.97)` at `0.12s ease-out`, on everything you press (it
    snaps; a hover may ease more slowly).
    One exception, Robbe's pick: the tools page's switch doesn't move at all. The tab not
    picked rests greyed; hover brings it forward (colour, background), press tints it.
  - Interface transitions stay at or under 300 ms; only panels and overlays (chat panel,
    mobile menu, lightbox) take a little longer.
  - Page entrances (`.hero-in`, `.reveal`, `styles.css`) rise in 0.5 s, 60 ms apart (`--i`),
    so a page is complete within about a second; they play on every page view, so keep
    them short. The intro (`index.html`) plays once per session and lasts a second. The
    project slides (`Projects.vue`, the MacBook's turn and lid) are the one slow, showy
    move, and only on click, swipe and wheel: the arrow keys page in a quarter of a second.
    The tools page's decks of captures (CardSwap) move as slowly, and by themselves only once:
    a round when they come into view, then they rest; Next moves them (from the keyboard at
    once). Its stories (the update pipeline, Sift's two apps) play once when scrolled to,
    about a second and a half, in CSS (`usePlayOnce.ts`); the picked tab's light runs once.
    Its activity grid joins the header's entrance: its columns fade in left to right, the
    last about 0.3 s after the first, each in 0.3 s (CSS only, like `.hero-in`), and that's all.
  - Numbers that count (`CountUpNumber.vue`) count once, when mostly in view, in 0.9 s; the
    Lighthouse rings' arcs fill with them, on CountUp's own quartic ease-out
    (`cubic-bezier(0.25, 1, 0.5, 1)`), so number and arc land together. The arc is the one
    `stroke-dashoffset` transition: an arc has no transform, and four small circles only repaint.
  - Name the properties: no `transition: all`. Animate `transform` and `opacity`, not
    `width`, `height`, `padding`, `top` or `left` (they lay the page out again every frame).
  - Reduced motion: the global rule in `terminal-theme.css` drops durations and delays;
    script-driven effects check `prefers-reduced-motion` themselves.
  - A page at rest comes to rest: no loop runs for something nobody sees or touches. The
    custom cursor has no loop: dot and ring sit on the pointer, moved with `transform` from
    `mousemove`, never `left`/`top`; the hero name sweeps twice, then waits for the
    mouse; an endless CSS animation on something hidden is paused until it shows.
- Phone-only CSS uses `@media (max-width: 639px)`, the exact complement of UnoCSS `sm:`
  (`min-width: 640px`). Never `max-width: 640px`: at exactly 640 px (a 1280 px laptop at
  200 % zoom) both apply and a page gets the phone layout under the desktop header.
- Screenshots of projects are real ones from the live sites, never mockups. The project
  slides show `public/<project>-home.jpg` (1600 × 1000) on a MacBook built in CSS 3D
  (`src/components/MacBook3D.vue`, posed by `Projects.vue`): a new screenshot is all it
  takes to update one.
- The browser gets smaller copies of the screenshots, made at build time: `scripts/images.mjs`
  (`npm run images`, with `sharp`; `build` and `dev` run it first) writes an AVIF and a
  WebP of every `public/*-home.jpg`, `*-mobile.jpg` and `*-poster.jpg`, at full and at half
  width, into `public/img/` (gitignored; Vite copies it into `dist/`). So a screenshot is
  still one JPG: replace it and the copies follow. Pages show a screenshot through
  `ShotPicture.vue` (a `<picture>`: the copies in a `srcset`, the JPG as the fallback),
  never a bare `<img>`. Give it the JPG's real `width` and
  `height` (they hold its room while it loads and give the widths of the copies) and
  `sizes` (`SHOT_SIZES` in `src/images.ts`, the MacBook's in `MacBook3D.vue`). A phone
  screenshot of another size needs its new `width` and `height` on the page, or the smoke
  tests fail. The
  lightbox shows the full-size copy. The Scan2Talk video's poster is the WebP copy: a
  poster takes one URL, and every browser this site supports shows WebP.
- The two screenshots at the top of a project page are the largest thing above the fold
  (the LCP): they load eagerly, the desktop one with `fetchpriority="high"`, so the browser
  fetches them straight from the prerendered HTML. Every image further down stays
  `loading="lazy"` (the smoke tests check both).
- Each project page's JSON-LD (`src/seo/jsonld.ts`) describes the project itself: a
  `WebSite` or a `WebApplication` with the page's own title and description, in the page's
  language, its real screenshot as its `image` (the route's `meta.image`; not the share
  image, which is about the page, not the work), plus what `src/seo/projects.ts` holds (live site, stack,
  programming languages, and the `repo-stats.json` key whose first commit is its
  `dateCreated`). A new project page needs an entry there; the smoke tests read the
  JSON-LD back from the prerendered HTML in both languages.
- Share images (Open Graph): what a link to a page shows on LinkedIn, Teams, WhatsApp,
  Slack and the like. Every page has its own in each language, `dist/og/<page>.png`
  (`/og/index.png`, `/og/nl/tools.png`: `shareImagePath` in `src/seo/share.ts`), a
  1200 × 630 PNG in the site's dark theme: the logo and the page's address on top, the
  page's terminal title and `$ …` line, its tagline (a project) or a short line (projects,
  tools) or its meta description, and real pictures beside them: a project's two
  screenshots in a browser and on a phone (as at the top of its page), all projects'
  screenshots, the tools' first captures as a deck, Robbe's photo (home), the about page's
  two photos; any other page, also a new one, is text only.
  - What is on each card is `src/seo/shareCards.ts`, from the site's own data (the router's
    pages and meta, the project pages' data, `src/tools.ts`, the locale files), so new
    pages, projects and texts need nothing there; only the title and `$` line of a page with
    a header of its own are written in `PAGES` there, as in its template.
  - How they look is `scripts/og.mjs` (`npm run og`, the last step of `build`): its
    `COLOR` (the dark theme's tokens), the building blocks (title, `$` line, browser,
    phone, app window, chip) and a layout per kind (`LAYOUTS`; `shareKind` in
    `src/seo/share.ts` picks it). It lays them out with satori (flexbox, a subset of CSS:
    every `div` is a flex box) into an SVG with the text as paths, and sharp draws that as a
    PNG of 256 colours (a third of the size, no visible difference; keep each under
    300 KB, the smoke tests check it: some previews skip large images). The fonts come
    from npm (`@fontsource/jetbrains-mono` and `@fontsource/inter`, SIL Open Font
    License), never fetched, so the build draws the same cards locally and on GitHub
    Actions; the logo is `BrandLogo.vue`'s paths. A drawn card is kept in
    `node_modules/.cache/og/` by a hash of all that goes into it: a build draws only what
    changed (all 20 take about 3 s).
  - After changing the design, run `npm run build:ssr && npm run og` and open the PNGs
    in `dist/og/`, each language: text that wraps badly, runs into a picture or past the
    margins; and at 300 px wide, as a feed shows them: the title and the picture must
    still read.
  - The head (`App.vue`) points `og:image` and `twitter:image` at the page's image, with
    its size, type and alt text (the page's title and what the picture shows: `share.*`
    in the locale files); the not-found page shares the home page's. The JSON-LD keeps
    naming the real pictures (Robbe's photo, a project's screenshot, the tools' captures).
  - Link previews are cached by the sites that show them: after a deploy, LinkedIn's Post
    Inspector (linkedin.com/post-inspector) and Facebook's Sharing Debugger fetch a page
    again; Slack and Teams refresh by themselves after a while.
- No secrets or private tooling in this repo: it is public.
