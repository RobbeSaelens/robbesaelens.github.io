/**
 * The AVIF and WebP copies the build makes of each screenshot JPG in public/
 * (scripts/images.mjs): at the JPG's width and at half of it, in /img.
 *
 *   /exulta-home.jpg → /img/exulta-home.avif, /img/exulta-home-half.avif (and .webp)
 */

/** The screenshots that get copies: keep in step with SCREENSHOT in scripts/images.mjs */
const SCREENSHOT = /^\/([\w-]+-(?:home|mobile|poster))\.jpg$/

export type ImageFormat = 'avif' | 'webp'

/** The browsers try them in this order; the JPG is the fallback. */
export const FORMATS: { format: ImageFormat; type: string }[] = [
  { format: 'avif', type: 'image/avif' },
  { format: 'webp', type: 'image/webp' },
]

/**
 * How wide the screenshots on the project pages are shown (`sizes`; the widths are in
 * src/assets/project-page.css): a desktop capture at most 720px, or the page width
 * less its padding; a phone capture about 205px inside its frame.
 */
export const SHOT_SIZES = {
  desktop: '(min-width: 768px) 720px, calc(100vw - 3rem)',
  phone: '205px',
}

/** A copy of a screenshot, or null when `src` is not one that gets copies. */
export function variant(src: string, format: ImageFormat, half = false): string | null {
  const name = SCREENSHOT.exec(src)?.[1]
  return name ? `/img/${name}${half ? '-half' : ''}.${format}` : null
}

/**
 * A srcset of both widths, for a JPG `width` pixels wide (its real width: the half
 * copy is that rounded, like the script does).
 */
export function variantSrcset(src: string, format: ImageFormat, width: number): string | null {
  const full = variant(src, format)
  const half = variant(src, format, true)
  return full && half ? `${half} ${Math.round(width / 2)}w, ${full} ${width}w` : null
}
