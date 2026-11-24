import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { PROJECTS } from '../src/seo/projects'
import { nl } from './routes'

/**
 * How the projects are kept up to date, from the data the deploy refreshes every morning:
 * - each project page's repository card ends with when its dependencies were updated and
 *   its open security alerts (repo-stats.json, npm run stats);
 * - the live sites' project pages show their Lighthouse scores as rings that count up
 *   (pagespeed.json, npm run pagespeed);
 * - the tools page shows every commit of the last year as a grid (repo-stats.json activity).
 * The real values are in the prerendered HTML, read out in words, in both languages; nothing
 * moves with reduced motion; nothing scrolls sideways.
 */

const read = (file: string) => JSON.parse(readFileSync(new URL(`../src/data/${file}`, import.meta.url), 'utf8'))
const stats = read('repo-stats.json')
const speed = read('pagespeed.json')
const en = read('../locales/en.json')
const nlText = read('../locales/nl.json')

const LOCALE = { en: 'en-GB', nl: 'nl-BE' } as const
const DAY = 24 * 60 * 60 * 1000

/** The project pages, the repository key of their card, and the live site's, if public */
const PAGES = [
  { route: '/exultadetail', key: 'exulta' },
  { route: '/scan2talkdetail', key: 'scan2talk' },
  { route: '/stablemanagerdetail', key: 'stableManager' },
  { route: '/vhsdetail', key: 'vhs' },
] as const
const LIVE = PROJECTS.filter((p) => p.liveUrl).map((p) => ({ key: p.stats, url: p.liveUrl!, route: p.path }))

/** Third-party requests blocked; every same-origin error collected. */
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

async function open(page: Page, route: string) {
  await page.goto(route)
  await expect(page.locator('#main-content')).toBeVisible()
  await page.waitForLoadState('networkidle')
}

/** "1 high, 2 medium" the way RepoActivity writes it */
function severities(lang: 'en' | 'nl', counts: Record<string, number>) {
  const text = lang === 'en' ? en : nlText
  return ['critical', 'high', 'medium', 'low']
    .filter((s) => counts[s])
    .map((s) => text.repo.severity[s].replace('{n}', String(counts[s])))
    .join(', ')
}

test.describe('the data', () => {
  test('each project has when its dependencies were updated and its open alerts, or null', () => {
    for (const [key, project] of Object.entries<Record<string, unknown>>(stats.projects)) {
      const { dependenciesUpdated: deps, openAlerts: alerts, openAlertsBySeverity: bySeverity } = project
      expect(deps === null || (typeof deps === 'string' && !Number.isNaN(Date.parse(deps))), key).toBe(true)
      if (alerts === null) {
        expect(bySeverity, key).toBeNull()
      } else {
        expect(Number.isInteger(alerts) && (alerts as number) >= 0, key).toBe(true)
        expect(Object.keys(bySeverity as object).sort(), key).toEqual(['critical', 'high', 'low', 'medium'])
        const sum = Object.values(bySeverity as Record<string, number>).reduce((a, b) => a + b, 0)
        expect(sum, key).toBe(alerts)
      }
    }
  })

  test('the activity grid is per-day totals only, from a Monday a year back to the day of the numbers', () => {
    const { activity } = stats
    expect(Object.keys(activity).sort()).toEqual(['days', 'from'])
    expect(activity.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const from = Date.parse(`${activity.from}T00:00:00Z`)
    expect(new Date(from).getUTCDay(), 'starts on a Monday').toBe(1)
    // 52 full weeks and this week's days up to the day of the numbers
    expect(activity.days.length).toBeGreaterThan(52 * 7)
    expect(activity.days.length).toBeLessThanOrEqual(53 * 7)
    for (const n of activity.days) expect(Number.isInteger(n) && n >= 0).toBe(true)
    const last = new Date(from + (activity.days.length - 1) * DAY).toISOString().slice(0, 10)
    const generated = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date(stats.generatedAt))
    expect(last).toBe(generated)
  })

  test('the Lighthouse scores: four 0–100 scores and a date per live site and strategy, nothing else', () => {
    expect(Object.keys(speed)).toEqual(['sites'])
    expect(Object.keys(speed.sites).length).toBeGreaterThan(0)
    for (const [key, site] of Object.entries<Record<string, Record<string, unknown>>>(speed.sites)) {
      expect(LIVE.map((l) => l.key), `${key} is a live site in src/seo/projects.ts`).toContain(key)
      for (const [strategy, run] of Object.entries(site)) {
        expect(['mobile', 'desktop']).toContain(strategy)
        expect(Object.keys(run).sort()).toEqual(['accessibility', 'bestPractices', 'measuredAt', 'performance', 'seo'])
        for (const name of ['performance', 'accessibility', 'bestPractices', 'seo']) {
          const score = run[name] as number
          expect(Number.isInteger(score) && score >= 0 && score <= 100, `${key} ${name}`).toBe(true)
        }
        expect(Number.isNaN(Date.parse(run.measuredAt as string))).toBe(false)
      }
    }
  })
})

test.describe('dependencies and security alerts', () => {
  for (const { route, key } of PAGES) {
    for (const lang of ['en', 'nl'] as const) {
      const url = lang === 'nl' ? nl(route) : route
      test(`${url} says when the dependencies were updated, and the open alerts`, async ({ page, request }) => {
        const project = stats.projects[key]
        const alerts =
          project.openAlerts === null
            ? null
            : (lang === 'en' ? en : nlText).repo.alerts.split(' | ')[Math.min(project.openAlerts, 2)].replace('{n}', String(project.openAlerts))
        // In the prerendered HTML: the exact moment in a <time>
        const html = await (await request.get(url)).text()
        if (project.dependenciesUpdated) expect(html).toContain(`<time datetime="${project.dependenciesUpdated}"`)
        if (alerts) expect(html).toContain(alerts)

        const errors = await guard(page)
        await open(page, url)
        const card = page.locator(`.repo:has(#repo-title-${key})`)
        const upkeep = card.locator('.repo-upkeep')
        await upkeep.scrollIntoViewIfNeeded()
        const time = upkeep.locator('time')
        await expect(time).toHaveAttribute('datetime', project.dependenciesUpdated)
        await expect(time).toHaveAttribute('title', /\d{4}/)
        await expect(upkeep).toContainText(lang === 'en' ? 'Dependencies updated' : 'Dependencies')
        // Intl's relative time: "3 days ago", but also "last week" / "vorige week"
        await expect(time).toHaveText(lang === 'en' ? /ago|yesterday|today|last (week|month|year)/ : /geleden|gisteren|vandaag|vorige (week|maand)|vorig jaar/)
        if (alerts) {
          const detail = project.openAlerts ? ` (${severities(lang, project.openAlertsBySeverity)})` : ''
          await expect(upkeep.locator('li').nth(1)).toHaveText(`${alerts}${detail}`)
        }
        expect(errors).toEqual([])
      })
    }
  }

  test('a repository without a lockfile or readable alerts gets no line (the Drupal version)', async ({ page }) => {
    expect(stats.projects.sharedCosts.dependenciesUpdated).toBeNull()
    expect(stats.projects.sharedCosts.openAlerts).toBeNull()
    await open(page, '/stablemanagerdetail')
    const card = page.locator('.repo:has(#repo-title-sharedCosts)')
    await card.scrollIntoViewIfNeeded()
    await expect(card.locator('.repo-note')).toBeVisible()
    await expect(card.locator('.repo-upkeep')).toHaveCount(0)
  })
})

test.describe('Lighthouse scores', () => {
  const NAMES = {
    en: ['Performance', 'Accessibility', 'Best practices', 'SEO'],
    nl: ['Prestaties', 'Toegankelijkheid', 'Praktische tips', 'SEO'],
  }
  const KEYS = ['performance', 'accessibility', 'bestPractices', 'seo'] as const

  for (const { key, url: live, route } of LIVE) {
    for (const lang of ['en', 'nl'] as const) {
      const url = lang === 'nl' ? nl(route) : route
      test(`${url} shows ${new URL(live).host}'s scores as rings, read out in words`, async ({ page, request }) => {
        const run = speed.sites[key].mobile
        const of = (n: number) => (lang === 'en' ? `${n} of 100` : `${n} van 100`)
        // The final values are in the prerendered HTML
        const html = await (await request.get(url)).text()
        for (const k of KEYS) expect(html).toContain(of(run[k]))

        const errors = await guard(page)
        await open(page, url)
        const host = new URL(live).host
        const region = page.getByRole('region', { name: `${lang === 'en' ? 'Lighthouse scores' : 'Lighthouse-scores'}: ${host}` })
        await region.scrollIntoViewIfNeeded()
        const items = region.getByRole('listitem')
        await expect(items).toHaveCount(4)
        for (const [i, k] of KEYS.entries()) {
          await expect(items.nth(i)).toContainText(NAMES[lang][i])
          await expect(items.nth(i).locator('.sr-only').last()).toHaveText(of(run[k]))
          // Lighthouse's bands
          const band = run[k] >= 90 ? 'good' : run[k] >= 50 ? 'average' : 'poor'
          await expect(items.nth(i)).toHaveClass(new RegExp(`is-${band}`))
          // Counted up to the score, the arc full to it
          await expect(items.nth(i).locator('.speed-n')).toHaveText(String(run[k]), { timeout: 5_000 })
          await expect
            .poll(() => items.nth(i).locator('.speed-arc').evaluate((c) => parseFloat(getComputedStyle(c).strokeDashoffset.replace(/[^\d.-]/g, ''))))
            .toBeCloseTo(100 - run[k], 0)
        }
        const date = new Date(run.measuredAt).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' })
        await expect(region.locator('.speed-note')).toContainText(lang === 'en' ? `Measured on mobile, ${date}` : `Gemeten op mobiel, ${date}`)
        const link = region.getByRole('link', { name: lang === 'en' ? 'PageSpeed report' : 'PageSpeed-rapport' })
        await expect(link).toHaveAttribute('href', `https://pagespeed.web.dev/report?url=${encodeURIComponent(new URL(live).href)}&form_factor=mobile`)
        await expect(link).toHaveAttribute('target', '_blank')
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        expect(errors).toEqual([])
      })
    }
  }

  test('the arcs wait empty below the fold, then fill as the numbers count', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await open(page, '/exultadetail')
    const first = page.locator('.speed-score').first()
    await expect(first.locator('.speed-ring')).toHaveClass(/is-armed/)
    expect(await first.locator('.speed-arc').evaluate((c) => parseFloat(getComputedStyle(c).strokeDashoffset.replace(/[^\d.-]/g, '')))).toBe(100)
    await expect(first.locator('.speed-n [aria-hidden="true"]')).toHaveText('0')
    await first.scrollIntoViewIfNeeded()
    await expect(first.locator('.speed-ring')).toHaveClass(/is-drawn/)
    await expect(first.locator('.speed-n')).toHaveText(String(speed.sites.exulta.mobile.performance), { timeout: 5_000 })
  })

  test('pages without a public live site have none', async ({ page }) => {
    for (const route of ['/stablemanagerdetail', '/vhsdetail']) {
      await open(page, route)
      await expect(page.locator('.speed')).toHaveCount(0)
    }
  })

  test('stay inside the page column on a small phone, two by two', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true })
    const page = await context.newPage()
    await open(page, '/nl/scan2talkdetail')
    const scores = page.locator('.speed-scores')
    await scores.scrollIntoViewIfNeeded()
    const box = (await scores.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(360)
    const tops = await page.locator('.speed-score').evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size)
    expect(tops).toBe(2)
    // No label wider than its column ("Toegankelijkheid")
    const overflow = await page.locator('.speed-label').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).length)
    expect(overflow).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await context.close()
  })
})

test.describe('activity grid', () => {
  const { activity } = stats
  const total = activity.days.reduce((a: number, b: number) => a + b, 0)
  const busy = activity.days.filter(Boolean).length
  const max = Math.max(...activity.days)

  for (const lang of ['en', 'nl'] as const) {
    const url = lang === 'nl' ? '/nl/tools' : '/tools'
    test(`${url} shows every commit of the last year, as one picture with its numbers`, async ({ page, request, isMobile }) => {
      const n = (x: number) => x.toLocaleString(LOCALE[lang])
      const summary =
        lang === 'en'
          ? `Commits per day over the last year: ${n(total)} in total, on ${n(busy)} days, at most ${n(max)} in one day.`
          : `Commits per dag in het laatste jaar: ${n(total)} in totaal, op ${n(busy)} dagen, hoogstens ${n(max)} op één dag.`
      const heading = lang === 'en' ? `${n(total)} commits in the last year` : `${n(total)} commits in het laatste jaar`
      // In the prerendered HTML
      const html = await (await request.get(url)).text()
      expect(html).toContain(`role="img" aria-label="${summary}"`)
      expect(html).toContain(heading)

      const errors = await guard(page)
      await open(page, url)
      const graph = page.getByRole('img', { name: summary })
      await expect(graph).toBeVisible()
      await expect(page.locator('.heat-total')).toHaveText(heading)
      // Every day a cell, a week a column, today last
      await expect(page.locator('.heat-grid .heat-day')).toHaveCount(activity.days.length)
      await expect(page.locator('.heat-col')).toHaveCount(Math.ceil(activity.days.length / 7))
      expect(await page.locator('.heat-month').count()).toBeGreaterThanOrEqual(11)
      // Each day's count in a title, for a mouse only
      const last = page.locator('.heat-grid .heat-day').last()
      if (isMobile) {
        await expect(last).not.toHaveAttribute('title')
      } else {
        const lastDay = new Date(Date.parse(`${activity.from}T00:00:00Z`) + (activity.days.length - 1) * DAY)
        const date = lastDay.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        const count = activity.days.at(-1)
        const word = lang === 'en' ? (count === 1 ? 'commit on' : 'commits on') : count === 1 ? 'commit op' : 'commits op'
        await expect(last).toHaveAttribute('title', count ? `${count} ${word} ${date}` : new RegExp(date))
      }
      // It fits: nothing scrolls sideways, the grid inside the page column
      const box = (await graph.boundingBox())!
      const viewport = page.viewportSize()!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      expect(await page.locator('.heat').evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
      expect(errors).toEqual([])
    })
  }

  test('the columns fade in once, left to right, then rest', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('intro-seen', '1'))
    await open(page, '/tools')
    const cols = page.locator('.heat-col')
    const delays = await cols.evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).getPropertyValue('--d'))))
    expect(delays[0]).toBe(0)
    for (let i = 1; i < delays.length; i++) expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1])
    expect(delays.at(-1)).toBeLessThanOrEqual(300)
    // Done within a second; nothing left running, every column shown
    await expect.poll(() => cols.evaluateAll((els) => els.filter((e) => e.getAnimations().some((a) => a.playState === 'running')).length)).toBe(0)
    expect(await cols.evaluateAll((els) => els.every((e) => getComputedStyle(e).opacity === '1'))).toBe(true)
  })
})

test('with reduced motion the scores and the grid are there at once, nothing moves', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  const errors = await guard(page)
  await open(page, '/exultadetail')
  // Before they are ever scrolled to: the final numbers and full arcs
  const run = speed.sites.exulta.mobile
  await expect(page.locator('.speed-n')).toHaveText([run.performance, run.accessibility, run.bestPractices, run.seo].map(String))
  await expect(page.locator('.speed-ring.is-armed')).toHaveCount(0)
  const offsets = await page.locator('.speed-arc').evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).strokeDashoffset.replace(/[^\d.-]/g, ''))))
  expect(offsets).toEqual([run.performance, run.accessibility, run.bestPractices, run.seo].map((s) => 100 - s))
  await expect(page.locator('.speed [aria-hidden="true"] [aria-hidden="true"]')).toHaveCount(0)

  await open(page, '/tools')
  const cols = page.locator('.heat-col')
  expect(await cols.evaluateAll((els) => els.every((e) => getComputedStyle(e).opacity === '1'))).toBe(true)
  expect(await cols.evaluateAll((els) => els.filter((e) => e.getAnimations().length).length)).toBe(0)
  expect(errors).toEqual([])
  await context.close()
})
