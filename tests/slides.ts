import type { Page } from '@playwright/test'

/** The project slides with a MacBook, and the screenshot on its screen. */
export const SLIDES = [
  { name: 'Exulta', screenshot: '/exulta-home.jpg' },
  { name: 'Scan2Talk', screenshot: '/scan2talk-home.jpg' },
  { name: 'Stal Manager', screenshot: '/stal-manager-home.jpg' },
  { name: 'VHS Service', screenshot: '/vhs-home.jpg' },
]

/**
 * The current slide's stage against the caption under it, and where the 3D MacBook
 * (MacBook3D.vue) is drawn: the union of its visible faces.
 */
export function measureCurrentSlide(page: Page) {
  return page.evaluate(() => {
    const slide = document.querySelector('.car-slide.is-current')!
    const stage = slide.querySelector('.car-stage')!.getBoundingClientRect()
    const track = document.querySelector('.car-track')!.getBoundingClientRect()
    const caption = slide.querySelector('.car-caption')!.getBoundingClientRect()
    const shot = slide.querySelector<HTMLImageElement>('img.mb-shot')!
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const face of slide.querySelectorAll('.mb-base-top, .mb-base-layer, .mb-lid-front, .mb-lid-back')) {
      const r = face.getBoundingClientRect()
      x0 = Math.min(x0, r.left)
      y0 = Math.min(y0, r.top)
      x1 = Math.max(x1, r.right)
      y1 = Math.max(y1, r.bottom)
    }
    return {
      screenshot: shot.getAttribute('src'),
      loaded: shot.complete && shot.naturalWidth > 0,
      left: stage.left - caption.left,
      right: stage.right - caption.right,
      /**
       * The whole MacBook is shown: it may reach a little past its stage (into the
       * space above it, give or take the sway), but the carousel doesn't cut it off
       * and it stays clear of the caption under it
       */
      inside:
        y0 >= track.top &&
        y1 <= caption.top &&
        x0 >= stage.left - stage.width * 0.06 &&
        x1 <= stage.right + stage.width * 0.06,
      /** How much of the stage the MacBook takes, across or down (whichever limits it) */
      share: Math.max((x1 - x0) / stage.width, (y1 - y0) / stage.height),
      /** Its height against the stage's: over 1 when it reaches past it */
      height: (y1 - y0) / stage.height,
    }
  })
}
