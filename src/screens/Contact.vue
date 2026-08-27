<template>
  <div class="about-page fade-out flex flex-1 flex-col">
    <div class="mx-auto w-full max-w-screen-2xl px-4 pb-8 sm:px-6">
      <TerminalHeader :title="$t('about.title').toLowerCase()" subtitle="cat ./about-me.md" />

      <div ref="gridRef" class="about-grid">
        <!-- Teaching -->
        <article class="about-card" style="--stagger-delay: 0ms">
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
            <i18n-t keypath="about.teachingText" tag="p" class="card-text">
              <template #link>
                <a
                  class="card-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.sport.vlaanderen/onze-centra/woumen/"
                  >Sport Vlaanderen Woumen</a
                >
              </template>
            </i18n-t>
          </div>
        </article>

        <!-- Education -->
        <article class="about-card" style="--stagger-delay: 100ms">
          <div class="card-media">
            <img
              src="/education.jpg"
              alt="Graduation ceremony photo of Robbe Saelens"
              class="card-image"
              loading="lazy"
            />
            <span class="card-slug">./education</span>
          </div>
          <div class="card-body">
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

        <!-- Experience -->
        <article class="about-card" style="--stagger-delay: 200ms">
          <div class="card-media">
            <img
              src="/coding.jpg"
              alt="Robbe Saelens coding at his development workspace"
              class="card-image"
              loading="lazy"
            />
            <span class="card-slug">./experience</span>
          </div>
          <div class="card-body">
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

        <!-- Competing -->
        <article class="about-card" style="--stagger-delay: 300ms">
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
            <p class="card-text">{{ $t('about.competingText') }}</p>
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
.about-page {
  color: var(--color-text-primary);
}

/* =============================================
   Grid — 2x2 on desktop, single column on mobile
   ============================================= */
.about-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  width: 100%;
}

/* Two columns only once each card is wide enough to hold a readable line */
@media (min-width: 900px) {
  .about-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
  }
}

@media (min-width: 1200px) {
  .about-grid {
    gap: 2rem;
  }
}

/* =============================================
   Card
   ============================================= */
.about-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
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

/* === Media === */
/* Two narrower columns (900–1199px) get the taller 3:2 crop; wider cards
   switch to 16:9 below, which is already tall in absolute pixels. */
.card-media {
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  background: var(--color-accent-soft);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Scrim keeps the slug readable over any photo */
.card-media::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 45%;
  background: linear-gradient(to top, rgba(8, 20, 26, 0.55), transparent);
  pointer-events: none;
}

.card-slug {
  position: absolute;
  left: 0.875rem;
  bottom: 0.75rem;
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

/* === Body === */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1.25rem 1.375rem 1.5rem;
  flex: 1;
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
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--color-text-secondary);
  overflow-wrap: break-word;
  /* Cards are wide at 2xl — keep lines at a readable measure */
  max-width: 68ch;
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

@media (min-width: 1200px) {
  .card-media {
    aspect-ratio: 16 / 9;
  }
  .card-body {
    padding: 1.375rem 1.625rem 1.625rem;
  }
}

/* =============================================
   Mobile
   ============================================= */
@media (max-width: 899px) {
  /* Single column: photo runs full width, so keep it shallower */
  .card-media {
    aspect-ratio: 16 / 9;
  }
  .card-body {
    padding: 1.125rem 1.25rem 1.375rem;
  }}

@media (max-width: 640px) {
  .card-media {
    aspect-ratio: 3 / 2;
  }
  .card-body {
    padding: 1rem 1.125rem 1.25rem;
  }
  .card-slug {
    left: 0.75rem;
    bottom: 0.625rem;
  }}

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
  .card-image {
    transition: none;
  }
}
</style>
