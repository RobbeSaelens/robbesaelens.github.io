<template>
  <div class="hero mx-auto w-full max-w-screen-2xl px-6">
    <div class="hero-head">
      <h1 class="hero-in terminal-title hero-title font-bold" style="--i: 0">
        <span class="terminal-prompt">&gt;</span>
        <span class="terminal-text">robbe saelens</span>
        <span class="terminal-cursor" aria-hidden="true"></span>
      </h1>
      <p class="hero-in hero-role" style="--i: 1">
        <span class="role-rule" aria-hidden="true"></span>
        <span class="prompt">$</span> {{ $t('home.role').toLowerCase() }}
      </p>
    </div>

    <!-- Photo: a wide card on phones, a ringed circle next to the text from 768px -->
    <div class="hero-in hero-photo" style="--i: 2">
      <div class="photo-wrapper group" @mousemove="onPhotoMove" @mouseleave="tooltipVisible = false">
        <div class="photo-glow pointer-events-none" aria-hidden="true"></div>

        <!-- dev tooltip (follows cursor) -->
        <div
          :class="[
            'photo-tooltip pointer-events-none fixed z-50 whitespace-nowrap rounded-lg border border-teal-200 bg-white px-3 py-2 shadow-md transition-opacity duration-150 dark:border-teal-700 dark:bg-gray-800',
            tooltipVisible ? 'opacity-100' : 'opacity-0',
          ]"
          :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
          aria-hidden="true"
        >
          <span class="font-mono text-xs text-teal-700 dark:text-teal-400">$ file ./robbe.jpg</span>
          <span class="mt-0.5 block font-mono text-[0.65rem] text-teal-700 dark:text-teal-300"
            >→ {{ $t('home.photoTooltip') }}</span
          >
        </div>

        <img class="photo-img" src="/pf2.jpg" alt="Robbe Saelens" width="800" height="800" />
      </div>
    </div>

    <div class="hero-body">
      <i18n-t keypath="home.bio" tag="p" class="hero-in hero-bio" style="--i: 2">
        <template #place><PlaceMap /></template>
      </i18n-t>

      <ul class="hero-in hero-facts" style="--i: 3">
        <li>
          <span class="fact-icon" aria-hidden="true"><Briefcase /></span>
          <span>
            @<a target="_blank" rel="noopener noreferrer" href="https://www.dynamate.be/" class="fact-link"
              >Dynamate</a
            >
            {{ $t('home.dynamateRole') }}
          </span>
        </li>
        <li>
          <span class="fact-icon" aria-hidden="true"><GraduationCap /></span>
          <span>
            {{ $t('home.educationLabel') }}
            <a
              href="https://www.howest.be/nl/opleidingen/bachelor/multimedia-en-creatieve-technologie"
              target="_blank"
              rel="noopener noreferrer"
              class="fact-link"
              >MCT</a
            >
          </span>
        </li>
      </ul>

      <div class="hero-in hero-actions" style="--i: 4">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/message"
          class="hero-btn hero-btn--primary"
        >
          {{ $t('home.sayHello') }}
          <MessageCircle class="hero-btn-icon" aria-hidden="true" />
        </a>
        <router-link :to="$lp('/projects')" class="hero-btn hero-btn--ghost">
          <span class="prompt">$</span> cd ./projects
          <ArrowRight class="hero-btn-icon hero-btn-arrow" aria-hidden="true" />
        </router-link>
      </div>

      <ul class="hero-in hero-social" style="--i: 5">
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.instagram.com/robbe.saelens/"
            aria-label="Follow me on Instagram"
            class="social-link"
          >
            <Instagram class="social-icon" />
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.facebook.com/profile.php?id=100006223099352"
            aria-label="Connect on Facebook"
            class="social-link"
          >
            <Facebook class="social-icon" />
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/"
            aria-label="Connect on LinkedIn"
            class="social-link"
          >
            <Linkedin class="social-icon" />
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/RobbeSaelens"
            aria-label="View my GitHub profile"
            class="social-link"
          >
            <Github class="social-icon" />
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.drupal.org/u/robbesaelens"
            aria-label="View my drupal.org profile"
            class="social-link"
          >
            <DrupalIcon class="social-icon" />
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import {
  Instagram,
  Linkedin,
  Facebook,
  Github,
  MessageCircle,
  ArrowRight,
  Briefcase,
  GraduationCap,
} from 'lucide-vue-next'
import PlaceMap from './PlaceMap.vue'
import DrupalIcon from './DrupalIcon.vue'

export default {
  components: {
    PlaceMap,
    DrupalIcon,
    Instagram,
    Linkedin,
    Facebook,
    Github,
    MessageCircle,
    ArrowRight,
    Briefcase,
    GraduationCap,
  },
  data() {
    return {
      tooltipVisible: false,
      tooltipX: 0,
      tooltipY: 0,
    }
  },
  methods: {
    onPhotoMove(e: MouseEvent) {
      this.tooltipVisible = true
      // offset so the tooltip appears above-right of the cursor
      this.tooltipX = e.clientX + 16
      this.tooltipY = e.clientY - 48
    },
  },
}
</script>

<style scoped>
/* =============================================
   Layout
   Phones: title, photo, text stacked. From 768px: text left, photo right,
   the whole hero centred in the screen height.
   ============================================= */
.hero {
  display: grid;
  grid-template-areas:
    'head'
    'photo'
    'body';
  gap: 1.75rem;
  padding-block: clamp(1.5rem, 5vh, 4rem) clamp(2rem, 6vh, 4.5rem);
}

@media (min-width: 768px) {
  .hero {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'head photo'
      'body photo';
    align-items: center;
    column-gap: clamp(2.5rem, 6vw, 7rem);
    row-gap: 2rem;
  }
  .hero-head {
    align-self: end;
  }
  .hero-body {
    align-self: start;
  }
}

.hero-head {
  grid-area: head;
  /* The title scales with its column (cqi), so it never wraps. */
  container-type: inline-size;
}
.hero-photo {
  grid-area: photo;
  justify-self: center;
}
.hero-body {
  grid-area: body;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 36rem;
}

/* =============================================
   Terminal Title
   ============================================= */
.terminal-title {
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 0.15em;
  margin: 0;
  line-height: 1.15;
  white-space: nowrap;
}
.hero-title {
  /* "> robbe saelens█" is about 9.5em wide in the mono font */
  font-size: clamp(1.75rem, 10cqi, 4.5rem);
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
  width: 0.5em;
  height: 1em;
  margin-left: 0.1em;
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

.hero-role {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  font-family: var(--font-mono);
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  font-weight: 500;
  color: var(--color-accent);
}
.role-rule {
  display: none;
  width: 2.5rem;
  height: 2px;
  margin-right: 0.25rem;
  background: var(--color-accent);
  opacity: 0.7;
}
@media (min-width: 1024px) {
  .role-rule {
    display: block;
  }
}
.prompt {
  color: var(--color-prompt);
  opacity: 0.8;
}

/* =============================================
   Text, facts
   ============================================= */
.hero-bio {
  margin: 0;
  font-size: clamp(1.0625rem, 1rem + 0.3vw, 1.25rem);
  line-height: 1.65;
  color: var(--color-text-primary);
}

.hero-facts {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: clamp(0.9375rem, 0.9rem + 0.2vw, 1.0625rem);
  color: var(--color-text-secondary);
}
.hero-facts li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.fact-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: var(--color-accent);
  background: var(--color-accent-soft);
}
.fact-icon :deep(svg) {
  width: 1rem;
  height: 1rem;
}
.fact-link {
  font-weight: 600;
  color: var(--color-text-primary);
  text-decoration: underline;
  text-decoration-color: var(--color-border-glow);
  text-underline-offset: 3px;
  transition:
    color 0.2s ease,
    text-decoration-color 0.2s ease;
}
.fact-link:hover {
  color: var(--color-accent);
  text-decoration-color: currentColor;
}

/* =============================================
   Buttons
   ============================================= */
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.875rem;
  padding: 0 1.25rem;
  border-radius: 0.625rem;
  font-weight: 600;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}
.hero-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
.hero-btn--primary {
  color: #fff;
  background: #0f766e; /* teal-700: white text stays above 4.5:1 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.hero-btn--primary:hover {
  background: #115e59;
  box-shadow: 0 6px 18px -6px rgba(13, 148, 136, 0.55);
}
.hero-btn--ghost {
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-accent);
  border: 1px solid var(--color-border-glow);
  background: var(--color-surface);
}
.hero-btn--ghost:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}
.hero-btn-icon {
  width: 1.125rem;
  height: 1.125rem;
}
.hero-btn-arrow {
  transition: transform 0.2s ease;
}
.hero-btn--ghost:hover .hero-btn-arrow {
  transform: translateX(3px);
}

/* =============================================
   Social Icons
   ============================================= */
.hero-social {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
  color: #0f766e;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.dark .social-link {
  color: #5eead4;
}

.social-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.social-link:hover {
  color: #0d9488;
  border-color: var(--color-border-glow);
  background: rgba(13, 148, 136, 0.08);
}

.dark .social-link:hover {
  color: #2dd4bf;
  background: rgba(45, 212, 191, 0.1);
}

.social-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* =============================================
   Profile Photo
   ============================================= */
.photo-wrapper {
  position: relative;
  display: block;
}

.photo-img {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  max-height: 15rem;
  object-fit: cover;
  object-position: 50% 30%;
  border-radius: 1.5rem;
  border: 2px solid rgba(45, 212, 191, 0.3);
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.25);
  transition:
    transform 0.5s ease,
    border-color 0.5s ease,
    box-shadow 0.5s ease;
}

.photo-glow {
  position: absolute;
  inset: -0.35rem;
  border-radius: 1.75rem;
  opacity: 0;
  transition: opacity 0.5s ease;
  background: conic-gradient(
    from 0deg,
    transparent,
    rgba(13, 148, 136, 0.25),
    transparent,
    rgba(13, 148, 136, 0.15),
    transparent
  );
  animation: glow-spin 4s linear infinite;
}

.dark .photo-glow {
  background: conic-gradient(
    from 0deg,
    transparent,
    rgba(45, 212, 191, 0.3),
    transparent,
    rgba(45, 212, 191, 0.18),
    transparent
  );
}

/* Phones: full width card. From 768px: a circle with an offset ring. */
.hero-photo {
  width: 100%;
}
@media (min-width: 768px) {
  .hero-photo {
    width: auto;
  }
  .photo-wrapper {
    width: clamp(13rem, 28vw, 26rem);
  }
  .photo-wrapper::before {
    content: '';
    position: absolute;
    inset: -0.9rem 0.9rem 0.9rem -0.9rem; /* offset up-left, away from the screen edge */
    border: 1px dashed var(--color-border-glow);
    border-radius: 50%;
    pointer-events: none;
  }
  .photo-img {
    aspect-ratio: 1;
    max-height: none;
    border-radius: 50%;
    object-position: center;
  }
  .photo-glow {
    border-radius: 50%;
  }
}

@media (hover: hover) and (pointer: fine) {
  .photo-wrapper:hover .photo-glow {
    opacity: 1;
  }
  .photo-wrapper:hover .photo-img {
    transform: scale(1.03);
    border-color: #14b8a6;
    box-shadow: 0 18px 40px -14px rgba(13, 148, 136, 0.45);
  }
}

@keyframes glow-spin {
  to {
    transform: rotate(360deg);
  }
}

/* =============================================
   Entrance: the shared .hero-in rise (styles.css); the photo scales in instead
   ============================================= */
html.js.intro-done .hero-photo {
  animation-name: hero-photo-in;
  animation-duration: 1s;
}
@keyframes hero-photo-in {
  from {
    opacity: 0;
    transform: scale(0.92) rotate(-2deg);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: none;
    filter: none;
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

  .photo-glow {
    animation: none;
  }

  .photo-img {
    transition: none;
  }
}
</style>
