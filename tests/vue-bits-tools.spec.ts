import { expect, test, type Page } from '@playwright/test'

/**
 * The tools page's motion (AGENTS.md: the Vue Bits rules, "a page at rest comes to rest"):
 * - CardSwap (ToolShots.vue): Sift's captures as a deck (Project Updater shows its film,
 *   ToolVideo.vue, tested at the end). One round by itself once in
 *   view, then it rests; it waits under the mouse, with focus in it, off screen, in the
 *   tool that isn't shown, in a hidden tab and under the lightbox; after Next it never moves
 *   by itself again. With reduced motion only Next moves it, at once.
 * - StarBorder (ToolSwitch.vue): a light runs once along the picked tab, then rests.
 * - The two stories (usePlayOnce.ts): played once when they scroll into view; before that
 *   at their first frame, after it at rest, and at rest from the start with reduced motion.
 * The real content is in the prerendered HTML: every capture with its alt text, every step.
 */

/** Blocks third-party requests and collects every same-origin error (as in smoke.spec.ts). */
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

/** Opens a page once the client app has replaced the prerendered HTML. */
async function open(page: Page, route: string) {
  await page.addInitScript(() => {
    sessionStorage.setItem('intro-seen', '1')
    localStorage.setItem('theme', 'light')
  })
  await page.goto(route)
  await expect(page.locator('#main-content')).toBeVisible()
  await page.waitForLoadState('networkidle')
}

test("the prerendered HTML has each tool's film in place of a deck, and the stories at rest", async ({ request }) => {
  const html = await (await request.get('/tools')).text()
  // Both tools show a film: no deck of captures (CardSwap) on the page
  expect(html).not.toMatch(/\bdeck-card\b/)
  for (const tool of ['project-updater', 'sift']) {
    expect(html).toMatch(new RegExp(`<video[^>]*poster="/img/${tool}-tour-poster\\.webp"`))
    expect(html).toContain(`src="/${tool}-tour.mp4"`)
  }
  // The stories' text is there too, at rest
  expect(html.match(/class="flow-step"/g) ?? []).toHaveLength(5)
  expect(html).toContain('PhpStorm')
  expect(html).not.toMatch(/is-armed|is-playing/)
})

test('with reduced motion: no film plays by itself, the stories and the tab are at rest', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = await guard(page)
  await open(page, '/tools')
  // The films: never play by themselves
  const film = page.locator('#project-updater-panel .tool-film video')
  await film.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  expect(await film.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
  await page.getByRole('tab', { name: /Sift/ }).click()
  const siftFilm = page.locator('#sift-panel .tool-film video')
  await siftFilm.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  expect(await siftFilm.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)

  // The stories: their whole picture, scrolled to or not
  for (const tool of ['project-updater', 'sift']) {
    await page.getByRole('tab', { name: new RegExp(tool === 'sift' ? 'Sift' : 'Project Updater') }).click()
    const story = page.locator(`#${tool}-panel .pipeline, #${tool}-panel .merge`)
    await story.scrollIntoViewIfNeeded()
    await expect(story).not.toHaveClass(/is-armed|is-playing/)
    for (const part of await story.locator('.flow-body, .merge-card:not(.merge-ghost), .merge-caption').all()) {
      expect(await part.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    }
  }
  // The tab's light: done at once, gone
  for (const light of await page.locator('[role="tab"] > [aria-hidden="true"]').all()) {
    expect(await light.evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
  }
  expect(errors).toEqual([])
  await context.close()
})

test("the picked tab's light runs once along its edges, then rests; again when the other is picked", async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/tools')
  const lights = (tool: string) => page.locator(`#${tool} > [aria-hidden="true"]`)
  await expect(lights('project-updater')).toHaveCount(2)
  await expect(lights('sift')).toHaveCount(0)
  for (const light of await lights('project-updater').all()) {
    const style = await light.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { name: cs.animationName, count: cs.animationIterationCount, background: cs.backgroundImage }
    })
    expect(style.name).toMatch(/star-movement-(top|bottom)/)
    expect(style.count).toBe('1')
    // In the tool's own colour (indigo), not the published white
    expect(style.background).toContain('rgb(99, 102, 241)')
  }
  // At rest after it: faded out
  await expect.poll(() => lights('project-updater').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
  await page.getByRole('tab', { name: /Sift/ }).click()
  await expect(lights('sift')).toHaveCount(2)
  expect(errors).toEqual([])
})

test('the stories play once when they scroll into view; before, their first frame; after, at rest', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/tools')
  const pipeline = page.locator('#project-updater-panel .pipeline')
  // Below the fold: waiting, its words hidden (not half-faded)
  await expect(pipeline).toHaveClass(/is-armed/)
  expect(await pipeline.locator('.flow-body').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
  await pipeline.scrollIntoViewIfNeeded()
  await expect(pipeline).toHaveClass(/is-playing/)
  // Every step lit by the end (under 2 s)
  await page.waitForTimeout(2000)
  for (const step of await pipeline.locator('.flow-step').all()) {
    expect(await step.locator('.flow-node').evaluate((el) => getComputedStyle(el, '::before').opacity)).toBe('1')
    expect(await step.locator('.flow-body').evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  }
  // Sift's, in the tool that isn't shown: waiting until it is, and scrolled to
  const merge = page.locator('#sift-panel .merge')
  await expect(merge).toHaveClass(/is-armed/)
  await page.getByRole('tab', { name: /Sift/ }).click()
  await expect(merge).toHaveClass(/is-armed/)
  await merge.scrollIntoViewIfNeeded()
  await expect(merge).toHaveClass(/is-playing/)
  await page.waitForTimeout(1600)
  // The copies that folded into Sift are gone again
  for (const ghost of await merge.locator('.merge-ghost').all()) expect(await ghost.evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
  for (const part of await merge.locator('.merge-card:not(.merge-ghost), .merge-plus, .merge-arrow, .merge-caption').all()) {
    expect(await part.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  }
  expect(errors).toEqual([])
})

test.describe("The tools' films (ToolVideo)", () => {
  test.skip(({ isMobile }) => isMobile, 'the phones are in the responsive check')

  test('plays muted only while in view and shown, and waits once the visitor pauses it', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/tools')
    const film = page.locator('#project-updater-panel .tool-film video')
    const paused = () => film.evaluate((v: HTMLVideoElement) => v.paused)
    await film.scrollIntoViewIfNeeded()
    await expect.poll(paused).toBe(false)
    expect(await film.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true)
    // Scrolled away: paused; back: playing
    await page.locator('#project-updater-panel .tool-end').scrollIntoViewIfNeeded()
    await expect.poll(paused).toBe(true)
    await film.scrollIntoViewIfNeeded()
    await expect.poll(paused).toBe(false)
    // The other tool: hidden, so paused
    await page.getByRole('tab', { name: /Sift/ }).click()
    await expect.poll(paused).toBe(true)
    await page.getByRole('tab', { name: /Project Updater/ }).click()
    await film.scrollIntoViewIfNeeded()
    await expect.poll(paused).toBe(false)
    // Paused by the visitor: it stays so, also after scrolling away and back
    await page.getByRole('button', { name: 'Pause the film' }).click()
    await expect.poll(paused).toBe(true)
    await page.locator('#project-updater-panel .tool-end').scrollIntoViewIfNeeded()
    await film.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    expect(await paused()).toBe(true)
    expect(errors).toEqual([])
  })

  test("Sift's plays muted once its tool is picked and in view, and pauses when the other is", async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/tools#sift')
    const film = page.locator('#sift-panel .tool-film video')
    const paused = () => film.evaluate((v: HTMLVideoElement) => v.paused)
    await film.scrollIntoViewIfNeeded()
    await expect.poll(paused).toBe(false)
    expect(await film.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true)
    await page.getByRole('tab', { name: /Project Updater/ }).click()
    await expect.poll(paused).toBe(true)
    expect(errors).toEqual([])
  })
})
