/**
 * Scroll reveal: elements with the class `reveal` inside `root` rise into place when
 * they scroll into view (styles.css). Elements that come into view together follow
 * each other, left to right and top to bottom.
 *
 * Nothing is hidden until this runs (the `reveal-armed` class), so content never stays
 * invisible without JavaScript. Returns a function that stops watching.
 */
export function watchReveal(root: HTMLElement): () => void {
  const targets = [...root.querySelectorAll<HTMLElement>('.reveal')]
  const timers: number[] = []
  const show = (el: HTMLElement, delay: number) => {
    if (delay) {
      el.style.setProperty('--reveal-delay', `${delay}ms`)
      // Gone once it has risen, so it can't delay anything else on the element
      timers.push(window.setTimeout(() => el.style.removeProperty('--reveal-delay'), delay + 1200))
    }
    el.classList.add('is-visible')
  }

  if (typeof IntersectionObserver === 'undefined') {
    targets.forEach((el) => show(el, 0))
    return () => {}
  }

  let reported = false
  const observer = new IntersectionObserver(
    (entries) => {
      reported = true
      const seen = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target as HTMLElement)
        .sort((a, b) => {
          const ra = a.getBoundingClientRect()
          const rb = b.getBoundingClientRect()
          return Math.abs(ra.top - rb.top) > 24 ? ra.top - rb.top : ra.left - rb.left
        })
      seen.forEach((el, i) => {
        show(el, Math.min(i, 5) * 90)
        observer.unobserve(el)
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  )
  targets.forEach((el) => {
    el.classList.add('reveal-armed')
    observer.observe(el)
  })

  // The observer reports every element once right away. In a background tab that
  // report may never come: then show everything rather than leave it hidden.
  timers.push(
    window.setTimeout(() => {
      if (!reported) targets.forEach((el) => show(el, 0))
    }, 1500),
  )

  return () => {
    observer.disconnect()
    timers.forEach(clearTimeout)
  }
}
