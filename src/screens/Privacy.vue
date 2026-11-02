<template>
  <div class="privacy-page mx-auto w-full max-w-screen-2xl px-6 pb-12">
    <TerminalHeader :title="$t('privacy.title').toLowerCase()" subtitle="cat ./privacy.md" />

    <div class="privacy-layout">
      <article ref="articleRef" class="privacy hero-in" style="--i: 2">
        <p class="privacy-intro">{{ $t('privacy.intro') }}</p>

        <section
          v-for="(section, i) in sections"
          :id="`privacy-${i}`"
          :key="i"
          class="privacy-section reveal"
          :data-index="i"
        >
          <h2>{{ $rt(section.title) }}</h2>
          <p>{{ $rt(section.text) }}</p>
        </section>

        <p class="privacy-updated">{{ $t('privacy.updated') }}</p>
      </article>

      <!-- Right column on wide screens (sticky), a card after the intro on smaller ones -->
      <aside class="privacy-aside hero-in" style="--i: 3" :aria-label="$t('privacy.glance.title')">
        <div class="glance">
          <h2 class="glance-title"><span class="glance-prompt">$</span> {{ $t('privacy.glance.title') }}</h2>
          <ul class="glance-list">
            <li v-for="(item, i) in glanceItems" :key="i" :style="{ '--d': `${i * 90}ms` }">
              <span class="glance-check" aria-hidden="true"><Check /></span>
              {{ $rt(item) }}
            </li>
          </ul>
          <div class="glance-status">
            <code>
              <span class="glance-prompt">$</span> {{ $t('privacy.glance.status') }}
              <span class="glance-arrow" aria-hidden="true">→</span>
              <strong>0</strong>
            </code>
          </div>
        </div>

        <nav class="toc" :aria-label="$t('privacy.glance.toc')">
          <p class="toc-title">{{ $t('privacy.glance.toc') }}</p>
          <div class="toc-progress" aria-hidden="true"><span :style="{ transform: `scaleX(${progress})` }"></span></div>
          <ol class="toc-list">
            <li v-for="(section, i) in sections" :key="i">
              <a
                :href="`#privacy-${i}`"
                class="toc-link"
                :class="{ 'is-active': i === active, 'is-read': i < active }"
                :aria-current="i === active ? 'true' : undefined"
                @click.prevent="goTo(i)"
              >
                <span class="toc-num">{{ String(i + 1).padStart(2, '0') }}</span>
                {{ $rt(section.title) }}
              </a>
            </li>
          </ol>
        </nav>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'
import TerminalHeader from '../components/TerminalHeader.vue'

const { tm } = useI18n({ useScope: 'global' })
const sections = computed(() => tm('privacy.sections') as { title: string; text: string }[])
const glanceItems = computed(() => tm('privacy.glance.items') as string[])

const articleRef = ref<HTMLElement | null>(null)
/** Section being read: the last one whose top has passed a line 30% down the screen. */
const active = ref(0)
/** How far through the text, 0..1, for the progress bar. */
const progress = ref(0)

let observer: IntersectionObserver | null = null
let frame = 0

function goTo(i: number) {
  document.getElementById(`privacy-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// The page scrolls inside a container on wider screens, not the window, so
// listen in the capture phase: that catches scrolling of any element.
function onScroll() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    const article = articleRef.value
    if (!article) return
    const line = innerHeight * 0.3
    const rect = article.getBoundingClientRect()
    const atEnd = rect.bottom <= innerHeight
    progress.value = atEnd ? 1 : Math.min(1, Math.max(0, (line - rect.top) / Math.max(1, rect.height - innerHeight * 0.5)))
    const els = [...article.querySelectorAll<HTMLElement>('.privacy-section')]
    const tops = els.map((s) => s.getBoundingClientRect().top)
    // A jump (index link, End key) can skip sections without the observer seeing them.
    els.forEach((el, i) => tops[i]! < innerHeight * 0.9 && el.classList.add('is-visible'))
    const passed = tops.filter((top) => top <= line).length
    // At the end of the text the last sections may never reach the line.
    active.value = atEnd ? tops.length - 1 : Math.max(0, passed - 1)
  })
}

onMounted(() => {
  const sectionsEls = articleRef.value?.querySelectorAll('.reveal') ?? []
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        }
      },
      { threshold: 0.15 },
    )
    sectionsEls.forEach((el) => observer!.observe(el))
  } else {
    sectionsEls.forEach((el) => el.classList.add('is-visible'))
  }
  document.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
  document.removeEventListener('scroll', onScroll, { capture: true })
  window.removeEventListener('resize', onScroll)
})
</script>

<style scoped>
/* Text left, the glance panel and index right from 1024px */
.privacy-layout {
  display: grid;
  gap: 2rem;
}
@media (min-width: 1024px) {
  .privacy-layout {
    grid-template-columns: minmax(0, 70ch) minmax(0, 22rem);
    justify-content: space-between;
    align-items: start;
    gap: clamp(3rem, 6vw, 7rem);
  }
  .privacy-aside {
    position: sticky;
    top: 6rem;
  }
}
/* Smaller screens: the glance card comes right after the intro, no index */
@media (max-width: 1023px) {
  .privacy-layout {
    display: flex;
    flex-direction: column;
  }
  .privacy-aside {
    order: -1;
  }
  .toc {
    display: none;
  }
}

.privacy {
  max-width: 70ch;
  color: var(--color-text-secondary);
  line-height: 1.7;
}
.privacy-intro {
  margin: 0 0 2rem;
  font-size: 1.125rem;
  color: var(--color-text-primary);
}
.privacy-section {
  padding: 1.25rem 0;
  border-top: 1px solid var(--color-border);
  scroll-margin-top: 6rem;
}
.privacy-section h2 {
  margin: 0 0 0.5rem;
  font-family: var(--font-mono);
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
}
.privacy-section p {
  margin: 0;
}

/* Sections rise in as they scroll into view; hidden only when JavaScript runs */
html.js .reveal {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
html.js .reveal.is-visible {
  opacity: 1;
  transform: none;
}

.toc-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.privacy-updated {
  margin: 1.5rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* ── Glance card ── */
.glance {
  padding: 1.25rem 1.375rem;
  border: 1px solid var(--color-border-glow);
  border-radius: 1rem;
  background:
    radial-gradient(120% 80% at 100% 0%, var(--color-accent-soft), transparent 60%),
    var(--color-surface);
}
.glance-title {
  margin: 0 0 1rem;
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}
.glance-prompt {
  color: var(--color-prompt);
}
.glance-list {
  display: grid;
  gap: 0.7rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.9375rem;
  line-height: 1.45;
  color: var(--color-text-secondary);
}
.glance-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}
html.js.intro-done .glance-list li {
  animation: glance-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--d) + 450ms);
}
.glance-check {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.375rem;
  height: 1.375rem;
  margin-top: 0.05rem;
  border-radius: 50%;
  color: var(--color-accent);
  background: var(--color-accent-soft);
}
.glance-check :deep(svg) {
  width: 0.875rem;
  height: 0.875rem;
  stroke-width: 3;
}
.glance-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--color-border);
}
.glance-status code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}
.glance-arrow {
  margin: 0 0.4em;
  color: var(--color-text-muted);
}
.glance-status strong {
  color: var(--color-accent);
}

/* ── Index ── */
.toc {
  margin-top: 1.5rem;
  padding: 0 0.25rem;
}
.toc-title {
  margin: 0 0 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.toc-progress {
  height: 2px;
  margin-bottom: 0.75rem;
  overflow: hidden;
  border-radius: 2px;
  background: var(--color-border);
}
.toc-progress span {
  display: block;
  height: 100%;
  background: var(--color-accent);
  transform-origin: left;
  transition: transform 0.15s linear;
}
.toc-list {
  display: grid;
  gap: 0.15rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.toc-link {
  display: flex;
  gap: 0.6rem;
  padding: 0.35rem 0.6rem;
  border-left: 2px solid transparent;
  border-radius: 0 0.375rem 0.375rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  transition:
    color 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;
}
.toc-num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding-top: 0.1rem;
}
.toc-link:hover {
  color: var(--color-text-primary);
}
.toc-link.is-read {
  color: var(--color-text-secondary);
}
.toc-link.is-active {
  color: var(--color-accent);
  font-weight: 600;
  border-left-color: var(--color-accent);
  background: var(--color-accent-soft);
}

@keyframes glance-in {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  html.js .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
  html.js.intro-done .glance-list li {
    animation: none;
  }
  .toc-progress span,
  .toc-link {
    transition: none;
  }
}
</style>
