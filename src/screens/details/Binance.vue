<template>
  <article class="detail-page pb-10 fade-out">
    <div class="mx-auto max-w-screen-xl px-4 pt-10 sm:px-6">
      <header class="text-center">
        <h1 class="terminal-title justify-center text-2xl font-bold sm:text-3xl lg:text-5xl">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">{{ $t('binance.title') }}</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>
        <p class="terminal-subtitle mt-3 text-sm tracking-wide md:text-base">
          <span class="opacity-50">$</span> cat ./binance-project.md
        </p>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <span class="tag-pill">Adobe XD</span>
          <span class="tag-pill">LottieFiles</span>
          <span class="tag-pill">Adobe AfterEffects</span>
        </div>
      </header>
      <div>
        <img
          class="w-90% mx-auto my-10 rounded-lg md:block md:w-300"
          src="/Mockup.jpg"
          alt="Binance cryptocurrency watch smartwatch app mockup"
          loading="lazy"
        />
      </div>
      <!-- Project Overview Section -->
      <div class="md:mx-10 mx-5 md:pt-10">
        <!-- Section Header -->
        <div class="mb-10">
          <h2 class="text-4xl md:text-5xl font-bold mb-3" style="color: var(--color-text-primary)">
            {{ $t('binance.overview') }}
          </h2>
        </div>

        <!-- About -->
        <div class="flex flex-col md:flex-row gap-8 mb-8">
          <div class="overview-card flex-1 px-6 py-8 md:px-8">
            <h3 class="overview-label">{{ $t('binance.about') }}</h3>
            <p class="leading-relaxed text-lg" style="color: var(--color-text-secondary)">
              {{ $t('binance.aboutText') }}
            </p>
          </div>
        </div>

        <!-- Languages & Tools -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('binance.languages') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span class="tag-pill">Adobe XD</span>
              <span class="tag-pill">LottieFiles</span>
              <span class="tag-pill">Adobe AfterEffects</span>
              <span class="tag-pill">Adobe Illustrator</span>
            </div>
          </div>
          <div class="overview-card px-6 py-8">
            <h3 class="overview-label">{{ $t('binance.tools') }}</h3>
            <div class="flex flex-wrap gap-2">
              <span class="tag-pill">Visual Studio Code</span>
              <span class="tag-pill">Azure Portal</span>
              <span class="tag-pill">Amazon AWS</span>
              <span class="tag-pill">Adobe XD</span>
            </div>
          </div>
        </div>

        <!-- View Other Projects -->
        <div class="mt-4 inline-block" style="color: var(--color-accent)">
          <router-link class="flex items-center gap-2 group" to="/projects">
            <span class="text-sm" style="color: var(--color-accent); opacity: 0.6">./</span>
            <span
              class="font-medium transition-colors"
              style="
                font-family: var(--font-mono);
                font-size: 0.875rem;
                color: var(--color-text-secondary);
              "
            >
              {{ $t('binance.viewOther') }}
            </span>
            <ArrowRight
              class="transition-transform group-hover:translate-x-1"
              :size="16"
              :stroke-width="2"
              style="color: var(--color-accent)"
            />
          </router-link>
        </div>
      </div>
    </div>
  </article>
</template>

<script lang="ts">
import { ArrowRight } from 'lucide-vue-next'
export default {
  components: { ArrowRight },
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
  --color-prompt: #2dd4bf;
  --color-cursor: #2dd4bf;
  --color-subtitle: #94a3b8;
}

/* =============================================
   Page
   ============================================= */
.detail-page {
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
   Tag Pills
   ============================================= */
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
}

/* =============================================
   Overview Cards
   ============================================= */
.overview-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.02);
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

.overview-card:hover {
  border-color: var(--color-border-glow);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 0 0 1px var(--color-border-glow);
}

/* =============================================
   Overview Label
   ============================================= */
.overview-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-accent);
  margin-bottom: 0.875rem;
}

/* =============================================
   Reduced Motion
   ============================================= */
@media (prefers-reduced-motion: reduce) {
  .terminal-cursor {
    animation: none;
    opacity: 1;
  }
}
</style>
