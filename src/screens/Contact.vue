<template>
  <div class="about-page fade-out">
    <div class="about-inner mx-auto w-full max-w-screen-2xl px-4 sm:px-6">
      <TerminalHeader :title="$t('about.title').toLowerCase()" subtitle="cat ./about-me.md" />

      <div ref="gridRef" class="about-grid">
        <!-- Education and experience first, as text; teaching and riding carry the photos. -->
        <article class="about-card about-card--text card-education" style="--stagger-delay: 0ms">
          <GraduationCap class="card-deco" aria-hidden="true" :stroke-width="1" />
          <div class="card-body">
            <span class="card-tag">./education</span>
            <h2 class="card-title">
              <GraduationCap class="card-icon" :size="18" :stroke-width="2" />
              {{ $t('about.education') }}
            </h2>
            <p class="card-text">{{ $t('about.educationText1') }}</p>
            <i18n-t keypath="about.educationText2" tag="p" class="card-text">
              <template #link>
                <a
                  class="card-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://mct.be/programma/next-web-developer/"
                  >Next Web Developer</a
                >
              </template>
            </i18n-t>
          </div>
        </article>

        <article class="about-card about-card--text card-experience" style="--stagger-delay: 100ms">
          <Briefcase class="card-deco" aria-hidden="true" :stroke-width="1" />
          <div class="card-body">
            <span class="card-tag">./experience</span>
            <h2 class="card-title">
              <Briefcase class="card-icon" :size="18" :stroke-width="2" />
              {{ $t('about.experience') }}
            </h2>
            <i18n-t keypath="about.experienceText1" tag="p" class="card-text">
              <template #link1>
                <a
                  class="card-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.yourmindourwork.be/"
                  >Your Mind Our Work</a
                >
              </template>
              <template #role>
                <strong>{{ $t('about.phpMagentoDev') }}</strong>
              </template>
            </i18n-t>
            <i18n-t keypath="about.experienceText2" tag="p" class="card-text">
              <template #role>
                <strong>{{ $t('about.juniorBackendDev') }}</strong>
              </template>
              <template #link2>
                <a
                  class="card-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.dynamate.be/"
                  >Dynamate</a
                >
              </template>
            </i18n-t>
          </div>
        </article>

        <article class="about-card about-card--photo card-teaching" style="--stagger-delay: 200ms" tabindex="0">
          <div class="card-media">
            <img
              src="/about.jpg"
              alt="Robbe Saelens teaching equestrian sports"
              class="card-image"
              loading="lazy"
            />
            <span class="card-slug">./teaching</span>
          </div>
          <div class="card-body">
            <h2 class="card-title">
              <BookOpen class="card-icon" :size="18" :stroke-width="2" />
              {{ $t('about.teaching') }}
            </h2>
            <div class="card-reveal">
              <p class="card-text">{{ $t('about.teachingText') }}</p>
            </div>
          </div>
        </article>

        <article class="about-card about-card--photo card-riding" style="--stagger-delay: 300ms" tabindex="0">
          <div class="card-media">
            <img
              src="/horse.jpg"
              alt="Robbe Saelens show jumping at an equestrian competition"
              class="card-image"
              loading="lazy"
            />
            <span class="card-slug">./riding</span>
          </div>
          <div class="card-body">
            <h2 class="card-title">
              <Trophy class="card-icon" :size="18" :stroke-width="2" />
              {{ $t('about.competing') }}
            </h2>
            <div class="card-reveal">
              <p class="card-text">{{ $t('about.competingText') }}</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Briefcase, GraduationCap, BookOpen, Trophy } from 'lucide-vue-next'
import TerminalHeader from '../components/TerminalHeader.vue'

export default {
  name: 'About',

  components: {
    Briefcase,
    GraduationCap,
    BookOpen,
    Trophy,
    TerminalHeader,
  },

  data() {
    return {
      observer: null as IntersectionObserver | null,
    }
  },

  mounted() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          this.observer!.unobserve(entry.target)
        })
      },
      { threshold: 0.12 },
    )

    const grid = this.$refs.gridRef as HTMLElement | undefined
    grid?.querySelectorAll('.about-card').forEach((card) => this.observer!.observe(card))
  },

  beforeUnmount() {
    this.observer?.disconnect()
  },
}
</script>

<style scoped>
/* One screen (route meta.fit): header, then the cards fill what is left.
   Photos take the leftover height, text keeps its natural size. On short
   screens (below 560px, where fit is off) the page scrolls as usual. */
.about-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  color: var(--color-text-primary);
}

.about-inner {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding-bottom: clamp(1rem, 3vh, 2rem);
}

/* =============================================
   Layout
   Desktop: education and experience stacked on the left, the two photo
   cards side by side next to them, all filling the screen height.
   Tablet: the two text cards on top, the photo cards below.
   Phone: one swipeable row, in reading order.
   ============================================= */
.about-grid {
  display: grid;
  flex: 1;
  min-height: 0;
  gap: 1.25rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
}

@media (min-width: 1000px) {
  .about-grid {
    /* The text column is a little wider: fewer lines, so both texts fit its half height. */
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }
  .card-education {
    grid-area: 1 / 1;
  }
  .card-experience {
    grid-area: 2 / 1;
  }
  .card-teaching {
    grid-area: 1 / 2 / 3 / 3;
  }
  .card-riding {
    grid-area: 1 / 3 / 3 / 4;
  }
}

@media (min-width: 1400px) {
  .about-grid {
    gap: 1.75rem;
  }
}

/* =============================================
   Card
   ============================================= */
.about-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.02);

  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  transition-delay: var(--stagger-delay, 0ms);
}

.about-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (hover: hover) and (pointer: fine) {
  .about-card:hover {
    border-color: var(--color-border-glow);
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.06),
      0 0 0 1px var(--color-border-glow);
  }
  .about-card:hover .card-image {
    transform: scale(1.04);
  }
}

/* Text cards: an accent edge instead of a photo, content centred in the space */
.about-card--text {
  position: relative;
  justify-content: flex-start;
  background:
    radial-gradient(120% 90% at 100% 0%, var(--color-accent-soft), transparent 60%),
    var(--color-surface);
}
.about-card--text::before {
  content: '';
  position: absolute;
  inset: 1.25rem auto 1.25rem 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--color-accent);
  opacity: 0.7;
}

/* Large faint icon in the corner, so a tall text card doesn't look empty */
.card-deco {
  position: absolute;
  right: -1.25rem;
  bottom: -1.25rem;
  width: clamp(6rem, 32%, 11rem);
  height: auto;
  color: var(--color-accent);
  opacity: 0.08;
  pointer-events: none;
}
.about-card--text .card-body {
  position: relative; /* above the icon */
}

/* Text scales with the screen height on desktop, where the cards have room */
@media (min-width: 1000px) {
  .about-card--text .card-title {
    font-size: clamp(1rem, 0.25rem + 1.35vh, 1.5rem);
  }
  .about-card--text .card-text {
    font-size: clamp(0.875rem, 0.15rem + 1.3vh, 1.125rem);
  }
}

/* Top-right corner, beside the title, so it costs no height */
.card-tag {
  position: absolute;
  top: clamp(0.75rem, 2vh, 1.25rem);
  right: 1rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border-glow);
  border-radius: 100px;
  padding: 0.15rem 0.625rem;
  line-height: 1.5;
}

/* === Photo cards: the photo fills the card; title and text sit on it === */
.about-card--photo {
  position: relative;
  outline: none;
}
.about-card--photo:focus-visible {
  box-shadow: 0 0 0 3px var(--color-accent);
}

.card-media {
  position: relative;
  flex: 1 1 0;
  min-height: 6rem;
  overflow: hidden;
  background: var(--color-accent-soft);
}

.about-card--photo .card-body {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 1;
  gap: 0;
  overflow: visible;
  padding: 3rem 1.25rem 1.125rem;
  background: linear-gradient(to top, rgba(8, 20, 26, 0.9) 0%, rgba(8, 20, 26, 0.72) 55%, transparent 100%);
}
.about-card--photo .card-title {
  color: #fff;
}
.about-card--photo .card-icon {
  color: #6ee7d8;
}
.about-card--photo .card-text {
  padding-top: 0.5rem;
  color: rgba(255, 255, 255, 0.86);
}

/* The text folds open (0fr -> 1fr) on hover or keyboard focus; touch screens always show it */
.card-reveal {
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows 0.45s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.35s ease;
}
.card-reveal > * {
  min-height: 0;
  overflow: hidden;
}
@media (hover: hover) and (pointer: fine) {
  .about-card--photo .card-reveal {
    grid-template-rows: 0fr;
    opacity: 0;
  }
  .about-card--photo:hover .card-reveal,
  .about-card--photo:focus-within .card-reveal {
    grid-template-rows: 1fr;
    opacity: 1;
  }
  .about-card--photo .card-image {
    transition:
      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
      filter 0.4s ease;
  }
  .about-card--photo:hover .card-image,
  .about-card--photo:focus-within .card-image {
    filter: brightness(0.8);
  }
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Light top scrim keeps the slug readable over any photo */
.card-media::after {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 25%;
  background: linear-gradient(to bottom, rgba(8, 20, 26, 0.35), transparent);
  pointer-events: none;
}

.card-slug {
  position: absolute;
  left: 0.875rem;
  top: 0.75rem;
  z-index: 1;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(8, 20, 26, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 100px;
  padding: 0.2rem 0.625rem;
  line-height: 1.5;
}

/* === Body: natural height; scrolls only as a last resort on cramped screens === */
.card-body {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
  overflow-y: auto;
  padding: 1.125rem 1.25rem 1.25rem;
}
.about-card--text .card-body {
  gap: clamp(0.375rem, 1vh, 0.625rem);
  padding: clamp(0.875rem, 2.2vh, 1.5rem) 1.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-family: var(--font-mono);
  font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
  overflow-wrap: anywhere;
}

.card-icon {
  flex-shrink: 0;
  color: var(--color-accent);
}

.card-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  overflow-wrap: break-word;
}

.card-link {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 500;
  overflow-wrap: anywhere;
  color: var(--color-accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}
.card-link:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
}

.card-text strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

@media (min-width: 1400px) {
  .card-body {
    padding: 1.25rem 1.5rem 1.5rem;
  }
  .card-text {
    font-size: 0.9375rem;
  }
}

/* Laptop-height screens: a little tighter so both texts fit their half */
@media (min-width: 1000px) and (max-height: 820px) {
  .about-card--text .card-text {
    line-height: 1.5;
  }
  .about-card--text .card-body {
    gap: 0.375rem;
    padding: 0.875rem 1.5rem 0.625rem;
  }
}

/* =============================================
   Phones: one card per screen width, swipe for the next
   ============================================= */
@media (max-width: 639px) {
  .about-grid {
    grid-template-columns: none;
    grid-template-rows: minmax(0, 1fr);
    grid-auto-flow: column;
    grid-auto-columns: 86%;
    gap: 0.875rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    /* Bleed to the screen edges so a swiped card isn't cut by the page padding */
    margin: 0 -1rem;
    padding: 0 1rem 0.25rem;
    scroll-padding: 0 1rem;
  }
  .about-grid::-webkit-scrollbar {
    display: none;
  }
  .about-card {
    scroll-snap-align: start;
  }
  .card-body {
    padding: 1rem 1.125rem 1.25rem;
  }
  .about-card--text .card-body {
    padding: 3.25rem 1.25rem 1.25rem; /* clear of the tag */
  }
  .card-deco {
    width: 55%;
    right: -2rem;
    bottom: -2rem;
  }
  .card-text {
    font-size: 0.9375rem;
  }
  .card-slug {
    left: 0.75rem;
    top: 0.625rem;
  }
}

/* Too short for one screen (fit is off): ordinary stacked page with fixed photo crops */
@media (max-height: 559px) {
  .about-grid {
    grid-template-rows: none;
  }
  .card-education,
  .card-experience,
  .card-teaching,
  .card-riding {
    grid-area: auto;
  }
  .card-media {
    flex: none;
    aspect-ratio: 16 / 9;
  }
  .card-body {
    overflow: visible;
  }
}

/* =============================================
   Reduced Motion
   ============================================= */
@media (prefers-reduced-motion: reduce) {
  .about-card {
    opacity: 1;
    transform: none;
    transition:
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }
  .card-image,
  .card-reveal {
    transition: none;
  }
}
</style>
