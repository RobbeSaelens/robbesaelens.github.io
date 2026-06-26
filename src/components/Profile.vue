<template>
  <div class="fade-out mx-auto my-auto max-w-screen-2xl px-6 pb-48 sm:pb-16">
    <div class="sm:space-x-15 mr-5% mt-10% flex items-center justify-between">
      <!-- Left: Social icons -->
      <div class="hidden flex-col gap-1 sm:flex">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.instagram.com/robbe.saelens/"
          aria-label="Follow me on Instagram"
          class="social-link"
        >
          <Instagram class="social-icon" />
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.facebook.com/profile.php?id=100006223099352"
          aria-label="Connect on Facebook"
          class="social-link"
        >
          <Facebook class="social-icon" />
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/"
          aria-label="Connect on LinkedIn"
          class="social-link"
        >
          <Linkedin class="social-icon" />
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/RobbeSaelens"
          aria-label="View my GitHub profile"
          class="social-link"
        >
          <Github class="social-icon" />
        </a>
      </div>

      <!-- Center: Content -->
      <div class="typewriter space-y-8">
        <!-- Terminal title -->
        <h1 class="terminal-title text-3xl font-bold sm:text-4xl lg:text-6xl">
          <span class="terminal-prompt">&gt;</span>
          <span class="terminal-text">robbe saelens</span>
          <span class="terminal-cursor" aria-hidden="true"></span>
        </h1>

        <!-- Role subtitle -->
        <div class="flex items-center font-medium">
          <hr class="mr-3 hidden h-0.5 w-10 border-0 bg-teal-500 lg:block" />
          <h2
            class="text-lg font-medium text-teal-600 dark:text-teal-400 md:text-xl"
            style="
              font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
            "
          >
            <span class="text-teal-500 dark:text-teal-400">$</span>
            {{ $t('home.role').toLowerCase() }}
          </h2>
        </div>

        <!-- Mobile profile photo -->
        <img
          class="h-56 w-full rounded-3xl object-cover shadow sm:hidden"
          src="/pf2.jpg"
          alt="Robbe Saelens"
          loading="lazy"
        />

        <!-- Bio & details -->
        <div class="max-w-lg space-y-5">
          <p class="text-lg leading-relaxed text-teal-800 dark:text-gray-200">
            {{ $t('home.bio') }}
          </p>
          <div class="space-y-3 border-l-2 border-teal-400 pl-5 dark:border-teal-600">
            <div class="flex items-center gap-2 sm:text-lg">
              <Briefcase class="h-4 w-4 shrink-0 text-teal-500 dark:text-teal-400" />
              <span class="text-teal-800 dark:text-gray-200">
                @<a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.dynamate.be/"
                  class="font-semibold transition-colors hover:text-teal-600 dark:hover:text-teal-400"
                  >Dynamate</a
                >
                {{ $t('home.dynamateRole') }}
              </span>
            </div>
            <div class="flex items-center gap-2 sm:text-lg">
              <GraduationCap class="h-4 w-4 shrink-0 text-teal-500 dark:text-teal-400" />
              <span class="text-teal-800 dark:text-gray-200">
                {{ $t('home.educationLabel') }}
                <a
                  href="https://www.howest.be/nl/opleidingen/bachelor/multimedia-en-creatieve-technologie"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-semibold transition-colors hover:text-teal-600 dark:hover:text-teal-400"
                  >MCT</a
                >
              </span>
            </div>
          </div>
        </div>

        <!-- CTA & navigation -->
        <div class="flex flex-col items-start">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/message"
            class="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-base font-semibold text-white shadow-sm transition-all duration-300 hover:bg-teal-600 hover:shadow-md dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {{ $t('home.sayHello') }}
            <MessageCircle class="h-5 w-5" />
          </a>

          <router-link
            class="group mt-8 inline-flex items-center gap-2 text-teal-600 transition-colors hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200 sm:mt-12"
            to="/projects"
            style="
              font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
              font-size: 0.9375rem;
            "
          >
            <span class="text-teal-500 dark:text-teal-400">$</span>
            <span>cd ./projects</span>
            <ArrowRight
              class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            />
          </router-link>
        </div>
      </div>

      <!-- Right: Profile photo (desktop) -->
      <div class="hidden md:block">
        <div
          class="photo-wrapper group relative"
          @mousemove="onPhotoMove"
          @mouseleave="tooltipVisible = false"
        >
          <!-- glow ring -->
          <div
            class="photo-glow pointer-events-none absolute -inset-1 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          ></div>

          <!-- dev tooltip (follows cursor) -->
          <div
            :class="[
              'photo-tooltip pointer-events-none fixed z-50 whitespace-nowrap rounded-lg border border-teal-200 bg-white px-3 py-2 shadow-md transition-opacity duration-150 dark:border-teal-700 dark:bg-gray-800',
              tooltipVisible ? 'opacity-100' : 'opacity-0',
            ]"
            :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
          >
            <span class="font-mono text-xs text-teal-600 dark:text-teal-400"
              >$ file ./robbe.jpg</span
            >
            <span class="mt-0.5 block font-mono text-[0.65rem] text-teal-500 dark:text-teal-300"
              >→ full-stack developer detected</span
            >
          </div>

          <img
            class="photo-img relative h-56 w-full rounded-3xl border-2 border-teal-400/30 object-cover shadow-lg transition-all duration-500 group-hover:scale-[1.03] group-hover:border-teal-500 group-hover:shadow-xl lg:h-96 lg:w-96 lg:rounded-full dark:border-teal-500/30 dark:group-hover:border-teal-400"
            src="/pf2.jpg"
            alt="Robbe Saelens"
            loading="lazy"
          />
        </div>
      </div>
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

export default {
  components: {
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

<style>
/* CSS Custom Properties — unscoped so :root and .dark apply globally */
:root {
  --color-accent: #0d9488;
  --color-prompt: #0d9488;
  --color-cursor: #0d9488;
  --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
}
.dark {
  --color-accent: #2dd4bf;
  --color-prompt: #2dd4bf;
  --color-cursor: #2dd4bf;
}
</style>

<style scoped>
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

/* =============================================
   Social Icons
   ============================================= */
.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  color: #0f766e;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.dark .social-link {
  color: #5eead4;
}

.social-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.social-link:hover {
  color: #0d9488;
  background: rgba(13, 148, 136, 0.08);
}

.dark .social-link:hover {
  color: #2dd4bf;
  background: rgba(45, 212, 191, 0.1);
}

/* =============================================
   Profile Photo Hover Glow
   ============================================= */
.photo-wrapper {
  display: inline-block;
  position: relative;
}

.photo-glow {
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

.photo-img {
  z-index: 1;
}

@keyframes glow-spin {
  to {
    transform: rotate(360deg);
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
