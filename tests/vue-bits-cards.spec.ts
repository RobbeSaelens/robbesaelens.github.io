import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * The Vue Bits effects on cards and screenshots add an effect and change nothing else:
 * - GlowCard (SpotlightCard): a teal glow under the text of the project pages' feature
 *   cards, the Drupal panels and the about page's text cards, following the mouse;
 * - ShotGlare (GlareHover): a glass sweep inside the project pages' screenshot buttons;
 * - PhotoDither (DitherVeil): the about photos as two-colour pixels.
 * The cards and buttons keep their tags, classes, text and clicks, the effects only
 * follow a mouse (no touch, no reduced motion), and the about photos stay real images.
 * The headless browser has no GPU, so PhotoDither never draws here: these tests check
 * that it stays out of the way (AGENTS.md says how to see it).
 */

const DETAILS = ['/exultadetail', '/scan2talkdetail', '/stablemanagerdetail', '/vhsdetail']

/** The glow colours (--color-spotlight in terminal-theme.css), as computed. */
const GLOW = { light: 'rgba(13, 148, 136, 0.14)', dark: 'rgba(45, 212, 191, 0.2)' }

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
  page.on('response', (res) => {
    if (res.url().startsWith('http://localhost') && res.status() >= 400) {
      errors.push(`HTTP ${res.status()} ${res.url()}`)
    }
  })
  return errors
}

/** Opens a page once the client app has replaced the prerendered HTML. */
async function open(page: Page, route: string, theme: 'light' | 'dark' = 'light') {
  await page.addInitScript((t) => {
    sessionStorage.setItem('intro-seen', '1')
    localStorage.setItem('theme', t)
  }, theme)
  await page.goto(route)
  await expect(page.locator('#main-content')).toBeVisible()
  await page.waitForLoadState('networkidle')
}

/** Scrolls a card into view and waits until it has risen in and stands still. */
async function settle(card: Locator) {
  await card.scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      card.evaluate(
        (e) => getComputedStyle(e).opacity === '1' && e.getAnimations().every((a) => a.playState === 'finished'),
      ),
    )
    .toBe(true)
}

/** The glow layer of a card: SpotlightCard's first child. */
const glowOf = (card: Locator) => card.locator(':scope > div').first()

/** The glare layer of a screenshot button: GlareHover's first child. */
const glareOf = (button: Locator) => button.locator(':scope > span > span').first()

const style = (el: Locator, property: string) =>
  el.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), property)

for (const route of DETAILS) {
  test.describe(`${route}`, () => {
    test('feature cards keep their markup, with the glow layer under their text', async ({ page, request }) => {
      const errors = await guard(page)
      await open(page, route)
      const cards = page.locator('.feature-card')
      const count = await cards.count()
      expect(count).toBeGreaterThan(0)
      for (const card of await cards.all()) {
        expect(await card.evaluate((e) => e.tagName)).toBe('ARTICLE')
        await expect(card).toHaveClass(/\breveal\b/)
        await expect(card.locator('.feature-title')).not.toBeEmpty()
        await expect(card.locator('.feature-text')).not.toBeEmpty()
        // The glow lies over the card's background and under its text
        expect(await style(card, 'isolation')).toBe('isolate')
        const glow = glowOf(card)
        expect(await style(glow, 'z-index')).toBe('-1')
        expect(await style(glow, 'pointer-events')).toBe('none')
        expect(await style(glow, 'opacity')).toBe('0')
      }
      // The look comes from the page, not from SpotlightCard
      const first = cards.first()
      expect(await style(first, 'border-top-left-radius')).toBe('16px')
      expect(await style(first, 'padding-top')).toBe('24px')

      // Prerendered: the same cards, as articles
      const html = await (await request.get(route)).text()
      expect(html.match(/<article class="[^"]*\bfeature-card reveal\b[^"]*"/g) ?? []).toHaveLength(count)
      expect(errors).toEqual([])
    })

    test('screenshot buttons look and click as before, with the glare inside', async ({ page, request }) => {
      const errors = await guard(page)
      await open(page, route)
      const buttons = page.locator('button.shot')
      const count = await buttons.count()
      expect(count).toBeGreaterThanOrEqual(2)

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        await button.scrollIntoViewIfNeeded()
        await expect(button).toHaveAttribute('aria-label', /^Open .+ screenshot full screen$/)
        await expect(button.locator('img')).toHaveAttribute('alt', /.+/)
        // GlareHover's own box is undone: a plain block filling the button, no border,
        // the button's cursor, the screenshot as wide as before
        const box = button.locator(':scope > span')
        await expect(box).toHaveCount(1)
        const layout = await button.evaluate((b) => {
          const inner = b.firstElementChild as HTMLElement
          const cs = getComputedStyle(b)
          const content = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
          const is = getComputedStyle(inner)
          return {
            display: is.display,
            border: is.borderTopWidth,
            cursor: is.cursor === cs.cursor,
            background: is.backgroundColor,
            innerWidth: inner.getBoundingClientRect().width,
            content,
            imgWidth: b.querySelector('img')!.getBoundingClientRect().width,
          }
        })
        expect(layout.display).toBe('block')
        expect(layout.border).toBe('0px')
        expect(layout.cursor, "the button's cursor").toBe(true)
        expect(layout.background).toBe('rgba(0, 0, 0, 0)')
        expect(Math.abs(layout.innerWidth - layout.content)).toBeLessThanOrEqual(1)
        expect(Math.abs(layout.imgWidth - layout.content)).toBeLessThanOrEqual(1)

        // Still opens the lightbox at its own screenshot
        await button.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog.locator('.lightbox-caption')).toContainText(`${i + 1} / ${count}`)
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
      }

      // Prerendered: no <div> inside a <button>, which may only hold phrasing content
      const html = await (await request.get(route)).text()
      const inside = [...html.matchAll(/<button[^>]*class="[^"]*\bshot\b[^>]*>([\s\S]*?)<\/button>/g)].map((m) => m[1])
      expect(inside).toHaveLength(count)
      for (const content of inside) expect(content).not.toContain('<div')
      expect(errors).toEqual([])
    })
  })
}

test.describe('with a mouse', () => {
  test.skip(({ isMobile }) => isMobile, 'mouse only')

  for (const theme of ['light', 'dark'] as const) {
    test(`a feature card glows teal where the mouse is, and stops when it leaves (${theme})`, async ({ page }) => {
      const errors = await guard(page)
      await open(page, '/exultadetail', theme)
      const card = page.locator('.feature-card').nth(1)
      await settle(card)
      const glow = glowOf(card)

      await card.hover({ position: { x: 60, y: 40 } })
      await expect.poll(() => style(glow, 'opacity')).toBe('0.6')
      const background = await style(glow, 'background-image')
      expect(background).toContain(GLOW[theme])
      const [, x, y] = background.match(/circle at ([\d.]+)px ([\d.]+)px/) ?? []
      expect(Math.abs(Number(x) - 60)).toBeLessThanOrEqual(2)
      expect(Math.abs(Number(y) - 40)).toBeLessThanOrEqual(6) // the card rises 4px on hover

      await page.mouse.move(2, 2)
      await expect.poll(() => style(glow, 'opacity')).toBe('0')
      expect(errors).toEqual([])
    })
  }

  test('a screenshot gets one glass sweep when the mouse enters it', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/vhsdetail')
    const button = page.locator('button.shot-desktop')
    const glare = glareOf(button)
    expect(await style(glare, 'background-image')).toContain('rgba(255, 255, 255, 0.3)')
    expect(await glare.evaluate((e) => e.style.backgroundPosition)).toMatch(/^-100% -100%/)
    await button.hover()
    expect(await glare.evaluate((e) => e.style.backgroundPosition)).toMatch(/^100% 100%/)
    // Once: back without a sweep when the mouse leaves
    await page.mouse.move(2, 2)
    expect(await glare.evaluate((e) => e.style.backgroundPosition)).toMatch(/^-100% -100%/)
    expect(await glare.evaluate((e) => e.style.transition)).toMatch(/none/)
    expect(errors).toEqual([])
  })

  test('the Drupal panels stay labelled sections, and glow too', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/drupal')
    const panels = page.locator('.panel')
    expect(await panels.count()).toBe(4)
    for (const panel of await panels.all()) {
      expect(await panel.evaluate((e) => e.tagName)).toBe('SECTION')
      await expect(panel).toHaveClass(/\breveal\b/)
      await expect(panel).toHaveAttribute('aria-labelledby', /^drupal-\w+-title$/)
    }
    await expect(page.getByRole('region', { name: 'Merge requests' })).toBeVisible()

    const panel = panels.first()
    await settle(panel)
    await panel.hover({ position: { x: 100, y: 30 } })
    await expect.poll(() => style(glowOf(panel), 'opacity')).toBe('0.6')
    expect(await style(glowOf(panel), 'background-image')).toContain(GLOW.light)
    expect(errors).toEqual([])
  })

  test('the about page: text cards glow, photo cards keep their photo', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/contact')
    for (const name of ['education', 'experience']) {
      const card = page.locator(`.card-${name}`)
      expect(await card.evaluate((e) => e.tagName)).toBe('ARTICLE')
      await expect(card).toHaveClass(/\bhero-in\b.*\babout-card--text\b/)
      await settle(card)
      await card.hover({ position: { x: 80, y: 60 } })
      await expect.poll(() => style(glowOf(card), 'opacity')).toBe('0.6')
    }
    // Without a GPU (headless Chrome) the photos stay plain images: no canvas over them
    for (const card of await page.locator('.about-card--photo').all()) {
      await expect(card.locator('img.card-image')).toBeVisible()
      await expect(card.locator('img.card-image')).toHaveAttribute('alt', /^Robbe Saelens /)
      await expect(card.locator('canvas')).toHaveCount(0)
      await expect(card.locator('.card-title')).toBeVisible()
    }
    expect(errors).toEqual([])
  })

  test('no glow and no sweep with reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = await guard(page)
    await open(page, '/exultadetail')
    const card = page.locator('.feature-card').first()
    await card.scrollIntoViewIfNeeded()
    await card.hover()
    await page.waitForTimeout(300)
    expect(await style(glowOf(card), 'background-image')).not.toContain('rgba(13, 148, 136')
    expect(await style(glareOf(page.locator('button.shot-desktop')), 'background-image')).toContain('rgba(255, 255, 255, 0)')
    expect(errors).toEqual([])
    await context.close()
  })
})

test.describe('on a touch screen', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch only')

  test('a tap leaves no glow on a card and no glare on a screenshot', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/scan2talkdetail')
    const card = page.locator('.feature-card').first()
    await settle(card)
    await card.tap()
    await page.waitForTimeout(700)
    expect(await style(glowOf(card), 'opacity')).toBe('0')
    expect(await style(glowOf(card), 'background-image')).not.toContain('rgba(13, 148, 136')
    expect(await style(glareOf(page.locator('button.shot-phone')), 'background-image')).toContain('rgba(255, 255, 255, 0)')
    expect(errors).toEqual([])
  })

  test('the about photos stay plain images, so the cards still swipe', async ({ page }) => {
    const errors = await guard(page)
    await open(page, '/contact')
    await expect(page.locator('.about-card--photo canvas')).toHaveCount(0)
    await expect(page.locator('.about-card--photo img.card-image')).toHaveCount(2)
    expect(errors).toEqual([])
  })
})

test('the about photos are real images with alt text in the prerendered HTML', async ({ request }) => {
  for (const url of ['/contact', '/nl/contact']) {
    const html = await (await request.get(url)).text()
    expect(html, url).toMatch(/<img src="\/about\.jpg" alt="Robbe Saelens teaching equestrian sports"/)
    expect(html, url).toMatch(/<img src="\/horse\.jpg" alt="Robbe Saelens show jumping at an equestrian competition"/)
    expect(html, url).not.toContain('<canvas')
    // The text cards stay articles, with their entrance
    expect(html.match(/<article class="[^"]*\bhero-in about-card about-card--text\b/g) ?? [], url).toHaveLength(2)
  }
})
