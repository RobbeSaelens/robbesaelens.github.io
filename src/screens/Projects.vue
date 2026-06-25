<template>
  <div class="projects-page flex flex-1 flex-col">
    <div class="mx-auto w-full max-w-screen-2xl px-4 pb-8 sm:px-6">
      <!-- Terminal-style title -->
      <header class="mb-10 mt-8 md:mb-14 md:mt-12">
        <h1 class="terminal-title text-2xl font-bold sm:text-3xl lg:text-5xl">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('projects.title').toLowerCase() }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="terminal-subtitle mt-3 text-sm tracking-wide md:text-base">
          <span class="opacity-50">$</span> ls -la ./selected-work
        </p>
      </header>

      <!-- Tech filter bar -->
      <div class="filter-bar">
        <div class="filter-scroll">
          <button
            v-for="tag in allTags"
            :key="tag"
            class="filter-chip"
            :class="{ 'is-active': selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
        <div v-if="selectedTags.length" class="filter-info">
          <span class="filter-count">{{ filteredProjects.length }} / {{ projects.length }}</span>
          <button class="filter-clear" @click="clearFilters">clear</button>
        </div>
      </div>

      <!-- Project cards grid -->
      <div class="projects-grid">
        <button
          v-for="(project, index) in filteredProjects"
          :key="project.id"
          :ref="(el) => setCardRef(el, index)"
          class="project-card"
          :aria-label="`View ${project.name} project details`"
          :style="{ '--stagger-delay': `${index * 100}ms` }"
          @click="navigateTo(project.route)"
        >
          <!-- Image container -->
          <div class="card-image-wrapper">
            <template v-if="project.image">
              <img
                :src="project.image"
                :alt="`${project.name} project mockup`"
                class="card-image"
                loading="lazy"
              />
            </template>
            <div v-else class="card-image-placeholder">
              <span class="placeholder-text">{{ project.name }}</span>
            </div>
            <div class="card-overlay">
              <span class="overlay-text">
                View project
                <ArrowRight class="overlay-arrow" :size="18" :stroke-width="2" />
              </span>
            </div>
          </div>

          <!-- Card body -->
          <div class="card-body">
            <h2 class="card-title">{{ project.name }}</h2>
            <p class="card-description">{{ project.description }}</p>
            <div class="card-tags">
              <span v-for="tag in project.tags" :key="tag" class="tag-pill">
                {{ tag }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowRight } from 'lucide-vue-next'

export default {
  name: 'Projects',

  components: {
    ArrowRight,
  },

  data() {
    return {
      selectedTags: [],
      projects: [
        {
          id: 'exulta',
          name: 'Exulta',
          description: 'Stretch tent rental & catalog',
          tags: ['Laravel', 'React', 'Inertia.js', 'Filament'],
          image: '/exulta.jpg',
          route: 'ExultaDetail',
        },
        {
          id: 'stal-manager',
          name: 'Stal Manager',
          description: 'Horse stable finance dashboard',
          tags: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL'],
          image: '/stal-manager.png',
          route: 'StalManagerDetail',
        },
        {
          id: 'scan2talk',
          name: 'Scan2Talk',
          description: 'QR student wellbeing check-in',
          tags: ['Laravel', 'Vue.js', 'Inertia.js', 'PWA'],
          image: '',
          route: 'Scan2TalkDetail',
        },
        {
          id: 'binance',
          name: 'Binance App',
          description: 'Smartwatch crypto companion',
          tags: ['Adobe XD', 'LottieFiles', 'After Effects'],
          image: '/Mockup.jpg',
          route: 'BinanceDetail',
        },
        {
          id: 'azure',
          name: 'Azure Search',
          description: 'Netflix-style search with AI',
          tags: ['Vue.js', 'TailwindCSS', 'Azure', 'OpenSearch'],
          image: '/ResearchMockup.jpg',
          route: 'AzureDetail',
        },
        {
          id: 'vital',
          name: 'Vital Cities',
          description: 'City vitality data dashboard',
          tags: ['Gatsby', 'TypeScript', 'Netlify'],
          image: '/Vital.JPG',
          route: 'VitalDetail',
        },
        {
          id: 'bikerental',
          name: 'BikeRental',
          description: 'Bike rental management app',
          tags: ['Vue.js', 'NestJS', 'MongoDB'],
          image: '/BikeRental.jpg',
          route: 'BikeRentalDetail',
        },
      ],
      observer: null,
      cardRefs: {},
    }
  },

  computed: {
    allTags() {
      const excluded = new Set(['Adobe XD', 'After Effects', 'LottieFiles'])
      const tagSet = new Set()
      this.projects.forEach((p) =>
        p.tags.forEach((t) => {
          if (!excluded.has(t)) tagSet.add(t)
        }),
      )
      return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
    },
    filteredProjects() {
      if (!this.selectedTags.length) return this.projects
      return this.projects.filter((p) => p.tags.some((t) => this.selectedTags.includes(t)))
    },
  },

  watch: {
    filteredProjects() {
      this.$nextTick(() => this.reobserve())
    },
  },

  mounted() {
    this.$nextTick(() => this.initObserver())
  },

  updated() {
    this.reobserve()
  },

  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect()
    }
  },

  methods: {
    setCardRef(el, index) {
      if (el) {
        const project = this.filteredProjects[index]
        if (project) {
          this.cardRefs[project.id] = el
        }
      }
    },

    initObserver() {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              this.observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
      )
      this.reobserve()
    },

    reobserve() {
      if (!this.observer) return
      Object.values(this.cardRefs).forEach((card: any) => {
        if (card) this.observer.observe(card)
      })
    },

    toggleTag(tag) {
      const idx = this.selectedTags.indexOf(tag)
      if (idx === -1) {
        this.selectedTags.push(tag)
      } else {
        this.selectedTags.splice(idx, 1)
      }
    },

    clearFilters() {
      this.selectedTags = []
    },

    navigateTo(routeName) {
      if (!routeName) return
      if (routeName.startsWith('http')) {
        window.open(routeName, '_blank', 'noopener,noreferrer')
      } else {
        this.$router.push({ name: routeName })
      }
    },

    goToBinance() {
      this.$router.push({ name: 'BinanceDetail' })
    },
    goToAzureDetail() {
      this.$router.push({ name: 'AzureDetail' })
    },
    goToVitalDetail() {
      this.$router.push({ name: 'VitalDetail' })
    },
    goToBikeRental() {
      this.$router.push({ name: 'BikeRentalDetail' })
    },
  },
}
</script>

<style>
/* =============================================
   CSS Custom Properties
   ============================================= */
:root {
  --color-bg: #f8fafb;
  --color-surface: #ffffff;
  --color-surface-hover: #f0f7f6;
  --color-border: rgba(0, 128, 128, 0.1);
  --color-border-glow: rgba(0, 128, 128, 0.35);
  --color-text-primary: #134e4a;
  --color-text-secondary: #5f8a86;
  --color-text-muted: #8fb3b0;
  --color-accent: #0d9488;
  --color-accent-soft: rgba(13, 148, 136, 0.08);
  --color-tag-bg: rgba(13, 148, 136, 0.08);
  --color-tag-text: #0f766e;
  --color-overlay: rgba(13, 22, 28, 0.82);
  --color-prompt: #0d9488;
  --color-cursor: #0d9488;
  --color-subtitle: #5f8a86;
  --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
}

.dark {
  --color-bg: #0a0f14;
  --color-surface: rgba(15, 23, 32, 0.8);
  --color-surface-hover: rgba(20, 32, 44, 0.9);
  --color-border: rgba(45, 212, 191, 0.1);
  --color-border-glow: rgba(45, 212, 191, 0.3);
  --color-text-primary: #e2e8f0;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --color-accent: #2dd4bf;
  --color-accent-soft: rgba(45, 212, 191, 0.08);
  --color-tag-bg: rgba(45, 212, 191, 0.1);
  --color-tag-text: #5eead4;
  --color-overlay: rgba(0, 0, 0, 0.85);
  --color-prompt: #2dd4bf;
  --color-cursor: #2dd4bf;
  --color-subtitle: #94a3b8;
}

/* =============================================
   Page Layout
   ============================================= */
.projects-page {
  color: var(--color-text-primary);
}

/* =============================================
   Terminal Title
   ============================================= */
.terminal-title {
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.2;
}

@media (max-width: 640px) {
  .terminal-title {
    gap: 0.25rem;
  }

  .terminal-cursor {
    width: 0.4em;
    height: 0.8em;
  }
}

.terminal-prompt {
  color: var(--color-prompt);
  font-weight: 700;
  flex-shrink: 0;
}

.terminal-text {
  background: linear-gradient(135deg, var(--color-accent), var(--color-prompt));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.terminal-cursor {
  display: inline-block;
  width: 0.55em;
  height: 1.1em;
  background: var(--color-cursor);
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
  border-radius: 1px;
  flex-shrink: 0;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.terminal-subtitle {
  font-family: var(--font-mono);
  color: var(--color-subtitle);
  font-size: 0.8rem;
}

/* =============================================
   Filter Bar
   ============================================= */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}

.filter-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  flex: 1;
  min-width: 0;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 100px;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1.5;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.filter-chip:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}
.filter-chip.is-active {
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border-color: var(--color-border-glow);
  box-shadow: 0 0 0 1px var(--color-border-glow);
}

.filter-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.filter-count {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}
.filter-clear {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.filter-clear:hover {
  color: var(--color-text-primary);
}

/* =============================================
   Project Cards Grid
   ============================================= */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
  width: 100%;
}

@media (min-width: 641px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

/* =============================================
   Individual Card
   ============================================= */
.project-card {
  /* Layout */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  width: 100%;

  /* Appearance */
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.02);

  /* Interaction */
  cursor: pointer;
  text-align: left;
  padding: 0;

  /* Animation setup */
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.3s ease,
    border-color 0.3s ease;

  /* Stagger delay */
  transition-delay: var(--stagger-delay, 0ms);

  /* Reset */
  font: inherit;
  color: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.project-card:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Visible state — IntersectionObserver adds this */
.project-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Hover effects */
@media (hover: hover) and (pointer: fine) {
  .project-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-border-glow);
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.06),
      0 0 0 1px var(--color-border-glow),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .project-card:hover .card-image {
    transform: scale(1.04);
  }

  .project-card:hover .card-overlay {
    opacity: 1;
  }

  .project-card:hover .overlay-text {
    transform: translateY(0);
    opacity: 1;
  }
}

/* =============================================
   Card Image
   ============================================= */
.card-image-wrapper {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background: var(--color-accent-soft);
}

@media (min-width: 641px) {
  .card-image-wrapper {
    aspect-ratio: 16 / 10;
  }
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  display: block;
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-accent-soft), transparent);
}

.placeholder-text {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-accent);
  opacity: 0.4;
}

/* =============================================
   Image Hover Overlay
   ============================================= */
.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-overlay);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.overlay-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffffff;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.025em;
  transform: translateY(6px);
  opacity: 0;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.overlay-arrow {
  transition: transform 0.25s ease;
}

@media (hover: hover) and (pointer: fine) {
  .project-card:hover .overlay-arrow {
    transform: translateX(3px);
  }
}

/* =============================================
   Card Body
   ============================================= */
.card-body {
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  flex: 1;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.3;
  margin: 0;
}

.card-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* =============================================
   Tech Tag Pills
   ============================================= */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--color-tag-text);
  background: var(--color-tag-bg);
  border-radius: 100px;
  white-space: nowrap;
  line-height: 1.6;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

@media (hover: hover) and (pointer: fine) {
  .project-card:hover .tag-pill {
    background: var(--color-accent-soft);
  }
}

/* =============================================
   Responsive Adjustments
   ============================================= */
@media (max-width: 640px) {
  .projects-grid {
    gap: 1.25rem;
  }

  .card-body {
    padding: 1rem 1.25rem 1.25rem;
  }

  .card-title {
    font-size: 1rem;
  }

  .tag-pill {
    font-size: 0.65rem;
    padding: 0.175rem 0.5rem;
  }
}

/* =============================================
   Reduced Motion
   ============================================= */
@media (prefers-reduced-motion: reduce) {
  .terminal-cursor {
    animation: none;
    opacity: 1;
  }

  .project-card {
    opacity: 1;
    transform: none;
    transition:
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .card-image {
    transition: none;
  }

  .card-overlay {
    transition: opacity 0.15s ease;
  }

  .overlay-text {
    transition: opacity 0.15s ease;
    transform: none;
  }
}
</style>
