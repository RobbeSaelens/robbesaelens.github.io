import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * The tools page's motion (AGENTS.md: the Vue Bits rules, "a page at rest comes to rest"):
 * - CardSwap (ToolShots.vue): each tool's captures as a deck. One round by itself once in
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

const deckOf = (page: Page, tool: string) => page.locator(`#${tool}-panel .tool-deck`)
const frontOf = (deck: Locator) => deck.getAttribute('data-front')

test('the prerendered HTML has every capture in its deck, in its place, as a picture with alt text', async ({ request }) => {
  const html = await (await request.get('/tools')).text()
  const cards = [...html.matchAll(/<div[^>]*class="[^"]*\bdeck-card\b[^"]*"[^>]*style="--slot:(\d)[^"]*"[^>]*>([\s\S]*?)<\/button>/g)]
  expect(cards).toHaveLength(8)
  expect(cards.map((m) => Number(m[1]))).toEqual([0, 1, 2, 3, 0, 1, 2, 3])
  for (const [, , card] of cards) {
    expect(card).toMatch(/<button[^>]*class="[^"]*\bshot\b/)
    expect(card).toMatch(/aria-label="Open .+ screenshot full screen"/)
    expect(card).toMatch(/<img[^>]*alt="[^"]{20,}"/)
    expect(card).toMatch(/<source type="image\/avif"/)
    // No <div> inside a <button>, which may only hold phrasing content
    expect(card.slice(card.indexOf('<button'))).not.toContain('<div')
  }
  // The stories' text is there too, at rest
  expect(html.match(/class="flow-step"/g) ?? []).toHaveLength(5)
  expect(html).toContain('PhpStorm')
  expect(html).not.toMatch(/is-armed|is-playing/)
})

test.describe('the deck of captures (CardSwap)', () => {
  test.skip(({ isMobile }) => isMobile, 'with a mouse; the phones are in the responsive check')

  test('comes forward by itself once in view: one round, then it rests', async ({ page }) => {
    const errors = await guard(page)
    await page.clock.install()
    await open(page, '/tools')
    const deck = deckOf(page, 'project-updater')
    await expect(deck).toHaveAttribute('data-autoplay', 'on')
    expect(await frontOf(deck)).toBe('0')

    // The first swap a moment after it comes into view, then one every few seconds
    await page.clock.runFor(1500)
    expect(await frontOf(deck)).toBe('0')
    await page.clock.runFor(1500)
    await expect(deck).toHaveAttribute('data-front', '1')
    for (const next of ['2', '3', '0']) {
      await page.clock.runFor(3800)
      await expect(deck).toHaveAttribute('data-front', next)
    }
    // Back at the first: it rests, and stays at rest
    await expect(deck).toHaveAttribute('data-autoplay', 'off')
    await page.clock.runFor(20_000)
    await expect(deck).toHaveAttribute('data-front', '0')
    expect(errors).toEqual([])
  })

  test('waits under the mouse and with the lightbox open; after Next it never moves by itself', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/tools')
    const deck = deckOf(page, 'project-updater')
    await expect(deck).toHaveAttribute('data-autoplay', 'on')
    await deck.locator('.deck-stage').hover()
    await expect(deck).toHaveAttribute('data-autoplay', 'off')
    await page.waitForTimeout(3000)
    expect(await frontOf(deck)).toBe('0')
    await page.mouse.move(5, 300)
    await expect(deck).toHaveAttribute('data-autoplay', 'on')

    // Under the lightbox
    await deck.locator('.deck-shot:not([tabindex="-1"])').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(deck).toHaveAttribute('data-autoplay', 'off')
    await page.keyboard.press('Escape')

    // Next: the visitor takes over, for good
    await page.mouse.move(5, 300)
    await deck.getByRole('button', { name: 'Next screenshot' }).click()
    await expect(deck).toHaveAttribute('data-front', '1')
    await expect(deck).toHaveAttribute('data-autoplay', 'off')
    await page.mouse.move(5, 300)
    await page.waitForTimeout(4500)
    expect(await frontOf(deck)).toBe('1')
    // The new front card is the tab stop, and opens its own capture
    await expect(deck.locator('.deck-shot:not([tabindex="-1"])')).toHaveAccessibleName(/updates waiting in my portfolio/)
    expect(errors).toEqual([])
  })

  test('nothing moves off screen: a deck scrolled away, the hidden tool, a hidden tab', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/tools')
    const updater = deckOf(page, 'project-updater')
    await expect(updater).toHaveAttribute('data-autoplay', 'on')
    // The other tool's deck: not shown, so still
    await expect(deckOf(page, 'sift')).toHaveAttribute('data-autoplay', 'off')
    // Scrolled away
    await page.locator('#project-updater-panel .tool-end').scrollIntoViewIfNeeded()
    await expect(updater).toHaveAttribute('data-autoplay', 'off')
    await page.evaluate(() => scrollTo(0, 0))
    await expect(updater).toHaveAttribute('data-autoplay', 'on')
    // A hidden tab
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(updater).toHaveAttribute('data-autoplay', 'off')
    expect(errors).toEqual([])
  })

  test('Next from the keyboard puts the cards in their places at once', async ({ page }) => {
    await guard(page)
    await open(page, '/tools')
    const deck = deckOf(page, 'project-updater')
    await deck.getByRole('button', { name: 'Next screenshot' }).focus()
    await page.keyboard.press('Enter')
    // No timeline: already the next in front (CardSwap's swap(true))
    expect(await frontOf(deck)).toBe('1')
    await expect(deck.locator('.deck-label')).toHaveText('the updates waiting in my portfolio')
  })
})

test('with reduced motion: no deck moves by itself, Next is at once, the stories and the tab are at rest', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = await guard(page)
  await open(page, '/tools')
  const deck = deckOf(page, 'project-updater')
  await expect(deck).toHaveAttribute('data-autoplay', 'off')
  await page.waitForTimeout(3000)
  expect(await frontOf(deck)).toBe('0')
  await deck.getByRole('button', { name: 'Next screenshot' }).click()
  expect(await frontOf(deck)).toBe('1')

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
