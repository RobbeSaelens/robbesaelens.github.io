<template>
  <div class="flex w-full items-center justify-between">
    <router-link class="focus-visible:ring-2xl rounded-md outline-none" to="/" @click="onLogoClick">
      <img
        class="hidden sm:block scale h-5 customFill"
        src="/Logo.svg"
        alt="Robbe Saelens logo"
        loading="lazy"
      />
      <img
        src="/Fav.png"
        alt="Robbe Saelens logo"
        class="scale h-5 customFill block sm:hidden"
        loading="lazy"
      />
    </router-link>
    <!-- Secret code revealed via triple-click -->
    <transition name="code-reveal">
      <span v-if="showSecretCode" class="secret-code-badge">{{ secretCode }}</span>
    </transition>

    <!-- Desktop nav -->
    <div class="ml-auto hidden items-center sm:flex">
      <ul class="flex items-center space-x-8 text-sm font-medium">
        <li :class="{ 'sm:active-link': $route.path === '/projects' }">
          <router-link class="active flex text-lg text-teal-700 dark:text-teal-500" to="/projects">
            {{ $t('nav.projects') }}
          </router-link>
        </li>
        <li :class="{ 'sm:active-link': $route.path === '/contact' }">
          <router-link class="active flex text-lg text-teal-700 dark:text-teal-500" to="/contact">
            {{ $t('nav.aboutMe') }}
          </router-link>
        </li>
        <li>
          <LanguageSwitcher />
        </li>
        <li>
          <button
            @click="toggleTheme"
            class="h-6 w-6 cursor-pointer text-teal-700 dark:text-teal-300"
            :aria-label="isDark ? $t('aria.toggleThemeLight') : $t('aria.toggleThemeDark')"
          >
            <Sun v-if="isDark" class="h-6 w-6" />
            <Moon v-else class="h-6 w-6" />
          </button>
        </li>
      </ul>
    </div>

    <!-- Mobile hamburger -->
    <button
      @click="toggleNav"
      type="button"
      class="hamburger relative z-[5001] rounded-lg p-2 text-sm text-teal-600 focus:outline-none focus:ring-2 focus:ring-gray-600 sm:hidden"
      :aria-controls="'mobile-menu'"
      :aria-expanded="showMenu"
      :aria-label="$t('aria.toggleNav')"
    >
      <!-- Hamburger icon -->
      <svg
        v-if="!showMenu"
        class="h-6 w-6"
        aria-hidden="true"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clip-rule="evenodd"
        ></path>
      </svg>
      <!-- X icon -->
      <svg
        v-else
        class="h-6 w-6"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Mobile fullscreen overlay -->
  <Teleport to="body">
    <transition name="overlay">
      <div
        v-if="showMenu"
        id="mobile-menu"
        class="fixed inset-0 z-5000 flex flex-col items-center justify-center bg-white dark:bg-gray-900"
        @click.self="closeMenu"
      >
        <img
          src="/Fav.png"
          alt="Robbe Saelens logo"
          class="absolute left-6 top-6 h-8"
          loading="lazy"
          @click="onLogoClick"
        />
        <nav class="flex flex-col items-center space-y-8 text-center">
          <router-link
            class="text-4xl font-bold text-teal-700 transition-colors hover:text-teal-500 dark:text-teal-300 dark:hover:text-teal-400"
            to="/"
            @click="closeMenu"
          >
            {{ $t('nav.home') }}
          </router-link>
          <router-link
            class="text-4xl font-bold text-teal-700 transition-colors hover:text-teal-500 dark:text-teal-300 dark:hover:text-teal-400"
            to="/projects"
            @click="closeMenu"
          >
            {{ $t('nav.projects') }}
          </router-link>
          <router-link
            class="text-4xl font-bold text-teal-700 transition-colors hover:text-teal-500 dark:text-teal-300 dark:hover:text-teal-400"
            to="/contact"
            @click="closeMenu"
          >
            {{ $t('nav.aboutMe') }}
          </router-link>

          <hr class="w-32 border-teal-200 dark:border-teal-800" />

          <div class="space-y-4 text-lg text-teal-600 dark:text-teal-400">
            <a
              href="tel:0471958195"
              class="flex items-center justify-center gap-2 transition-colors hover:text-teal-800 dark:hover:text-teal-200"
            >
              <Phone class="h-5 w-5" />
              0471 95 81 95
            </a>
            <a
              href="mailto:robbe.saelens@telenet.be"
              class="flex items-center justify-center gap-2 transition-colors hover:text-teal-800 dark:hover:text-teal-200"
            >
              <Mail class="h-5 w-5" />
              robbe.saelens@telenet.be
            </a>
          </div>

          <LanguageSwitcher />

          <button
            @click="toggleTheme"
            class="mt-4 rounded-full border border-teal-300 px-6 py-2 text-teal-700 transition-colors hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-900"
            :aria-label="isDark ? $t('aria.toggleThemeLight') : $t('aria.toggleThemeDark')"
          >
            <Sun v-if="isDark" class="mx-auto h-6 w-6" />
            <Moon v-else class="mx-auto h-6 w-6" />
          </button>
        </nav>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Sun, Moon, Phone, Mail } from 'lucide-vue-next'
import LanguageSwitcher from '../../components/LanguageSwitcher.vue'
import { useEasterEgg } from '../../composables/useEasterEgg'

export default {
  components: {
    Sun,
    Moon,
    Phone,
    Mail,
    LanguageSwitcher,
  },
  setup() {
    const showMenu = ref(false)
    const { handleLogoClick, secretCode, showSecretCode } = useEasterEgg()

    const onLogoClick = () => {
      handleLogoClick()
      closeMenu()
    }

    // Read theme from localStorage, fall back to system preference, default to light
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = stored || (prefersDark ? 'dark' : 'light')
    const theme = ref(initialTheme)

    const isDark = computed(() => theme.value === 'dark')

    // Sync DOM class on mount and whenever theme changes
    onMounted(() => {
      if (isDark.value) {
        document.documentElement.classList.add('dark')
      }
    })

    const toggleNav = () => {
      showMenu.value = !showMenu.value
      // Prevent body scroll when menu is open
      document.body.style.overflow = showMenu.value ? 'hidden' : ''
    }

    const closeMenu = () => {
      showMenu.value = false
      document.body.style.overflow = ''
    }

    const applyTheme = (nextTheme: 'light' | 'dark') => {
      theme.value = nextTheme
      localStorage.setItem('theme', nextTheme)
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    const toggleTheme = () => {
      const nextTheme = theme.value === 'light' ? 'dark' : 'light'
      if (!document.startViewTransition) {
        applyTheme(nextTheme)
        return
      }
      document.startViewTransition(() => applyTheme(nextTheme))
    }

    return {
      showMenu,
      isDark,
      toggleNav,
      closeMenu,
      toggleTheme,
      onLogoClick,
      secretCode,
      showSecretCode,
    }
  },
}
</script>

<style>
.hamburger {
  background-color: rgba(0, 128, 128, 0.1);
}

/* Overlay transition */
.overlay-enter-active {
  transition: opacity 0.3s ease-out;
}
.overlay-leave-active {
  transition: opacity 0.2s ease-in;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.overlay-enter-active nav,
.overlay-leave-active nav {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-out;
}
.overlay-enter-from nav,
.overlay-leave-to nav {
  transform: translateY(20px);
  opacity: 0;
}

.scale {
  transform: scale(1);
}

.scale:hover {
  transform: scale(1.1);
}

@media (min-width: 768px) {
  .scale {
    transition: transform 0.5s ease-in-out;
  }

  .scale:hover {
    transform: scale(1.05);
  }
}

.active {
  padding: 0.3rem 0.8rem;
}

.active:focus,
.active:active {
  border-radius: 5rem;
  background-color: rgba(0, 128, 128, 0.15);
  transition: background-color 0.5s ease-in-out;
}

.active:hover {
  border-radius: 5rem;
  background-color: rgba(0, 128, 128, 0.1);
  transition: background-color 0.2s ease-in-out;
}

/* ── Theme toggle view transition ── */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.5s;
}

::view-transition-old(root) {
  animation-name: fade-out;
}

::view-transition-new(root) {
  animation-name: fade-in;
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ── Secret code badge (easter egg) ── */
.secret-code-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 0.75rem;
  padding: 0.2rem 0.6rem;
  font-family: var(--font-mono, 'SF Mono', monospace);
  font-size: 1rem;
  font-weight: 700;
  color: #14b8a6;
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.35);
  border-radius: 0.375rem;
  letter-spacing: 0.2em;
  animation: code-pulse 0.6s ease-in-out 2;
}

@keyframes code-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 12px 2px rgba(20, 184, 166, 0.4);
  }
}

.code-reveal-enter-active {
  transition: all 0.3s ease-out;
}
.code-reveal-leave-active {
  transition: all 0.5s ease-in;
}
.code-reveal-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.8);
}
.code-reveal-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
