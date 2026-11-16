import { expect, test } from '@playwright/test'
import { FIT_ROUTES, nl, ROUTES } from './routes'
import { measureCurrentSlide } from './slides'

/**
 * Responsive check: every page at every breakpoint that matters, plus dark mode
 * on a phone and a laptop. Fails on sideways scrolling, and on vertical scrolling
 * for one-screen pages. Each case also saves a full-page screenshot to
 * test-results/responsive/<page>/<size>.png: look through them after a frontend
 * change, the assertions can't judge whether a layout looks right.
 *
 * Run with `npm run test:responsive` (see AGENTS.md).
 */
// The first seven are the sizes in AGENTS.md; the last three are where things run
// out of room (and caught real breakage: hidden about text, collapsed project slides).
const BREAKPOINTS = [
  { name: 'phone-small', width: 360, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop-small', width: 1280, height: 720 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
  // Short and zoomed screens, where one-screen pages and sticky panels run out of room
  { name: 'zoom-200', width: 640, height: 360 }, // a 1280 × 720 laptop at 200 % zoom
  { name: 'tablet-landscape-safari', width: 1024, height: 690 }, // iPad landscape, minus Safari's bars
  { name: 'laptop-short', width: 1366, height: 600 }, // 1366 × 768 laptop, minus browser and taskbar
]
const DARK = ['phone', 'laptop']
/** Dutch text runs longer: the Dutch pages get checked at these sizes too. */
const DUTCH = ['phone', 'laptop']

/** Fit pages only promise one screen from this height up (AppHolder.vue). */
const FIT_MIN_HEIGHT = 560

const cases = BREAKPOINTS.flatMap((bp) => [
  { ...bp, theme: 'light' as const, dutch: false },
  ...(DARK.includes(bp.name) ? [{ ...bp, theme: 'dark' as const, dutch: false }] : []),
  ...(DUTCH.includes(bp.name) ? [{ ...bp, theme: 'light' as const, dutch: true }] : []),
])

for (const base of ROUTES) {
  for (const { name, width, height, theme, dutch } of cases) {
    const route = dutch ? nl(base) : base
    const slug = route === '/' ? 'home' : route.slice(1).replace('/', '-')
    test(`${slug} at ${name} ${width}x${height}${theme === 'dark' ? ' (dark)' : ''}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: width < 640,
        hasTouch: width < 1024,
        colorScheme: theme,
      })
      // Skip the intro animation and pin the theme, so screenshots are stable.
      await context.addInitScript((t) => {
        sessionStorage.setItem('intro-seen', '1')
        localStorage.setItem('theme', t)
      }, theme)
      const page = await context.newPage()
      await page.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort()) // no analytics

      await page.goto(route)
      await expect(page.locator('#main-content')).toBeVisible()
      await page.waitForLoadState('networkidle')

      // Scroll through once so reveal-on-scroll content is shown in the screenshot.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
          scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 60))
        }
        scrollTo(0, 0)
      })
      await page.waitForTimeout(700)

      const size = await page.evaluate(() => ({
        sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      }))
      expect(size.sideways, 'scrolls sideways').toBeLessThanOrEqual(1)
      if (FIT_ROUTES.includes(base) && height >= FIT_MIN_HEIGHT) {
        expect(size.vertical, 'one-screen page scrolls vertically').toBeLessThanOrEqual(1)
      }

      // The about cards scroll inside themselves only as a last resort, with no visible
      // scrollbar: at these sizes all their text must show.
      if (base === '/contact') {
        const hidden = await page.locator('.card-body').evaluateAll((els) => els.map((e) => e.scrollHeight - e.clientHeight))
        expect(Math.max(...hidden), 'text cut off inside an about card').toBeLessThanOrEqual(1)
      }

      // Tap targets: at least 24 × 24 px; the main controls 44 px on a touch phone
      const targets = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.nav-menu-btn, .nav-icon-btn, .lang-switch, .chatbot-fab, .car-dot, .car-btn, .about-dot')]
          .filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
          .map((el) => {
            const r = el.getBoundingClientRect()
            return { name: el.className.split(' ')[0], w: Math.round(r.width), h: Math.round(r.height) }
          }),
      )
      for (const t of targets) {
        expect(Math.min(t.w, t.h), `${t.name} is ${t.w}×${t.h}`).toBeGreaterThanOrEqual(24)
        if (width < 640 && ['nav-icon-btn', 'nav-menu-btn', 'chatbot-fab'].includes(t.name)) {
          expect(Math.min(t.w, t.h), `${t.name} on a phone is ${t.w}×${t.h}`).toBeGreaterThanOrEqual(44)
        }
        if (width < 640 && ['car-dot', 'about-dot'].includes(t.name)) expect(t.h, `${t.name} on a phone is ${t.h}px tall`).toBeGreaterThanOrEqual(44)
      }

      // The project slides: the stage spans its slide, edge to edge with the caption,
      // with the whole 3D MacBook in it
      if (base === '/projects') {
        await page.waitForTimeout(800) // the lid opening
        const slide = await measureCurrentSlide(page)
        expect(slide.loaded, 'screenshot on the MacBook loaded').toBe(true)
        expect(Math.abs(slide.left), "stage's left edge vs the caption").toBeLessThanOrEqual(1)
        expect(Math.abs(slide.right), "stage's right edge vs the caption").toBeLessThanOrEqual(1)
        expect(slide.inside, 'the whole MacBook is shown, clear of the caption').toBe(true)
        expect(slide.share, 'the MacBook fills its stage').toBeGreaterThan(0.85)
      }

      await page.screenshot({
        path: `test-results/responsive/${slug}/${width}x${height}-${theme}.png`,
        fullPage: true,
      })
      await context.close()
    })
  }
}
