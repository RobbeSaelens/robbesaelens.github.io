<template>
  <div class="fade-out flex flex-1 flex-col">
    <div class="mx-auto w-full max-w-screen-2xl px-6">
      <TerminalHeader :title="$t('about.title').toLowerCase()" subtitle="cat ./about-me.md" />
    </div>

    <div class="content-wrapper mx-auto flex min-h-0 max-w-screen-2xl flex-1 flex-col px-6">
      <!-- Horizontal timeline cards -->
      <div class="cards-row mb-3">
        <!-- Teaching -->
        <article ref="teachingRef" :class="['timeline-card', teachingVisible ? 'animate-in' : '']">
          <img
            src="/about.jpg"
            alt="Robbe Saelens teaching equestrian sports"
            class="scale card-img"
            loading="lazy"
          />
          <div class="card-body">
            <h2 class="card-title">
              <BookOpen class="card-icon" />
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

        <!-- Connector -->
        <div class="timeline-connector">
          <div class="connector-line"></div>
          <div class="connector-arrow">
            <ArrowRight class="w-4 h-4" />
          </div>
        </div>

        <!-- Education -->
        <article
          ref="educationRef"
          :class="['timeline-card', educationVisible ? 'animate-in' : '']"
        >
          <img
            src="/education.jpg"
            alt="Graduation ceremony photo of Robbe Saelens"
            class="scale card-img"
            loading="lazy"
          />
          <div class="card-body">
            <h2 class="card-title">
              <GraduationCap class="card-icon" />
              {{ $t('about.education') }}
            </h2>
            <p class="card-text">
              {{ $t('about.educationText1') }}
            </p>
            <i18n-t keypath="about.educationText2" tag="p" class="card-text mt-2">
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

        <!-- Connector -->
        <div class="timeline-connector">
          <div class="connector-line"></div>
          <div class="connector-arrow">
            <ArrowRight class="w-4 h-4" />
          </div>
        </div>

        <!-- Experience -->
        <article
          ref="experienceRef"
          :class="['timeline-card', experienceVisible ? 'animate-in' : '']"
        >
          <img
            src="/coding.jpg"
            alt="Robbe Saelens coding at his development workspace"
            class="scale card-img"
            loading="lazy"
          />
          <div class="card-body">
            <h2 class="card-title">
              <Briefcase class="card-icon" />
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
            <i18n-t keypath="about.experienceText2" tag="p" class="card-text mt-2">
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
      </div>

      <!-- CTA -->
      <div class="cta-bar">
        <div class="cta-inner">
          <MessageCircle class="cta-icon-lg" />
          <span class="cta-text">{{ $t('about.workTogether') }}</span>
          <a class="cta-pill" href="mailto:robbe.saelens@telenet.be">
            robbe.saelens@telenet.be
            <ArrowRight class="cta-arrow" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Briefcase, GraduationCap, ArrowRight, BookOpen, MessageCircle } from 'lucide-vue-next'
import TerminalHeader from '../components/TerminalHeader.vue'

export default {
  components: {
    Briefcase,
    GraduationCap,
    ArrowRight,
    BookOpen,
    MessageCircle,
    TerminalHeader,
  },
  data() {
    return {
      educationVisible: false,
      experienceVisible: false,
      teachingVisible: false,
      observer: null as IntersectionObserver | null,
    }
  },
  mounted() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            if (target === this.$refs.educationRef) this.educationVisible = true
            if (target === this.$refs.experienceRef) this.experienceVisible = true
            if (target === this.$refs.teachingRef) this.teachingVisible = true
          }
        })
      },
      { threshold: 0.05 },
    )

    const refs = [this.$refs.educationRef, this.$refs.experienceRef, this.$refs.teachingRef]
    refs.forEach((ref: any) => {
      if (ref && ref instanceof Element) this.observer!.observe(ref)
    })
  },
  beforeUnmount() {
    this.observer?.disconnect()
  },
}
</script>

<style>
/* =============================================
   CSS Custom Properties
   ============================================= */
:root {
  --color-surface: #ffffff;
  --color-surface-hover: #f0f7f6;
  --color-border: rgba(0, 128, 128, 0.1);
  --color-border-glow: rgba(0, 128, 128, 0.35);
  --color-text-primary: #134e4a;
  --color-text-secondary: #5f8a86;
  --color-accent: #0d9488;
  --color-accent-soft: rgba(13, 148, 136, 0.08);
  --color-tag-bg: rgba(13, 148, 136, 0.08);
  --color-tag-text: #0f766e;
  --color-prompt: #0d9488;
  --color-cursor: #0d9488;
  --color-subtitle: #5f8a86;
  --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
}
.dark {
  --color-surface: rgba(15, 23, 32, 0.8);
  --color-surface-hover: rgba(20, 32, 44, 0.9);
  --color-border: rgba(45, 212, 191, 0.1);
  --color-border-glow: rgba(45, 212, 191, 0.3);
  --color-text-primary: #e2e8f0;
  --color-text-secondary: #94a3b8;
  --color-accent: #2dd4bf;
  --color-accent-soft: rgba(45, 212, 191, 0.08);
  --color-tag-bg: rgba(45, 212, 191, 0.1);
  --color-tag-text: #5eead4;
  --color-prompt: #2dd4bf;
  --color-cursor: #2dd4bf;
  --color-subtitle: #94a3b8;
}

/* === Image hover === */
.scale {
  transition: transform 0.5s ease-in-out;
}
.scale:hover {
  transform: scale(1.02);
}
@media (min-width: 768px) {
  .scale {
    transition: transform 0.3s ease-in-out;
  }
  .scale:hover {
    transform: scale(1.02);
  }
}

/* === Cards row (horizontal timeline) === */
.cards-row {
  display: flex;
  gap: 0;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

.timeline-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.5s ease-out,
    transform 0.5s ease-out,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}
.timeline-card.animate-in {
  opacity: 1;
  transform: translateY(0);
}
@media (hover: hover) and (pointer: fine) {
  .timeline-card:hover {
    border-color: var(--color-border-glow);
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.04),
      0 0 0 1px var(--color-border-glow);
  }
}

/* Stagger animation */
.cards-row .timeline-card:nth-child(1) {
  transition-delay: 0s;
}
.cards-row .timeline-card:nth-child(3) {
  transition-delay: 0.12s;
}
.cards-row .timeline-card:nth-child(5) {
  transition-delay: 0.24s;
}

/* === Horizontal connector === */
.timeline-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  flex-shrink: 0;
  gap: 0.25rem;
}

.connector-line {
  width: 2px;
  flex: 1;
  background: linear-gradient(to bottom, var(--color-border), var(--color-border-glow));
  min-height: 2rem;
}

.connector-arrow {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--color-surface);
  border: 2px solid var(--color-border-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  flex-shrink: 0;
}

/* Card image */
.timeline-card .card-img {
  width: 100%;
  height: clamp(12rem, 30vh, 22rem);
  object-fit: cover;
  border-radius: 0.75rem 0.75rem 0 0;
  flex-shrink: 0;
}

/* Card body */
.timeline-card .card-body {
  padding: 1rem 1.25rem 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Card typography */
.timeline-card .card-title {
  font-family: var(--font-mono), serif;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-accent);
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex: none;
}

.timeline-card .card-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  opacity: 0.7;
}

.timeline-card .card-text {
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.card-link {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 0.8125rem;
  text-decoration: none;
  color: var(--color-accent);
  border-bottom: 1px solid var(--color-accent);
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}
.card-link:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
}

/* === CTA bar === */
.cta-bar {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}

.cta-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}
@media (hover: hover) and (pointer: fine) {
  .cta-inner:hover {
    border-color: var(--color-border-glow);
    box-shadow:
      0 2px 20px rgba(0, 0, 0, 0.04),
      0 0 0 1px var(--color-border-glow);
  }
}

.cta-icon-lg {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--color-accent);
  flex-shrink: 0;
}

.cta-text {
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.cta-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  background: var(--color-accent);
  color: white;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}
.cta-pill:hover {
  background: var(--color-text-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.cta-arrow {
  width: 0.875rem;
  height: 0.875rem;
}

/* === Responsive: stack on small screens === */
@media (max-width: 768px) {
  .content-wrapper {
    flex: none;
    min-height: auto;
  }
  .cards-row {
    flex: none;
    flex-direction: column;
    gap: 0.75rem;
  }
  .timeline-connector {
    display: none;
  }
  .timeline-card .card-img {
    height: clamp(7rem, 30vw, 15rem);
    border-radius: 0.75rem 0.75rem 0 0;
  }
  .cta-inner {
    gap: 0.625rem;
    padding: 0.625rem 1.125rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  .cta-bar {
    margin-top: 1rem;
    margin-bottom: 1.5rem;
  }
}

/* =============================================
   Reduced Motion
   ============================================= */
@media (prefers-reduced-motion: reduce) {
  .timeline-card {
    opacity: 1;
    transform: none;
    transition:
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .scale {
    transition: none;
  }
}
</style>
