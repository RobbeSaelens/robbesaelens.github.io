<template>
  <div class="detail-page pb-10 fade-out">
    <div class="mx-auto max-w-screen-xl px-4 pt-10 sm:px-6">
      <header class="text-center">
        <h1 class="terminal-title justify-center text-2xl font-bold sm:text-3xl lg:text-5xl">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('scan2talk.title') }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="terminal-subtitle mt-3 text-sm tracking-wide md:text-base">
          <span class="opacity-50">$</span> cat ./scan2talk-project.md
        </p>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <span class="tag-pill">Laravel</span>
          <span class="tag-pill">Vue.js</span>
          <span class="tag-pill">Inertia.js</span>
          <span class="tag-pill">PWA</span>
          <span class="tag-pill">PostgreSQL</span>
          <span class="tag-pill">Chart.js</span>
        </div>
      </header>
      <div>
        <div
          class="mx-auto my-10 flex max-w-3xl items-center justify-center rounded-lg"
          style="
            aspect-ratio: 16/10;
            background: linear-gradient(135deg, var(--color-accent-soft), transparent);
          "
        >
          <span
            class="text-lg font-semibold opacity-40"
            style="font-family: var(--font-mono); color: var(--color-accent)"
          >
            {{ $t('scan2talk.screenshotSoon') }}</span
          >
        </div>
      </div>
      <div class="mx-5 pt-10 md:mx-10">
        <div class="mb-10">
          <h2 class="mb-3 text-4xl font-bold md:text-5xl" style="color: var(--color-text-primary)">
            {{ $t('scan2talk.overview') }}
          </h2>
        </div>

        <div class="mb-8 flex flex-col gap-8 md:flex-row">
          <div class="overview-card flex-1 px-6 py-8 md:px-8">
            <h3 class="overview-label">{{ $t('scan2talk.about') }}</h3>
            <p class="text-lg leading-relaxed" style="color: var(--color-text-secondary)">
              {{ $t('scan2talk.aboutText') }}
            </p>
          </div>
        </div>

        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('scan2talk.languages') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span class="tag-pill">Laravel 13</span>
              <span class="tag-pill">Vue.js 3</span>
              <span class="tag-pill">Inertia.js</span>
              <span class="tag-pill">PostgreSQL 16</span>
              <span class="tag-pill">Tailwind CSS 3</span>
              <span class="tag-pill">Chart.js</span>
            </div>
          </div>
          <div class="overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('scan2talk.tools') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span class="tag-pill">Visual Studio Code</span>
              <span class="tag-pill">DDEV</span>
              <span class="tag-pill">PWA (vite-plugin)</span>
              <span class="tag-pill">Spatie Permissions</span>
              <span class="tag-pill">Simple QR Code</span>
              <span class="tag-pill">Laravel Breeze</span>
            </div>
          </div>
        </div>

        <div class="mt-4 inline-block" style="color: var(--color-accent)">
          <router-link class="group flex items-center gap-2" to="/projects">
            <span class="text-sm" style="color: var(--color-accent); opacity: 0.6">./</span>
            <span
              class="font-medium transition-colors"
              style="color: var(--color-accent); font-family: var(--font-mono)"
              >{{ $t('scan2talk.viewOther') }}</span
            >
            <ArrowRight
              class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              style="color: var(--color-accent)"
            />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowRight } from 'lucide-vue-next'
export default {
  components: { ArrowRight },
}
</script>

<style>
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
}

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
  color: var(--color-text-secondary);
  overflow-x: auto;
}

.overview-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}
.overview-card:hover {
  border-color: var(--color-border-glow);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.04),
    0 0 0 1px var(--color-border-glow);
}
.overview-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-accent);
  margin-bottom: 0.875rem;
}
.tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 100px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-tag-text);
  background: var(--color-tag-bg);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .terminal-cursor {
    animation: none;
    opacity: 1;
  }
}
</style>
