<template>
  <transition name="consent">
    <section
      v-if="consentOpen"
      class="consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-text"
    >
      <h2 id="consent-title" class="consent-title"><span class="consent-prompt">$</span> {{ $t('consent.title') }}</h2>
      <p id="consent-text" class="consent-text">
        {{ $t('consent.text') }}
        <router-link to="/privacy" class="consent-link">{{ $t('consent.privacy') }}</router-link>
      </p>
      <!-- Both choices equally prominent: declining must be as easy as accepting -->
      <div class="consent-actions">
        <button type="button" class="consent-btn" @click="setConsent('denied')">{{ $t('consent.decline') }}</button>
        <button type="button" class="consent-btn" @click="setConsent('granted')">{{ $t('consent.accept') }}</button>
      </div>
    </section>
  </transition>
</template>

<script setup lang="ts">
import { consentOpen, setConsent } from '../analytics'
</script>

<style scoped>
.consent {
  position: fixed;
  left: 1.5rem;
  bottom: 1.5rem;
  z-index: 60;
  width: min(26rem, calc(100vw - 3rem));
  padding: 1.125rem 1.25rem;
  color: var(--color-text-primary);
  /* Opaque: the dark theme's --color-surface is see-through */
  background: var(--color-bg);
  border: 1px solid var(--color-border-glow);
  border-radius: 0.875rem;
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.35);
}
.consent-title {
  margin: 0 0 0.375rem;
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 700;
}
.consent-prompt {
  color: var(--color-prompt);
}
.consent-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
}
.consent-link {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.consent-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 1rem;
}
.consent-btn {
  padding: 0.55rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent);
  background: var(--color-surface);
  border: 1px solid var(--color-border-glow);
  border-radius: 0.5rem;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}
.consent-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}
.consent-btn:focus-visible,
.consent-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Phones: full width, above the chat button */
@media (max-width: 639px) {
  .consent {
    left: 0.75rem;
    right: 0.75rem;
    bottom: 5rem;
    width: auto;
  }
}

.consent-enter-active,
.consent-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.consent-enter-from,
.consent-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
@media (prefers-reduced-motion: reduce) {
  .consent-enter-active,
  .consent-leave-active {
    transition: none;
  }
}
</style>
