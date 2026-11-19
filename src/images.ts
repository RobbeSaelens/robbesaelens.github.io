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
 * How wide the screenshots on the project pages are shown (`sizes`; the layout is in
 * src/components/project/ProjectPage.vue). The page is the header's 1536px column less
 * its padding (100vw - 3rem below that); from 1024px the screenshots take the right 7/12.
 * - desktop: the capture at the top, 84% of its stage (the phone overlaps the rest)
 * - phone: the phone capture over it, about a quarter of the stage, inside its frame
 * - wide: a capture as wide as its half of a split (Stable Manager's Drupal version)
 * - next: the next project's capture in the band at the end, cropped to its half
 * - deck: the front card of a tool's captures on the tools page (ToolShots.vue): its 7/12,
 *   less the room the cards behind it take on the right
 */
export const SHOT_SIZES = {
  desktop: '(min-width: 1536px) 690px, (min-width: 1024px) 45vw, calc(84vw - 2.5rem)',
  phone: '(min-width: 1536px) 180px, (min-width: 1024px) 12vw, 25vw',
  wide: '(min-width: 1536px) 820px, (min-width: 1024px) 54vw, calc(100vw - 3rem)',
  next: '(min-width: 1536px) 820px, (min-width: 768px) 55vw, calc(100vw - 3rem)',
  deck: '(min-width: 1536px) 760px, (min-width: 1024px) 50vw, calc(93vw - 3rem)',
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
