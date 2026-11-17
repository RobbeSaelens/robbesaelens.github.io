// Writes dist/llms.txt, what the site's AI chatbot answers from, after the SSR build:
// the hand-written profile (src/data/llms-profile.md) and the site's own data (pages,
// projects, repository numbers, Drupal contributions), put together by src/llms.ts.
// The status-worker reads only the first LLMS_MAX_CHARS characters, so a longer file
// fails the build instead of being cut off without a word.
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')

if (!existsSync(ssrEntry)) {
  console.error('[llms] missing SSR bundle at dist-ssr/entry-server.js; build it with `npm run build:ssr`')
  process.exit(1)
}

const { llms, LLMS_MAX_CHARS } = await import(ssrEntry)
const { text, size, issuesShown, issues } = llms()
const n = (number) => number.toLocaleString('en')

if (size > LLMS_MAX_CHARS) {
  console.error(
    `[llms] llms.txt is ${n(size)} characters without any Drupal issue, over the ${n(LLMS_MAX_CHARS)} the chatbot reads: ` +
      'shorten src/data/llms-profile.md, or the texts src/llms.ts takes from the site',
  )
  process.exit(1)
}

writeFileSync(join(root, 'dist', 'llms.txt'), text)
const drupal = issuesShown < issues ? `, ${issuesShown} of ${issues} Drupal issues (the rest didn't fit)` : ''
console.log(`[llms] wrote llms.txt: ${n(size)} of ${n(LLMS_MAX_CHARS)} characters, ${n(LLMS_MAX_CHARS - size)} left${drupal}`)
