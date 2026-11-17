// Smaller copies of the project screenshots, made before every build (and before
// `npm run dev`), so replacing a screenshot is still dropping in one JPG.
//
// Every screenshot in public/ (<name>-home.jpg, <name>-mobile.jpg, <name>-poster.jpg)
// gets an AVIF and a WebP copy at its own width and at half of it, in public/img/
// (gitignored; Vite copies public/ into dist/):
//
//   public/exulta-home.jpg → img/exulta-home.avif, img/exulta-home.webp,
//                            img/exulta-home-half.avif, img/exulta-home-half.webp
//
// The pages show them through ShotPicture.vue (src/images.ts holds the same naming),
// with the JPG as the fallback and as og:image. Copies newer than their JPG are kept;
// copies of a JPG that is gone are removed.
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const outDir = join(publicDir, 'img')

/** The screenshots: keep in step with SCREENSHOT in src/images.ts */
const SCREENSHOT = /-(home|mobile|poster)\.jpg$/

/**
 * Screenshots are text and flat colour: AVIF keeps full colour resolution (4:4:4) so
 * thin coloured text stays sharp, at a quality where the text doesn't smear.
 */
const FORMATS = {
  avif: (image) => image.avif({ quality: 60, effort: 5, chromaSubsampling: '4:4:4' }),
  webp: (image) => image.webp({ quality: 80, effort: 5 }),
}

mkdirSync(outDir, { recursive: true })

const sources = readdirSync(publicDir).filter((file) => SCREENSHOT.test(file))
const wanted = new Set()
let made = 0

for (const file of sources) {
  const source = join(publicDir, file)
  const name = file.replace(/\.jpg$/, '')
  const changed = statSync(source).mtimeMs
  const { width } = await sharp(source).metadata()

  for (const [suffix, w] of [['', width], ['-half', Math.round(width / 2)]]) {
    for (const [ext, encode] of Object.entries(FORMATS)) {
      const out = `${name}${suffix}.${ext}`
      wanted.add(out)
      const target = join(outDir, out)
      let fresh = false
      try {
        fresh = statSync(target).mtimeMs >= changed
      } catch {}
      if (fresh) continue
      await encode(sharp(source).resize({ width: w })).toFile(target)
      made++
    }
  }
}

let removed = 0
for (const file of readdirSync(outDir)) {
  if (wanted.has(file)) continue
  rmSync(join(outDir, file))
  removed++
}

console.log(
  `[images] ${sources.length} screenshots: ${made} copies made, ${wanted.size - made} up to date` +
    (removed ? `, ${removed} stale removed` : ''),
)
