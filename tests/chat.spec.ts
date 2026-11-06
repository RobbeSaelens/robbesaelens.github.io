import { expect, test, type Page } from '@playwright/test'

/**
 * The chat window, interaction by interaction: suggestion chips, follow-ups,
 * clear, close (button, Escape, outside click), links, language, the fallback
 * when the AI is down, and the layout on small screens. The AI is faked.
 */

type Turn = { role: string; content: string }
type Sent = { messages: Turn[]; lang: string }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** Fakes the AI worker; returns every request body it got. */
async function fakeAi(page: Page, answer: (body: Sent, n: number) => { status: number; json: unknown } = defaultAnswer) {
  const sent: Sent[] = []
  await page.route('https://chat.invalid/chat', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    const body = route.request().postDataJSON() as Sent
    sent.push(body)
    const { status, json } = answer(body, sent.length)
    await route.fulfill({ status, json, headers: CORS })
  })
  return sent
}

function defaultAnswer(body: Sent, n: number) {
  const q = body.messages.at(-1)!.content
  return { status: 200, json: { reply: `Answer ${n} to ${q}`, suggestions: [`Follow-up ${n}a`, `Follow-up ${n}b`] } }
}

async function setup(page: Page) {
  const errors: string[] = []
  await page.addInitScript(() => sessionStorage.setItem('intro-seen', '1'))
  await page.route(/^https?:\/\/(?!localhost[:/]|chat\.invalid)/, (r) => r.abort())
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

const fab = (page: Page) => page.locator('.chatbot-fab')
const chatWindow = (page: Page) => page.locator('.chatbot-window')
const chip = (page: Page, name: string) => page.locator('.chat-chip', { hasText: name })

async function openChat(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.locator('#main-content')).toBeVisible()
  await fab(page).click()
  await expect(chatWindow(page)).toBeVisible()
  // The welcome line types in first.
  await waitForAnswer(page, 1)
}

/** Waits for `count` bot messages (the typing dots look like one, so not those). */
async function waitForAnswer(page: Page, count: number) {
  await expect(page.locator('.chat-typing')).toHaveCount(0)
  await expect(page.locator('.msg--bot')).toHaveCount(count)
}

test('a starter chip asks its question and keeps the chat open', async ({ page }) => {
  const errors = await setup(page)
  const sent = await fakeAi(page)
  await openChat(page)

  await chip(page, 'Skills').click()
  await expect(chatWindow(page)).toBeVisible()
  await expect(page.locator('.msg--user')).toHaveText(['Skills'])
  await waitForAnswer(page, 2)
  await expect(chatWindow(page)).toBeVisible()
  expect(sent).toHaveLength(1)
  expect(sent[0]!.messages.at(-1)).toEqual({ role: 'user', content: 'Skills' })
  expect(errors).toEqual([])
})

test('follow-up chips ask the next question with the whole conversation', async ({ page }) => {
  await setup(page)
  const sent = await fakeAi(page)
  await openChat(page)

  await chip(page, 'Projects').click()
  await waitForAnswer(page, 2)
  // The starter chips make way for the follow-ups of the answer.
  await expect(page.locator('.chat-chip')).toHaveText(['Follow-up 1a', 'Follow-up 1b'])

  await chip(page, 'Follow-up 1b').click()
  await expect(chatWindow(page)).toBeVisible()
  await waitForAnswer(page, 3)
  await expect(page.locator('.chat-chip')).toHaveText(['Follow-up 2a', 'Follow-up 2b'])
  expect(sent[1]!.messages.map((m) => m.role)).toEqual(['assistant', 'user', 'assistant', 'user'])
  expect(sent[1]!.messages.at(-1)!.content).toBe('Follow-up 1b')
})

test('an answer without follow-ups shows no chips', async ({ page }) => {
  await setup(page)
  await fakeAi(page, () => ({ status: 200, json: { reply: 'Just this.', suggestions: [] } }))
  await openChat(page)
  await chip(page, 'Contact').click()
  await waitForAnswer(page, 2)
  await expect(page.locator('.chat-chip')).toHaveCount(0)
})

test('one question at a time: a second one waits, the typed text is kept', async ({ page }) => {
  await setup(page)
  let release!: () => void
  const gate = new Promise<void>((r) => (release = r))
  const sent: Sent[] = []
  await page.route('https://chat.invalid/chat', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    sent.push(route.request().postDataJSON() as Sent)
    await gate
    await route.fulfill({ status: 200, json: { reply: 'Slow answer', suggestions: [] }, headers: CORS })
  })
  await openChat(page)

  await page.locator('#chat-input').fill('First question')
  await page.locator('#chat-input').press('Enter')
  await expect(page.locator('.chat-typing')).toBeVisible()
  await page.locator('#chat-input').fill('Second question')
  await page.locator('#chat-input').press('Enter')
  await expect(page.locator('.chat-send')).toBeDisabled()
  await expect(page.locator('#chat-input')).toHaveValue('Second question')

  release()
  await waitForAnswer(page, 2)
  expect(sent).toHaveLength(1)
  await expect(page.locator('.chat-send')).toBeEnabled()
})

test('clear starts over without closing', async ({ page }) => {
  await setup(page)
  await fakeAi(page)
  await openChat(page)
  await chip(page, 'Education').click()
  await waitForAnswer(page, 2)

  await page.getByRole('button', { name: 'Clear chat' }).click()
  await expect(chatWindow(page)).toBeVisible()
  await expect(page.locator('.msg--user')).toHaveCount(0)
  await expect(page.locator('.msg--bot')).toHaveCount(1)
  await expect(chip(page, 'Skills')).toBeVisible()
})

test('closes with the close button, the chat button, Escape and an outside click', async ({ page }) => {
  await setup(page)
  await fakeAi(page)
  await openChat(page)

  // Clicking inside (on a message, the header) keeps it open.
  await page.locator('.msg--bot').first().click()
  await page.locator('.chat-title').click()
  await expect(chatWindow(page)).toBeVisible()

  await chatWindow(page).getByRole('button', { name: 'Close AI chat' }).click()
  await expect(chatWindow(page)).toBeHidden()

  await fab(page).click()
  await expect(chatWindow(page)).toBeVisible()
  await fab(page).click()
  await expect(chatWindow(page)).toBeHidden()

  await fab(page).click()
  await page.locator('#chat-input').press('Escape')
  await expect(chatWindow(page)).toBeHidden()
  await expect(fab(page)).toBeFocused()

  await fab(page).click()
  await expect(chatWindow(page)).toBeVisible()
  await page.locator('h1').first().click()
  await expect(chatWindow(page)).toBeHidden()
})

test('the conversation survives closing and moving to another page', async ({ page }) => {
  await setup(page)
  await fakeAi(page)
  await openChat(page)
  await chip(page, 'Experience').click()
  await waitForAnswer(page, 2)

  await page.keyboard.press('Escape')
  await page.locator('#main-content a[href="/projects"]').first().click()
  await expect(page).toHaveURL(/\/projects$/)
  await fab(page).click()
  await expect(page.locator('.msg--user')).toHaveText(['Experience'])
  await expect(page.locator('.msg--bot')).toHaveCount(2)
})

test('the privacy link in the AI notice opens the privacy page in the current language', async ({ page }) => {
  await setup(page)
  await fakeAi(page)
  await openChat(page, '/nl')
  await page.locator('.chat-notice-link').click()
  await expect(page).toHaveURL(/\/nl\/privacy$/)
  await expect(chatWindow(page)).toBeHidden()
})

test('in Dutch: Dutch chips, and the AI is asked to answer in Dutch', async ({ page }) => {
  await setup(page)
  const sent = await fakeAi(page)
  await openChat(page, '/nl')
  await expect(page.locator('.chat-chip').first()).toHaveText('Vaardigheden')
  await page.locator('.chat-chip').first().click()
  await waitForAnswer(page, 2)
  expect(sent[0]!.lang).toBe('nl')
})

test('when the AI is rate-limited it says so and answers from the built-in replies', async ({ page }) => {
  await setup(page)
  const sent = await fakeAi(page, () => ({ status: 429, json: { error: 'rate_limited' } }))
  await openChat(page)
  await expect(page.locator('.chat-sub')).toContainText('Llama 3.3')

  await chip(page, 'Skills').click()
  await waitForAnswer(page, 2)
  await expect(page.locator('.chat-status')).toHaveClass(/is-off/)
  const reply = await page.locator('.msg--bot').last().innerText()
  expect(reply.length).toBeGreaterThan(20)

  // Paused: the next question doesn't hit the worker again.
  await page.locator('#chat-input').fill('And projects?')
  await page.locator('#chat-input').press('Enter')
  await waitForAnswer(page, 3)
  expect(sent).toHaveLength(1)
})

for (const path of ['/', '/nl']) {
  test(`without the AI every built-in answer works (${path})`, async ({ page }) => {
    const errors = await setup(page)
    page.on('console', (m) => m.type() === 'error' && !/ERR_FAILED/.test(m.text()) && errors.push(m.text()))
    await page.route('https://chat.invalid/chat', (r) => r.abort())
    await openChat(page, path)
    const starters = await page.locator('.chat-chip').allInnerTexts()
    expect(starters).toHaveLength(5)
    // Every topic, plus help and an unknown question (the fallback).
    for (const [i, q] of [...starters, 'help', 'xyzzy plugh'].entries()) {
      await page.locator('#chat-input').fill(q)
      await page.locator('#chat-input').press('Enter')
      await waitForAnswer(page, i + 2)
      await expect(chatWindow(page)).toBeVisible()
      const reply = await page.locator('.msg--bot').last().innerText()
      expect(reply.length, q).toBeGreaterThan(10)
      expect(reply, q).not.toMatch(/\bchat\.[a-z]/)
    }
    await expect(page.locator('.msg--bot').nth(4)).toContainText('robbe.saelens@telenet.be')
    expect(errors).toEqual([])
  })
}

for (const [path, question, url] of [
  ['/', 'Does he contribute to drupal.org?', 'robbesaelens.github.io/drupal'],
  ['/nl', 'Drupal-bijdragen?', 'robbesaelens.github.io/nl/drupal'],
]) {
  test(`without the AI, Drupal contributions get their own answer, pointing at the page (${path})`, async ({ page }) => {
    await setup(page)
    await page.route('https://chat.invalid/chat', (r) => r.abort())
    await openChat(page, path)
    await page.locator('#chat-input').fill(question)
    await page.locator('#chat-input').press('Enter')
    await waitForAnswer(page, 2)
    await expect(page.locator('.msg--bot').last()).toContainText(url)
    // "drupal module" still means Shared Costs
    await page.locator('#chat-input').fill('drupal module')
    await page.locator('#chat-input').press('Enter')
    await waitForAnswer(page, 3)
    await expect(page.locator('.msg--bot').last()).toContainText('Shared Costs')
  })

  test(`without the AI, Stable Manager is found by its name and its old one (${path})`, async ({ page }) => {
    await setup(page)
    await page.route('https://chat.invalid/chat', (r) => r.abort())
    await openChat(page, path)
    for (const [i, name] of ['Stable Manager', 'stal manager'].entries()) {
      await page.locator('#chat-input').fill(name)
      await page.locator('#chat-input').press('Enter')
      await waitForAnswer(page, i + 2)
      await expect(page.locator('.msg--bot').last()).toContainText('Stable Manager is')
    }
  })
}

test('AI replies are shown as text, never as HTML', async ({ page }) => {
  await setup(page)
  await fakeAi(page, () => ({ status: 200, json: { reply: '<img src=x onerror="window.pwned=1">hi', suggestions: ['<b>x</b>'] } }))
  await openChat(page)
  await chip(page, 'Skills').click()
  await waitForAnswer(page, 2)
  await expect(page.locator('.msg--bot').last()).toContainText('<img src=x')
  expect(await page.evaluate(() => (window as unknown as { pwned?: number }).pwned)).toBeUndefined()
  await expect(page.locator('.chat-chip')).toHaveText(['<b>x</b>'])
})

test('the open chat fits the screen and nothing covers the input', async ({ page }) => {
  await setup(page)
  await fakeAi(page)
  await openChat(page)
  for (let i = 0; i < 4; i++) {
    await page.locator('#chat-input').fill(`Question ${i} with a fairly long text to make the conversation grow`)
    await page.locator('#chat-input').press('Enter')
    await waitForAnswer(page, i + 2)
  }
  const view = page.viewportSize()!
  const box = (await chatWindow(page).boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(view.width + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(view.height + 1)

  // The send button is clickable: not under the chat button or off screen.
  const send = (await page.locator('.chat-send').boundingBox())!
  const hit = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x!, y!)?.closest('.chat-send, .chatbot-fab')?.className ?? null,
    [send.x + send.width / 2, send.y + send.height / 2],
  )
  expect(hit).toContain('chat-send')
  // Scrolled down to the last answer and its follow-up chips.
  await expect(page.locator('.msg--bot').last()).toBeInViewport()
  await expect(page.locator('.chat-chip').last()).toBeInViewport({ ratio: 1 })
})
