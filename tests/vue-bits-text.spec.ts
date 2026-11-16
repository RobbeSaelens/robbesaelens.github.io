import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { nl } from './routes'

/**
 * The two Vue Bits text effects: the "$ …" line under each page title decrypts as it
 * rises in (TerminalCommand.vue around DecryptedText.vue), and the commit counts count
 * up when they come into view (CountUpNumber.vue around CountUp.vue, in RepoActivity).
 * Either way the real text is in the prerendered HTML, screen readers only ever get the
 * real text, nothing moves, nothing plays with reduced motion, and once it has played
 * the plain text is back.
 */

/** Every page with a "$ …" line, and its command. */
const COMMANDS: [route: string, command: string][] = [
  ['/projects', 'ls ./projects'],
  ['/contact', 'cat ./about-me.md'],
  ['/drupal', 'cat ./drupal-contributions.md'],
  ['/privacy', 'cat ./privacy.md'],
  ['/exultadetail', 'cat ./exulta-project.md'],
  ['/scan2talkdetail', 'cat ./scan2talk-project.md'],
  ['/stablemanagerdetail', 'cat ./stable-manager-project.md'],
  ['/vhsdetail', 'cat ./vhs-project.md'],
]

const stats = JSON.parse(readFileSync(new URL('../src/data/repo-stats.json', import.meta.url), 'utf8')).projects
/** The project pages and the repositories on them (two on Stable Manager). */
const REPOS: [route: string, keys: string[]][] = [
  ['/exultadetail', ['exulta']],
  ['/scan2talkdetail', ['scan2talk']],
  ['/stablemanagerdetail', ['stableManager', 'sharedCosts']],
  ['/vhsdetail', ['vhs']],
]
/** How the site writes numbers in each language (RepoActivity.vue). */
const LOCALE = { en: 'en-GB', nl: 'nl-BE' } as const

/** Third-party requests blocked; every same-origin error collected. */
async function guard(page: Page) {
  const errors: string[] = []
  await page.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort())
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    if (/ERR_FAILED|ERR_BLOCKED|cloudflareinsights/i.test(msg.text())) return
    errors.push(`console: ${msg.text()}`)
  })
  return errors
}

type Frame = {
  t: number
  /** What is on screen: the animated copy while it plays, else the plain text */
  shown: string
  /** What screen readers get: the visually hidden copy while it plays, else the plain text */
  heard: string
  animating: boolean
  width: number
  lineWidth: number
  lineHeight: number
  font: string
}

/**
 * Records, on every change to the page, how the first element matching `selector`
 * looks and what it reads as. Returns a function that fetches the frames so far.
 */
async function record(page: Page, selector: string) {
  await page.addInitScript((sel) => {
    const frames: Frame[] = []
    ;(window as unknown as { __frames: Frame[] }).__frames = frames
    new MutationObserver(() => {
      const el = document.querySelector(sel)
      if (!el) return
      const animated = el.querySelector('[aria-hidden="true"]')
      const line = el.parentElement!.getBoundingClientRect()
      const frame = {
        t: performance.now(),
        shown: (animated ?? el).textContent ?? '',
        heard: (animated ? el.querySelector('.sr-only')?.textContent : el.textContent) ?? '',
        animating: !!animated,
        width: el.getBoundingClientRect().width,
        lineWidth: line.width,
        lineHeight: line.height,
        font: getComputedStyle(animated ?? el).fontFamily,
      }
      const last = frames.at(-1)
      const same = last && (['shown', 'heard', 'animating', 'width', 'lineWidth', 'lineHeight'] as const).every((k) => last[k] === frame[k])
      if (!same) frames.push(frame)
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true })
  }, selector)
  return () => page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames)
}

/** The HTML as served, without Vue's fragment markers: what crawlers read. */
async function served(page: Page, url: string) {
  const html = await (await page.request.get(url)).text()
  return html.replace(/<!--[[\]]-->/g, '')
}

test.describe('the "$ …" line under the page title (DecryptedText)', () => {
  test('the prerendered HTML has the real command, as plain text, in both languages', async ({ page }) => {
    for (const [route, command] of COMMANDS) {
      for (const url of [route, nl(route)]) {
        const html = await served(page, url)
        expect(html, url).toMatch(new RegExp(`<span class="terminal-command"[^>]*>${command.replace(/[.]/g, '\\.')}</span>`))
      }
    }
  })

  for (const [route, command] of COMMANDS.filter(([r]) => ['/privacy', '/projects', '/stablemanagerdetail'].includes(r))) {
    test(`${route}: decrypts once as it rises in, in monospace, without moving anything`, async ({ page }) => {
      const errors = await guard(page)
      const frames = await record(page, '.terminal-command')
      await page.goto(route)
      const line = page.locator('.terminal-command')
      // It plays, and the plain text is back afterwards
      await expect.poll(async () => (await frames()).some((f) => f.animating)).toBe(true)
      await expect.poll(async () => (await frames()).at(-1)?.animating, { timeout: 5000 }).toBe(false)
      await expect(line).toHaveText(command)
      await expect(line.locator('.sr-only, [aria-hidden]')).toHaveCount(0)

      const played = (await frames()).filter((f) => f.animating)
      // Scrambled characters, one for one: never the real text until the end
      expect(played.some((f) => f.shown !== command)).toBe(true)
      for (const f of played) expect(f.shown).toHaveLength(command.length)
      // ...and only on screen: screen readers get the real text at every moment
      for (const f of await frames()) expect(f.heard).toBe(command)
      // Monospace: the scrambled characters take the room of the real ones. From the
      // plain text just before it starts to the plain text after it (each character in
      // its own span rounds to Chrome's 1/64 px layout units: a fraction of a pixel).
      expect(played[0].font).toMatch(/monospace/)
      const all = await frames()
      const around = all.slice(Math.max(0, all.findIndex((f) => f.animating) - 1))
      const spread = (k: 'width' | 'lineWidth' | 'lineHeight') =>
        Math.max(...around.map((f) => f[k])) - Math.min(...around.map((f) => f[k]))
      expect(spread('width'), 'command width').toBeLessThan(1)
      expect(spread('lineWidth'), 'line width').toBeLessThan(1)
      expect(spread('lineHeight'), 'line height').toBe(0)

      // Once per page view: not again on hover or after scrolling back
      const count = (await frames()).length
      await line.hover()
      await page.mouse.wheel(0, 2000)
      await page.waitForTimeout(300)
      await page.mouse.wheel(0, -4000)
      await page.waitForTimeout(800)
      expect((await frames()).slice(count).some((f) => f.animating)).toBe(false)
      expect(errors).toEqual([])
    })
  }

  test('waits for the intro: it starts when the line rises in', async ({ page }) => {
    const errors = await guard(page)
    // Hold the page as if the intro were still playing (html without intro-done)
    // (<html> may not exist yet when this runs: watch the document.)
    await page.addInitScript(() => {
      const hold = new MutationObserver(() => {
        const html = document.documentElement
        if (!html?.classList.contains('intro-done')) return
        html.classList.remove('intro-done')
        hold.disconnect()
      })
      hold.observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] })
    })
    const frames = await record(page, '.terminal-command')
    await page.goto('/privacy')
    await expect(page.locator('#main-content')).toBeVisible()
    await page.waitForTimeout(1500)
    expect((await frames()).some((f) => f.animating), 'nothing plays during the intro').toBe(false)
    await expect(page.locator('.terminal-command')).toHaveText('cat ./privacy.md')

    const done = await page.evaluate(() => {
      document.documentElement.classList.add('intro-done')
      return performance.now()
    })
    await expect.poll(async () => (await frames()).some((f) => f.animating)).toBe(true)
    const start = (await frames()).find((f) => f.animating)!.t
    // The line rises after the title (--i: 1, styles.css: 150 ms)
    expect(start - done).toBeGreaterThan(120)
    await expect.poll(async () => (await frames()).at(-1)?.animating, { timeout: 5000 }).toBe(false)
    await expect(page.locator('.terminal-command')).toHaveText('cat ./privacy.md')
    expect(errors).toEqual([])
  })
})

test.describe('the commit counts (CountUp)', () => {
  test('the prerendered HTML has the final numbers, written the site\'s way, in both languages', async ({ page }) => {
    for (const [route, keys] of REPOS) {
      for (const lang of ['en', 'nl'] as const) {
        const url = lang === 'nl' ? nl(route) : route
        const html = await served(page, url)
        for (const key of keys) {
          for (const n of [stats[key].commits, stats[key].commitsLast30Days] as number[]) {
            const text = n.toLocaleString(LOCALE[lang])
            expect(html, `${url} ${key} ${n}`).toMatch(new RegExp(`<dd[^>]*><span[^>]*>${text.replace(/[.]/g, '\\.')}</span></dd>`))
          }
        }
      }
    }
  })

  for (const lang of ['en', 'nl'] as const) {
    test(`count up when they come into view, read out as the final number (${lang})`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      const errors = await guard(page)
      const frames = await record(page, '.repo--inline .repo-number dd')
      const final = (stats.exulta.commits as number).toLocaleString(LOCALE[lang])
      await page.goto(lang === 'nl' ? nl('/exultadetail') : '/exultadetail')
      await expect(page.locator('#main-content')).toBeVisible()
      await page.waitForTimeout(1000)

      // Below the fold: waiting at 0, the final number for screen readers
      const dd = page.locator('.repo--inline .repo-number dd').first()
      await expect(dd.locator('[aria-hidden="true"]')).toHaveText('0')
      await expect(dd.locator('.sr-only')).toHaveText(final)

      await dd.scrollIntoViewIfNeeded()
      await expect(dd).toHaveText(final, { timeout: 10_000 })
      await expect(dd.locator('.sr-only, [aria-hidden]')).toHaveCount(0)

      const played = (await frames()).filter((f) => f.animating)
      const shown = played.map((f) => Number(f.shown.replace(/\D/g, '')))
      expect(shown.some((n) => n > 0 && n < stats.exulta.commits), 'counted through the numbers in between').toBe(true)
      expect(shown, 'counts up, never down').toEqual([...shown].sort((a, b) => a - b))
      for (const f of await frames()) expect(f.heard).toBe(final)
      expect(errors).toEqual([])
    })
  }

  test('the side panel on wide screens counts too, after it has slid in', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const errors = await guard(page)
    await page.goto('/exultadetail')
    const dd = page.locator('.repo--aside .repo-number dd')
    await expect(dd.first()).toHaveText(stats.exulta.commits.toLocaleString('en-GB'), { timeout: 10_000 })
    await expect(dd.nth(1)).toHaveText(stats.exulta.commitsLast30Days.toLocaleString('en-GB'), { timeout: 10_000 })
    await expect(dd.locator('.sr-only, [aria-hidden]')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

test('with reduced motion nothing scrambles or counts: the final text at once', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  const errors = await guard(page)
  const frames = await record(page, '.terminal-command')
  await page.goto('/exultadetail')
  await expect(page.locator('#main-content')).toBeVisible()
  await expect(page.locator('.terminal-command')).toHaveText('cat ./exulta-project.md')
  // The counts: final before they are ever scrolled to
  const dd = page.locator('.repo--inline .repo-number dd')
  await expect(dd.first()).toHaveText(stats.exulta.commits.toLocaleString('en-GB'))
  await expect(dd.nth(1)).toHaveText(stats.exulta.commitsLast30Days.toLocaleString('en-GB'))
  await page.waitForTimeout(1500)
  await dd.first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  expect((await frames()).some((f) => f.animating)).toBe(false)
  await expect(page.locator('.terminal-command [aria-hidden], .repo-number dd [aria-hidden]')).toHaveCount(0)
  expect(errors).toEqual([])
  await context.close()
})
