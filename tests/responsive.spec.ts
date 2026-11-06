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
const BREAKPOINTS = [
  { name: 'phone-small', width: 360, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop-small', width: 1280, height: 720 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
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
