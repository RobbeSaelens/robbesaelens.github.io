import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { ROUTES, STATES } from './routes'

/**
 * Accessibility: every page (light and dark) and the open chatbot, checked against WCAG 2.1 A and AA with axe-core. Runs with the smoke
 * tests on desktop and mobile.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function prepare(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => {
    sessionStorage.setItem('intro-seen', '1')
    localStorage.setItem('theme', t)
  }, theme)
  await page.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort())
}

async function settle(page: Page) {
  await expect(page.locator('#main-content')).toBeVisible()
  await page.waitForLoadState('networkidle')
  // Let entrance animations finish: half-faded text has misleading contrast.
  await page.waitForTimeout(1600)
}

function report(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length}x) ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
}

for (const route of [...ROUTES, ...STATES]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`a11y ${route} (${theme})`, async ({ page }) => {
      await prepare(page, theme)
      await page.goto(route)
      await settle(page)
      // The projects carousel dims the slides that aren't selected (45% opacity);
      // their text is inactive until you move to them, where it is checked.
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).exclude('.car-slide:not(.is-current)').analyze()
      expect(report(violations)).toEqual([])
    })
  }
}

test('a11y: open chatbot', async ({ page }) => {
  await prepare(page, 'light')
  await page.goto('/')
  await settle(page)
  await page.getByRole('button', { name: 'Open AI chat' }).click()
  await page.waitForTimeout(1200)
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).include('.chatbot-root').analyze()
  expect(report(violations)).toEqual([])
})

test('a11y: chatbot with an answer and its follow-up questions', async ({ page }) => {
  await prepare(page, 'dark')
  // The AI is faked (registered last, so it wins over the blocked hosts)
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }
  await page.route('https://chat.invalid/chat', (route) =>
    route.request().method() === 'OPTIONS'
      ? route.fulfill({ status: 204, headers: cors })
      : route.fulfill({
          headers: cors,
          json: { reply: 'Robbe works at Dynamate.', suggestions: ['What does he do there?', 'Which projects did he build?'] },
        }),
  )
  await page.goto('/')
  await settle(page)
  await page.getByRole('button', { name: 'Open AI chat' }).click()
  await page.locator('#chat-input').fill('Where does he work?')
  await page.locator('#chat-input').press('Enter')
  await expect(page.getByRole('group', { name: 'Suggested questions' }).getByRole('button')).toHaveCount(2)
  await page.waitForTimeout(600) // the chips' entrance
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).include('.chatbot-root').analyze()
  expect(report(violations)).toEqual([])
})
