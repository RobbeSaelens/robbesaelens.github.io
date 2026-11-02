import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { ROUTES } from './routes'

/**
 * Smoke tests: every public page renders without errors in both languages and
 * on mobile, the prerendered HTML still carries its SEO tags, and the key
 * interactions (language switch, theme, lightbox) work.
 */

// Untranslated vue-i18n keys leak through as "namespace.someKey". Domains such
// as "scan2talk.be" look similar, so known TLDs are excluded.
const RAW_I18N_KEY =
  /\b(?:nav|home|about|projects|exulta|vhs|scan2talk|aria|chat|error)\.(?!(?:be|com|dev|app|io)\b)[a-z][A-Za-z]+\b/

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
    if (/ERR_FAILED|ERR_BLOCKED|googletagmanager/i.test(msg.text())) return
    errors.push(`console: ${msg.text()}`)
  })
  page.on('response', (res) => {
    if (res.url().startsWith('http://localhost') && res.status() >= 400) {
      errors.push(`HTTP ${res.status()} ${res.url()}`)
    }
  })
  return errors
}

async function setLocale(page: Page, locale: 'en' | 'nl') {
  await page.addInitScript((l) => localStorage.setItem('app-locale', l), locale)
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
        await setLocale(page, locale)
        await open(page, route)

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
      expect(sources.length).toBeGreaterThan(0)
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

    test('ships SEO tags in the prerendered HTML', async ({ request }) => {
      // Raw HTML, no JavaScript: what search engines and AI crawlers get.
      const html = await (await request.get(route)).text()
      expect(html).toMatch(/<title>[^<]*Robbe Saelens<\/title>/)
      expect(html).toMatch(/<meta name="description" content="[^"]{50,160}"/)
      expect(html).toMatch(/<link rel="canonical" href="https:\/\/robbesaelens\.github\.io\//)
      expect(html).toContain('application/ld+json')
      expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
    })
  })
}

// vue-i18n falls back to English for a missing Dutch key, so a forgotten
// translation never shows up as a raw key on the page. Compare the files instead.
test('English and Dutch translations have the same keys', () => {
  const keys = (file: string) => {
    const out: string[] = []
    const walk = (node: Record<string, unknown>, prefix: string) => {
      for (const [k, v] of Object.entries(node)) {
        const key = prefix ? `${prefix}.${k}` : k
        if (v && typeof v === 'object') walk(v as Record<string, unknown>, key)
        else out.push(key)
      }
    }
    walk(JSON.parse(readFileSync(new URL(`../src/locales/${file}`, import.meta.url), 'utf8')), '')
    return out.sort()
  }
  const en = keys('en.json')
  const nl = keys('nl.json')
  expect(en.filter((k) => !nl.includes(k)), 'missing in nl.json').toEqual([])
  expect(nl.filter((k) => !en.includes(k)), 'missing in en.json').toEqual([])
})

test('sitemap lists exactly the tested routes', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  const paths = [...xml.matchAll(/<loc>https:\/\/robbesaelens\.github\.io(\/[^<]*)<\/loc>/g)].map(
    (m) => m[1],
  )
  expect(paths.sort()).toEqual([...ROUTES].sort())
})

test('language switch updates the page and remembers the choice', async ({ page }) => {
  const errors = await guard(page)
  // No setLocale() here: an init script runs again on reload and would reset the choice.
  await open(page, '/projects')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('h1')).toContainText('projects')

  await openMenuIfCollapsed(page)
  await page.getByRole('button', { name: 'Switch to Dutch' }).filter({ visible: true }).first().click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
  await expect(page.locator('h1')).toContainText('projecten')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
  expect(errors).toEqual([])
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
    ['Stal Manager', '/stalmanagerdetail'],
    ['VHS Service', '/vhsdetail'],
  ]) {
    await open(page, '/projects')
    // Bring the slide to the middle with its page dot, then follow its (real, crawlable) link.
    await page.getByRole('button', { name, exact: true }).click()
    await page.getByRole('link', { name: `View ${name} project details` }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.locator('h1')).toContainText(name)
  }
})

test('lightbox opens, steps through screenshots and the video, and closes', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/exultadetail')

  await page.locator('button.shot').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog.locator('.lightbox-caption')).toContainText('1 / 3')

  await page.keyboard.press('ArrowRight')
  await expect(dialog.locator('.lightbox-caption')).toContainText('2 / 3')
  await page.keyboard.press('ArrowRight')
  await expect(dialog.locator('.lightbox-caption')).toContainText('3 / 3')
  await expect(dialog.locator('video')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  expect(errors).toEqual([])
})

test('calculator video has a working source', async ({ request }) => {
  for (const [file, type] of [
    ['/exulta-calc.webm', 'video/webm'],
    ['/exulta-calc.mp4', 'video/mp4'],
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
    await page.getByRole('button', { name: 'Toggle terminal' }).click()
    await expect(page.locator('.bot-line').first()).toBeVisible()
    await page.locator('#chat-input').fill(question)
    await page.locator('#chat-input').press('Enter')
  }

  test('answers with the AI, sending the conversation and language', async ({ page }) => {
    await guard(page)
    let sent: { messages: { role: string; content: string }[]; lang: string } | null = null
    await fakeAi(page, (body) => {
      sent = body as typeof sent
      return { status: 200, json: { reply: 'Robbe works at <b>Dynamate</b>.' } }
    })
    await open(page, '/')
    await ask(page, 'Where does Robbe work?')
    // Shown as text: the tag is not rendered as HTML.
    await expect(page.locator('.bot-line').last()).toHaveText(/Robbe works at <b>Dynamate<\/b>\./)
    expect(sent!.lang).toBe('en')
    expect(sent!.messages.at(-1)).toEqual({ role: 'user', content: 'Where does Robbe work?' })
    expect(sent!.messages.every((m) => m.content.length > 0)).toBe(true)
  })

  test('falls back to the built-in answers when the AI is unavailable', async ({ page }) => {
    await guard(page)
    await fakeAi(page, () => ({ status: 503, json: { error: 'unavailable' } }))
    await open(page, '/')
    await ask(page, 'What are your skills?')
    await expect(page.locator('.typing-cursor')).toHaveCount(0)
    const reply = await page.locator('.bot-line').last().innerText()
    expect(reply).not.toMatch(RAW_I18N_KEY)
    expect(reply.length).toBeGreaterThan(20)
  })
})
