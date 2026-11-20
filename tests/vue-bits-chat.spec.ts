import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type BrowserContextOptions, type Locator, type Page } from '@playwright/test'

/**
 * Two Vue Bits components around the chat: LatticeLoader as its thinking line
 * (ChatThinking.vue), and Magnet on the chat button and the home page's
 * "Say hello" (ButtonMagnet.vue). The AI is faked and holds its answer until
 * the test lets it go.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
const ANSWER = 'Robbe builds websites.'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function setup(page: Page) {
  const errors: string[] = []
  await page.addInitScript(() => sessionStorage.setItem('intro-seen', '1'))
  await page.route(/^https?:\/\/(?!localhost[:/]|chat\.invalid)/, (r) => r.abort())
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

/** Fakes the AI worker; it answers once the returned function is called. */
async function heldAi(page: Page) {
  let release!: () => void
  const gate = new Promise<void>((r) => (release = r))
  await page.route('https://chat.invalid/chat', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    await gate
    await route.fulfill({ status: 200, json: { reply: ANSWER, suggestions: [] }, headers: CORS })
  })
  return release
}

async function openChat(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.locator('#main-content')).toBeVisible()
  await page.locator('.chatbot-fab').click()
  await expect(page.locator('.chatbot-window')).toBeVisible()
  // The welcome line types in first (no time above it: it answers nothing).
  await expect(page.locator('.chat-typing')).toHaveCount(0)
  await expect(page.locator('.msg--bot')).toHaveCount(1)
  await expect(page.locator('.msg--bot .ll-root')).toHaveCount(0)
}

async function ask(page: Page, question: string) {
  await page.locator('#chat-input').fill(question)
  await page.locator('#chat-input').press('Enter')
}

/** The running loader in the typing row, and the done one above the last answer. */
const running = (page: Page) => page.locator('.chat-typing .ll-root')
const done = (page: Page) => page.locator('.msg--bot').last().locator('.ll-root')
/** The loader's timer, in seconds. */
const seconds = async (loader: Locator) => parseFloat(await loader.locator('.tabular-nums').innerText())
const label = (loader: Locator) => loader.locator('[data-active]')
const cells = (loader: Locator) => loader.locator('.ll-run > span')

function report(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.map((v) => `${v.impact} ${v.id}: ${v.help} ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
}

test.describe('thinking line (LatticeLoader)', () => {
  for (const [path, thinking, answered] of [
    ['/', 'Thinking', 'Answered in'],
    ['/nl', 'Nadenken', 'Beantwoord in'],
  ]) {
    test(`pulses with a running timer, then turns into a check with the time (${path})`, async ({ page }) => {
      const errors = await setup(page)
      const release = await heldAi(page)
      await openChat(page, path)
      await ask(page, 'What does Robbe build?')

      const loader = running(page)
      await expect(loader).toHaveAttribute('data-status', 'working')
      await expect(label(loader)).toHaveText(thinking)
      await expect(loader.locator('.tabular-nums')).toHaveText(/^\d+\.\ds$/)
      await expect.poll(() => seconds(loader), { message: 'the timer runs' }).toBeGreaterThanOrEqual(0.5)
      // A 3×3 grid, every dot pulsing, in the chat's teal
      await expect(cells(loader)).toHaveCount(9)
      const pulsing = await cells(loader).evaluateAll(
        (els) => els.filter((e) => e.getAnimations().some((a) => a.playState === 'running')).length,
      )
      expect(pulsing).toBe(9)
      expect(await cells(loader).first().evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(94, 234, 212)')
      // The site's own easing for the pulse (UnoCSS would leave it at "ease")
      expect(await cells(loader).first().evaluate((e) => getComputedStyle(e).animationTimingFunction)).toBe(
        'cubic-bezier(0.77, 0, 0.175, 1)',
      )

      release()
      await expect(page.locator('.chat-typing')).toHaveCount(0)
      await expect(page.locator('.msg--bot')).toHaveCount(2)
      await expect(page.locator('.msg--bot').last()).toContainText(ANSWER)
      // The answer opens with the line, done: a check of four dots and the time it took
      const check = done(page)
      await expect(check).toHaveAttribute('data-status', 'done')
      await expect(label(check)).toHaveText(answered)
      await expect(check.locator('.ll-mark [data-on]')).toHaveCount(4)
      await expect.poll(() => check.locator('.ll-mark').evaluate((e) => getComputedStyle(e).opacity)).toBe('1')
      await expect.poll(() => check.locator('.ll-run').evaluate((e) => getComputedStyle(e).opacity)).toBe('0')
      expect(await seconds(check)).toBeGreaterThanOrEqual(0.5)
      expect(errors).toEqual([])
    })
  }

  test('screen readers hear the answer once, and nothing of the loader; axe passes', async ({ page }) => {
    await setup(page)
    const release = await heldAi(page)
    await openChat(page)
    // The conversation's log (role="log", polite) is the one live region: the loader sits
    // outside it, aria-hidden, and adds no role="status" of its own; the chips too.
    const body = page.getByRole('log')
    await expect(page.locator('.chatbot-window [aria-live], .chatbot-window [role="log"]')).toHaveCount(1)
    await expect(body).toHaveCount(1)
    await ask(page, 'What does Robbe build?')
    await expect(running(page)).toBeVisible()
    await expect(page.locator('.chatbot-window').getByRole('status')).toHaveCount(0)
    expect(await body.ariaSnapshot()).not.toMatch(/Thinking|in progress/)
    expect(await page.locator('.chat-body').ariaSnapshot()).not.toMatch(/Thinking|in progress/)
    await page.waitForTimeout(400) // the row's own fade-in
    let { violations } = await new AxeBuilder({ page }).withTags(TAGS).include('.chatbot-root').analyze()
    expect(report(violations), 'while thinking').toEqual([])

    release()
    await expect(done(page)).toHaveAttribute('data-status', 'done')
    await expect(page.locator('.chatbot-window').getByRole('status')).toHaveCount(0)
    const tree = await body.ariaSnapshot()
    expect(tree).toContain(ANSWER)
    expect(tree).not.toMatch(/Answered|seconds|\d\.\ds/)
    await page.waitForTimeout(600) // the answer's fade-in and the check's cross-fade
    ;({ violations } = await new AxeBuilder({ page }).withTags(TAGS).include('.chatbot-root').analyze())
    expect(report(violations), 'after the answer').toEqual([])
  })

  test('with reduced motion the dots hold still, and the timer still counts', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await setup(page)
    const release = await heldAi(page)
    await openChat(page)
    await ask(page, 'What does Robbe build?')

    const loader = running(page)
    await expect(cells(loader)).toHaveCount(9)
    await expect.poll(() => seconds(loader)).toBeGreaterThanOrEqual(0.3)
    const animations = await cells(loader).evaluateAll((els) => els.flatMap((e) => e.getAnimations()).length)
    expect(animations).toBe(0)
    expect(await cells(loader).evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity))).toEqual(Array(9).fill('0.6'))

    release()
    await expect(done(page)).toHaveAttribute('data-status', 'done')
    await expect(done(page).locator('.ll-mark [data-on]')).toHaveCount(4)
    await context.close()
  })
})

test.describe('Magnet', () => {
  /** The element Magnet moves, around the given button. */
  const mover = (page: Page, button: Locator) => page.locator('.button-magnet', { has: button }).locator(':scope > div')
  /**
   * Where the button is at rest: Magnet's own wrapper, which nothing moves (the
   * chat button scales in on load and lifts on hover, so its own box can be off).
   */
  const rest = async (page: Page, button: Locator) =>
    (await page.locator('.button-magnet', { has: button }).boundingBox())!
  /** How far Magnet has moved it, [x, y] in px (where it is heading: the transition aside). */
  const pull = (moving: Locator) =>
    moving.evaluate((e) => {
      const m = /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(e.style.transform)
      return m ? [Number(m[1]), Number(m[2])] : [NaN, NaN]
    })
  const fab = (page: Page) => page.locator('.chatbot-fab')
  const hello = (page: Page) => page.locator('.hero-btn--primary')

  async function home(page: Page) {
    await setup(page)
    await page.goto('/')
    await expect(page.locator('#main-content')).toBeVisible()
    await page.waitForLoadState('networkidle')
  }

  test('the chat button and "Say hello" lean towards a mouse close by, and come back', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse only')
    await home(page)
    const view = page.viewportSize()!

    for (const button of [fab(page), hello(page)]) {
      await button.scrollIntoViewIfNeeded()
      const box = await rest(page, button)
      const moving = mover(page, button)
      expect(await pull(moving)).toEqual([0, 0])
      // Just above and left of it, within reach: pulled up and left
      await page.mouse.move(box.x - 6, box.y - 6)
      await expect.poll(async () => (await pull(moving)).every((v) => v < 0)).toBe(true)
      // Far away (the top of the screen): back in place
      await page.mouse.move(view.width / 2, 4)
      await expect.poll(() => pull(moving)).toEqual([0, 0])
    }
  })

  test('"Say hello" never reaches the button next to it', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse only')
    await home(page)
    const next = page.locator('.hero-btn--ghost')
    const box = await rest(page, hello(page))
    const gap = (await next.boundingBox())!.x - (box.x + box.width)
    // The furthest right it can be pulled: the mouse at the end of its reach, in the gap
    await page.mouse.move(box.x + box.width + gap - 1, box.y + box.height / 2)
    await expect.poll(async () => (await pull(mover(page, hello(page))))[0]).toBeGreaterThan(0)
    const [x] = await pull(mover(page, hello(page)))
    expect(x).toBeLessThan(gap)
  })

  test('in the corner the chat button stays on screen, and holds still while the chat is open', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse only')
    await home(page)
    const view = page.viewportSize()!
    const box = await rest(page, fab(page))
    const moving = mover(page, fab(page))
    // The mouse towards the screen's corner, at the end of its reach (16px past its
    // edges): pulled as far as it goes, but not off screen
    const reach = 15
    await page.mouse.move(
      Math.min(view.width - 1, box.x + box.width + reach),
      Math.min(view.height - 1, box.y + box.height + reach),
    )
    await expect.poll(async () => (await pull(moving)).every((v) => v > 0)).toBe(true)
    const [x, y] = await pull(moving)
    expect(box.x + box.width + x).toBeLessThanOrEqual(view.width)
    expect(box.y + box.height + y).toBeLessThanOrEqual(view.height)
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(sideways).toBeLessThanOrEqual(1)

    // Pulled left as far as it goes, it stays clear of the footer's contact links
    await page.mouse.move(box.x - reach, box.y + box.height / 2)
    await expect.poll(async () => (await pull(moving))[0]).toBeLessThan(0)
    const [left] = await pull(moving)
    const links = await page.locator('footer a').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right))
    expect(box.x + left).toBeGreaterThan(Math.max(...links))

    // The button itself is as it was: its name, its click, its focus outline
    await page.mouse.move(view.width / 2, view.height / 2)
    await expect.poll(() => pull(moving)).toEqual([0, 0])
    await expect(fab(page)).toHaveAccessibleName('Open AI chat')
    await fab(page).focus()
    expect(await fab(page).evaluate((e) => getComputedStyle(e).outline)).toMatch(/solid 2px|2px solid/)
    await fab(page).click()
    await expect(page.locator('.chatbot-window')).toBeVisible()
    await expect(fab(page)).toHaveAccessibleName('Close AI chat')
    // Open, it is the close button right under the send button: it stays put
    await page.mouse.move(box.x - 6, box.y - 6)
    await page.waitForTimeout(200)
    expect(await pull(moving)).toEqual([0, 0])
  })

  async function holdsStill(browser: Browser, options: BrowserContextOptions) {
    const context = await browser.newContext(options)
    const page = await context.newPage()
    await home(page)
    for (const button of [fab(page), hello(page)]) {
      await button.scrollIntoViewIfNeeded()
      const box = await rest(page, button)
      await page.mouse.move(box.x - 6, box.y - 6)
      await page.waitForTimeout(150)
      expect(await pull(mover(page, button))).toEqual([0, 0])
    }
    await context.close()
  }

  test('holds still with reduced motion', async ({ browser }) => {
    await holdsStill(browser, { reducedMotion: 'reduce' })
  })

  test('holds still on a touch screen', async ({ browser }) => {
    await holdsStill(browser, { hasTouch: true, isMobile: true, viewport: { width: 768, height: 1024 } })
  })

  test('each magnet listens to the mouse only while its button is on the page', async ({ page }) => {
    // Counts the window's mousemove listeners: only Magnet adds them.
    await page.addInitScript(() => {
      const live = new Set<unknown>()
      const add = window.addEventListener.bind(window)
      const remove = window.removeEventListener.bind(window)
      window.addEventListener = ((type: string, fn: EventListener, options?: AddEventListenerOptions) => {
        if (type === 'mousemove') live.add(fn)
        return add(type, fn, options)
      }) as typeof window.addEventListener
      window.removeEventListener = ((type: string, fn: EventListener, options?: EventListenerOptions) => {
        if (type === 'mousemove') live.delete(fn)
        return remove(type, fn, options)
      }) as typeof window.removeEventListener
      ;(window as unknown as { mousemoveListeners: Set<unknown> }).mousemoveListeners = live
    })
    const listeners = () => page.evaluate(() => (window as unknown as { mousemoveListeners: Set<unknown> }).mousemoveListeners.size)
    await home(page)
    await expect.poll(listeners, { message: 'chat button and Say hello' }).toBe(2)
    await page.locator('#main-content a[href="/projects"]').first().click()
    await expect(page).toHaveURL(/\/projects$/)
    await expect.poll(listeners, { message: 'the chat button only' }).toBe(1)
  })
})
