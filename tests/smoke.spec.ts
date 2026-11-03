import { readFileSync } from 'node:fs'
import { baseCompile } from '@intlify/message-compiler'
import { expect, test, type Page } from '@playwright/test'
import { nl, ROUTES } from './routes'

/**
 * Smoke tests: every public page renders without errors in both languages and
 * on mobile, the prerendered HTML still carries its SEO tags, and the key
 * interactions (language switch, theme, lightbox) work.
 */

// Untranslated vue-i18n keys leak through as "namespace.someKey". Domains such
// as "scan2talk.be" and file names like "privacy.md" look similar, so those
// endings are excluded.
const RAW_I18N_KEY =
  /\b(?:nav|home|about|projects|exulta|vhs|scan2talk|aria|chat|error|footer|privacy|repo)\.(?!(?:be|com|dev|app|io|md)\b)[a-z][A-Za-z]+\b/

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
        await open(page, locale === 'nl' ? nl(route) : route)

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
      if (route !== '/privacy') expect(sources.length).toBeGreaterThan(0) // the only text-only page
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

    test('ships SEO tags in the prerendered HTML, in both languages', async ({ request }) => {
      // Raw HTML, no JavaScript: what search engines and AI crawlers get.
      for (const url of [route, nl(route)]) {
        const html = await (await request.get(url)).text()
        expect(html, url).toMatch(/<title>[^<]*Robbe Saelens<\/title>/)
        expect(html, url).toMatch(/<meta name="description" content="[^"]{50,160}"/)
        expect(html, url).toMatch(/<link rel="canonical" href="https:\/\/robbesaelens\.github\.io\//)
        expect(html, url).toContain('application/ld+json')
        expect(html.match(/<h1[\s>]/g) ?? [], url).toHaveLength(1)
      }
    })
  })
}

/** Every translation as [key, text], e.g. ['chat.contact', 'You can reach…']. */
function translations(file: string): [string, string][] {
  const out: [string, string][] = []
  const walk = (node: Record<string, unknown>, prefix: string) => {
    for (const [k, v] of Object.entries(node)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v && typeof v === 'object') walk(v as Record<string, unknown>, key)
      else out.push([key, String(v)])
    }
  }
  walk(JSON.parse(readFileSync(new URL(`../src/locales/${file}`, import.meta.url), 'utf8')), '')
  return out
}

// vue-i18n falls back to English for a missing Dutch key, so a forgotten
// translation never shows up as a raw key on the page. Compare the files instead.
test('English and Dutch translations have the same keys', () => {
  const en = translations('en.json').map(([k]) => k)
  const nl = translations('nl.json').map(([k]) => k)
  expect(en.filter((k) => !nl.includes(k)), 'missing in nl.json').toEqual([])
  expect(nl.filter((k) => !en.includes(k)), 'missing in en.json').toEqual([])
})

// "@", "|", "{" and "}" mean something to vue-i18n. A bare one (an email
// address, an Instagram handle) breaks the message only when it is shown, which
// can be deep in the chat. Write them as {'@'} etc.
test('every translation compiles', () => {
  const broken: string[] = []
  for (const file of ['en.json', 'nl.json']) {
    for (const [key, text] of translations(file)) {
      baseCompile(text, { onError: (e) => broken.push(`${file} ${key}: ${e.message}`) })
    }
  }
  expect(broken).toEqual([])
})

test('sitemap lists exactly the tested routes', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  const paths = [...xml.matchAll(/<loc>https:\/\/robbesaelens\.github\.io(\/[^<]*)<\/loc>/g)].map(
    (m) => m[1],
  )
  expect(paths.sort()).toEqual([...ROUTES, ...ROUTES.map(nl)].sort())
  // every URL points at both language versions
  expect(xml.match(/hreflang="nl"/g)).toHaveLength(ROUTES.length * 2)
})

test('Dutch pages have their own URL, title, lang and alternates', async ({ request }) => {
  const html = await (await request.get('/nl/contact')).text()
  expect(html).toContain('<html lang="nl"')
  expect(html).toMatch(/<title>Over mij \| Robbe Saelens<\/title>/)
  expect(html).toContain('<link rel="canonical" href="https://robbesaelens.github.io/nl/contact">')
  expect(html).toContain('hreflang="en" href="https://robbesaelens.github.io/contact"')
  expect(html).toContain('hreflang="x-default" href="https://robbesaelens.github.io/contact"')
  expect(html).toContain('href="/nl/projects"') // links stay in Dutch
})

test('language switch goes to the Dutch URL and remembers the choice', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/projects')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('h1')).toContainText('projects')

  await openMenuIfCollapsed(page)
  await page.getByRole('link', { name: /Switch to Dutch/ }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/nl\/projects$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
  await expect(page.locator('h1')).toContainText('projecten')

  // The choice sticks: an English link now opens in Dutch on a new visit.
  await page.goto('/contact')
  await expect(page).toHaveURL(/\/nl\/contact$/)
  expect(errors).toEqual([])
})

test('a Dutch browser lands on the Dutch home page, deep links keep their language', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'nl-BE' })
  const page = await context.newPage()
  await guard(page)
  await page.goto('/')
  await expect(page).toHaveURL(/\/nl$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
  const deep = await context.newPage()
  await guard(deep)
  await deep.goto('/projects')
  await expect(deep.locator('html')).toHaveAttribute('lang', 'en')
  await context.close()
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
    const current = page.locator('.car-slide.is-current')
    await expect(current).toContainText(name) // the carousel has scrolled there
    await current.locator('a.car-card').click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.locator('h1')).toContainText(name)
  }
})

test('lightbox opens, steps through the screenshots, and closes', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/exultadetail')

  await page.locator('button.shot').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog.locator('.lightbox-caption')).toContainText('1 / 2')

  await page.keyboard.press('ArrowRight')
  await expect(dialog.locator('.lightbox-caption')).toContainText('2 / 2')
  await page.keyboard.press('ArrowRight')
  await expect(dialog.locator('.lightbox-caption')).toContainText('1 / 2')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  expect(errors).toEqual([])
})

test.describe('repository activity', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/repo-stats.json', import.meta.url), 'utf8'))
  const PAGES = [
    ['/exultadetail', 'exulta'],
    ['/scan2talkdetail', 'scan2talk'],
    ['/stalmanagerdetail', 'stalManager'],
    ['/vhsdetail', 'vhs'],
  ] as const

  // The repos are private: counts and dates only.
  test('the stats cover every project and hold no personal data', () => {
    for (const [, key] of PAGES) expect(data.projects[key], key).toBeTruthy()
    const text = JSON.stringify(data)
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/)
    expect(text).not.toMatch(/"(author|name|email|committer|subject|message|latestCommits)"/i)
  })

  for (const [route, key] of PAGES) {
    test(`${route} shows the repository numbers`, async ({ page }) => {
      const errors = await guard(page)
      const stats = data.projects[key]
      await open(page, route)
      const section = page.locator('.repo--inline')
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()
      await expect(section.locator('.repo-number dd').first()).toHaveText(stats.commits.toLocaleString('en-GB'))
      await expect(section.locator('.repo-number')).toHaveCount(4)
      await expect(section.locator('.repo-commit')).toHaveCount(0)
      await expect(section.locator('.repo-bar')).toHaveCount(26)
      expect(errors).toEqual([])
    })
  }

  test('on wide screens it floats beside the content instead', async ({ page }) => {
    await guard(page)
    await page.setViewportSize({ width: 1920, height: 1080 })
    await open(page, '/exultadetail')
    const aside = page.getByRole('complementary', { name: 'Repository activity' })
    await expect(aside).toBeVisible()
    await expect(page.locator('.repo--inline')).toBeHidden()
    // Right of the 1280px content, and it stays put while scrolling.
    const content = (await page.locator('.detail-page > div').first().boundingBox())!
    const before = (await aside.boundingBox())!
    expect(before.x).toBeGreaterThanOrEqual(content.x + content.width)
    expect(before.x + before.width).toBeLessThanOrEqual(1920)
    await page.mouse.wheel(0, 1500)
    await page.waitForTimeout(300)
    expect((await aside.boundingBox())!.y).toBeCloseTo(before.y, 0)

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(aside).toBeHidden()
    await expect(page.locator('.repo--inline')).toBeVisible()
  })

  test('in Dutch on /nl', async ({ page }) => {
    await guard(page)
    await open(page, '/nl/vhsdetail')
    await expect(page.getByRole('region', { name: 'Repository-activiteit' })).toBeAttached()
    await expect(page.locator('.repo-number dt').nth(1)).toHaveText('in de laatste 30 dagen')
  })
})

test('hovering Geluwe shows a map, Escape hides it', async ({ page }) => {
  const errors = await guard(page)
  await open(page, '/')
  const place = page.getByRole('button', { name: 'Geluwe' })
  const card = page.getByRole('tooltip')
  await expect(card).toBeHidden()
  await place.hover()
  await expect(card).toBeVisible()
  await expect(card.getByRole('img', { name: /Map of Geluwe/ })).toHaveJSProperty('complete', true)
  expect(await card.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(320)
  await page.keyboard.press('Escape')
  await expect(card).toBeHidden()
  // Also reachable with the keyboard
  await place.focus()
  await expect(card).toBeVisible()
  expect(errors).toEqual([])
})

// The map is inverted in dark mode; nothing else may be (a stray filter once
// inverted the whole page).
test('dark mode inverts only the map', async ({ page }) => {
  await guard(page)
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
  await open(page, '/')
  const filtered = await page.evaluate(() =>
    [...document.querySelectorAll('body, body *')]
      .filter((el) => getComputedStyle(el).filter !== 'none' && !el.closest('.place-map'))
      .map((el) => el.className.toString() || el.tagName),
  )
  expect(filtered).toEqual([])
  expect(await page.locator('.place-map img').evaluate((img) => getComputedStyle(img).filter)).toContain('invert')
})

test('the Scan2Talk check-in video has working sources', async ({ request }) => {
  for (const [file, type] of [
    ['/scan2talk-checkin.webm', 'video/webm'],
    ['/scan2talk-checkin.mp4', 'video/mp4'],
    ['/scan2talk-checkin-poster.jpg', 'image/jpeg'],
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
    await page.getByRole('button', { name: 'Open AI chat' }).click()
    await expect(page.locator('.msg--bot').first()).toBeVisible()
    await page.locator('#chat-input').fill(question)
    await page.locator('#chat-input').press('Enter')
  }

  test('answers with the AI, sending the conversation and language', async ({ page }) => {
    await guard(page)
    let sent: { messages: { role: string; content: string }[]; lang: string } | null = null
    await fakeAi(page, (body) => {
      sent = body as typeof sent
      return { status: 200, json: { reply: 'Robbe works at <b>Dynamate</b>.', suggestions: ['Which projects?', 'What did he study?'] } }
    })
    await open(page, '/')
    await ask(page, 'Where does Robbe work?')
    // Shown as text: the tag is not rendered as HTML.
    await expect(page.locator('.msg--bot').last()).toHaveText(/Robbe works at <b>Dynamate<\/b>\./)
    // Follow-up questions show up as buttons, and asking one sends it.
    const followUp = page.getByRole('button', { name: 'Which projects?' })
    await expect(followUp).toBeVisible()
    await expect(page.getByRole('button', { name: 'What did he study?' })).toBeVisible()
    expect(sent!.lang).toBe('en')
    expect(sent!.messages.at(-1)).toEqual({ role: 'user', content: 'Where does Robbe work?' })
    expect(sent!.messages.every((m) => m.content.length > 0)).toBe(true)
  })

  test('falls back to the built-in answers when the AI is unavailable', async ({ page }) => {
    await guard(page)
    await fakeAi(page, () => ({ status: 503, json: { error: 'unavailable' } }))
    await open(page, '/')
    await ask(page, 'What are your skills?')
    await expect(page.locator('.chat-typing')).toHaveCount(0)
    const reply = await page.locator('.msg--bot').last().innerText()
    expect(reply).not.toMatch(RAW_I18N_KEY)
    expect(reply.length).toBeGreaterThan(20)
  })
})

test.describe('analytics', () => {
  test('counts visits with the cookieless Cloudflare beacon, without a banner', async ({ page }) => {
    await guard(page)
    const beacon: string[] = []
    page.on('request', (r) => /static\.cloudflareinsights\.com\/beacon\.min\.js/.test(r.url()) && beacon.push(r.url()))
    await open(page, '/')

    await expect.poll(() => beacon.length).toBe(1)
    const config = await page.locator('script[data-cf-beacon]').getAttribute('data-cf-beacon')
    expect(JSON.parse(config!)).toMatchObject({ token: 'test-token' })
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await page.evaluate(() => document.cookie)).toBe('')
  })

  test('clears what the old Google Analytics setup left behind', async ({ page }) => {
    await guard(page)
    await page.addInitScript(() => {
      localStorage.setItem('cookie-consent', 'granted')
      document.cookie = '_ga=GA1.1.123; path=/'
      document.cookie = '_ga_KTMQFBG1N2=GS1.1.456; path=/'
    })
    const google: string[] = []
    page.on('request', (r) => /google/.test(r.url()) && google.push(r.url()))
    await open(page, '/')

    expect(await page.evaluate(() => localStorage.getItem('cookie-consent'))).toBeNull()
    expect(await page.evaluate(() => document.cookie)).not.toMatch(/_ga/)
    expect(google).toEqual([])
  })

  // Sentry only reports from robbesaelens.github.io (src/sentry.ts).
  test('error reporting stays off outside the live site', async ({ page }) => {
    await guard(page)
    const sentry: string[] = []
    page.on('request', (r) => /sentry\.io/.test(r.url()) && sentry.push(r.url()))
    await open(page, '/')
    await page.evaluate(() => setTimeout(() => {
      throw new Error('test error, must not be reported')
    }))
    await page.waitForTimeout(1500)
    expect(sentry).toEqual([])
  })

  test('the privacy page explains the statistics, error reports and the chatbot', async ({ page }) => {
    await guard(page)
    await open(page, '/privacy')
    await expect(page.getByRole('heading', { name: 'Statistics (Cloudflare Web Analytics)' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Error reports (Sentry)' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Chatbot' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cookie settings' })).toHaveCount(0)
  })
})

test('the chatbot says its answers come from AI', async ({ page }) => {
  await guard(page)
  await open(page, '/')
  await page.getByRole('button', { name: 'Open AI chat' }).click()
  await expect(page.locator('.chat-notice')).toContainText('generated by AI')
})
