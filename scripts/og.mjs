// Draws the share images (Open Graph) into dist/og/, after the prerender: one 1200 × 630
// PNG per page and language, in the site's terminal style, for link previews (LinkedIn,
// Teams, WhatsApp, Slack). What is on each card comes from the site's own data, through
// the SSR bundle (shareCards in src/seo/shareCards.ts); how it looks is this file's.
//
// satori lays the card out (flexbox, like the site's CSS) and turns it into an SVG, its
// text drawn as paths in fonts from npm (@fontsource: JetBrains Mono and Inter, both
// SIL Open Font License), so nothing is fetched and the result is the same on any machine;
// sharp (librsvg) draws that SVG as a PNG. The pictures are the real ones from public/.
//
// A drawn card is kept in node_modules/.cache/og/, by a hash of everything that goes into
// it (the card, its pictures, the logo, the fonts and this file), so a build only draws
// the cards that changed.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const cacheDir = join(root, 'node_modules', '.cache', 'og')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')

if (!existsSync(ssrEntry)) {
  console.error('[og] missing SSR bundle at dist-ssr/entry-server.js; build it with `npm run build:ssr`')
  process.exit(1)
}

const { shareCards, shareLogo, SHARE_IMAGE } = await import(ssrEntry)
const { width: W, height: H } = SHARE_IMAGE

// =============================================
// The design: the site's dark theme (terminal-theme.css, .dark)
// =============================================

const COLOR = {
  page: '#222222', // html.dark (styles.css)
  text: '#e2e8f0', // --color-text-primary
  secondary: '#94a3b8', // --color-text-secondary, --color-subtitle
  muted: '#8a97a8', // --color-text-muted
  accent: '#2dd4bf', // --color-accent, --color-prompt, --color-cursor
  frame: '#1a2129', // the screenshots' frames: --color-surface over the page
  bar: '#202a33', // a browser frame's bar: --color-surface-hover
  border: 'rgba(45, 212, 191, 0.16)', // --color-border, a little stronger at this size
  shadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
}
/** The tools' own colours (tools-page.css, dark): Project Updater's indigo, Sift's amber */
const TOOL_COLOR = { 'Project Updater': '#a5b4fc', Sift: '#fbbf24' }

const MONO = 'JetBrains Mono'
const SANS = 'Inter'
/** JetBrains Mono's advance: every character is 0.6 em wide */
const MONO_ADVANCE = 0.6

/** The card's margins: the logo, the text and the pictures keep inside them */
const PAD_X = 72
const PAD_Y = 56

// =============================================
// Fonts: from npm, never fetched
// =============================================

const fontFile = (family, file) => join(root, 'node_modules', '@fontsource', family, 'files', file)
const FONTS = [
  [MONO, 'jetbrains-mono', 400],
  [MONO, 'jetbrains-mono', 700],
  [SANS, 'inter', 400],
  [SANS, 'inter', 500],
  [SANS, 'inter', 600],
].flatMap(([name, family, weight]) =>
  // latin first, latin-ext for the letters it lacks
  ['latin', 'latin-ext'].map((subset) => ({
    name,
    weight,
    style: 'normal',
    data: readFileSync(fontFile(family, `${family}-${subset}-${weight}-normal.woff`)),
  })),
)

// =============================================
// Building blocks (satori takes React-like elements: { type, props })
// =============================================

const h = (type, props, ...children) => ({
  type,
  props: { ...props, children: children.flat().filter((child) => child !== null && child !== undefined && child !== false) },
})
/** A flex box (satori lays out every box with more than one child as flex), sized as on the site: border-box */
const box = (style, ...children) => h('div', { style: { display: 'flex', boxSizing: 'border-box', ...style } }, ...children)
const image = (src, width, height, style = {}) => h('img', { src, width, height, style: { width, height, ...style } })

/** The real pictures, at the size they are drawn (sharp scales better than librsvg). */
const pictureCache = new Map()
async function picture(src, width, height, position = 'top') {
  const key = `${src} ${width}x${height} ${position}`
  if (!pictureCache.has(key)) {
    const file = join(root, 'public', src)
    const data = await sharp(file)
      .resize({ width: width * 2, height: height * 2, fit: 'cover', position })
      .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
      .toBuffer()
    pictureCache.set(key, `data:image/jpeg;base64,${data.toString('base64')}`)
  }
  return pictureCache.get(key)
}
/** A picture's size, read once */
const sizes = new Map()
async function sizeOf(src) {
  if (!sizes.has(src)) {
    const { width, height } = await sharp(join(root, 'public', src)).metadata()
    sizes.set(src, { width, height })
  }
  return sizes.get(src)
}

/**
 * The header's logo, "robbe saelens." (BrandLogo.vue), in the dark theme's colours, as a
 * PNG: its letters are paths, so it needs no font.
 */
const LOGO_HEIGHT = 26
const logo = await (async () => {
  const markup = await shareLogo()
  const [, , boxWidth, boxHeight] = markup.match(/viewbox="([^"]+)"/i)[1].split(/\s+/).map(Number)
  const svg = markup
    .replace(/viewbox=/i, 'viewBox=') // the server renderer writes it in lower case
    .replace(/\swidth="[^"]*"\s+height="[^"]*"/, ` width="${(LOGO_HEIGHT * boxWidth) / boxHeight}" height="${LOGO_HEIGHT}"`)
    .replace(/class="brand-lite"/g, `fill="${COLOR.secondary}"`)
    .replace(/class="brand-ink"/g, `fill="${COLOR.text}"`)
    .replace(/class="brand-dot"/g, `fill="${COLOR.accent}"`)
    .replace(/\sdata-v-[\w-]+/g, '')
    .replace(/<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ')
  const png = await sharp(Buffer.from(svg), { density: 72 * 3 }).png().toBuffer()
  const { width, height } = await sharp(png).metadata()
  return { svg, src: `data:image/png;base64,${png.toString('base64')}`, width: width / 3, height: height / 3 }
})()

/** The largest size, up to `max`, at which a mono line of `chars` characters fits `width`. */
const monoFit = (chars, width, max) => Math.min(max, Math.floor(width / (chars * MONO_ADVANCE)))

/** "> title▋": the terminal title, as on the pages (terminal-theme.css), in one line. */
function terminalTitle(title, width, max) {
  // the prompt and a space, the title, a space and the cursor (0.55 em)
  const size = monoFit(title.length + 2 + 0.25 / MONO_ADVANCE + 0.55 / MONO_ADVANCE, width, max)
  return box(
    { alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: size, lineHeight: 1.2, color: COLOR.accent },
    box({ marginRight: size * MONO_ADVANCE }, '>'),
    box({}, title),
    box({ width: size * 0.55, height: size * 1.05, marginLeft: size * 0.25, background: COLOR.accent, borderRadius: 2 }),
  )
}

/** "$ cat ./file.md": the line under the title */
function commandLine(command, width, max) {
  const size = monoFit(command.length + 2, width, max)
  return box(
    { fontFamily: MONO, fontSize: size, lineHeight: 1.4, color: COLOR.secondary },
    box({ opacity: 0.5, marginRight: size * MONO_ADVANCE }, '$'),
    box({}, command),
  )
}

/**
 * The tagline or description, as large as fits `lines` lines of `width`, between `max` and
 * `min`. An estimate (Inter's letters are about half an em wide on average, a little more with the space lost at line ends), so look at the
 * cards when a text gets much longer: past `min` it takes a line more.
 */
function paragraph(text, width, { max, min, lines, weight = 500, color = COLOR.text }) {
  let size = max
  while (size > min && Math.ceil((text.length * 0.53 * size) / width) > lines) size -= 1
  return box(
    { width, fontFamily: SANS, fontWeight: weight, fontSize: size, lineHeight: 1.3, color, letterSpacing: -0.2, textWrap: 'pretty' },
    text,
  )
}

/** A browser window around a desktop screenshot, as ProjectShot.vue draws it */
async function browser(src, width, address) {
  const height = Math.round((width * 10) / 16)
  const dot = (color) => box({ width: 11, height: 11, borderRadius: 9999, background: color })
  return box(
    {
      flexDirection: 'column',
      width,
      borderRadius: 12,
      overflow: 'hidden',
      border: `1px solid ${COLOR.border}`,
      background: COLOR.frame,
      boxShadow: COLOR.shadow,
    },
    box(
      { alignItems: 'center', height: 32, padding: '0 14px', gap: 7, background: COLOR.bar, borderBottom: `1px solid ${COLOR.border}` },
      dot('#f87171'),
      dot('#facc15'),
      dot('#4ade80'),
      address ? box({ marginLeft: 10, fontFamily: MONO, fontSize: 14, color: COLOR.muted }, address) : null,
    ),
    image(await picture(src, width - 2, height), width - 2, height),
  )
}

/** A phone around a phone screenshot, as ProjectShot.vue draws it */
async function phone(src, width) {
  const { width: w, height: h } = await sizeOf(src)
  const inner = width - 16 // the padding and the border
  const height = Math.round((inner * h) / w)
  return box(
    {
      flexDirection: 'column',
      alignItems: 'center',
      width,
      padding: 7,
      borderRadius: 26,
      border: `1px solid ${COLOR.border}`,
      background: COLOR.frame,
      boxShadow: COLOR.shadow,
    },
    box({ width: '40%', height: 4, marginBottom: 6, borderRadius: 9999, background: COLOR.border }),
    image(await picture(src, inner, height), inner, height, { borderRadius: 18 }),
  )
}

/** A Mac app's own window: the capture brings its title bar */
async function appWindow(src, width) {
  const height = Math.round((width * 10) / 16)
  return box(
    { width, height, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: COLOR.shadow },
    image(await picture(src, width, height), width, height),
  )
}

/** A small label in the site's chip style */
const chip = (text, color) =>
  box(
    {
      alignItems: 'center',
      gap: 10,
      padding: '7px 14px',
      borderRadius: 9999,
      border: `1px solid ${color}55`,
      background: `${color}14`,
      fontFamily: MONO,
      fontSize: 19,
      color,
    },
    box({ width: 9, height: 9, borderRadius: 9999, background: color }),
    text,
  )

// =============================================
// The cards
// =============================================

/** Top row: the logo, and the page's address */
const header = (card) =>
  box(
    { justifyContent: 'space-between', alignItems: 'center', width: W - PAD_X * 2 },
    image(logo.src, logo.width, logo.height),
    box({ fontFamily: MONO, fontSize: 18, color: COLOR.muted }, card.address),
  )

/** The page around a card's content: the background, the header, the content below it */
const frame = (card, content) =>
  box(
    {
      flexDirection: 'column',
      width: W,
      height: H,
      padding: `${PAD_Y}px ${PAD_X}px`,
      backgroundColor: COLOR.page,
      // the teal glow of the site's background (SiteBackground.vue), faint
      backgroundImage:
        'radial-gradient(circle at 88% 8%, rgba(45, 212, 191, 0.16), rgba(45, 212, 191, 0) 45%), radial-gradient(circle at 0% 100%, rgba(45, 212, 191, 0.08), rgba(45, 212, 191, 0) 40%)',
    },
    header(card),
    box({ flexGrow: 1, width: W - PAD_X * 2, marginTop: 28 }, content),
  )

const CONTENT_W = W - PAD_X * 2

/** The text column: title, "$" line, text, and what follows it */
const textColumn = (card, width, { title = 64, command = 26, text, after = null }) =>
  box(
    { flexDirection: 'column', justifyContent: 'center', width, flexShrink: 0 },
    terminalTitle(card.title, width, title),
    box({ marginTop: 14 }, commandLine(card.command, width, command)),
    box({ marginTop: 30 }, paragraph(card.text, width, text)),
    after ? box({ marginTop: 30 }, after) : null,
  )

const LAYOUTS = {
  /** A project page: its header on the left, its two screenshots on the right, the phone over the corner */
  async project(card) {
    const stageW = 560
    const desktopW = Math.round(stageW * 0.84)
    const phoneW = Math.round(stageW * 0.25)
    const [desktop, mobile] = card.pictures
    // the badge as on the page: teal while live, grey otherwise, with what it doesn't say
    const { label, live, note } = card.status
    const status = box(
      { alignItems: 'center', gap: 16, flexWrap: 'wrap' },
      chip(label, live ? COLOR.accent : COLOR.secondary),
      note ? box({ fontFamily: MONO, fontSize: 18, color: COLOR.muted }, note) : null,
    )
    return box(
      { alignItems: 'center', justifyContent: 'space-between', width: CONTENT_W },
      textColumn(card, CONTENT_W - stageW - 48, { title: 64, text: { max: 36, min: 28, lines: 3 }, after: status }),
      box(
        { position: 'relative', width: stageW, height: 400 },
        box({ position: 'absolute', left: 0, top: 0 }, await browser(desktop.src, desktopW, card.site)),
        box({ position: 'absolute', right: 0, bottom: 0 }, await phone(mobile.src, phoneW)),
      ),
    )
  },

  /** Home: the name, the role, the bio, and Robbe's photo in a ring */
  async photo(card) {
    const size = 360
    return box(
      { alignItems: 'center', justifyContent: 'space-between', width: CONTENT_W },
      textColumn(card, CONTENT_W - size - 64, { title: 72, command: 30, text: { max: 32, min: 26, lines: 4, weight: 400 } }),
      box(
        { padding: 8, borderRadius: 9999, border: `3px solid ${COLOR.accent}`, boxShadow: '0 0 60px rgba(45, 212, 191, 0.25)' },
        image(await picture(card.pictures[0].src, size - 22, size - 22, 'centre'), size - 22, size - 22, { borderRadius: 9999 }),
      ),
    )
  },

  /** About: the page's two photos, as cards laid on each other */
  async photos(card) {
    const [teaching, riding] = card.pictures
    const stageW = 420
    const photo = (style, child) =>
      box({ position: 'absolute', borderRadius: 16, overflow: 'hidden', border: `1px solid ${COLOR.border}`, boxShadow: COLOR.shadow, ...style }, child)
    return box(
      { alignItems: 'center', justifyContent: 'space-between', width: CONTENT_W },
      textColumn(card, CONTENT_W - stageW - 48, { title: 72, command: 26, text: { max: 32, min: 26, lines: 5, weight: 400 } }),
      box(
        { position: 'relative', width: stageW, height: 420 },
        photo({ left: 0, top: 0, transform: 'rotate(-4deg)' }, image(await picture(teaching.src, 230, 310, 'centre'), 230, 310)),
        photo({ right: 0, bottom: 14, transform: 'rotate(3deg)' }, image(await picture(riding.src, 300, 210, 'centre'), 300, 210)),
      ),
    )
  },

  /** Projects: every project's screenshot, two by two */
  async projects(card) {
    const shotW = 270
    const shots = await Promise.all(card.pictures.map((p) => browser(p.src, shotW, p.label)))
    return box(
      { alignItems: 'center', justifyContent: 'space-between', width: CONTENT_W },
      textColumn(card, CONTENT_W - shotW * 2 - 18 - 56, { title: 72, text: { max: 36, min: 28, lines: 3 } }),
      box({ flexWrap: 'wrap', width: shotW * 2 + 18, gap: 18 }, shots),
    )
  },

  /** Tools: the two apps' first captures, as a deck */
  async tools(card) {
    const [front, back] = card.pictures
    const appW = 480
    return box(
      { alignItems: 'center', justifyContent: 'space-between', width: CONTENT_W },
      textColumn(card, CONTENT_W - appW - 90, {
        title: 72,
        text: { max: 36, min: 28, lines: 3 },
        after: box({ gap: 12, flexWrap: 'wrap' }, card.pictures.map((p) => chip(p.label, TOOL_COLOR[p.label] ?? COLOR.accent))),
      }),
      box(
        { position: 'relative', width: appW + 70, height: 420 },
        box({ position: 'absolute', right: 0, top: 0, transform: 'rotate(3deg)', opacity: 0.92 }, await appWindow(back.src, appW)),
        box({ position: 'absolute', left: 0, bottom: 0 }, await appWindow(front.src, appW)),
      ),
    )
  },

  /** Any other page: its header and description, large */
  async text(card) {
    return box(
      { alignItems: 'center', width: CONTENT_W },
      textColumn(card, 920, { title: 80, command: 30, text: { max: 38, min: 30, lines: 3, weight: 400, color: COLOR.text } }),
    )
  },
}

// =============================================
// Drawing, with a cache
// =============================================

const fontsHash = createHash('sha256')
for (const font of FONTS) fontsHash.update(font.data)
const salt = [readFileSync(fileURLToPath(import.meta.url)), fontsHash.digest('hex'), logo.svg, `${W}x${H}`]

async function draw(card) {
  const svg = await satori(frame(card, await LAYOUTS[card.kind](card)), { width: W, height: H, fonts: FONTS })
  // 256 colours, at full quality: a third of the size, which link previews load faster
  // (WhatsApp skips large images), and no visible difference
  return sharp(Buffer.from(svg)).png({ palette: true, quality: 100, effort: 10, compressionLevel: 9 }).toBuffer()
}

async function cacheKey(card) {
  const hash = createHash('sha256')
  for (const part of salt) hash.update(part)
  hash.update(JSON.stringify(card))
  for (const { src } of card.pictures) hash.update(readFileSync(join(root, 'public', src)))
  return hash.digest('hex').slice(0, 24)
}

const started = performance.now()
mkdirSync(cacheDir, { recursive: true })
let drawn = 0
let bytes = 0
const cards = shareCards()

for (const card of cards) {
  if (!LAYOUTS[card.kind]) throw new Error(`[og] no layout for "${card.kind}" (${card.path})`)
  const cached = join(cacheDir, `${await cacheKey(card)}.png`)
  let png
  if (existsSync(cached)) {
    png = readFileSync(cached)
  } else {
    png = await draw(card)
    writeFileSync(cached, png)
    drawn++
  }
  const out = join(distDir, card.file)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, png)
  bytes += png.length
}

const seconds = ((performance.now() - started) / 1000).toFixed(1)
console.log(
  `[og] ${cards.length} share images in dist/og/ (${drawn} drawn, ${cards.length - drawn} from the cache), ` +
    `${Math.round(bytes / cards.length / 1024)} KB on average, in ${seconds} s`,
)
