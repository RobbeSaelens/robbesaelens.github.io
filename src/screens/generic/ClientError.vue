<template>
  <main class="error-page">
    <div class="terminal-window">
      <!-- Title bar -->
      <div class="terminal-chrome">
        <div class="chrome-dots">
          <span class="dot dot--red"></span>
          <span class="dot dot--yellow"></span>
          <span class="dot dot--green"></span>
        </div>
        <span class="chrome-title">error.sh</span>
        <div class="chrome-spacer"></div>
      </div>

      <!-- Terminal body -->
      <div class="terminal-body">
        <!-- CRT scanline overlay -->
        <div class="crt-overlay"></div>

        <!-- Content -->
        <div class="terminal-content">
          <!-- Status code number (watermark) -->
          <div class="status-code glitch-target">{{ statusCodeNumber }}</div>

          <!-- Icon -->
          <div class="icon-wrapper">
            <component
              :is="errorIcon"
              class="error-icon"
              :class="errorIconClass"
              :size="80"
              :stroke-width="1.2"
            />
          </div>

          <!-- Title / description -->
          <h1 class="error-title">{{ errorTitle }}</h1>
          <p class="error-description">{{ errorDescription }}</p>

          <!-- Terminal command simulation -->
          <div class="command-block">
            <div class="command-line">
              <span class="terminal-prompt">&gt;</span>
              <span class="typing-wrapper">
                <span class="typing-text">curl -I {{ $route.path }}</span>
                <span class="terminal-cursor"></span>
              </span>
            </div>

            <!-- Response lines (stagger after typing finishes at ~3.4s) -->
            <div class="response-block">
              <div class="response-line" style="animation-delay: 3.6s">
                <span class="response-header">{{ statusCodeNumber }} {{ statusCodeLabel }}</span>
              </div>
              <div class="response-line" style="animation-delay: 3.9s">
                <span class="response-key">Content-Type:</span> text/html
              </div>
              <div class="response-line" style="animation-delay: 4.2s">
                <span class="response-key">Connection:</span> close
              </div>
              <div class="response-line response-line--blank" style="animation-delay: 4.4s"></div>
              <div class="response-line response-line--error" style="animation-delay: 4.7s">
                Error: {{ errorDescription }}
              </div>
            </div>
          </div>

          <!-- Back link -->
          <router-link to="/" class="back-link group">
            <span class="back-prompt">$</span>
            <span class="back-command">{{ $t('error.backHome') }}</span>
            <ArrowRight class="back-arrow" />
          </router-link>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { FileQuestion, ServerCrash, AlertTriangle, ArrowRight } from 'lucide-vue-next'

export default defineComponent({
  name: 'ClientError',
  components: {
    FileQuestion,
    ServerCrash,
    AlertTriangle,
    ArrowRight,
  },
  computed: {
    errorCode(): string {
      return (this.$route.meta?.errorCode as string) || '404'
    },
    statusCodeNumber(): string {
      return this.errorCode
    },
    errorIcon() {
      switch (this.errorCode) {
        case '404':
          return FileQuestion
        case '500':
          return ServerCrash
        default:
          return AlertTriangle
      }
    },
    errorIconClass(): string {
      switch (this.errorCode) {
        case '404':
          return 'icon--accent'
        case '500':
          return 'icon--danger'
        default:
          return 'icon--warning'
      }
    },
    statusCodeLabel(): string {
      const key = `error.${this.errorCode}.statusCode`
      const val = this.$t(key)
      return val !== key ? val : this.$t('error.defaultTitle')
    },
    errorTitle(): string {
      const key = `error.${this.errorCode}.title`
      const val = this.$t(key)
      return val !== key ? val : this.$t('error.defaultTitle')
    },
    errorDescription(): string {
      const key = `error.${this.errorCode}.description`
      const val = this.$t(key)
      return val !== key ? val : this.$t('error.defaultDescription')
    },
  },
})
</script>

<style scoped>
/* =============================================
   Page Layout
   ============================================= */

.error-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--color-bg);
  background-image:
    radial-gradient(ellipse at 50% 0%, var(--color-accent-soft) 0%, transparent 60%),
    radial-gradient(circle at 80% 80%, rgba(13, 148, 136, 0.04) 0%, transparent 40%);
}

/* =============================================
   Terminal Window
   ============================================= */

.terminal-window {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.08),
    0 20px 40px -4px rgba(0, 0, 0, 0.12),
    0 0 0 1px var(--color-border),
    0 0 60px -10px var(--color-accent-soft);
}

/* =============================================
   Chrome / Title Bar
   ============================================= */

.terminal-chrome {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.chrome-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  opacity: 0.85;
}

.dot--red {
  background: #ef4444;
}

.dot--yellow {
  background: #f59e0b;
}

.dot--green {
  background: #22c55e;
}

.chrome-title {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  flex: 1;
  text-align: center;
}

.chrome-spacer {
  width: 54px; /* balance the dots */
}

/* =============================================
   Terminal Body
   ============================================= */

.terminal-body {
  position: relative;
  flex: 1;
  overflow-y: auto;
  background: var(--color-surface);
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.terminal-body::-webkit-scrollbar {
  width: 6px;
}

.terminal-body::-webkit-scrollbar-track {
  background: transparent;
}

.terminal-body::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

/* CRT scanline overlay */
.crt-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  animation: scanlines 8s linear infinite;
}

/* =============================================
   Terminal Content
   ============================================= */

.terminal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  text-align: center;
}

/* =============================================
   Status Code Number
   ============================================= */

.status-code {
  font-family: var(--font-mono);
  font-size: clamp(4rem, 12vw, 8rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  background: linear-gradient(
    135deg,
    var(--color-accent),
    var(--color-prompt),
    var(--color-accent)
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.12;
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 1;
  user-select: none;
}

/* =============================================
   Icon
   ============================================= */

.icon-wrapper {
  position: relative;
  z-index: 2;
  margin-bottom: 1.5rem;
  animation: float 4s ease-in-out infinite;
}

.error-icon {
  opacity: 0;
  animation: fadeIn 0.6s ease 0.3s both;
}

.icon--accent {
  color: var(--color-accent);
}

.icon--danger {
  color: var(--color-danger);
}

.icon--warning {
  color: var(--color-warning);
}

/* =============================================
   Error Text
   ============================================= */

.error-title {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
  opacity: 0;
  animation: fadeIn 0.5s ease 0.5s both;
}

.error-description {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0 0 2.5rem 0;
  max-width: 420px;
  line-height: 1.6;
  opacity: 0;
  animation: fadeIn 0.5s ease 0.7s both;
}

/* =============================================
   Command Block
   ============================================= */

.command-block {
  width: 100%;
  max-width: 480px;
  text-align: left;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2.5rem;
  opacity: 0;
  animation: fadeIn 0.5s ease 0.9s both;
}

.command-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.typing-wrapper {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  width: 0;
  animation: typing 2s steps(40, end) 1.4s forwards;
}

.typing-text {
  color: var(--color-text-primary);
}

.command-line .terminal-cursor {
  margin-left: 2px;
}

/* =============================================
   Response Lines
   ============================================= */

.response-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.response-line {
  opacity: 0;
  animation: fadeIn 0.4s ease both;
}

.response-line--blank {
  height: 0.5rem;
}

.response-header {
  color: var(--color-text-primary);
  font-weight: 600;
}

.response-key {
  color: var(--color-text-muted);
}

.response-line--error {
  color: var(--color-danger);
  font-weight: 500;
}

/* =============================================
   Back Link
   ============================================= */

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  color: var(--color-accent);
  text-decoration: none;
  opacity: 0;
  animation: fadeIn 0.5s ease 5.3s both;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--color-prompt);
}

.back-prompt {
  color: var(--color-prompt);
  font-weight: 700;
}

.back-command {
  transition: color 0.2s ease;
}

.back-link:hover .back-command {
  color: var(--color-text-primary);
}

.back-arrow {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
}

.back-link:hover .back-arrow {
  transform: translateX(4px);
}

/* =============================================
   Glitch on Status Code
   ============================================= */

.glitch-target {
  animation:
    fadeIn 0.6s ease both,
    glitch-shift 8s step-end 6s infinite;
}

/* =============================================
   Reduced Motion
   ============================================= */

@media (prefers-reduced-motion: reduce) {
  .crt-overlay {
    animation: none;
  }

  .icon-wrapper {
    animation: none;
  }

  .glitch-target {
    animation: fadeIn 0.6s ease both;
  }
}

/* =============================================
   Mobile Adjustments
   ============================================= */

@media (max-width: 640px) {
  .terminal-content {
    padding: 2rem 1.25rem;
  }

  .command-block {
    padding: 1rem;
  }

  .status-code {
    font-size: clamp(3rem, 15vw, 5rem);
    top: 1.25rem;
    right: 1.25rem;
  }

  .error-icon {
    width: 56px;
    height: 56px;
  }
}
</style>
