<template>
  <div class="projects-page flex flex-1 flex-col">
    <div class="mx-auto w-full max-w-screen-xl px-4 pb-16 sm:px-6">
      <TerminalHeader
        :title="$t('projects.title').toLowerCase()"
        subtitle="ls -la ./selected-work"
      />

      <!-- Tech filter — only worth showing once there are enough projects to filter. -->
      <div v-if="showFilter" class="filter-bar">
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
          <span class="filter-count">{{
            $t('projects.showingCount', { count: filteredProjects.length, total: projects.length })
          }}</span>
          <button class="filter-clear" @click="clearFilters">{{ $t('projects.clear') }}</button>
        </div>
      </div>

      <!-- Showcase rows -->
      <div class="showcase">
        <article
          v-for="(project, index) in filteredProjects"
          :key="project.id"
          class="row reveal"
          :class="{ 'row-reverse': index % 2 === 1 }"
          :style="{ '--stagger-delay': `${index * 120}ms` }"
        >
          <!-- Visual -->
          <component
            :is="project.route ? 'button' : 'div'"
            class="row-visual"
            :type="project.route ? 'button' : undefined"
            :aria-label="project.route ? `View ${project.name} project details` : undefined"
            @click="project.route && navigateTo(project.route)"
          >
            <span class="visual-frame">
              <span class="visual-bar" aria-hidden="true">
                <span class="visual-dot"></span>
                <span class="visual-dot"></span>
                <span class="visual-dot"></span>
                <span class="visual-path">~/{{ project.id }}</span>
              </span>

              <img
                v-if="project.image"
                :src="project.image"
                :alt="`${project.name} project mockup`"
                class="visual-img"
                loading="lazy"
              />

              <span v-else class="visual-soon" aria-hidden="true">
                <span class="soon-cursor">_</span>
              </span>

              <span v-if="project.route" class="visual-overlay">
                <span class="overlay-text">
                  {{ $t('projects.viewProject') }}
                  <ArrowRight class="overlay-arrow" :size="18" :stroke-width="2" />
                </span>
              </span>
            </span>
          </component>

          <!-- Content -->
          <div class="row-content">
            <div class="row-meta">
              <span class="row-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span v-if="project.date" class="row-date">{{ project.date }}</span>
              <span v-if="project.live" class="row-live">
                <span class="row-live-dot"></span>{{ $t('projects.live') }}
              </span>
              <span v-else-if="project.rebranding" class="row-rebranding">{{
                $t('projects.rebranding')
              }}</span>
            </div>

            <h2 class="row-title">{{ project.name }}</h2>
            <p class="row-description">{{ $t(`projects.items.${project.id}.description`) }}</p>

            <div class="row-tags">
              <span v-if="project.comingSoon" class="tag-pill tag-coming-soon">Coming Soon</span>
              <span v-for="tag in project.tags" :key="tag" class="tag-pill">{{ tag }}</span>
            </div>

            <button v-if="project.route" class="row-link" @click="navigateTo(project.route)">
              <span class="row-link-prompt">$</span>
              <span>open ./{{ project.id }}</span>
              <ArrowRight class="row-link-arrow" :size="16" :stroke-width="2" />
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import TerminalHeader from '../components/TerminalHeader.vue'

export default {
  name: 'Projects',

  components: {
    ArrowRight,
    TerminalHeader,
  },

  data() {
    return {
      selectedTags: [],
      observer: null,
      revealFallback: 0,
      projects: [
        {
          id: 'exulta',
          name: 'Exulta',
          tags: ['Laravel', 'React', 'Inertia.js', 'Filament'],
          image: '/exulta-home.jpg',
          rebranding: true,
          route: 'ExultaDetail',
          date: '2026',
        },
        {
          id: 'scan2talk',
          name: 'Scan2Talk',
          tags: ['Laravel', 'Vue.js', 'Inertia.js', 'PWA'],
          image: '/scan2talk-home.jpg',
          route: 'Scan2TalkDetail',
          date: '2026',
          live: true,
        },
        {
          id: 'vhs',
          name: 'VHS Service',
          tags: ['Next.js', 'React', 'TypeScript', 'GSAP'],
          image: '/vhs-home.jpg',
          route: 'VHSDetail',
          date: '2026',
          rebranding: true,
        },
      ],
    }
  },

  computed: {
    allTags() {
      const tagSet = new Set()
      this.projects.forEach((p) => p.tags.forEach((t) => tagSet.add(t)))
      return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
    },
    // A filter over two projects is noise; it earns its place once the list grows.
    showFilter() {
      return this.projects.filter((p) => !p.comingSoon).length > 3
    },
    filteredProjects() {
      if (!this.showFilter || !this.selectedTags.length) return this.projects
      return this.projects.filter(
        (p) => p.comingSoon || p.tags.some((t) => this.selectedTags.includes(t)),
      )
    },
  },

  mounted() {
    this.$nextTick(() => this.initObserver())
  },

  updated() {
    this.initObserver()
  },

  beforeUnmount() {
    clearTimeout(this.revealFallback)
    this.observer?.disconnect()
  },

  methods: {
    initObserver() {
      const targets = [...this.$el.querySelectorAll('.reveal:not(.is-visible)')]
      if (!targets.length) return

      // Content is visible by default; it is only hidden once we know we can
      // reveal it again. That way a missing or suspended IntersectionObserver
      // can never leave the page permanently blank.
      if (typeof IntersectionObserver === 'undefined') {
        targets.forEach((el) => el.classList.add('is-visible'))
        return
      }

      this.observer?.disconnect()
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              this.observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
      )

      targets.forEach((el) => {
        el.classList.add('reveal-armed')
        this.observer.observe(el)
      })

      // Safety net: if no callback ever arrives (background tab, suspended
      // observer), show everything rather than leaving it hidden.
      clearTimeout(this.revealFallback)
      this.revealFallback = setTimeout(() => {
        targets.forEach((el) => el.classList.add('is-visible'))
      }, 1600)
    },

    toggleTag(tag) {
      const i = this.selectedTags.indexOf(tag)
      if (i === -1) this.selectedTags.push(tag)
      else this.selectedTags.splice(i, 1)
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
  },
}
</script>

<style scoped>
.projects-page {
  color: var(--color-text-primary);
}

/* =============================================
   Filter bar
   ============================================= */
.filter-bar {
  margin: 1.5rem 0 0.5rem;
}
.filter-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.filter-chip {
  padding: 0.25rem 0.7rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-tag-text);
  background: var(--color-tag-bg);
  border: 1px solid transparent;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}
.filter-chip.is-active {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.filter-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
}
.filter-clear {
  color: var(--color-accent);
}

/* =============================================
   Showcase rows
   ============================================= */
.showcase {
  display: flex;
  flex-direction: column;
  gap: clamp(3rem, 7vw, 5.5rem);
  margin-top: clamp(2rem, 5vw, 3.5rem);
}

.row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
  align-items: center;
}
@media (min-width: 900px) {
  .row {
    grid-template-columns: 1.15fr 1fr;
    gap: clamp(2rem, 5vw, 4rem);
  }
  .row-reverse .row-visual {
    order: 2;
  }
}

/* Scroll reveal, staggered per row */
.reveal {
  transition:
    opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--stagger-delay, 0ms);
}
/* Only hidden once JS has armed the observer — see initObserver(). */
.reveal.reveal-armed {
  opacity: 0;
  transform: translateY(28px);
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}

/* ---------- Visual ---------- */
.row-visual {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
}
button.row-visual {
  cursor: pointer;
}

.visual-frame {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.07);
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.35s ease,
    box-shadow 0.35s ease;
}
@media (hover: hover) and (pointer: fine) {
  button.row-visual:hover .visual-frame {
    transform: translateY(-6px);
    border-color: var(--color-border-glow);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.12);
  }
  button.row-visual:hover .visual-overlay {
    opacity: 1;
  }
  button.row-visual:hover .visual-img {
    transform: scale(1.03);
  }
}
button.row-visual:focus-visible .visual-frame {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

/* Terminal-style title bar */
.visual-bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.85rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-hover);
}
.visual-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--color-border);
}
.visual-dot:nth-child(1) {
  background: #f87171;
}
.visual-dot:nth-child(2) {
  background: #facc15;
}
.visual-dot:nth-child(3) {
  background: #4ade80;
}
.visual-path {
  margin-left: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

.visual-img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Coming soon visual */
.visual-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  background: repeating-linear-gradient(
    45deg,
    var(--color-surface),
    var(--color-surface) 10px,
    var(--color-surface-hover) 10px,
    var(--color-surface-hover) 20px
  );
}
.soon-cursor {
  font-family: var(--font-mono);
  font-size: 2rem;
  color: var(--color-accent);
  animation: blink 1s step-end infinite;
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

.visual-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  background: var(--color-overlay);
  transition: opacity 0.3s ease;
}
.overlay-text {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  background: var(--color-accent);
}

/* ---------- Content ---------- */
.row-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-muted);
}
.row-index {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-accent);
  opacity: 0.7;
}
.row-rebranding {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  background: var(--color-tag-bg);
}

.row-live {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-accent);
  background: var(--color-accent-soft);
}
.row-live-dot {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 9999px;
  background: var(--color-accent);
  animation: pulse-dot 1.8s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.7);
  }
}

.row-title {
  margin-top: 0.6rem;
  font-family: var(--font-mono);
  font-size: clamp(1.5rem, 3.5vw, 2.25rem);
  font-weight: 700;
  line-height: 1.15;
  color: var(--color-text-primary);
}
.row-description {
  margin-top: 0.75rem;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--color-text-secondary);
}
.row-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 1.1rem;
}
.row-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.4rem;
  /* Keeps the tap target above the 24px WCAG minimum without moving the text. */
  min-height: 2.75rem;
  padding: 0.25rem 0;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent);
  transition: gap 0.25s ease;
}
.row-link:hover {
  gap: 0.75rem;
}
.row-link-prompt {
  opacity: 0.55;
}
.row-link-arrow {
  transition: transform 0.25s ease;
}
.row-link:hover .row-link-arrow {
  transform: translateX(2px);
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal.reveal-armed {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .soon-cursor,
  .row-live-dot {
    animation: none;
  }
  .visual-frame,
  .visual-img {
    transition: none;
  }
}
</style>
