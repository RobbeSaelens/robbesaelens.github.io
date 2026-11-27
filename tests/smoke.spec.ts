import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { baseCompile } from '@intlify/message-compiler'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import type { ShareCard } from '../src/seo/shareCards'
import { MOVED, nl, ROUTES } from './routes'
import { measureCurrentSlide, SLIDES } from './slides'

/**
 * Smoke tests: every public page renders without errors in both languages and
 * on mobile, the prerendered HTML still carries its SEO tags, and the key
 * interactions (language switch, theme, lightbox) work.
 */

// Untranslated vue-i18n keys leak through as "namespace.someKey". Domains such
// as "scan2talk.be" and "drupal.org" and file names like "privacy.md" look
// similar, so those endings are excluded.
const RAW_I18N_KEY =
  /\b(?:nav|home|about|projects?|exulta|vhs|scan2talk|stableManager|aria|chat|error|footer|privacy|repo|speed|activity|drupal|tools)\.(?!(?:be|com|dev|app|io|md|org)\b)[a-z][A-Za-z]+\b/

/** Pages without images. */
const TEXT_ONLY = ['/privacy', '/drupal']

/**
 * Blocks third-party requests (analytics) so tests are deterministic and never
 * count as real visits, and collects every same-origin error.
 */
async function guard(page: Page) {
  const errors: string[] = []
  await page.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort())
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    // Fallout from the blocked third-party requests above.
    if (/ERR_FAILED|ERR_BLOCKED|cloudflareinsights/i.test(msg.text())) return
    errors.push(`console: ${msg.text()}`)
  })
  page.on('response', (res) => {
    if (res.url().startsWith('http://localhost') && res.status() >= 400) {
      errors.push(`HTTP ${res.status()} ${res.url()}`)
    }
  })
  return errors
}

/**
 * Opens a page and waits until the client app has replaced the prerendered
 * HTML (it briefly shows the splash screen in between), so assertions never
 * run against nodes that are about to be swapped out.
 */
async function open(page: Page, route: string) {
  await page.goto(route)
  await expect(page.locator('#main-content')).toBeVisible()
  await page.waitForLoadState('networkidle')
}

/** Waits until the project carousel has stopped scrolling. */
async function settled(page: Page) {
  const position = () => page.locator('.car-track').evaluate((el) => el.scrollLeft)
  let last = -1
  await expect
    .poll(async () => {
      const now = await position()
      const still = now === last
      last = now
      return still
    }, { intervals: [150] })
    .toBe(true)
}

/** On small screens the nav controls live in the hamburger menu. */
async function openMenuIfCollapsed(page: Page) {
  const menu = page.getByRole('button', { name: 'Toggle navigation menu' })
  if (await menu.isVisible()) await menu.click()
}

for (const route of ROUTES) {
  test.describe(`page ${route}`, () => {
    for (const locale of ['en', 'nl'] as const) {
      test(`renders cleanly in ${locale}`, async ({ page }) => {
        const errors = await guard(page)
        await open(page, locale === 'nl' ? nl(route) : route)

        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.locator('h1')).toHaveCount(1)
        await expect(page).toHaveTitle(/Robbe Saelens/)

        const text = await page.locator('#app').innerText()
        expect(text.length, 'page has real content').toBeGreaterThan(150)
        expect(text, 'no untranslated i18n keys').not.toMatch(RAW_I18N_KEY)

        expect(errors).toEqual([])
      })
    }

    test('has every image resolving', async ({ page, request }) => {
      await guard(page)
      await open(page, route)
      // Many images are lazy-loaded below the fold, and a browser fetches only one
      // candidate of a srcset, so check each source directly: every src, every srcset
      // candidate (the AVIF and WebP copies of the screenshots) and video posters.
      const sources = await page.$$eval('#app img, #app picture source, #app video[poster]', (els) => [
        ...new Set(
          els
            .flatMap((el) => [
              el.getAttribute(el.localName === 'video' ? 'poster' : 'src'),
              ...(el.getAttribute('srcset') ?? '').split(',').map((candidate) => candidate.trim().split(/\s+/)[0]),
            ])
            .filter(Boolean),
        ),
      ])
      if (!TEXT_ONLY.includes(route)) expect(sources.length).toBeGreaterThan(0)
      for (const src of sources) {
        const res = await request.get(src!)
        expect(res.status(), src!).toBe(200)
        expect(res.headers()['content-type'], src!).toMatch(/^image\//)
      }
      for (const img of await page.locator('#app img').all()) {
        await expect(img, 'images need alt text').toHaveAttribute('alt', /.+/)
      }
    })

    test('does not scroll sideways', async ({ page }) => {
      await guard(page)
      await open(page, route)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
    })

    // What a link preview shows (LinkedIn, Teams, WhatsApp, Slack): the page's own share
    // image (scripts/og.mjs), from the prerendered HTML, which is all their crawlers read.
    test('has a share image of its own in each language: a 1200 × 630 PNG, with its alt text', async ({ request }) => {
      const images: string[] = []
      for (const url of [route, nl(route)]) {
        const html = await (await request.get(url)).text()
        const meta = (key: string) => html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1]
        const image = meta('og:image')!
        expect(image, url).toMatch(/^https:\/\/robbesaelens\.github\.io\/og\/[\w/-]+\.png$/)
        expect(meta('twitter:image'), url).toBe(image)
        expect(meta('og:image:type'), url).toBe('image/png')
        expect([meta('og:image:width'), meta('og:image:height')], url).toEqual(['1200', '630'])
        // The alt text names the page, in its language
        const title = html.match(/<title>([^<]+)<\/title>/)![1]
        expect(meta('og:image:alt')!.startsWith(title), url).toBe(true)
        expect(meta('twitter:image:alt'), url).toBe(meta('og:image:alt'))

        const res = await request.get(new URL(image).pathname)
        expect(res.status(), image).toBe(200)
        expect(res.headers()['content-type'], image).toBe('image/png')
        const png = await res.body()
        // The PNG's own size, from its header (IHDR)
        expect(png.subarray(1, 4).toString(), image).toBe('PNG')
        expect([png.readUInt32BE(16), png.readUInt32BE(20)], image).toEqual([1200, 630])
        // Light enough for every preview (some skip large images, WhatsApp around 300 KB)
        expect(png.length, image).toBeLessThan(300 * 1024)
        images.push(image)
      }
      expect(images[0], 'each language has its own').not.toBe(images[1])
    })

    test('ships SEO tags in the prerendered HTML, in both languages', async ({ request }) => {
      // Raw HTML, no JavaScript: what search engines and AI crawlers get.
      for (const url of [route, nl(route)]) {
        const html = await (await request.get(url)).text()
        expect(html, url).toMatch(/<title>[^<]*Robbe Saelens<\/title>/)
        expect(html, url).toMatch(/<meta name="description" content="[^"]{50,160}"/)
        expect(html, url).toMatch(/<link rel="canonical" href="https:\/\/robbesaelens\.github\.io\//)
        expect(html, url).toContain('application/ld+json')
        expect(html.match(/<h1[\s>]/g) ?? [], url).toHaveLength(1)
      }
    })
  })
}

/** Every translation as [key, text], e.g. ['chat.contact', 'You can reach…']. */
function translations(file: string): [string, string][] {
  const out: [string, string][] = []
  const walk = (node: Record<string, unknown>, prefix: string) => {
    for (const [k, v] of Object.entries(node)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v && typeof v === 'object') walk(v as Record<string, unknown>, key)
      else out.push([key, String(v)])
    }
  }
  walk(JSON.parse(readFileSync(new URL(`../src/locales/${file}`, import.meta.url), 'utf8')), '')
  return out
}

// vue-i18n falls back to English for a missing Dutch key, so a forgotten
// translation never shows up as a raw key on the page. Compare the files instead.
test('English and Dutch translations have the same keys', () => {
  const en = translations('en.json').map(([k]) => k)
  const nl = translations('nl.json').map(([k]) => k)
  expect(en.filter((k) => !nl.includes(k)), 'missing in nl.json').toEqual([])
  expect(nl.filter((k) => !en.includes(k)), 'missing in en.json').toEqual([])
})

// "@", "|", "{" and "}" mean something to vue-i18n. A bare one (an email
// address, an Instagram handle) breaks the message only when it is shown, which
// can be deep in the chat. Write them as {'@'} etc.
test('every translation compiles', () => {
  const broken: string[] = []
  for (const file of ['en.json', 'nl.json']) {
    for (const [key, text] of translations(file)) {
      baseCompile(text, { onError: (e) => broken.push(`${file} ${key}: ${e.message}`) })
    }
  }
  expect(broken).toEqual([])
})

test('sitemap lists exactly the tested routes', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  const paths = [...xml.matchAll(/<loc>https:\/\/robbesaelens\.github\.io(\/[^<]*)<\/loc>/g)].map(
    (m) => m[1],
  )
  expect(paths.sort()).toEqual([...ROUTES, ...ROUTES.map(nl)].sort())
  // Old URLs that moved only redirect: not in the sitemap
  for (const [from] of MOVED) expect(xml).not.toContain(from)
  // every URL points at both language versions
  expect(xml.match(/hreflang="nl"/g)).toHaveLength(ROUTES.length * 2)
})

// The share images' cards (src/seo/shareCards.ts), read back from the SSR bundle the build
// drew them from (scripts/og.mjs), against the pages they are about.
test.describe('share images', () => {
  const cards = async (): Promise<ShareCard[]> =>
    (await import(new URL('../dist-ssr/entry-server.js', import.meta.url).href)).shareCards()

  test('there is one for every page, in both languages, where its head says', async ({ request }) => {
    const all = await cards()
    expect(all.map((card) => card.path).sort()).toEqual([...ROUTES, ...ROUTES.map(nl)].sort())
    for (const card of all) {
      const html = await (await request.get(card.path)).text()
      expect(html, card.path).toContain(`<meta property="og:image" content="https://robbesaelens.github.io/${card.file}">`)
    }
  })

  test('each says what its page says: the title, the "$" line, a project\'s tagline', async ({ browser }) => {
    // The prerendered page, before the app (and the "$" line's effect) runs
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    for (const card of await cards()) {
      await page.goto(card.path)
      await expect(page.locator('h1 .terminal-text'), card.path).toHaveText(card.title)
      // The "$" line: the pages' TerminalCommand, or the home page's role
      const command = await page.locator('.terminal-subtitle .terminal-command, .hero-role').first().textContent()
      expect(command!.trim().replace(/^\$\s*/, ''), card.path).toBe(card.command)
      if (card.kind === 'project') await expect(page.locator('.hero-tagline'), card.path).toHaveText(card.text)
    }
    await context.close()
  })
})

// What the AI chatbot answers from, written by the build (src/llms.ts): the hand-written
// profile, then the site's own data. The status-worker reads the first 20,000 characters
// (LLMS_MAX_CHARS in src/llms.ts, MAX_CHARS in its src/knowledge.ts).
const LLMS_MAX_CHARS = 20_000

test.describe('llms.txt', () => {
  const read = (file: string) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
  const en = JSON.parse(read('locales/en.json'))
  const stats = JSON.parse(read('data/repo-stats.json'))
  const drupal = JSON.parse(read('data/drupal.json'))
  const llms = async (request: APIRequestContext) => {
    const res = await request.get('/llms.txt')
    expect(res.status()).toBe(200)
    return res.text()
  }

  test('fits what the chatbot reads, in the llmstxt.org shape, as plain text', async ({ request }) => {
    const text = await llms(request)
    expect(text.trim().length).toBeLessThanOrEqual(LLMS_MAX_CHARS)
    expect(text).toMatch(/^# Robbe Saelens\n\n> /)
    const headings = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1])
    expect(headings).toEqual(expect.arrayContaining(['Identity', 'Personal', 'Not to share', 'Pages', 'Projects', 'Drupal contributions']))
    // Who he is and what not to share come before everything generated
    expect(headings.indexOf('Not to share')).toBeLessThan(headings.indexOf('Pages'))
    expect(text).not.toMatch(RAW_I18N_KEY)
    expect(text).not.toMatch(/undefined|\[object Object\]|\bNaN\b|\bnull\b/)
    expect(text, 'no HTML or comments').not.toMatch(/<\/?[a-z][^>]*>|<!--/i)
  })

  test('holds the hand-written profile, whole', async ({ request }) => {
    const text = await llms(request)
    const profile = read('data/llms-profile.md').replace(/<!--[\s\S]*?-->/g, '')
    for (const line of profile.split('\n').filter((l) => l.trim())) expect(text).toContain(line)
    for (const fact of [
      '- Born: 2000',
      '- Location: Geluwe, West Flanders, Belgium',
      '- Languages: Dutch (native), English, a little French',
      'Open to some side projects, not to\n  freelance work.',
      '- Driving licence: B.',
      'padel, which he has played for about a\n  year (since 2025)',
      "Robbe doesn't share his exact address",
    ]) {
      expect(text).toContain(fact)
    }
    // The age the year means, worked out at build time (the AI doesn't know the date)
    expect(text).toMatch(/- Born: 2000 \(\d+ or \d+ years old as of [A-Z][a-z]+ \d{4}\)/)
  })

  test('holds every project, with its pages, features, stack and repository numbers', async ({ request }) => {
    const text = await llms(request)
    for (const [ns, path] of [
      ['exulta', '/exultadetail'],
      ['scan2talk', '/scan2talkdetail'],
      ['stableManager', '/stablemanagerdetail'],
      ['vhs', '/vhsdetail'],
    ]) {
      expect(text).toContain(`### ${en[ns].title}\n`)
      expect(text).toContain(`https://robbesaelens.github.io${path}`)
      expect(text).toContain(en[ns].aboutText)
      // Every item of its numbered lists, title and text as on the page: the features,
      // Scan2Talk's steps
      const items = Object.keys(en[ns]).filter((key) => /^(feature|flowStep)/.test(key) && `${key}Text` in en[ns])
      expect(items.length).toBeGreaterThan(0)
      const lines = text.split('\n')
      for (const key of items) {
        const item = `${en[ns][key]}: ${en[ns][`${key}Text`]}`
        expect(lines.some((line) => /^\d\. /.test(line) && line.slice(3) === item), `${ns}.${key}`).toBe(true)
      }
    }
    expect(text).toContain(`${en.project.featuresTitle}:\n1. ${en.exulta.featureCatalog}: `)
    expect(text).toContain(`${en.scan2talk.flowTitle}:\n1. ${en.scan2talk.flowStep1}: ${en.scan2talk.flowStep1Text}\n`)
    for (const tagline of Object.values(en.projects.items).map((item) => (item as { tagline: string }).tagline)) {
      if (tagline !== en.projects.items['coming-soon'].tagline) expect(text).toContain(tagline)
    }
    expect(text).toContain('Built with: PHP 8.4, Laravel 13, React 19')
    expect(text).toContain('Tools: Better Auth, shadcn/ui')
    for (const [key, repo] of Object.entries(stats.projects) as [string, { commits: number; commitsLast30Days: number }][]) {
      expect(text, key).toContain(`${repo.commits} commits, ${repo.commitsLast30Days} in the last 30 days, active since`)
    }
    for (const page of ['/contact', '/drupal', '/privacy', '/projects', '/tools']) {
      expect(text).toContain(`](https://robbesaelens.github.io${page})`)
    }
  })

  test('holds the tools: what they are and do, their story, and that their code is private', async ({ request }) => {
    const text = await llms(request)
    const headings = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1])
    expect(headings.indexOf('Tools')).toBe(headings.indexOf('Projects') + 1)
    expect(text).toContain('https://robbesaelens.github.io/tools')
    expect(text).toContain('https://robbesaelens.github.io/tools#sift')
    for (const [name, ns] of [
      ['Project Updater', 'updater'],
      ['Sift', 'sift'],
    ] as const) {
      const tool = en.tools[ns] as Record<string, string>
      expect(text).toContain(`### ${name}\n${tool.headline}\n${tool.summary}\n`)
      expect(text).toContain(tool.description)
      for (const key of Object.keys(tool).filter((key) => key.startsWith('point'))) expect(text, `${ns}.${key}`).toContain(tool[key])
    }
    expect(text).toMatch(/Status: macOS app, version \d+\.\d+\.\d+, private repository for now/)
    // How an update runs, step by step
    const updater = en.tools.updater as Record<string, string>
    expect(text).toContain(`${updater.storyTitle}: ${updater.stepScan} (${updater.stepScanText}) → ${updater.stepUpdate}`)
    // Sift's story, in Robbe's words
    expect(text).toContain('PhpStorm (diffs & commits) + Sublime Merge (branches & history) → Sift')
    // ...and what Sift's card holds, what it took from both and what's new
    expect(text).toContain(`→ Sift (${en.tools.sift.toSift}: ${en.tools.sift.tagDiffs}, `)
    expect(text).toContain(`; new: ${en.tools.sift.tagAi}, ${en.tools.sift.tagTeamwork})`)
    expect(text).toContain(en.tools.sift.storyCaption)
    // Its AI and Teamwork features, exactly
    expect(text).toContain('Write with AI has AI write the commit message')
    expect(text).toContain('at most $0.25')
    expect(text).toContain('Teamwork task')
    // Private: no link to either repository
    expect(text).not.toMatch(/github\.com\/RobbeSaelens\/(?:Project-Updater|project-updater|Sift|sift)\b/i)
  })

  test('holds the Drupal contributions: the counts and every issue that fits, the rest only when full', async ({ request }) => {
    const text = await llms(request)
    expect(text).toContain(`${drupal.issuesCreated.length} issues opened, ${drupal.credits.length} credits`)
    // One line per issue, its credit and merge request with it; the latest first
    const urls = new Map<number, { title: string; urls: string[] }>()
    const add = (id: number, title: string, url: string) =>
      urls.set(id, { title, urls: [...(urls.get(id)?.urls ?? []), url] })
    for (const issue of [...drupal.issuesCreated, ...drupal.issuesJoined]) add(issue.id, issue.title, issue.url)
    for (const credit of drupal.credits) add(credit.issue, credit.title, credit.url)
    for (const mr of drupal.mergeRequests) add(mr.issue, mr.title, mr.url)
    const listed = [...urls.values()].filter((issue) => issue.urls.some((url) => text.includes(`](${url})`)))
    for (const issue of listed) expect(text).toContain(`[${issue.title}](`)
    // What doesn't fit is on the Drupal page; issues are only left out once the next one
    // (a line of a few hundred characters) would go over the budget
    const rest = Number(text.match(/^- (\d+) older ones: https:\/\/robbesaelens\.github\.io\/drupal$/m)?.[1] ?? 0)
    expect(listed.length + rest).toBe(urls.size)
    expect(listed.length).toBeGreaterThan(0)
    if (rest > 0) expect(text.trim().length, 'issues left out while there was room').toBeGreaterThan(LLMS_MAX_CHARS - 600)
  })
})

test('Dutch pages have their own URL, title, lang and alternates', async ({ request }) => {
  const html = await (await request.get('/nl/contact')).text()
  expect(html).toContain('<html lang="nl"')
  expect(html).toMatch(/<title>Over mij \| Robbe Saelens<\/title>/)
  expect(html).toContain('<link rel="canonical" href="https://robbesaelens.github.io/nl/contact">')
  expect(html).toContain('hreflang="en" href="https://robbesaelens.github.io/contact"')
  expect(html).toContain('hreflang="x-default" href="https://robbesaelens.github.io/contact"')
  expect(html).toContain('href="/nl/projects"') // links stay in Dutch
})

test('language switch goes to the Dutch URL and remembers the choice', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/projects')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('h1')).toContainText('projects')

  await openMenuIfCollapsed(page)
  await page.getByRole('link', { name: /Switch to Dutch/ }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/nl\/projects$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
  await expect(page.locator('h1')).toContainText('projecten')

  // The choice sticks: an English link now opens in Dutch on a new visit.
  await page.goto('/contact')
  await expect(page).toHaveURL(/\/nl\/contact$/)
  expect(errors).toEqual([])
})

test('a Dutch browser lands on the Dutch home page, deep links keep their language', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'nl-BE' })
  const page = await context.newPage()
  await guard(page)
  await page.goto('/')
  await expect(page).toHaveURL(/\/nl$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
  const deep = await context.newPage()
  await guard(deep)
  await deep.goto('/projects')
  await expect(deep.locator('html')).toHaveAttribute('lang', 'en')
  await context.close()
})

test('theme toggle switches to dark mode and back', async ({ page }) => {
  await guard(page)
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
  await open(page, '/')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/\bdark\b/)

  await openMenuIfCollapsed(page)

  await page.getByRole('button', { name: 'Switch to dark mode' }).filter({ visible: true }).first().click()
  await expect(html).toHaveClass(/\bdark\b/)
  await page.getByRole('button', { name: 'Switch to light mode' }).filter({ visible: true }).first().click()
  await expect(html).not.toHaveClass(/\bdark\b/)
})

test('with a mouse the custom cursor replaces the pointer, but fields keep the text cursor', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mouse only')
  await guard(page)
  await open(page, '/')
  await page.locator('.chatbot-fab').click()
  await expect(page.locator('#chat-input')).toHaveCSS('cursor', 'text')
  await expect(page.locator('.chat-send')).toHaveCSS('cursor', 'none')
})

test('on a phone the about cards are a swipe row, with dots that show and change the card', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones')
  await guard(page)
  await open(page, '/contact')
  const dots = page.locator('.about-dot')
  await expect(dots).toHaveCount(4)
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  await page.getByRole('button', { name: 'Teaching', exact: true }).click()
  await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true')
  await expect(dots.nth(0)).not.toHaveAttribute('aria-current', 'true')
  await expect.poll(() => page.locator('.about-grid').evaluate((g) => g.scrollLeft)).toBeGreaterThan(0)
  // Swiping back moves the dot with it
  await page.locator('.about-grid').evaluate((g) => g.scrollTo({ left: 0 }))
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')

  await open(page, '/nl/contact')
  await expect(page.getByRole('button', { name: 'Paardrijden', exact: true })).toBeVisible()
})

test('projects page links to each project', async ({ page }) => {
  await guard(page)
  await open(page, '/projects')
  for (const [name, path] of [
    ['Exulta', '/exultadetail'],
    ['Scan2Talk', '/scan2talkdetail'],
    ['Stable Manager', '/stablemanagerdetail'],
    ['VHS Service', '/vhsdetail'],
  ]) {
    await open(page, '/projects')
    // Bring the slide to the middle with its page dot, then follow its (real, crawlable) link.
    await page.getByRole('button', { name, exact: true }).click()
    const current = page.locator('.car-slide.is-current')
    await expect(current).toContainText(name)
    await settled(page) // the carousel has scrolled there
    // Click where it is on screen: locator.click() would first scroll the link into
    // view, and moving the carousel makes another slide the current one
    const box = (await current.locator('a.car-card').boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.locator('h1')).toContainText(name)
  }
})

// The tools page: the two Mac apps Robbe built to maintain his projects (src/tools.ts),
// one at a time behind a switch whose hash picks the tool (/tools#sift). Each chapter: its
// status, a headline and a sentence, four points, its captures as a deck, its story, what
// it's made with and the other tool. Their repositories are private, so nothing links to them.
test.describe('tools page', () => {
  const TOOLS = [
    {
      id: 'project-updater',
      name: 'Project Updater',
      shots: ['projects', 'updates', 'security', 'review'].map((view) => `/project-updater-${view}-home.jpg`),
      points: 4,
      story: 5,
      film: true,
    },
    {
      id: 'sift',
      name: 'Sift',
      shots: ['diff', 'stage', 'branches', 'commit'].map((view) => `/sift-${view}-home.jpg`),
      points: 5,
      story: 3,
      film: true,
    },
  ] as const

  /** The tool shown: its tab is selected, its chapter visible, the other's hidden */
  async function shows(page: Page, id: string) {
    await expect(page.locator(`[role="tab"][aria-selected="true"]`)).toHaveAttribute('id', id)
    for (const tool of TOOLS) {
      const panel = page.locator(`#${tool.id}-panel`)
      if (tool.id === id) await expect(panel).toBeVisible()
      else await expect(panel).toBeHidden()
    }
  }

  for (const [route, privately, projects] of [
    ['/tools', 'Private for now', '/projects'],
    ['/nl/tools', 'Voorlopig privé', '/nl/projects'],
  ] as const) {
    test(`${route} shows a tool at a time: status, headline, points, captures, story, stack, no repository link`, async ({ page }) => {
      const errors = await guard(page)
      await open(page, route)
      await expect(page.locator('h1')).toContainText('tools')

      const tabs = page.getByRole('tab')
      await expect(tabs).toHaveCount(TOOLS.length)
      for (const [i, tool] of TOOLS.entries()) {
        await expect(tabs.nth(i)).toHaveAttribute('href', `#${tool.id}`)
        await expect(tabs.nth(i)).toContainText(tool.name)
        await expect(tabs.nth(i)).toHaveAttribute('aria-controls', `${tool.id}-panel`)
      }
      // The first one, until another is picked
      await shows(page, 'project-updater')

      for (const tool of TOOLS) {
        if (tool.id !== 'project-updater') await tabs.filter({ hasText: tool.name }).click()
        await shows(page, tool.id)
        const panel = page.getByRole('tabpanel', { name: tool.name, exact: true })
        await expect(panel).toHaveAttribute('id', `${tool.id}-panel`)
        await expect(panel.locator('.tool-version')).toHaveText(/^v\d+\.\d+\.\d+$/)
        await expect(panel.locator('.tool-status')).toContainText('macOS')
        await expect(panel.locator('.tool-status')).toContainText(privately)
        await expect(panel.locator('.tool-headline')).not.toBeEmpty()
        await expect(panel.locator('.tool-summary')).not.toBeEmpty()
        // Short: one or two sentences, and a few points of a few words
        expect((await panel.locator(".tool-summary").innerText()).split(/[.!?](?:\s|$)/).filter(Boolean).length).toBeLessThanOrEqual(2)
        const points = panel.locator('.tool-point')
        await expect(points).toHaveCount(tool.points)
        for (const point of await points.all()) {
          expect((await point.innerText()).split(/\s+/).length).toBeLessThanOrEqual(9)
          await expect(point.locator('svg')).toHaveCount(1)
        }
        // Its film, or (a tool without one) its captures as buttons with pictures, in their order
        if (tool.film) {
          await expect(panel.locator('.tool-shots .tool-film video')).toHaveCount(1)
          await expect(panel.locator('.tool-deck')).toHaveCount(0)
        } else {
          const shots = panel.locator('.tool-deck button.shot img')
          await expect(shots).toHaveCount(tool.shots.length)
          for (const [i, src] of tool.shots.entries()) await expect(shots.nth(i)).toHaveAttribute('src', src)
          await expect(panel.locator('.deck-label')).not.toBeEmpty()
        }
        // Its story, step by step or card by card
        await expect(panel.locator('.flow-step, .merge-card:not(.merge-ghost)')).toHaveCount(tool.story)
        expect(await panel.locator('.tag-pill').count()).toBeGreaterThan(5)
        // The other tool, as a card that picks it
        const other = TOOLS.find((t) => t.id !== tool.id)!
        await expect(panel.locator('.tool-next')).toHaveAttribute('href', `#${other.id}`)
        await expect(panel.locator('.tool-next')).toContainText(other.name)
        await expect(panel.locator('.project-all')).toHaveAttribute('href', projects)
      }
      // Sift's story: one light tool instead of PhpStorm and Sublime Merge, by name only
      const story = page.locator('#sift-panel .merge')
      await expect(story).toContainText('PhpStorm')
      await expect(story).toContainText('Sublime Merge')
      await expect(story.locator('img')).toHaveCount(0)

      // Private for now: no link to either repository, or to GitHub at all
      await expect(page.locator('#main-content a[href*="github.com"]')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  }

  // The tours: each tool's film in place of the deck of captures. Muted, it plays by
  // itself once in view; a button turns the sound on, another pauses it. Nothing of it loads
  // before (preload none, the poster first), phones get the 480p file, the JSON-LD names it.
  test('the tour: a muted film in place of the captures, with a button for the sound', async ({ page, request }) => {
    const errors = await guard(page)
    await open(page, '/tools')
    const panel = page.locator('#project-updater-panel')
    await expect(page.locator('.tool-deck')).toHaveCount(0)
    // Sift's film: its own files and name, every file there
    const sift = page.locator('#sift-panel .tool-shots video')
    await expect(sift).toHaveAttribute('aria-label', /^Sift at work: /) // its panel is hidden, so no accessible name yet
    const siftFiles = [
      (await sift.getAttribute('poster'))!,
      ...(await sift.locator('source').evaluateAll((list) => list.map((s) => s.getAttribute('src')!))),
    ]
    expect(siftFiles).toEqual(['/img/sift-tour-poster.webp', '/sift-tour-480.mp4', '/sift-tour.mp4'])
    for (const file of siftFiles) expect((await request.get(file)).status(), file).toBe(200)
    const video = panel.locator('.tool-shots video')
    await expect(video).toHaveAttribute('preload', 'none')
    await expect(video).toHaveAttribute('playsinline', '')
    await expect(video).toHaveAccessibleName(/^Project Updater at work: /)
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted && v.loop)).toBe(true)
    await expect(panel.locator('.film-caption')).not.toBeEmpty()
    const files = [
      (await video.getAttribute('poster'))!,
      ...(await video.locator('source').evaluateAll((list) => list.map((s) => s.getAttribute('src')!))),
    ]
    expect(files).toEqual(['/img/project-updater-tour-poster.webp', '/project-updater-tour-480.mp4', '/project-updater-tour.mp4'])
    for (const file of files) expect((await request.get(file)).status(), file).toBe(200)
    // The prerendered HTML fetches the poster first, as the LCP
    const html = await (await request.get('/tools')).text()
    expect(html).toMatch(/<link[^>]+rel="preload"[^>]+href="\/img\/project-updater-tour-poster\.webp"/)

    // In view, it plays by itself, muted
    await video.scrollIntoViewIfNeeded()
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true)
    // The sound button turns the sound on and says so
    const sound = panel.getByRole('button', { name: 'Sound' })
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
    await sound.click()
    await expect(sound).toHaveAttribute('aria-pressed', 'true')
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false)
    // Pause, and it stays paused
    await panel.getByRole('button', { name: 'Pause the film' }).click()
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
    await expect(panel.getByRole('button', { name: 'Play the film' })).toBeVisible()

    const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(ld.join('')).toContain('"@type":"VideoObject"')
    expect(ld.join('')).toContain('/project-updater-tour.mp4')
    expect(ld.join('')).toContain('/sift-tour.mp4')
    expect(errors).toEqual([])
  })

  test('the switch: a click or the arrow keys pick a tool, the URL says which, the page stays put', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/tools')
    await page.getByRole('tab', { name: /Sift/ }).click()
    await expect(page).toHaveURL(/\/tools#sift$/)
    await shows(page, 'sift')
    expect(await page.evaluate(() => scrollY)).toBe(0)

    // Tabs: the arrows move and pick, only the picked one is a tab stop
    await page.getByRole('tab', { name: /Sift/ }).focus()
    await page.keyboard.press('ArrowLeft')
    await shows(page, 'project-updater')
    await expect(page.getByRole('tab', { name: /Project Updater/ })).toBeFocused()
    await expect(page).toHaveURL(/\/tools#project-updater$/)
    await expect(page.getByRole('tab', { name: /Sift/ })).toHaveAttribute('tabindex', '-1')
    await page.keyboard.press('End')
    await shows(page, 'sift')
    await page.keyboard.press('Home')
    await shows(page, 'project-updater')
    expect(errors).toEqual([])
  })

  test('a link to a tool opens the page at its top, with that tool shown; back and forward follow', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/nl/tools#sift')
    await shows(page, 'sift')
    expect(await page.evaluate(() => scrollY)).toBe(0)
    await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Sift')

    // From another page and back
    await page.getByRole('tab', { name: /Project Updater/ }).click()
    await shows(page, 'project-updater')
    await page.locator('#project-updater-panel .project-all').click()
    await expect(page).toHaveURL(/\/nl\/projects$/)
    await page.goBack()
    await shows(page, 'project-updater')
    expect(errors).toEqual([])
  })

  test('before the app runs, the hash picks the tool too (the prerendered page)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/tools#sift')
    await expect(page.locator('#sift-panel')).toBeVisible()
    await expect(page.locator('#project-updater-panel')).toBeHidden()
    expect(await page.evaluate(() => scrollY)).toBe(0)
    // The tabs are plain links then
    await page.locator('a#project-updater').click()
    await expect(page.locator('#project-updater-panel')).toBeVisible()
    await expect(page.locator('#sift-panel')).toBeHidden()
    await context.close()
  })

  test('the switch sticks under the header; picking from it starts the other tool at its top', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/tools')
    await page.locator('#project-updater-panel .tool-story').scrollIntoViewIfNeeded()
    const header = await page.locator('.site-header').boundingBox()
    const bar = page.locator('.tool-switch')
    await expect.poll(async () => (await bar.boundingBox())!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1)
    expect((await bar.boundingBox())!.y).toBeLessThan(header!.y + header!.height + 24)
    // Where it is on screen (a locator's click would first scroll the page to the tab's place in it)
    const tab = (await page.getByRole('tab', { name: /Sift/ }).boundingBox())!
    await page.mouse.click(tab.x + tab.width / 2, tab.y + tab.height / 2)
    await shows(page, 'sift')
    const top = await page.locator('#sift-panel').boundingBox()
    const below = (await bar.boundingBox())!
    expect(top!.y).toBeGreaterThanOrEqual(below.y + below.height)
    expect(top!.y).toBeLessThanOrEqual(below.y + below.height + 48)
    expect(errors).toEqual([])
  })

  test("the other tool's card picks it, from its top, with the focus on its name", async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/tools')
    await page.locator('#project-updater-panel .tool-next').click()
    await shows(page, 'sift')
    await expect(page).toHaveURL(/\/tools#sift$/)
    await expect(page.locator('#sift-title')).toBeFocused()
    const top = (await page.locator('#sift-panel').boundingBox())!.y
    expect(top).toBeGreaterThan(0)
    expect(top).toBeLessThan(400)
    expect(errors).toEqual([])
  })

  test("each capture opens in the lightbox, with the tool's others", async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/tools')
    const dialog = page.getByRole('dialog')
    const shown = () => dialog.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.currentSrc)
    for (const tool of TOOLS.filter((t) => !t.film)) {
      await page.getByRole('tab', { name: new RegExp(tool.name) }).click()
      // The front card: a tab stop and a click; the others only for screen readers
      const front = page.locator(`#${tool.id}-panel .deck-shot:not([tabindex="-1"])`)
      await expect(front).toHaveCount(1)
      await front.click()
      await expect(dialog.locator('.lightbox-caption')).toContainText(`${tool.name} — `)
      await expect(dialog.locator('.lightbox-count')).toHaveText(new RegExp(`^\\d / ${tool.shots.length}$`))
      // The full-size copy, AVIF where the browser has it
      await expect.poll(shown).toMatch(new RegExp(`/img/${tool.id}-[a-z]+-home\\.avif$`))
      await page.keyboard.press('ArrowRight')
      await expect.poll(shown).toMatch(/-home\.avif$/)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
    }
    expect(errors).toEqual([])
  })

  test("the film's poster loads first, every capture lazily, all from the prerendered HTML", async ({ request }) => {
    const html = await (await request.get('/tools')).text()
    // The first tool shows its film: its poster is preloaded, every <img> waits
    expect(html).toMatch(/<link[^>]+rel="preload"[^>]+as="image"[^>]+fetchpriority="high"|<link[^>]+fetchpriority="high"[^>]+rel="preload"/)
    const imgs = html.match(/<img\b[^>]*>/g) ?? []
    for (const img of imgs) expect(img).toContain('loading="lazy"')
    // Each film's poster is in the HTML, on its <video>
    for (const tool of TOOLS) if (tool.film) expect(html).toContain(`poster="/img/${tool.id}-tour-poster.webp"`)
    // Every capture of the deck, with its alt text, and the tabs as links
    for (const tool of TOOLS) {
      if (!tool.film) for (const src of tool.shots) expect(html).toMatch(new RegExp(`<img[^>]*src="${src}"[^>]*alt="[^"]{20,}"|<img[^>]*alt="[^"]{20,}"[^>]*src="${src}"`))
      expect(html).toMatch(new RegExp(`<a[^>]*id="${tool.id}"[^>]*role="tab"|<a[^>]*role="tab"[^>]*id="${tool.id}"`))
    }
  })

  test('the main navigation links to it, next to the projects', async ({ page, isMobile }) => {
    await guard(page)
    await open(page, '/tools')
    if (isMobile) {
      await openMenuIfCollapsed(page)
      const links = page.locator('#mobile-menu .mobile-link')
      await expect(links).toHaveText([/Home/, /Projects/, /Tools/, /About me/, /Drupal/])
      await expect(links.nth(2)).toHaveAttribute('href', '/tools')
      await expect(links.nth(2)).toHaveClass(/is-current/)
    } else {
      const links = page.locator('.nav-links .nav-link')
      await expect(links).toHaveText([/Projects/, /Tools/, /About me/])
      await expect(links.nth(1)).toHaveAttribute('href', '/tools')
      await expect(links.nth(1)).toHaveClass(/is-current/)
    }
  })
})

// The four project pages are one template (src/components/project/ProjectPage.vue) with
// each page's data: the same sections in the same order, a page's own block in its slot,
// and at the end the next project in the order of the projects page.
test.describe('project page template', () => {
  const PAGES = [
    { route: '/exultadetail', name: 'Exulta', next: ['Scan2Talk', '/scan2talkdetail'], own: null },
    { route: '/scan2talkdetail', name: 'Scan2Talk', next: ['Stable Manager', '/stablemanagerdetail'], own: 'Scan2Talk in one minute' },
    { route: '/stablemanagerdetail', name: 'Stable Manager', next: ['VHS Service', '/vhsdetail'], own: null },
    // The last one wraps around to the first
    { route: '/vhsdetail', name: 'VHS Service', next: ['Exulta', '/exultadetail'], own: null },
  ] as const
  const OWN = ['Scan2Talk in one minute']

  for (const { route, name, next, own } of PAGES) {
    test(`${route} has the template's sections in order, and its own block`, async ({ page }) => {
      const errors = await guard(page)
      await open(page, route)
      await expect(page.locator('h1')).toContainText(name)

      // The first screen: tagline, status, overview, and the two screenshots
      await expect(page.locator('.hero-tagline')).not.toBeEmpty()
      await expect(page.locator('.hero-status')).not.toBeEmpty()
      await expect(page.locator('.hero-more .project-text')).not.toBeEmpty()
      await expect(page.locator('.hero-stage button.shot')).toHaveCount(2)

      // What's in it: six numbered features, each with its text
      const features = page.getByRole('region', { name: "What's in it" })
      await expect(features.locator('.index-item')).toHaveCount(6)
      await expect(features.locator('.index-n').first()).toHaveText('01')
      for (const text of await features.locator('.index-text').all()) await expect(text).not.toBeEmpty()

      // Built with, beside the repository's activity
      const built = page.getByRole('region', { name: 'Built with' })
      expect(await built.locator('.tag-pill').count()).toBeGreaterThan(5)
      await expect(page.locator('.repo')).toHaveCount(1)

      // Its own block, if it has one, in its place: Scan2Talk's film after the first screen
      for (const block of OWN) {
        await expect(page.getByRole('region', { name: block, exact: true })).toHaveCount(block === own ? 1 : 0)
      }
      const top = async (locator: ReturnType<Page['locator']>) => (await locator.boundingBox())!.y
      if (own === 'Scan2Talk in one minute') {
        const film = page.getByRole('region', { name: own })
        await expect(film.locator('video')).toHaveCount(1)
        expect(await top(film)).toBeLessThan(await top(features))
      }

      // The way on: the next project, with its screenshot, and all projects
      const end = page.getByRole('navigation', { name: 'Next project' })
      const link = end.getByRole('link', { name: new RegExp(`Next project.*${next[0]}`) })
      await expect(link).toHaveAttribute('href', next[1])
      // Its picture comes only once the band is near (else it would load with the top ones)
      await expect(link.locator('img')).toHaveCount(0)
      await link.scrollIntoViewIfNeeded()
      await expect(link.locator('img')).toHaveAttribute('loading', 'lazy')
      await expect(end.getByRole('link', { name: 'All projects' })).toHaveAttribute('href', '/projects')
      await expect(end.getByRole('link', { name: 'How I maintain them' })).toHaveAttribute('href', '/tools')
      expect(await top(end)).toBeGreaterThan(await top(page.locator('.repo').last()))
      expect(errors).toEqual([])
    })
  }

  test('the next project wraps around, from the last to the first, in both languages', async ({ page }) => {
    const errors = await guard(page)
    for (const [from, to, label, title] of [
      ['/vhsdetail', '/exultadetail', 'Next project', 'Exulta'],
      ['/nl/vhsdetail', '/nl/exultadetail', 'Volgend project', 'Exulta'],
    ]) {
      await open(page, from)
      const link = page.getByRole('navigation', { name: label }).getByRole('link', { name: new RegExp(title) })
      await link.scrollIntoViewIfNeeded()
      await link.click()
      await expect(page).toHaveURL(new RegExp(`${to}$`))
      await expect(page.locator('h1')).toContainText(title)
      await expect(page.locator('html')).toHaveAttribute('lang', from.startsWith('/nl') ? 'nl' : 'en')
    }
    await expect(page.getByRole('navigation', { name: 'Volgend project' }).getByRole('link', { name: 'Alle projecten' })).toHaveAttribute(
      'href',
      '/nl/projects',
    )
    expect(errors).toEqual([])
  })

  // On phones the features fold into rows that open (ProjectIndex.vue): <details>, closed in
  // the prerendered HTML, so a phone gets them folded before any script runs; from 640px CSS
  // shows the text of a closed one. The text is in the HTML either way.
  test('the features come folded on phones in the prerendered HTML, open from 640px', async ({ browser, request }) => {
    const html = await (await request.get('/exultadetail')).text()
    const folds = html.match(/<details[^>]*class="index-fold"[^>]*>/g) ?? []
    expect(folds).toHaveLength(6)
    for (const fold of folds) expect(fold).not.toMatch(/\sopen\b/)
    expect(html).toContain('An interactive tool where visitors set a guest count')

    for (const [width, shown] of [
      [390, false],
      [1280, true],
    ] as const) {
      // No JavaScript: the prerendered page as it arrives
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 800 } })
      const page = await context.newPage()
      await page.goto('/exultadetail')
      const texts = page.locator('.index-text')
      await expect(texts).toHaveCount(6)
      for (const text of await texts.all()) {
        if (shown) await expect(text).toBeVisible()
        else await expect(text).toBeHidden()
      }
      await expect(page.locator('.index-title').first()).toBeVisible()
      await context.close()
    }
  })

  test('on a phone a feature opens and closes by keyboard and by tap', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const page = await context.newPage()
    const errors = await guard(page)
    await open(page, '/exultadetail')
    const folds = page.locator('.index-fold')
    const first = folds.nth(0)
    await expect(first.locator('.index-text')).toBeHidden()

    // A disclosure: focusable, Enter and Space toggle it, Tab goes on to the next title
    await first.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(first).toHaveJSProperty('open', true)
    await expect(first.locator('.index-text')).toBeVisible()
    await page.keyboard.press('Space')
    await expect(first).toHaveJSProperty('open', false)
    await expect(first.locator('.index-text')).toBeHidden()
    await page.keyboard.press('Tab')
    await expect(folds.nth(1).locator('summary')).toBeFocused()

    // And a tap
    await folds.nth(2).locator('summary').tap()
    await expect(folds.nth(2).locator('.index-text')).toBeVisible()
    await expect(folds.nth(3).locator('.index-text')).toBeHidden()
    expect(errors).toEqual([])
    await context.close()
  })

  test('wider screens show every text, and the titles are no toggles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const errors = await guard(page)
    await open(page, '/exultadetail')
    const folds = page.locator('.index-fold')
    for (const fold of await folds.all()) {
      await expect(fold).toHaveJSProperty('open', true)
      await expect(fold.locator('summary')).toHaveAttribute('tabindex', '-1')
    }
    const first = folds.first()
    await first.scrollIntoViewIfNeeded()
    await first.locator('summary').click()
    await expect(first).toHaveJSProperty('open', true)
    await expect(first.locator('.index-text')).toBeVisible()
    expect(errors).toEqual([])
  })
})

// Old URLs may be linked or indexed: they end up on the new page, in the same
// language, with the query and hash.
test.describe('old URLs', () => {
  const moved = MOVED.flatMap(([from, to]) => [
    [from, to, 'en'],
    [nl(from), nl(to), 'nl'],
  ])

  for (const [from, to, lang] of moved) {
    test(`${from} ends up on ${to}`, async ({ page }) => {
      const errors = await guard(page)
      await page.goto(`${from}?ref=old#drupal-title`)
      await expect(page).toHaveURL(new RegExp(`${to}\\?ref=old#drupal-title$`))
      await expect(page.locator('#main-content')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('h1')).toContainText('Stable Manager')
      expect(errors).toEqual([])
    })

    test(`${from} redirects without JavaScript too, and stays out of search`, async ({ request }) => {
      // Raw HTML: what GitHub Pages serves at the old URL, with and without the slash
      for (const url of [from, `${from}/`]) {
        const res = await request.get(url)
        expect(res.status(), url).toBe(200)
        const html = await res.text()
        expect(html, url).toContain(`<html lang="${lang}">`)
        expect(html, url).toContain(`<meta http-equiv="refresh" content="0; url=${to}" />`)
        expect(html, url).toContain(`<link rel="canonical" href="https://robbesaelens.github.io${to}" />`)
        expect(html, url).toContain('<meta name="robots" content="noindex, follow" />')
        expect(html, url).toContain(`<a href="${to}">Stable Manager`)
      }
    })
  }

  test('the router sends them on inside the app as well', async ({ page }) => {
    const errors = await guard(page)
    for (const [from, to] of moved) {
      await open(page, '/projects')
      // A client-side navigation, as an old link inside the app would make
      await page.evaluate((url) => {
        history.pushState(null, '', url)
        dispatchEvent(new PopStateEvent('popstate'))
      }, from)
      await expect(page).toHaveURL(new RegExp(`${to}$`))
      await expect(page.locator('h1')).toContainText('Stable Manager')
    }
    expect(errors).toEqual([])
  })
})

// After a deploy an open tab still asks for the old route chunks, which are gone
// (Safari: "Importing a module script failed."). The page then loads in full.
test('a route chunk that fails to load opens the page in full instead', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/privacy')
  // The tab's chunk is gone until the page loads anew (with the new build's chunks)
  let stale = true
  page.on('request', (req) => {
    if (req.isNavigationRequest()) stale = false
  })
  await page.route(/\/assets\/Contact-[\w-]+\.js$/, (route) =>
    stale ? route.fulfill({ status: 404, body: '' }) : route.continue(),
  )
  await page.evaluate(() => {
    history.pushState(null, '', '/contact')
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page).toHaveURL(/\/contact$/)
  await expect.poll(() => stale).toBe(false)
  await expect(page.locator('#main-content')).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(errors.filter((e) => !/Contact-|404/.test(e))).toEqual([])
})

test.describe('project slides', () => {
  /** The pose a slide gives its MacBook (custom properties read by MacBook3D.vue) */
  const poses = (page: Page) =>
    page.locator('.car-slide').evaluateAll((slides) =>
      slides
        .filter((el) => el.querySelector('.mb-scene'))
        .map((el) => {
          const style = getComputedStyle(el.querySelector('.mb-scene')!)
          return { lid: parseFloat(style.getPropertyValue('--lid')), ry: parseFloat(style.getPropertyValue('--ry')) }
        }),
    )

  for (const route of ['/projects', nl('/projects')]) {
    test(`every slide shows its screenshot on a 3D MacBook, lined up with its caption (${route})`, async ({ page }) => {
      const errors = await guard(page)
      await open(page, route)
      const alt = route === '/projects' ? 'on a MacBook' : 'op een MacBook'
      await expect(page.locator('.mb-scene')).toHaveCount(SLIDES.length)

      for (const { name, screenshot } of SLIDES) {
        await page.getByRole('button', { name, exact: true }).click()
        const current = page.locator('.car-slide.is-current')
        await expect(current).toContainText(name)
        await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-current', 'true')
        await expect(current.locator('img.mb-shot')).toHaveAttribute('alt', `${name} ${alt}`)

        // Let the scroll, the turn and the lid settle before measuring
        await expect.poll(async () => (await measureCurrentSlide(page)).loaded).toBe(true)
        await page.waitForTimeout(1500)
        const m = await measureCurrentSlide(page)
        expect(m.screenshot).toBe(screenshot)
        expect(Math.abs(m.left), `${name}: stage's left edge vs the caption`).toBeLessThanOrEqual(1)
        expect(Math.abs(m.right), `${name}: stage's right edge vs the caption`).toBeLessThanOrEqual(1)
        expect(m.inside, `${name}: the whole MacBook is shown, clear of the caption`).toBe(true)
        expect(m.share, `${name}: the MacBook fills its stage`).toBeGreaterThan(0.85)
      }
      expect(errors).toEqual([])
    })
  }

  test('clicking the slide beside the current one brings it to the middle; clicking the current one opens it', async ({ page }) => {
    await open(page, '/projects')
    await page.getByRole('button', { name: 'Scan2Talk', exact: true }).click()
    const current = page.locator('.car-slide.is-current')
    await expect(current).toContainText('Scan2Talk')
    await settled(page)

    /** Clicks a slide where it shows on screen (part of it is off the edge) */
    const clickVisible = async (name: string) => {
      const slide = page.locator('.car-slide', { hasText: name })
      const box = (await slide.boundingBox())!
      const view = page.viewportSize()!
      const left = Math.max(box.x, 0)
      const right = Math.min(box.x + box.width, view.width)
      await page.mouse.click((left + right) / 2, box.y + box.height * 0.4)
    }

    for (const name of ['Stable Manager', 'Scan2Talk', 'Exulta']) {
      await clickVisible(name)
      await expect(current).toContainText(name)
      await expect(page).toHaveURL(/\/projects$/)
      await settled(page)
    }

    // The current one opens its project page
    await clickVisible('Exulta')
    await expect(page).toHaveURL(/\/exultadetail$/)
  })

  test('the arrows, keys and dots reach every slide, also the narrow ones on short screens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 620 })
    await open(page, '/projects')
    const counter = page.locator('.car-count-now')
    const next = page.getByRole('button', { name: 'Next project' })
    if (await next.isVisible()) {
      for (const n of ['02', '03', '04', '05']) {
        await next.click()
        await expect(counter).toHaveText(n)
      }
    }
    await page.locator('.car-track').focus()
    for (const n of ['04', '03', '02', '01']) {
      await page.keyboard.press('ArrowLeft')
      await expect(counter).toHaveText(n)
    }
    await page.getByRole('button', { name: 'Scan2Talk', exact: true }).click()
    await expect(page.locator('.car-slide.is-current')).toContainText('Scan2Talk')
  })

  test('Tab reaches only the current slide, shows a focus ring, and follows the arrow keys', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard')
    await open(page, '/projects')
    await page.locator('.car-track').focus()
    await page.keyboard.press('Tab')
    const current = page.locator('.car-slide.is-current a.car-card')
    await expect(current).toBeFocused()
    expect(await current.evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('solid')
    await expect(page.locator('.car-slide a.car-card[tabindex="-1"]')).toHaveCount(3)
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.car-count-now')).toHaveText('02')
    await expect(page.locator('.car-slide.is-current a.car-card')).toBeFocused()
  })

  test('the current MacBook is open; the others are half closed and turned towards it', async ({ page }) => {
    await open(page, '/projects')
    await page.getByRole('button', { name: 'Stable Manager', exact: true }).click()
    await expect(page.locator('.car-slide.is-current')).toContainText('Stable Manager')
    const p = await poses(page)
    expect(p.map((x) => x.lid)).toEqual([-38, -38, 14, -38])
    // Before the current one they turn right (towards it), after it left
    expect(p[0].ry).toBeGreaterThan(0)
    expect(p[1].ry).toBeGreaterThan(0)
    expect(p[3].ry).toBeLessThan(0)
    // Every other current MacBook is seen from the other side
    await page.getByRole('button', { name: 'VHS Service', exact: true }).click()
    await expect(page.locator('.car-slide.is-current')).toContainText('VHS Service')
    expect(Math.sign((await poses(page))[3].ry)).toBe(-Math.sign(p[2].ry))
  })

  test('the lid is closed until the intro has played, then it opens', async ({ page }) => {
    await open(page, '/projects')
    const lid = () =>
      page.locator('.car-slide.is-current .mb-scene').evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--lid')))
    expect(await lid()).toBe(14)
    await page.evaluate(() => document.documentElement.classList.remove('intro-done'))
    expect(await lid()).toBe(-90)
    await page.evaluate(() => document.documentElement.classList.add('intro-done'))
    expect(await lid()).toBe(14)
  })

  test('the current MacBook sways, and turns towards the mouse', async ({ page, isMobile }) => {
    await open(page, '/projects')
    const swaying = () =>
      page.locator('.mb-sway').evaluateAll((els) =>
        els.map((el) => el.getAnimations().some((a) => a.playState === 'running')),
      )
    expect(await swaying()).toEqual([true, false, false, false])
    test.skip(isMobile, 'mouse only')

    const stage = page.locator('.car-slide.is-current .car-stage')
    const box = (await stage.boundingBox())!
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1)
    await expect(stage).toHaveClass(/is-tilted/)
    // Eased towards the mouse frame by frame
    const tilt = () => stage.evaluate((el) => [el.style.getPropertyValue('--tx'), el.style.getPropertyValue('--ty')].map(parseFloat))
    await expect.poll(async () => (await tilt())[0], { message: 'tips back at the top' }).toBeGreaterThan(3)
    await expect.poll(async () => (await tilt())[1], { message: 'turns right on the right' }).toBeGreaterThan(8)
    expect(await swaying(), 'the sway pauses under the mouse').toEqual([false, false, false, false])
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 200)
    await expect(stage).not.toHaveClass(/is-tilted/)
  })

  test('no swaying, turning or tilting with reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await open(page, '/projects')
    const animations = await page.locator('.mb-sway').evaluateAll((els) => els.flatMap((el) => el.getAnimations()).length)
    expect(animations).toBe(0)
    // The site's reduced-motion rule (styles.css) leaves transitions at 0.01 ms at most
    const transition = await page.locator('.mb-pose').first().evaluate((el) => getComputedStyle(el).transitionDuration)
    expect(parseFloat(transition)).toBeLessThan(0.001)
    const stage = page.locator('.car-slide.is-current .car-stage')
    const box = (await stage.boundingBox())!
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1)
    await expect(stage).not.toHaveClass(/is-tilted/)
    await context.close()
  })
})

test.describe('project page animations', () => {
  const DETAILS = ['/exultadetail', '/scan2talkdetail', '/stablemanagerdetail', '/vhsdetail']

  for (const route of DETAILS) {
    test(`${route} rises in like the other pages, and the rest as you scroll to it`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      const errors = await guard(page)
      await open(page, route)

      // The header and the screenshots: the shared entrance (styles.css)
      for (const el of [page.locator('h1'), page.locator('.stage-desktop'), page.locator('.stage-phone')]) {
        await expect(el).toHaveClass(/hero-in/)
        const names = await el.evaluate((e) => e.getAnimations().map((a) => (a as CSSAnimation).animationName))
        expect(names).toContain('hero-rise')
      }

      // Below the fold stays hidden until scrolled to (no timer that shows it anyway)
      const last = page.locator('.reveal').last()
      await page.waitForTimeout(2000)
      await expect(last).toHaveClass(/reveal-armed/)
      await expect(last).not.toHaveClass(/is-visible/)
      expect(await last.evaluate((e) => getComputedStyle(e).opacity)).toBe('0')

      // ...and rises in when it scrolls into view
      await last.scrollIntoViewIfNeeded()
      await expect(last).toHaveClass(/is-visible/)
      await expect.poll(() => last.evaluate((e) => getComputedStyle(e).opacity)).toBe('1')
      expect(errors).toEqual([])
    })
  }

  test('things that come into view together follow each other', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, '/exultadetail')
    const cards = page.locator('.index-item')
    await cards.first().scrollIntoViewIfNeeded()
    await expect(cards.nth(2)).toHaveClass(/is-visible/)
    const delays = await cards.evaluateAll((els) =>
      els.slice(0, 3).map((e) => parseFloat(getComputedStyle(e).getPropertyValue('--reveal-delay') || '0')),
    )
    // Left to right, each a little later than the one before
    expect(delays[1]).toBeGreaterThan(delays[0])
    expect(delays[2]).toBeGreaterThan(delays[1])
  })

  test('nothing is hidden or animated with reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await open(page, '/exultadetail')
    const opacities = await page.locator('.reveal, .hero-in').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity))
    expect(opacities.every((o) => o === '1')).toBe(true)
    const animated = await page.locator('.reveal, .hero-in').evaluateAll((els) => els.filter((e) => e.getAnimations().length).length)
    expect(animated).toBe(0)
    await context.close()
  })
})

// In the prerendered HTML, where the browser's preload scanner finds them: the two
// screenshots at the top load straight away, the desktop one (the largest paint) first.
test.describe('project page screenshots', () => {
  for (const route of ['/exultadetail', '/scan2talkdetail', '/stablemanagerdetail', '/vhsdetail']) {
    test(`${route} loads its hero screenshots first, and the rest lazily`, async ({ request }) => {
      const html = await (await request.get(route)).text()
      const [desktop, phone, ...rest] = html.match(/<img\b[^>]*>/g) ?? []
      expect(desktop).toMatch(/src="\/[\w-]+-home\.jpg"/)
      expect(desktop).toContain('fetchpriority="high"')
      expect(desktop).not.toContain('loading="lazy"')
      expect(phone).toMatch(/src="\/[\w-]+-mobile\.jpg"/)
      expect(phone).not.toContain('loading="lazy"')
      for (const img of rest) expect(img).toContain('loading="lazy"')
    })
  }

  // Each screenshot is a <picture>: the AVIF and WebP copies at two widths that the build
  // makes (scripts/images.mjs), with the JPG as the fallback. Its width and height are the
  // JPG's own: they hold its room while it loads and give the widths in the srcset.
  for (const route of ['/exultadetail', '/scan2talkdetail', '/stablemanagerdetail', '/vhsdetail', '/projects', '/tools']) {
    test(`${route} shows its screenshots as AVIF or WebP, at their JPG's real size`, async ({ page }) => {
      await open(page, route)
      const shots = await page.locator('#app picture').evaluateAll((pictures) =>
        Promise.all(
          pictures.map(async (picture) => {
            const img = picture.querySelector('img')!
            const jpg = new Image()
            jpg.src = img.getAttribute('src')!
            await jpg.decode()
            const sources = [...picture.querySelectorAll('source')]
            return {
              src: img.getAttribute('src')!,
              size: [Number(img.getAttribute('width')), Number(img.getAttribute('height'))],
              real: [jpg.naturalWidth, jpg.naturalHeight],
              types: sources.map((s) => s.getAttribute('type')),
              srcset: sources[0]?.getAttribute('srcset'),
              sizes: sources[0]?.getAttribute('sizes'),
            }
          }),
        ),
      )
      expect(shots.length).toBeGreaterThanOrEqual(route === '/projects' ? 4 : 2)
      for (const { src, size, real, types, srcset, sizes } of shots) {
        expect(size, src).toEqual(real)
        expect(types, src).toEqual(['image/avif', 'image/webp'])
        const name = src.slice(1, -'.jpg'.length)
        expect(srcset, src).toBe(`/img/${name}-half.avif ${Math.round(size[0] / 2)}w, /img/${name}.avif ${size[0]}w`)
        expect(sizes, src).toBeTruthy()
      }
    })
  }
})

// The structured data of each project page, as crawlers read it from the prerendered
// HTML: the site or app itself, with the page's own name and description, and its real
// screenshot (the share image, og:image, is about the page, not the work).
test.describe('project structured data', () => {
  const stats = JSON.parse(readFileSync(new URL('../src/data/repo-stats.json', import.meta.url), 'utf8'))
  const PROJECTS = [
    { route: '/exultadetail', type: 'WebSite', name: 'Exulta', stats: 'exulta', shot: 'exulta', live: 'https://exulta.be' },
    { route: '/scan2talkdetail', type: 'WebApplication', name: 'Scan2Talk', stats: 'scan2talk', shot: 'scan2talk', live: 'https://scan2talk.be' },
    { route: '/stablemanagerdetail', type: 'WebApplication', name: 'Stable Manager', stats: 'stableManager', shot: 'stable-manager' },
    { route: '/vhsdetail', type: 'WebSite', name: 'VHS Service', stats: 'vhs', shot: 'vhs' },
  ]
  const attr = (html: string, pattern: RegExp) => html.match(pattern)?.[1]?.replace(/&amp;/g, '&').replace(/&#39;/g, "'")

  for (const { route, type, name, stats: key, shot, live } of PROJECTS) {
    for (const url of [route, nl(route)]) {
      test(`${url} describes ${name} as a ${type}`, async ({ request }) => {
        const html = await (await request.get(url)).text()
        const json = attr(html, /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
        const graph: Record<string, any>[] = JSON.parse(json!)['@graph']
        const byId = new Map(graph.map((node) => [node['@id'], node]))
        const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/)

        const project = byId.get(`${canonical}#project`)!
        expect(project['@type']).toBe(type)
        expect(project.name).toBe(name)
        expect(project.description).toBe(attr(html, /<meta name="description" content="([^"]+)"/))
        expect(project.headline).toBe(attr(html, /<title>([^<]+) \| Robbe Saelens<\/title>/))
        expect(project.url).toBe(canonical)
        expect(project.image).toBe(`https://robbesaelens.github.io/${shot}-home.jpg`)
        expect(attr(html, /<meta property="og:image" content="([^"]+)"/)).toBe(`https://robbesaelens.github.io/og${url}.png`)
        expect(project.sameAs).toBe(live)
        expect(project.dateCreated).toBe(stats.projects[key].firstCommit.slice(0, 10))
        expect(project.keywords).toMatch(/\w+, \w+/)
        expect(project.hasPart[0]['@type']).toBe('SoftwareSourceCode')
        expect(project.hasPart[0].programmingLanguage.length).toBeGreaterThan(0)
        if (type === 'WebApplication') expect(project.applicationCategory).toMatch(/Application$/)

        // The page is about it; it and its code are Robbe's
        const page = byId.get(`${canonical}#webpage`)!
        expect(page['@type']).toBe('ItemPage')
        expect(page.inLanguage).toBe(url.startsWith('/nl') ? 'nl' : 'en')
        expect(page.mainEntity['@id']).toBe(project['@id'])
        expect(project.mainEntityOfPage['@id']).toBe(page['@id'])
        expect(byId.get(project.author['@id'])['@type']).toBe('Person')

        // Every reference points at a node in the graph
        const refs: string[] = []
        const walk = (value: unknown) => {
          if (Array.isArray(value)) value.forEach(walk)
          else if (value && typeof value === 'object') {
            const entries = Object.entries(value)
            if (entries.length === 1 && entries[0][0] === '@id') refs.push(entries[0][1] as string)
            else entries.forEach(([, v]) => walk(v))
          }
        }
        graph.forEach((node) => Object.entries(node).forEach(([k, v]) => k !== '@id' && walk(v)))
        for (const ref of refs) expect(byId.has(ref), ref).toBe(true)
      })
    }
  }
})

// The tools page's structured data: each tool a SoftwareApplication for macOS, in the
// page's language, by Robbe; no code repository while they're private.
test.describe('tools structured data', () => {
  const unescape = (text: string) => text.replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  for (const url of ['/tools', '/nl/tools']) {
    test(`${url} describes both tools as SoftwareApplications`, async ({ request }) => {
      const html = await (await request.get(url)).text()
      const json = unescape(html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)![1])
      const graph: Record<string, any>[] = JSON.parse(json)['@graph']
      const byId = new Map(graph.map((node) => [node['@id'], node]))
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)![1]

      const page = byId.get(`${canonical}#webpage`)!
      expect(page['@type']).toBe('CollectionPage')
      expect(page.inLanguage).toBe(url.startsWith('/nl') ? 'nl' : 'en')
      expect(page.mainEntity['@id']).toBe(`${canonical}#tools`)

      const list = byId.get(`${canonical}#tools`)!
      expect(list['@type']).toBe('ItemList')
      const apps: Record<string, any>[] = list.itemListElement.map((entry: { item: unknown }) => entry.item)
      expect(apps.map((app) => app.name)).toEqual(['Project Updater', 'Sift'])
      for (const app of apps) {
        expect(app['@type']).toBe('SoftwareApplication')
        expect(app.operatingSystem).toBe('macOS')
        expect(app.applicationCategory).toBe('DeveloperApplication')
        expect(app.softwareVersion).toMatch(/^\d+\.\d+\.\d+$/)
        expect(app.url).toBe(app['@id'])
        expect(app.url.startsWith(`${canonical}#`)).toBe(true)
        expect(app.image).toMatch(/^https:\/\/robbesaelens\.github\.io\/[\w-]+-home\.jpg$/)
        expect(app.screenshot).toHaveLength(4)
        expect(app.screenshot[0]).toBe(app.image)
        expect(app.description.length).toBeGreaterThan(80)
        expect(byId.get(app.author['@id'])!['@type']).toBe('Person')
        expect(JSON.stringify(app)).not.toContain('codeRepository')
      }
      // In the page's language
      expect(apps[1].description).toContain(url.startsWith('/nl') ? 'rechtstreeks vanuit de terminal' : 'straight from the terminal')
    })
  }
})

test('lightbox opens, steps through the screenshots, and closes', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/exultadetail')

  await page.locator('button.shot').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog.locator('.lightbox-caption')).toContainText('1 / 2')
  // The full-size copy, AVIF where the browser has it
  const shown = () => dialog.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.currentSrc)
  await expect.poll(shown).toMatch(/\/img\/exulta-home\.avif$/)

  await page.keyboard.press('ArrowRight')
  await expect(dialog.locator('.lightbox-caption')).toContainText('2 / 2')
  await expect.poll(shown).toMatch(/\/img\/exulta-mobile\.avif$/)
  await page.keyboard.press('ArrowRight')
  await expect(dialog.locator('.lightbox-caption')).toContainText('1 / 2')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  expect(errors).toEqual([])
})

test.describe('repository activity', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/repo-stats.json', import.meta.url), 'utf8'))
  const PAGES = [
    ['/exultadetail', 'exulta'],
    ['/scan2talkdetail', 'scan2talk'],
    ['/stablemanagerdetail', 'stableManager'],
    ['/vhsdetail', 'vhs'],
  ] as const

  // Most repos are private: counts and dates only.
  test('the stats cover every project and hold no personal data', () => {
    for (const [, key] of PAGES) expect(data.projects[key], key).toBeTruthy()
    const text = JSON.stringify(data)
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/)
    expect(text).not.toMatch(/"(author|name|email|committer|subject|message|latestCommits)"/i)
  })

  for (const [route, key] of PAGES) {
    test(`${route} shows the numbers of ${key}`, async ({ page }) => {
      const errors = await guard(page)
      const stats = data.projects[key]
      await open(page, route)
      const section = page.locator(`.repo:has(#repo-title-${key})`)
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()
      // The count rises to its value (CountUp, 0.9 s however many commits).
      await expect(section.locator('.repo-number dd').first()).toHaveText(stats.commits.toLocaleString('en-GB'), { timeout: 5_000 })
      await expect(section.locator('.repo-number')).toHaveCount(4)
      await expect(section.locator('.repo-commit')).toHaveCount(0)
      await expect(section.locator('.repo-bar')).toHaveCount(26)
      expect(errors).toEqual([])
    })
  }

  // One block in the page at every width, beside the stack (no panel fixed at the side):
  // its numbers in one row where it has 600px of room, two by two where it hasn't.
  test('stays in the page at every width, laid out by its own width', async ({ page }) => {
    await guard(page)
    const rows = async (repo: ReturnType<Page['locator']>) => {
      const tops = await repo.locator('.repo-number').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)))
      return new Set(tops).size
    }
    for (const [width, height, inRow] of [
      [1920, 1080, true],
      [1440, 900, true],
      [1024, 768, false],
      [390, 844, false],
    ] as const) {
      await page.setViewportSize({ width, height })
      await open(page, '/stablemanagerdetail')
      await expect(page.getByRole('complementary')).toHaveCount(0)
      for (const name of ['Repository activity']) {
        const repo = page.getByRole('region', { name })
        await repo.scrollIntoViewIfNeeded()
        await expect(repo).toBeVisible()
        // Inside the page's column, in line with the header
        const box = (await repo.boundingBox())!
        const column = (await page.locator('.detail-page > .project-page').boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(column.x)
        expect(box.x + box.width).toBeLessThanOrEqual(column.x + column.width)
        expect(await rows(repo), `${name} at ${width}px`).toBe(inRow ? 1 : 2)
        expect(await repo.evaluate((e) => getComputedStyle(e).position)).toBe('static')
      }
    }
  })

  test('in Dutch on /nl', async ({ page }) => {
    await guard(page)
    await open(page, '/nl/vhsdetail')
    await expect(page.getByRole('region', { name: 'Repository-activiteit' })).toBeAttached()
    await expect(page.locator('.repo-number dt').nth(1)).toHaveText('in de laatste 30 dagen')
  })
})

test.describe('Drupal contributions', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/drupal.json', import.meta.url), 'utf8'))
  const LISTS = [
    ['Credited contributions', 'Bijdragen met credit', data.credits],
    ['Merge requests', 'Merge requests', data.mergeRequests],
    ['Issues I opened', 'Issues die ik aanmaakte', data.issuesCreated],
    ['Issues I took part in', 'Issues waaraan ik meewerkte', data.issuesJoined],
  ] as const
  const merged = data.mergeRequests.filter((mr: { state: string }) => mr.state === 'merged').length

  // Public metadata only (npm run drupal): no comment text, no e-mail addresses.
  test('the data holds titles, projects, statuses, dates and links only', () => {
    const text = JSON.stringify(data)
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/)
    expect(text).not.toMatch(/"(body|comment_body|comments?|description|notes?|email|mail|author|uid)"/i)
    for (const [name, , items] of LISTS) {
      for (const item of items) expect(item.url, name).toMatch(/^https:\/\/(www\.drupal\.org|git\.drupalcode\.org)\//)
    }
    expect(data.credits.length + data.issuesCreated.length).toBeGreaterThan(0)
  })

  test('lists every contribution, each linking to drupal.org or git.drupalcode.org', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/drupal')
    for (const [name, , items] of LISTS) {
      const list = page.getByRole('region', { name, exact: true })
      await list.scrollIntoViewIfNeeded()
      const links = list.getByRole('link')
      await expect(links, name).toHaveCount(items.length)
      for (const [i, item] of items.entries()) {
        await expect(links.nth(i)).toHaveAttribute('href', item.url)
        await expect(links.nth(i)).toHaveAttribute('target', '_blank')
        await expect(links.nth(i)).toHaveAttribute('rel', 'noopener noreferrer')
        await expect(links.nth(i)).toContainText(item.title)
        await expect(links.nth(i).locator('.badge')).not.toBeEmpty()
      }
    }
    // The numbers are the lists' lengths, in the lists' order (they count once in view)
    await page.locator('.stats').scrollIntoViewIfNeeded()
    await expect(page.locator('.stats-number dd')).toHaveText(
      [data.issuesCreated.length, data.credits.length, merged, data.issuesJoined.length].map(String),
    )
    // The projects he contributed to: "All" and one chip per project in the lists, as a
    // filter. Picking one leaves only its rows and numbers, and links to its drupal.org page.
    const used = new Set<string>([
      ...data.credits.map((c) => c.project),
      ...data.mergeRequests.map((mr) => mr.project),
      ...data.issuesCreated.map((i) => i.project),
      ...data.issuesJoined.map((i) => i.project),
    ])
    const chips = page.locator('.drupal-projects .chip')
    await expect(chips).toHaveCount(used.size + 1)
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'true')
    await chips.nth(1).click()
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'false')
    const picked = (await chips.nth(1).locator('.chip-name').innerText()).trim()
    await expect(page.locator('.drupal-filter-note a')).toHaveAttribute('href', /^https:\/\/www\.drupal\.org\/project\//)
    for (const row of await page.locator('.row-meta').all()) await expect(row).toContainText(picked)
    await chips.first().click()
    await page.locator('.stats').scrollIntoViewIfNeeded()
    await expect(page.locator('.stats-number dd')).toHaveText(
      [data.issuesCreated.length, data.credits.length, merged, data.issuesJoined.length].map(String),
    )
    const asOf = new Date(data.generatedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Brussels',
    })
    await expect(page.locator('.stats-note')).toContainText(asOf)
    await expect(page.getByRole('link', { name: 'drupal.org profile' })).toHaveAttribute(
      'href',
      'https://www.drupal.org/u/robbesaelens',
    )
    expect(errors).toEqual([])
  })

  test('in Dutch on /nl/drupal', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/nl/drupal')
    await expect(page.locator('h1')).toContainText('drupal-bijdragen')
    for (const [, name, items] of LISTS) {
      await expect(page.getByRole('region', { name, exact: true }).getByRole('link')).toHaveCount(items.length)
    }
    // Dates in Dutch; statuses keep drupal.org's English terms
    const opened = page.getByRole('region', { name: 'Issues die ik aanmaakte' })
    await expect(opened.locator('.row-meta').first()).toContainText('aangemaakt op')
    await expect(opened.locator('.badge').first()).toHaveText(/^(Active|Needs work|Needs review|RTBC|Fixed|Postponed|Closed)/)
    expect(errors).toEqual([])
  })

  test('rises in, and the lists as you scroll to them', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    const errors = await guard(page)
    await open(page, '/drupal')
    for (const el of [page.locator('h1'), page.locator('.stats')]) {
      const names = await el.evaluate((e) => e.getAnimations().map((a) => (a as CSSAnimation).animationName))
      expect(names).toContain('hero-rise')
    }
    const last = page.locator('.reveal').last()
    await page.waitForTimeout(2000)
    await expect(last).not.toHaveClass(/is-visible/)
    await last.scrollIntoViewIfNeeded()
    await expect(last).toHaveClass(/is-visible/)
    await expect.poll(() => last.evaluate((e) => getComputedStyle(e).opacity)).toBe('1')
    expect(errors).toEqual([])
  })

  test('the mobile menu says "Drupal", on one line like the other links, and still announces it in full', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    const errors = await guard(page)
    for (const [path, full] of [['/drupal', 'Drupal contributions'], ['/nl/drupal', 'Drupal-bijdragen']] as const) {
      await open(page, path)
      await page.locator('button[aria-controls="mobile-menu"]').click()
      const link = page.locator('.mobile-link[href$="/drupal"]')
      await expect(link.locator('.mobile-label')).toHaveText('Drupal')
      await expect(link).toHaveAccessibleName(full)
      // A long label wrapped onto two lines and made its row about 40px taller (the first row's border adds 1px).
      const heights = await page.locator('.mobile-link').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
      expect(Math.max(...heights) - Math.min(...heights), `${path}: every row as tall as the others (${heights})`).toBeLessThan(5)
    }
    expect(errors).toEqual([])
  })

  test('is linked from the about page, in both languages', async ({ page }) => {
    const errors = await guard(page)
    for (const [about, label, target] of [
      ['/contact', 'My Drupal contributions', '/drupal'],
      ['/nl/contact', 'Mijn Drupal-bijdragen', '/nl/drupal'],
    ]) {
      await open(page, about)
      await page.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL(new RegExp(`${target}$`))
      await expect(page.locator('h1')).toContainText(target.startsWith('/nl') ? 'drupal-bijdragen' : 'drupal contributions')
    }
    expect(errors).toEqual([])
  })
})

test('hovering Geluwe shows a map, Escape hides it', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/')
  const place = page.getByRole('button', { name: 'Geluwe' })
  const card = page.getByRole('tooltip')
  await expect(card).toBeHidden()
  // The word rises in with the hero text: hover it once it stands still, or it can
  // slide out from under the mouse (a mouseleave) on a slow machine.
  let last = ''
  await expect
    .poll(async () => {
      const box = JSON.stringify(await place.boundingBox())
      const still = box === last
      last = box
      return still
    }, { intervals: [150] })
    .toBe(true)
  await place.hover()
  await expect(card).toBeVisible()
  await expect(card.getByRole('img', { name: /Map of Geluwe/ })).toBeVisible()
  // The SVG map loads on first open, with Geluwe labelled
  await expect(card.locator('svg .m-label-main')).toHaveText('Geluwe')
  await page.keyboard.press('Escape')
  await expect(card).toBeHidden()
  // Also reachable with the keyboard, and it stays while the word has focus,
  // also when the mouse leaves it (WCAG 1.4.13)
  await place.focus()
  await expect(card).toBeVisible()
  await page.mouse.move(5, 5)
  await expect(place).toHaveAttribute('aria-expanded', 'true') // the card fades, so check the state
  await expect(card).toBeVisible()
  // Focus leaving the word (back, out of it; Tab would go into the card's link) closes it
  await page.keyboard.press('Shift+Tab')
  await expect(card).toBeHidden()
  expect(errors).toEqual([])
})

// The map has its own dark palette. No filters anywhere: a stray one once
// inverted the whole page.
test('dark mode uses the dark map palette and no filters', async ({ page }) => {
  await guard(page)
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
  await open(page, '/')
  const filtered = await page.evaluate(() =>
    [...document.querySelectorAll('body, body *')]
      .filter((el) => getComputedStyle(el).filter !== 'none')
      .map((el) => el.className.toString() || el.tagName),
  )
  expect(filtered).toEqual([])
  await page.getByRole('button', { name: 'Geluwe' }).hover()
  await expect(page.locator('.place-map .m-bg')).toHaveCSS('fill', 'rgb(17, 26, 34)')
})

test('the Scan2Talk film has working sources', async ({ request }) => {
  for (const [file, type] of [
    ['/scan2talk-tour.mp4', 'video/mp4'],
    ['/scan2talk-tour-480.mp4', 'video/mp4'],
    ['/img/scan2talk-tour-poster.webp', 'image/webp'],
  ]) {
    const res = await request.get(file, { headers: { Range: 'bytes=0-1023' } })
    expect([200, 206], file).toContain(res.status())
    expect(res.headers()['content-type'], file).toBe(type)
  }
})

test('screenshot buttons and social links are labelled in the page language', async ({ page }) => {
  await guard(page)
  await open(page, '/nl/exultadetail')
  await expect(page.locator('button.shot').nth(1)).toHaveAttribute(
    'aria-label',
    'Open de schermafbeelding van exulta.be — mobiel op volledig scherm',
  )
  await open(page, '/nl')
  await expect(page.getByRole('link', { name: 'Volg me op Instagram' })).toBeVisible()
  await open(page, '/')
  await expect(page.getByRole('link', { name: 'Follow me on Instagram' })).toBeVisible()
})

test('unknown pages show the not-found page and are kept out of search', async ({ page }) => {
  await guard(page)
  await open(page, '/this-page-does-not-exist')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
  // In the site layout, like every page: header, skip link, footer, one <main>
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
  await expect(page.locator('.site-header')).toBeVisible()
  await expect(page.locator('footer')).toBeVisible()
  await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main-content')
  await expect(page.locator('main')).toHaveCount(1)
})

test.describe('chatbot', () => {
  /** Stands in for the AI worker, with the CORS headers the real one sends. */
  async function fakeAi(page: Page, answer: (body: unknown) => { status: number; json: unknown }) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
    await page.route('https://chat.invalid/chat', async (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
      const { status, json } = answer(route.request().postDataJSON())
      await route.fulfill({ status, json, headers: cors })
    })
  }

  async function ask(page: Page, question: string) {
    await page.getByRole('button', { name: 'Open AI chat' }).click()
    await expect(page.locator('.msg--bot').first()).toBeVisible()
    await page.locator('#chat-input').fill(question)
    await page.locator('#chat-input').press('Enter')
  }

  test('answers with the AI, sending the conversation and language', async ({ page }) => {
    await guard(page)
    let sent: { messages: { role: string; content: string }[]; lang: string } | null = null
    await fakeAi(page, (body) => {
      sent = body as typeof sent
      return { status: 200, json: { reply: 'Robbe works at <b>Dynamate</b>.', suggestions: ['Which projects?', 'What did he study?'] } }
    })
    await open(page, '/')
    await ask(page, 'Where does Robbe work?')
    // Shown as text: the tag is not rendered as HTML.
    await expect(page.locator('.msg--bot').last()).toHaveText(/Robbe works at <b>Dynamate<\/b>\./)
    // Follow-up questions show up as buttons, and asking one sends it.
    const followUp = page.getByRole('button', { name: 'Which projects?' })
    await expect(followUp).toBeVisible()
    await expect(page.getByRole('button', { name: 'What did he study?' })).toBeVisible()
    expect(sent!.lang).toBe('en')
    expect(sent!.messages.at(-1)).toEqual({ role: 'user', content: 'Where does Robbe work?' })
    expect(sent!.messages.every((m) => m.content.length > 0)).toBe(true)
  })

  test('falls back to the built-in answers when the AI is unavailable', async ({ page }) => {
    await guard(page)
    await fakeAi(page, () => ({ status: 503, json: { error: 'unavailable' } }))
    await open(page, '/')
    await ask(page, 'What are your skills?')
    await expect(page.locator('.chat-typing')).toHaveCount(0)
    const reply = await page.locator('.msg--bot').last().innerText()
    expect(reply).not.toMatch(RAW_I18N_KEY)
    expect(reply.length).toBeGreaterThan(20)
  })
})

test.describe('analytics', () => {
  test('counts visits with the cookieless Cloudflare beacon, without a banner', async ({ page }) => {
    await guard(page)
    const beacon: string[] = []
    page.on('request', (r) => /static\.cloudflareinsights\.com\/beacon\.min\.js/.test(r.url()) && beacon.push(r.url()))
    await open(page, '/')

    await expect.poll(() => beacon.length).toBe(1)
    const config = await page.locator('script[data-cf-beacon]').getAttribute('data-cf-beacon')
    expect(JSON.parse(config!)).toMatchObject({ token: 'test-token' })
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await page.evaluate(() => document.cookie)).toBe('')
  })

  test('clears what the old Google Analytics setup left behind', async ({ page }) => {
    await guard(page)
    await page.addInitScript(() => {
      localStorage.setItem('cookie-consent', 'granted')
      document.cookie = '_ga=GA1.1.123; path=/'
      document.cookie = '_ga_KTMQFBG1N2=GS1.1.456; path=/'
    })
    const google: string[] = []
    page.on('request', (r) => /google/.test(r.url()) && google.push(r.url()))
    await open(page, '/')

    expect(await page.evaluate(() => localStorage.getItem('cookie-consent'))).toBeNull()
    expect(await page.evaluate(() => document.cookie)).not.toMatch(/_ga/)
    expect(google).toEqual([])
  })

  // Sentry only reports from robbesaelens.github.io (src/sentry.ts).
  test('error reporting stays off outside the live site', async ({ page }) => {
    await guard(page)
    const sentry: string[] = []
    page.on('request', (r) => /sentry\.io/.test(r.url()) && sentry.push(r.url()))
    await open(page, '/')
    await page.evaluate(() => setTimeout(() => {
      throw new Error('test error, must not be reported')
    }))
    await page.waitForTimeout(1500)
    expect(sentry).toEqual([])
  })

  test('the privacy page explains the statistics, error reports and the chatbot', async ({ page }) => {
    await guard(page)
    await open(page, '/privacy')
    await expect(page.getByRole('heading', { name: 'Statistics (Cloudflare Web Analytics)' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Error reports (Sentry)' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Chatbot' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cookie settings' })).toHaveCount(0)
  })
})

test('the chatbot says its answers come from AI', async ({ page }) => {
  await guard(page)
  await open(page, '/')
  await page.getByRole('button', { name: 'Open AI chat' }).click()
  await expect(page.locator('.chat-notice')).toContainText('generated by AI')
})
