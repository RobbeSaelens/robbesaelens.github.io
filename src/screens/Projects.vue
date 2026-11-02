<template>
  <div class="car" @wheel.passive="onWheel">
    <header class="car-head">
      <div>
        <!-- Same terminal title as the other pages (TerminalHeader), sized for a one-screen layout. -->
        <h1 class="hero-in terminal-title text-2xl font-bold sm:text-3xl lg:text-5xl" style="--i: 0">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('nav.projects').toLowerCase() }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="hero-in terminal-subtitle car-intro text-sm tracking-wide md:text-base" style="--i: 1">
          <span class="opacity-50">$</span> ls ./projects
          <span class="car-comment"># {{ $t('projects.intro') }}</span>
        </p>
      </div>

      <div class="hero-in car-nav" style="--i: 1">
        <span class="car-count" aria-hidden="true">
          <Transition name="count" mode="out-in">
            <span :key="current" class="car-count-now">{{ pad(current + 1) }}</span>
          </Transition>
          <span class="car-count-total">/{{ pad(projects.length) }}</span>
        </span>
        <button
          type="button"
          class="car-btn"
          :aria-label="$t('projects.prev')"
          :disabled="current === 0"
          @click="go(current - 1)"
        >
          <ArrowLeft :size="20" />
        </button>
        <button
          type="button"
          class="car-btn"
          :aria-label="$t('projects.next')"
          :disabled="current === projects.length - 1"
          @click="go(current + 1)"
        >
          <ArrowRight :size="20" />
        </button>
      </div>
    </header>

    <ul
      ref="track"
      class="hero-in car-track"
      style="--i: 2"
      :class="{ 'is-dragging': dragging }"
      tabindex="0"
      :aria-label="$t('nav.projects')"
      @scroll.passive="onScroll"
      @pointerdown="dragStart"
      @keydown.left.prevent="go(current - 1)"
      @keydown.right.prevent="go(current + 1)"
    >
      <li
        v-for="(project, index) in projects"
        :key="project.id"
        class="car-slide"
        :class="{ 'is-current': index === current, 'is-soon': !project.route }"
      >
        <component
          :is="project.route ? 'router-link' : 'div'"
          :to="project.route ? { name: $ln(project.route) } : undefined"
          class="car-card"
          draggable="false"
          @click="onCardClick($event, index)"
        >
          <!-- Mockup: the desktop screenshot in a browser window, the phone screenshot overlapping it. -->
          <div class="car-stage">
            <div v-if="project.image" class="car-mock">
              <div class="car-browser">
                <div class="car-chrome" aria-hidden="true">
                  <span class="car-chrome-dots"><i></i><i></i><i></i></span>
                  <span class="car-chrome-url">{{ project.host }}</span>
                </div>
                <img
                  class="car-shot"
                  :src="project.image"
                  :alt="`${project.name} project screenshot`"
                  width="1600"
                  height="1000"
                  draggable="false"
                  :loading="index < 2 ? 'eager' : 'lazy'"
                />
              </div>
              <img
                class="car-phone"
                :src="project.mobileImage"
                :alt="`${project.name} on mobile`"
                width="470"
                height="800"
                draggable="false"
                :loading="index < 2 ? 'eager' : 'lazy'"
              />
            </div>
            <div v-else class="car-soon" aria-hidden="true">+</div>
          </div>

          <div class="car-caption">
            <div class="car-caption-text">
              <h2 class="car-name">
                <span class="terminal-prompt">&gt;</span>
                {{ project.route ? project.name : $t('projects.comingSoon') }}
              </h2>
              <p class="car-tagline">
                <span class="opacity-50">#</span> {{ $t(`projects.items.${project.id}.tagline`) }}
              </p>
            </div>
            <div class="car-meta">
              <span class="tag-pill car-status" :class="`is-${project.status}`">
                <span v-if="project.status === 'live' || project.status === 'private'" class="dot"></span>
                {{ $t(STATUS_KEYS[project.status]) }}
              </span>
              <span v-if="project.route" class="car-cta" aria-hidden="true">
                {{ $t('projects.viewCase') }}
                <ArrowUpRight :size="16" :stroke-width="2.25" />
              </span>
            </div>
          </div>
        </component>
      </li>
    </ul>

    <div class="hero-in car-dots" style="--i: 3">
      <button
        v-for="(project, index) in projects"
        :key="project.id"
        type="button"
        class="car-dot"
        :class="{ 'is-current': index === current }"
        :aria-label="project.route ? project.name : $t('projects.comingSoon')"
        :aria-current="index === current ? 'true' : undefined"
        @click="go(index)"
      >
        <span></span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-vue-next'

type Status = 'live' | 'private' | 'rebranding' | 'soon'

interface Project {
  id: string
  name: string
  /** Shown in the mockup's address bar. */
  host?: string
  image?: string
  mobileImage?: string
  route?: string
  status: Status
}

// Copy (taglines) lives in the locale files under projects.items.<id>.
const PROJECTS: Project[] = [
  {
    id: 'exulta',
    name: 'Exulta',
    host: 'exulta.be',
    image: '/exulta-home.jpg',
    mobileImage: '/exulta-mobile.jpg',
    route: 'ExultaDetail',
    status: 'live',
  },
  {
    id: 'scan2talk',
    name: 'Scan2Talk',
    host: 'scan2talk.be',
    image: '/scan2talk-home.jpg',
    mobileImage: '/scan2talk-mobile.jpg',
    route: 'Scan2TalkDetail',
    status: 'live',
  },
  {
    id: 'stal-manager',
    name: 'Stal Manager',
    host: 'stal-manager',
    image: '/stal-manager-home.jpg',
    mobileImage: '/stal-manager-mobile.jpg',
    route: 'StalManagerDetail',
    status: 'private',
  },
  {
    id: 'vhs',
    name: 'VHS Service',
    host: 'vhs-service',
    image: '/vhs-home.jpg',
    mobileImage: '/vhs-mobile.jpg',
    route: 'VHSDetail',
    status: 'rebranding',
  },
  { id: 'coming-soon', name: 'Coming soon', status: 'soon' },
]

const STATUS_KEYS: Record<Status, string> = {
  live: 'projects.live',
  private: 'projects.private',
  rebranding: 'projects.rebranding',
  soon: 'projects.inProgress',
}

export default {
  name: 'ProjectsScreen',
  components: { ArrowLeft, ArrowRight, ArrowUpRight },

  data() {
    return {
      projects: PROJECTS,
      STATUS_KEYS,
      current: 0,
      dragging: false,
      moved: false,
      startX: 0,
      startLeft: 0,
      wheelLocked: false,
      wheelTimer: 0,
    }
  },

  beforeUnmount() {
    window.removeEventListener('pointermove', this.dragMove)
    window.removeEventListener('pointerup', this.dragEnd)
    clearTimeout(this.wheelTimer)
  },

  methods: {
    pad(n: number) {
      return String(n).padStart(2, '0')
    },
    track(): HTMLElement {
      return this.$refs.track as HTMLElement
    },
    go(index: number) {
      const i = Math.max(0, Math.min(this.projects.length - 1, index))
      const t = this.track()
      const slide = t.children[i] as HTMLElement
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      t.scrollTo({
        left: slide.offsetLeft - (t.clientWidth - slide.offsetWidth) / 2,
        behavior: reduced ? 'auto' : 'smooth',
      })
    },
    /** The slide closest to the middle of the track is the current one. */
    onScroll() {
      const t = this.track()
      const center = t.scrollLeft + t.clientWidth / 2
      let best = 0
      let bestDist = Infinity
      ;[...t.children].forEach((child, i) => {
        const el = child as HTMLElement
        const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center)
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      })
      this.current = best
    },
    /** The page doesn't scroll vertically, so a vertical wheel gesture steps one slide. */
    onWheel(event: WheelEvent) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || Math.abs(event.deltaY) < 8) return
      if (!window.matchMedia('(min-height: 560px)').matches) return
      // Trackpads keep firing during inertia; unlock only once the gesture goes quiet.
      clearTimeout(this.wheelTimer)
      this.wheelTimer = window.setTimeout(() => (this.wheelLocked = false), 220)
      if (this.wheelLocked) return
      this.wheelLocked = true
      this.go(this.current + Math.sign(event.deltaY))
    },
    /** Mouse drag to scroll; touch already scrolls natively. */
    dragStart(event: PointerEvent) {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      this.dragging = true
      this.moved = false
      this.startX = event.clientX
      this.startLeft = this.track().scrollLeft
      window.addEventListener('pointermove', this.dragMove)
      window.addEventListener('pointerup', this.dragEnd)
    },
    dragMove(event: PointerEvent) {
      const dx = event.clientX - this.startX
      if (Math.abs(dx) > 5) this.moved = true
      this.track().scrollLeft = this.startLeft - dx
    },
    dragEnd() {
      this.dragging = false
      window.removeEventListener('pointermove', this.dragMove)
      window.removeEventListener('pointerup', this.dragEnd)
      if (this.moved) this.go(this.current)
    },
    /** A drag isn't a click, and clicking a peeking slide brings it to the middle first. */
    onCardClick(event: MouseEvent, index: number) {
      if (this.moved) {
        event.preventDefault()
        this.moved = false
      } else if (index !== this.current && event.detail > 0) {
        event.preventDefault()
        this.go(index)
      }
    },
  },
}
</script>

<style scoped>
/* Fills the space between header and footer; the slides take whatever height is left. */
.car {
  /* Same content width as the home and contact pages (max-w-screen-2xl + px-6). */
  --gutter: max(1.5rem, calc((100% - 1536px) / 2 + 1.5rem));
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.car-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  padding: clamp(1rem, 3.5vh, 2.25rem) var(--gutter) clamp(0.25rem, 1.5vh, 0.75rem);
}
.car-intro {
  margin-top: clamp(0.5rem, 1.5vh, 1.25rem);
}
.car-comment {
  margin-left: 0.5rem;
  color: var(--color-text-muted);
}

.car-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
}
.car-count {
  display: inline-flex;
  align-items: baseline;
  margin-right: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.car-count-now {
  display: inline-block;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-accent);
}
.car-count-total {
  font-size: 1rem;
  color: var(--color-text-muted);
}
.count-enter-active,
.count-leave-active {
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.25s ease;
}
.count-enter-from {
  opacity: 0;
  transform: translateY(0.6em);
}
.count-leave-to {
  opacity: 0;
  transform: translateY(-0.6em);
}
/* Keycap buttons, like the terminal FAB and windows elsewhere on the site. */
.car-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-glow);
  border-bottom-width: 3px;
  color: var(--color-accent);
  background: var(--color-surface);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.1s ease,
    opacity 0.2s ease;
}
.car-btn:hover:not(:disabled) {
  background: var(--color-accent-soft);
  box-shadow: 0 0 16px var(--color-border-glow);
}
.car-btn:active:not(:disabled) {
  transform: translateY(2px);
  border-bottom-width: 1px;
}
.car-btn:disabled {
  opacity: 0.35;
}

/* Size container: slides are sized from the track's own height (cqh) and width (cqw). */
.car-track {
  container-type: size;
  display: flex;
  flex: 1;
  gap: clamp(1rem, 2.2vw, 2rem);
  min-height: 18rem;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  /* Vertical padding leaves room for the slide shadow, which the scroller would clip. */
  padding: clamp(1rem, 3vh, 1.75rem) var(--gutter) clamp(2rem, 6vh, 3.5rem);
  scroll-padding: 0 var(--gutter);
  outline: none;
  cursor: grab;
}
.car-track::-webkit-scrollbar {
  display: none;
}
.car-track.is-dragging {
  scroll-snap-type: none;
  cursor: grabbing;
}
.car-track:focus-visible .car-slide.is-current .car-card {
  outline: 3px solid var(--color-accent);
  outline-offset: 4px;
}

/* Slide width follows the track height (minus the caption), capped by the track width. */
.car-slide {
  flex: 0 0 min(82cqw, calc((100cqh - 6.5rem) * 1.9));
  scroll-snap-align: center;
  opacity: 0.45;
  transform: scale(0.92);
  transition:
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.6s ease;
}
.car-slide.is-current {
  opacity: 1;
  transform: none;
}

.car-card {
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vh, 1.25rem);
  height: 100%;
  user-select: none;
  outline: none;
}

/* Stage: a soft teal glow over a faint terminal grid, holding the mockup. */
.car-stage {
  container-type: size;
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  border-radius: 1.5rem;
  border: 1px solid var(--color-border);
  background:
    radial-gradient(120% 90% at 30% 20%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 65%),
    linear-gradient(var(--color-border) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(90deg, var(--color-border) 1px, transparent 1px) 0 0 / 28px 28px,
    var(--color-surface);
  box-shadow:
    0 1px 2px rgba(8, 40, 38, 0.06),
    0 12px 28px -16px rgba(8, 40, 38, 0.25);
  transition: box-shadow 0.6s ease;
}
/* Layered shadow: tight contact shadow, soft depth, and a teal glow underneath. */
.car-slide.is-current .car-stage {
  box-shadow:
    0 1px 2px rgba(8, 40, 38, 0.08),
    0 18px 36px -20px rgba(8, 40, 38, 0.35),
    0 40px 80px -40px color-mix(in srgb, var(--color-accent) 50%, transparent);
}
.dark .car-stage {
  box-shadow: 0 16px 40px -20px rgba(0, 0, 0, 0.8);
}
.dark .car-slide.is-current .car-stage {
  box-shadow:
    0 24px 50px -24px rgba(0, 0, 0, 0.9),
    0 40px 90px -40px color-mix(in srgb, var(--color-accent) 40%, transparent);
}

/* Browser sized to fit the stage both ways; the phone hangs off its bottom-right corner. */
.car-mock {
  position: relative;
  width: min(70cqw, calc((76cqh - 1.9rem) * 1.6));
  transform: translateX(-4%);
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.car-browser {
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow:
    0 2px 4px rgba(8, 40, 38, 0.06),
    0 24px 50px -24px rgba(8, 40, 38, 0.45);
}
.car-chrome {
  display: grid;
  grid-template-columns: 2.5rem 1fr 2.5rem;
  align-items: center;
  height: 1.9rem;
  padding: 0 0.7rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-hover);
}
.car-chrome-dots {
  display: flex;
  gap: 0.3rem;
}
.car-chrome-dots i {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #ef4444;
}
.car-chrome-dots i:nth-child(2) {
  background: #f59e0b;
}
.car-chrome-dots i:nth-child(3) {
  background: #22c55e;
}
.car-chrome-url {
  justify-self: center;
  max-width: 100%;
  overflow: hidden;
  padding: 0.1rem 0.9rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-text-muted);
  background: var(--color-accent-soft);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.car-shot {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  object-position: top;
}
.car-phone {
  position: absolute;
  right: -9%;
  bottom: -10%;
  width: 21%;
  aspect-ratio: 470 / 800;
  object-fit: cover;
  object-position: top;
  border: 4px solid #0b1215;
  border-radius: 1rem;
  background: #0b1215;
  box-shadow: 0 24px 40px -16px rgba(0, 0, 0, 0.55);
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
@media (hover: hover) {
  .car-slide.is-current .car-card:hover .car-mock {
    transform: translateX(-4%) translateY(-4px);
  }
  .car-slide.is-current .car-card:hover .car-phone {
    transform: translateY(-10px);
  }
  .car-slide.is-current .car-card:hover .car-cta {
    background: var(--color-accent-soft);
    box-shadow: 0 0 16px var(--color-border-glow);
  }
}

.car-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 1rem;
  border: 2px dashed var(--color-border-glow);
  font-family: var(--font-mono);
  font-size: 2.5rem;
  color: var(--color-accent);
  background: var(--color-surface);
}
.car-slide.is-soon .car-stage {
  border: 2px dashed var(--color-border-glow);
  box-shadow: none;
}

/* Caption under the stage, in the terminal type; it rises in when the slide becomes current. */
.car-caption {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.25rem;
}
.car-caption > * {
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.5s ease,
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.car-slide.is-current .car-caption > * {
  opacity: 1;
  transform: none;
}
.car-slide.is-current .car-caption > :nth-child(1) {
  transition-delay: 0.12s;
}
.car-slide.is-current .car-caption > :nth-child(2) {
  transition-delay: 0.22s;
}
.car-caption-text {
  min-width: 0;
}
.car-name {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: clamp(1.2rem, 2vw, 1.65rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text-primary);
}
.car-tagline {
  margin-top: 0.3rem;
  font-family: var(--font-mono);
  font-size: clamp(0.78rem, 1vw, 0.9rem);
  color: var(--color-text-secondary);
}
.car-meta {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.75rem;
}
.car-status {
  gap: 0.4rem;
}
.car-status.is-rebranding,
.car-status.is-soon {
  color: var(--color-text-muted);
}
/* Keycap, like the arrow buttons. */
.car-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-glow);
  border-bottom-width: 3px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-accent);
  background: var(--color-surface);
  white-space: nowrap;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: currentColor;
  animation: pulse 1.8s ease-in-out infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}

/* Page dots double as the progress indicator; they sit in the track's bottom padding. */
.car-dots {
  display: flex;
  gap: 0.25rem;
  margin-top: calc(-1 * clamp(1.25rem, 4vh, 2.25rem));
  padding: 0 var(--gutter) clamp(0.5rem, 2vh, 1.25rem);
}
.car-dot {
  padding: 0.5rem 0.2rem;
}
.car-dot span {
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--color-border-glow);
  transition:
    width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.3s ease;
}
.car-dot:hover span {
  background: var(--color-accent);
}
.car-dot.is-current span {
  width: 2rem;
  background: var(--color-accent);
}

@media (max-width: 640px) {
  .car {
    --gutter: 1rem; /* contact's px-4 on phones: more room for the slides */
  }
  .car-nav,
  .car-comment,
  .car-cta {
    display: none;
  }
  .car-slide {
    flex-basis: 84cqw;
  }
  .car-stage {
    border-radius: 1.25rem;
  }
  .car-mock {
    width: min(74cqw, calc((70cqh - 1.9rem) * 1.6));
    transform: translateX(-7%);
  }
  .car-phone {
    right: -14%;
    bottom: -22%;
    width: 32%;
    border-width: 3px;
    border-radius: 0.75rem;
  }
  .car-caption {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: none;
  }
  .car-slide,
  .car-mock,
  .car-phone,
  .car-caption > *,
  .car-dot span {
    transition: none;
  }
}
</style>
