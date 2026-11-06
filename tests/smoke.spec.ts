import { readFileSync } from 'node:fs'
import { baseCompile } from '@intlify/message-compiler'
import { expect, test, type Page } from '@playwright/test'
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
  /\b(?:nav|home|about|projects|exulta|vhs|scan2talk|stableManager|aria|chat|error|footer|privacy|repo|drupal)\.(?!(?:be|com|dev|app|io|md|org)\b)[a-z][A-Za-z]+\b/

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
      // Many images are lazy-loaded below the fold, so check each source directly.
      const sources = await page.$$eval('#app img', (imgs) =>
        [...new Set(imgs.map((i) => i.getAttribute('src')).filter(Boolean))],
      )
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

test('Stable Manager shows its Drupal version, with the public repository and its screenshot', async ({ page }) => {
  const errors = await guard(page)
  const repo = 'https://github.com/RobbeSaelens/shared_costs'
  await open(page, '/stablemanagerdetail')
  const drupal = page.getByRole('region', { name: 'Also in Drupal' })
  await expect(drupal.getByRole('link', { name: 'View on GitHub' })).toHaveAttribute('href', repo)
  // Each repository is labelled; only the public one links to GitHub
  await expect(page.getByRole('region', { name: 'Repository activity: Next.js app' }).locator('.repo-note-link')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Repository activity: Drupal version' }).locator('.repo-note-link')).toHaveAttribute('href', repo)
  // The Drupal screenshot is the third one in the lightbox
  await drupal.locator('button.shot').click()
  await expect(page.getByRole('dialog').locator('.lightbox-caption')).toContainText('3 / 3')
  await page.keyboard.press('Escape')

  await open(page, nl('/stablemanagerdetail'))
  await expect(page.getByRole('region', { name: 'Ook in Drupal' }).getByRole('link', { name: 'Bekijk op GitHub' })).toHaveAttribute('href', repo)
  await expect(page.getByRole('region', { name: 'Repository-activiteit: Drupal-versie' })).toBeAttached()
  expect(errors).toEqual([])
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
      for (const el of [page.locator('h1'), page.locator('.shots')]) {
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
    const cards = page.locator('.feature-card')
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

test('lightbox opens, steps through the screenshots, and closes', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/exultadetail')

  await page.locator('button.shot').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog.locator('.lightbox-caption')).toContainText('1 / 2')

  await page.keyboard.press('ArrowRight')
  await expect(dialog.locator('.lightbox-caption')).toContainText('2 / 2')
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
    // The Drupal version, on the Stable Manager page
    ['/stablemanagerdetail', 'sharedCosts'],
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
      const section = page.locator(`.repo--inline:has(#repo-title-${key}-inline)`)
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()
      await expect(section.locator('.repo-number dd').first()).toHaveText(stats.commits.toLocaleString('en-GB'))
      await expect(section.locator('.repo-number')).toHaveCount(4)
      await expect(section.locator('.repo-commit')).toHaveCount(0)
      await expect(section.locator('.repo-bar')).toHaveCount(26)
      expect(errors).toEqual([])
    })
  }

  test('on wide screens it floats beside the content instead', async ({ page }) => {
    await guard(page)
    await page.setViewportSize({ width: 1920, height: 1080 })
    await open(page, '/exultadetail')
    const aside = page.getByRole('complementary', { name: 'Repository activity' })
    await expect(aside).toBeVisible()
    await expect(page.locator('.repo--inline')).toBeHidden()
    // Right of the 1280px content, and it stays put while scrolling.
    const content = (await page.locator('.detail-page > div').first().boundingBox())!
    const before = (await aside.boundingBox())!
    expect(before.x).toBeGreaterThanOrEqual(content.x + content.width)
    expect(before.x + before.width).toBeLessThanOrEqual(1920)
    await page.mouse.wheel(0, 1500)
    await page.waitForTimeout(300)
    expect((await aside.boundingBox())!.y).toBeCloseTo(before.y, 0)

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(aside).toBeHidden()
    await expect(page.locator('.repo--inline')).toBeVisible()
  })

  test('with two repositories, only the first floats; the other stays on the page', async ({ page }) => {
    await guard(page)
    await page.setViewportSize({ width: 1920, height: 1080 })
    await open(page, '/stablemanagerdetail')
    await expect(page.getByRole('complementary')).toHaveCount(1)
    await expect(page.getByRole('complementary', { name: 'Repository activity: Next.js app' })).toBeVisible()
    await expect(page.locator('#repo-title-stableManager-inline')).toBeHidden()
    const drupal = page.getByRole('region', { name: 'Repository activity: Drupal version' })
    await drupal.scrollIntoViewIfNeeded()
    await expect(drupal).toBeVisible()
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
    // The numbers are the lists' lengths, in the lists' order
    await expect(page.locator('.stats-number dd')).toHaveText(
      [data.issuesCreated.length, data.credits.length, merged, data.issuesJoined.length].map(String),
    )
    // The projects he contributed to: one chip per project in the lists, linking to its drupal.org page
    const used = new Set<string>([
      ...data.credits.map((c) => c.project),
      ...data.mergeRequests.map((mr) => mr.project),
      ...data.issuesCreated.map((i) => i.project),
      ...data.issuesJoined.map((i) => i.project),
    ])
    const chips = page.locator('.drupal-projects .chip')
    await expect(chips).toHaveCount(used.size)
    for (const [i, project] of (await chips.evaluateAll((els) => els.map((e) => e.getAttribute('href')))).entries()) {
      expect(project, `chip ${i}`).toMatch(/^https:\/\/www\.drupal\.org\/project\//)
    }
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

  test('is linked from the about page and the Stable Manager page, in both languages', async ({ page }) => {
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
    await open(page, '/stablemanagerdetail')
    await expect(
      page.getByRole('region', { name: 'Also in Drupal' }).getByRole('link', { name: 'My Drupal contributions' }),
    ).toHaveAttribute('href', '/drupal')
    expect(errors).toEqual([])
  })
})

test('hovering Geluwe shows a map, Escape hides it', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/')
  const place = page.getByRole('button', { name: 'Geluwe' })
  const card = page.getByRole('tooltip')
  await expect(card).toBeHidden()
  await place.hover()
  await expect(card).toBeVisible()
  await expect(card.getByRole('img', { name: /Map of Geluwe/ })).toBeVisible()
  // The SVG map loads on first open, with Geluwe labelled
  await expect(card.locator('svg .m-label-main')).toHaveText('Geluwe')
  await page.keyboard.press('Escape')
  await expect(card).toBeHidden()
  // Also reachable with the keyboard
  await place.focus()
  await expect(card).toBeVisible()
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

test('the Scan2Talk check-in video has working sources', async ({ request }) => {
  for (const [file, type] of [
    ['/scan2talk-checkin.webm', 'video/webm'],
    ['/scan2talk-checkin.mp4', 'video/mp4'],
    ['/scan2talk-checkin-poster.jpg', 'image/jpeg'],
  ]) {
    const res = await request.get(file, { headers: { Range: 'bytes=0-1023' } })
    expect([200, 206], file).toContain(res.status())
    expect(res.headers()['content-type'], file).toBe(type)
  }
})

test('unknown pages show the not-found page and are kept out of search', async ({ page }) => {
  await guard(page)
  // Not wrapped in the app layout, so there is no #main-content to wait for.
  await page.goto('/this-page-does-not-exist')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
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
