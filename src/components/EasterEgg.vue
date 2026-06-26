<template>
  <div v-if="!isEasterEggUnlocked" />

  <Teleport to="body">
    <div v-if="isEasterEggUnlocked" class="ee-overlay">
      <!-- CRT scanline overlay -->
      <div class="ee-scanlines" />

      <!-- Matrix rain -->
      <div class="ee-matrix" aria-hidden="true">
        <span
          v-for="col in matrixColumns"
          :key="col.id"
          class="ee-matrix-col"
          :style="{
            left: col.left + '%',
            animationDuration: col.duration + 's',
            animationDelay: col.delay + 's',
            fontSize: col.fontSize + 'px',
          }"
          >{{ col.chars }}</span
        >
      </div>

      <!-- Confetti -->
      <div class="ee-confetti" aria-hidden="true">
        <span
          v-for="p in confettiParticles"
          :key="p.id"
          class="ee-confetti-piece"
          :style="{
            left: p.left + '%',
            animationDuration: p.duration + 's',
            animationDelay: p.delay + 's',
            backgroundColor: p.color,
            width: p.size + 'px',
            height: p.size + 'px',
          }"
        />
      </div>

      <!-- Main content -->
      <div class="ee-content">
        <!-- ASCII art banner -->
        <pre class="ee-ascii" aria-hidden="true">
    ╔══════════════════════════════════════╗
    ║                                      ║
    ║      ┌─┐  ┌─┐┌─┐┬  ┬┬ ┬           ║
    ║      └─┐  │ ││ ││  │└┬┘           ║
    ║      └─┘  └─┘└─┘┴─┘┴  ┴           ║
    ║                                      ║
    ║         ★ ★ ★ ACCESS GRANTED ★ ★ ★   ║
    ║                                      ║
    ╚══════════════════════════════════════╝
        </pre>

        <!-- Title + badge -->
        <div class="ee-title-block">
          <h1 class="ee-title glitch" :data-text="$t('easter.title')">
            {{ $t('easter.title') }}
          </h1>
          <span class="ee-badge">{{ $t('easter.activated') }}</span>
        </div>

        <!-- Message text -->
        <p class="ee-subtitle">{{ $t('easter.subtitle') }}</p>
        <p class="ee-message">{{ $t('easter.message') }}</p>

        <!-- Fun fact cycling -->
        <div class="ee-fact-block">
          <div class="ee-fact">
            <span class="ee-fact-prompt">&gt;</span>
            <span class="ee-fact-text" :key="currentFactIndex">
              {{ $t(`easter.fact${currentFactIndex + 1}`) }}
            </span>
          </div>
        </div>

        <!-- Close button -->
        <button class="ee-close" @click="close">
          <span class="ee-close-prompt">$</span>
          {{ $t('easter.close') }}
        </button>

        <!-- Hint -->
        <p class="ee-hint">{{ $t('easter.hint') }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useEasterEgg } from '../composables/useEasterEgg'

const MATRIX_CHARS = '0123456789ABCDEF'
const CONFETTI_COLORS = ['#2dd4bf', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa']

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateMatrixColumn(id: number) {
  const charCount = randomBetween(4, 8)
  let chars = ''
  for (let i = 0; i < charCount; i++) {
    chars += MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
  }
  return {
    id,
    left: (id / 25) * 100 + randomBetween(-3, 3),
    duration: randomBetween(3, 8),
    delay: randomBetween(0, 6),
    chars,
    fontSize: randomBetween(12, 16),
  }
}

function generateConfettiPiece(id: number) {
  return {
    id,
    left: randomBetween(0, 100),
    duration: randomBetween(4, 8),
    delay: randomBetween(0.5, 3),
    color: CONFETTI_COLORS[randomBetween(0, CONFETTI_COLORS.length - 1)],
    size: randomBetween(6, 10),
  }
}

export default defineComponent({
  name: 'EasterEgg',
  setup() {
    const { isEasterEggUnlocked, close } = useEasterEgg()

    const currentFactIndex = ref(0)
    let factInterval: ReturnType<typeof setInterval> | null = null

    const matrixColumns = computed(() => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
      const count = isMobile ? 12 : 25
      return Array.from({ length: count }, (_, i) => generateMatrixColumn(i))
    })

    const confettiParticles = computed(() => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
      const count = isMobile ? 8 : 15
      return Array.from({ length: count }, (_, i) => generateConfettiPiece(i))
    })

    onMounted(() => {
      factInterval = setInterval(() => {
        currentFactIndex.value = (currentFactIndex.value + 1) % 5
      }, 5000)
    })

    onUnmounted(() => {
      if (factInterval) clearInterval(factInterval)
    })

    return {
      isEasterEggUnlocked,
      close,
      currentFactIndex,
      matrixColumns,
      confettiParticles,
    }
  },
})
</script>

<style scoped>
/* =============================================
   Overlay
   ============================================= */

.ee-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0f14;
  background-image:
    radial-gradient(ellipse at 50% 30%, rgba(20, 184, 166, 0.08) 0%, transparent 60%),
    radial-gradient(circle at 80% 80%, rgba(45, 212, 191, 0.04) 0%, transparent 40%);
  overflow: hidden;
  animation: ee-fade-in 0.3s ease both;
}

/* =============================================
   CRT Scanlines
   ============================================= */

.ee-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.04) 2px,
    rgba(0, 0, 0, 0.04) 4px
  );
  animation: ee-scanlines 8s linear infinite;
}

/* =============================================
   Matrix Rain
   ============================================= */

.ee-matrix {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.ee-matrix-col {
  position: absolute;
  top: 0;
  font-family: var(--font-mono);
  color: #14b8a6;
  opacity: 0.2;
  white-space: pre;
  animation: ee-matrix-rain linear infinite;
  writing-mode: vertical-lr;
}

/* =============================================
   Confetti
   ============================================= */

.ee-confetti {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

.ee-confetti-piece {
  position: absolute;
  top: -10px;
  border-radius: 2px;
  animation: ee-confetti-fall linear infinite;
}

/* =============================================
   Main Content
   ============================================= */

.ee-content {
  position: relative;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 640px;
  width: 100%;
  padding: 2rem;
  text-align: center;
}

/* =============================================
   ASCII Art Banner
   ============================================= */

.ee-ascii {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  line-height: 1.3;
  color: #14b8a6;
  opacity: 0;
  animation: ee-fade-in 0.5s ease 0.3s both;
  margin-bottom: 1.5rem;
  white-space: pre;
  user-select: none;
}

/* =============================================
   Title Section
   ============================================= */

.ee-title-block {
  margin-bottom: 2rem;
  opacity: 0;
  animation: ee-fade-in 0.5s ease 0.5s both;
}

.ee-title {
  font-family: var(--font-mono);
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #f0fdfa;
  margin: 0 0 0.75rem 0;
  line-height: 1.1;
  position: relative;
}

/* Glitch pseudo-elements */
.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.glitch::before {
  color: #f87171;
  z-index: -1;
  animation: ee-glitch-1 4s infinite linear alternate-reverse;
}

.glitch::after {
  color: #22d3ee;
  z-index: -2;
  animation: ee-glitch-2 4s infinite linear alternate-reverse;
}

.ee-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #0a0f14;
  background: #14b8a6;
  padding: 0.35rem 1.25rem;
  border-radius: 2px;
  animation: ee-pulse-glow 2s ease-in-out infinite;
}

/* =============================================
   Message Text
   ============================================= */

.ee-subtitle {
  font-family: var(--font-mono);
  font-size: 1.125rem;
  color: #a5f3d0;
  margin: 0 0 0.5rem 0;
  line-height: 1.6;
  opacity: 0;
  animation: ee-fade-in 0.5s ease 0.8s both;
}

.ee-message {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 2.5rem 0;
  line-height: 1.6;
  max-width: 480px;
  opacity: 0;
  animation: ee-fade-in 0.5s ease 1s both;
}

/* =============================================
   Fun Facts
   ============================================= */

.ee-fact-block {
  width: 100%;
  max-width: 520px;
  margin-bottom: 2.5rem;
  opacity: 0;
  animation: ee-fade-in 0.5s ease 1.2s both;
}

.ee-fact {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: #5eead4;
  background: rgba(20, 184, 166, 0.04);
  border-left: 2px solid rgba(20, 184, 166, 0.3);
  padding: 1rem 1.25rem;
  border-radius: 0 4px 4px 0;
  text-align: left;
  line-height: 1.6;
}

.ee-fact-prompt {
  color: #14b8a6;
  font-weight: 700;
  flex-shrink: 0;
  opacity: 0.7;
}

.ee-fact-text {
  animation: ee-fade-in 0.4s ease both;
}

/* =============================================
   Close Button
   ============================================= */

.ee-close {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 500;
  color: #14b8a6;
  background: none;
  border: 1px solid rgba(20, 184, 166, 0.2);
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  min-height: 44px;
  min-width: 44px;
  opacity: 0;
  animation: ee-fade-in 0.5s ease 1.4s both;
}

.ee-close:hover {
  color: #2dd4bf;
  border-color: rgba(45, 212, 191, 0.4);
  background: rgba(45, 212, 191, 0.06);
}

.ee-close:active {
  transform: scale(0.97);
}

.ee-close-prompt {
  color: #2dd4bf;
  font-weight: 700;
  transition: color 0.2s ease;
}

.ee-close:hover .ee-close-prompt {
  color: #5eead4;
}

/* =============================================
   Hint Text
   ============================================= */

.ee-hint {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #4b5563;
  margin-top: 1rem;
  opacity: 0;
  animation: ee-fade-in 0.5s ease 1.6s both;
}

/* =============================================
   Keyframe Animations
   ============================================= */

@keyframes ee-fade-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ee-glitch-1 {
  0% {
    clip-path: inset(0 0 95% 0);
    transform: translate(0);
  }
  5% {
    clip-path: inset(40% 0 30% 0);
    transform: translate(-3px, 1px);
  }
  10% {
    clip-path: inset(80% 0 0% 0);
    transform: translate(2px, -1px);
  }
  15% {
    clip-path: inset(0 0 95% 0);
    transform: translate(0);
  }
  100% {
    clip-path: inset(0 0 95% 0);
    transform: translate(0);
  }
}

@keyframes ee-glitch-2 {
  0% {
    clip-path: inset(95% 0 0 0);
    transform: translate(0);
  }
  5% {
    clip-path: inset(10% 0 60% 0);
    transform: translate(3px, -1px);
  }
  10% {
    clip-path: inset(50% 0 20% 0);
    transform: translate(-2px, 1px);
  }
  15% {
    clip-path: inset(95% 0 0 0);
    transform: translate(0);
  }
  100% {
    clip-path: inset(95% 0 0 0);
    transform: translate(0);
  }
}

@keyframes ee-scanlines {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 8px;
  }
}

@keyframes ee-pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 8px rgba(20, 184, 166, 0.15);
  }
  50% {
    box-shadow:
      0 0 20px rgba(20, 184, 166, 0.3),
      0 0 40px rgba(20, 184, 166, 0.1);
  }
}

@keyframes ee-matrix-rain {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  10% {
    opacity: 0.25;
  }
  90% {
    opacity: 0.1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

@keyframes ee-confetti-fall {
  0% {
    transform: translateY(-10vh) rotate(0deg) translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(720deg) translateX(80px);
    opacity: 0;
  }
}

/* =============================================
   Reduced Motion
   ============================================= */

@media (prefers-reduced-motion: reduce) {
  .ee-overlay {
    animation: ee-fade-in 0.3s ease both;
  }

  .ee-scanlines {
    animation: none;
  }

  .ee-matrix {
    display: none;
  }

  .ee-confetti {
    display: none;
  }

  .glitch::before,
  .glitch::after {
    animation: none;
  }

  .ee-badge {
    animation: none;
    box-shadow: none;
  }

  .ee-fact-text {
    animation: none;
  }
}

/* =============================================
   Mobile Adjustments
   ============================================= */

@media (max-width: 640px) {
  .ee-content {
    padding: 1.5rem 1rem;
  }

  .ee-ascii {
    font-size: 0.45rem;
    margin-bottom: 1rem;
  }

  .ee-title {
    font-size: clamp(1.75rem, 8vw, 2.5rem);
  }

  .ee-badge {
    font-size: 0.75rem;
    padding: 0.3rem 1rem;
  }

  .ee-subtitle {
    font-size: 0.9375rem;
  }

  .ee-message {
    font-size: 0.8125rem;
  }

  .ee-fact {
    font-size: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .ee-close {
    font-size: 0.875rem;
    padding: 0.75rem 1.25rem;
  }

  .ee-hint {
    font-size: 0.6875rem;
  }
}
</style>
