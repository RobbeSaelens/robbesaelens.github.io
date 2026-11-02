<template>
  <div class="nav-bar">
    <router-link class="nav-logo" :to="lp('/')" @click="onLogoClick">
      <BrandLogo class="nav-logo-full" />
      <BrandLogo class="nav-logo-mark" variant="mark" />
    </router-link>

    <!-- Secret code revealed via triple-click -->
    <transition name="code-reveal">
      <span v-if="showSecretCode" class="secret-code-badge">{{ secretCode }}</span>
    </transition>

    <!-- Desktop -->
    <div class="nav-desktop">
      <div ref="linkList" class="nav-links">
        <span class="nav-indicator" :style="indicatorStyle" aria-hidden="true"></span>
        <ul class="nav-links-list">
          <li v-for="link in links" :key="link.to">
            <router-link
              :ref="(el) => setLinkRef(link.to, el)"
              :to="lp(link.to)"
              class="nav-link"
              :class="{ 'is-current': isCurrent(link) }"
            >
              <span class="nav-link-prompt" aria-hidden="true">&gt;</span>
              {{ $t(link.label) }}
            </router-link>
          </li>
        </ul>
      </div>

      <span class="nav-divider" aria-hidden="true"></span>

      <div class="nav-tools">
        <LanguageSwitcher />
        <button
          type="button"
          class="nav-icon-btn"
          :aria-label="isDark ? $t('aria.toggleThemeLight') : $t('aria.toggleThemeDark')"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="h-[1.15rem] w-[1.15rem]" />
          <Moon v-else class="h-[1.15rem] w-[1.15rem]" />
        </button>
      </div>
    </div>

    <!-- Mobile -->
    <button
      ref="menuButton"
      type="button"
      class="nav-icon-btn nav-menu-btn"
      aria-controls="mobile-menu"
      :aria-expanded="showMenu"
      :aria-label="$t('aria.toggleNav')"
      @click="openMenu"
    >
      <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
    </button>
  </div>

  <!-- Mobile fullscreen menu -->
  <Teleport to="body">
    <transition name="menu">
      <div
        v-if="showMenu"
        id="mobile-menu"
        ref="menuPanel"
        class="mobile-menu"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('aria.mainNav')"
        @keydown.esc="closeMenu"
        @keydown.tab="trapFocus"
      >
        <div class="mobile-top">
          <router-link class="nav-logo" :to="lp('/')" @click="onLogoClick">
            <BrandLogo class="nav-logo-menu" variant="mark" />
          </router-link>
          <button
            type="button"
            class="nav-icon-btn"
            :aria-label="$t('aria.closeNav')"
            @click="closeMenu"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <nav class="mobile-links" :aria-label="$t('aria.mainNav')">
          <p class="mobile-path" aria-hidden="true">~/robbe-saelens <span>$ ls</span></p>
          <router-link
            v-for="(link, i) in mobileLinks"
            :key="link.to"
            :to="lp(link.to)"
            class="mobile-link"
            :class="{ 'is-current': isCurrent(link) }"
            :style="{ '--i': i }"
            @click="closeMenu"
          >
            <span class="mobile-index" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="mobile-label">{{ $t(link.label) }}</span>
            <ArrowRight class="mobile-arrow" aria-hidden="true" />
          </router-link>
        </nav>

        <div class="mobile-bottom" :style="{ '--i': mobileLinks.length }">
          <a href="tel:0471958195" class="mobile-contact">
            <Phone class="h-4 w-4" aria-hidden="true" />
            0471 95 81 95
          </a>
          <a href="mailto:robbe.saelens@telenet.be" class="mobile-contact">
            <Mail class="h-4 w-4" aria-hidden="true" />
            robbe.saelens@telenet.be
          </a>
          <div class="mobile-tools">
            <LanguageSwitcher />
            <button
              type="button"
              class="nav-icon-btn"
              :aria-label="isDark ? $t('aria.toggleThemeLight') : $t('aria.toggleThemeDark')"
              @click="toggleTheme"
            >
              <Sun v-if="isDark" class="h-5 w-5" />
              <Moon v-else class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  type ComponentPublicInstance,
} from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Sun, Moon, Phone, Mail, X, ArrowRight } from 'lucide-vue-next'
import { stripLocale, useLocalePath } from '../../localePath'
import LanguageSwitcher from '../../components/LanguageSwitcher.vue'
import BrandLogo from '../../components/BrandLogo.vue'
import { useEasterEgg } from '../../composables/useEasterEgg'

interface NavLink {
  to: string
  label: string
  /** Extra paths that count as this section (project detail pages). */
  matches?: (path: string) => boolean
}

const LINKS: NavLink[] = [
  { to: '/projects', label: 'nav.projects', matches: (p) => p.endsWith('detail') },
  { to: '/contact', label: 'nav.aboutMe' },
]

export default {
  components: { Sun, Moon, Phone, Mail, X, ArrowRight, LanguageSwitcher, BrandLogo },

  setup() {
    const route = useRoute()
    const { locale } = useI18n({ useScope: 'global' })
    const showMenu = ref(false)
    const { handleLogoClick, secretCode, showSecretCode } = useEasterEgg()

    const links = LINKS
    const mobileLinks: NavLink[] = [{ to: '/', label: 'nav.home' }, ...LINKS]

    const { lp } = useLocalePath()
    // Compare without the /nl prefix: /nl/projects is the projects page too.
    const isCurrent = (link: NavLink) => {
      const path = stripLocale(route.path)
      return path === link.to || (link.matches?.(path) ?? false)
    }

    // ── Sliding indicator behind the current desktop link ──
    const linkList = ref<HTMLElement | null>(null)
    const linkEls = new Map<string, HTMLElement>()
    const indicator = ref({ x: 0, w: 0, visible: false })

    const setLinkRef = (to: string, el: Element | ComponentPublicInstance | null) => {
      const node = el && '$el' in el ? (el.$el as HTMLElement) : (el as HTMLElement | null)
      if (node) linkEls.set(to, node)
      else linkEls.delete(to)
    }

    const placeIndicator = () => {
      const current = links.find(isCurrent)
      const el = current && linkEls.get(current.to)
      if (!el) {
        indicator.value = { ...indicator.value, visible: false }
        return
      }
      indicator.value = { x: el.offsetLeft, w: el.offsetWidth, visible: true }
    }

    const indicatorStyle = computed(() => ({
      transform: `translateX(${indicator.value.x}px)`,
      width: `${indicator.value.w}px`,
      opacity: indicator.value.visible ? 1 : 0,
    }))

    // Labels change width with the language and the current page, so measure again.
    let resizeObserver: ResizeObserver | null = null
    watch(
      () => [route.path, locale.value],
      () => nextTick(placeIndicator),
    )

    // ── Theme (read guarded: setup() also runs during prerendering) ──
    const isBrowser = typeof window !== 'undefined'
    const stored = isBrowser ? localStorage.getItem('theme') : null
    const prefersDark = isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = ref(stored || (prefersDark ? 'dark' : 'light'))
    const isDark = computed(() => theme.value === 'dark')

    const applyTheme = (nextTheme: 'light' | 'dark') => {
      theme.value = nextTheme
      localStorage.setItem('theme', nextTheme)
      document.documentElement.classList.toggle('dark', nextTheme === 'dark')
      // Browser UI colour follows the page background (see index.html).
      document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
        meta.setAttribute('content', nextTheme === 'dark' ? '#222222' : '#f6f6f6')
      })
    }

    const toggleTheme = () => {
      const nextTheme = theme.value === 'light' ? 'dark' : 'light'
      if (!document.startViewTransition) {
        applyTheme(nextTheme)
        return
      }
      document.startViewTransition(() => applyTheme(nextTheme))
    }

    // ── Mobile menu ──
    const menuButton = ref<HTMLElement | null>(null)
    const menuPanel = ref<HTMLElement | null>(null)

    const openMenu = () => {
      showMenu.value = true
      document.body.style.overflow = 'hidden'
      nextTick(() => menuPanel.value?.querySelector<HTMLElement>('.mobile-link')?.focus())
    }

    const closeMenu = () => {
      if (!showMenu.value) return
      showMenu.value = false
      document.body.style.overflow = ''
      nextTick(() => menuButton.value?.focus())
    }

    /** Keep Tab inside the open menu. */
    const trapFocus = (e: KeyboardEvent) => {
      const focusable = menuPanel.value?.querySelectorAll<HTMLElement>('a[href], button')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    // Back/forward navigation must not leave the menu open over a new page.
    watch(() => route.path, closeMenu)

    const onLogoClick = () => {
      handleLogoClick()
      closeMenu()
    }

    onMounted(() => {
      if (isDark.value) document.documentElement.classList.add('dark')
      placeIndicator()
      // Each link, not just the bar: the ">" prompt animates a link wider when it
      // becomes current, and the indicator has to follow that growth.
      if (typeof ResizeObserver !== 'undefined' && linkList.value) {
        resizeObserver = new ResizeObserver(placeIndicator)
        resizeObserver.observe(linkList.value)
        linkEls.forEach((el) => resizeObserver?.observe(el))
      }
    })

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      document.body.style.overflow = ''
    })

    return {
      links,
      mobileLinks,
      isCurrent,
      lp,
      linkList,
      setLinkRef,
      indicatorStyle,
      showMenu,
      isDark,
      menuButton,
      menuPanel,
      openMenu,
      closeMenu,
      trapFocus,
      toggleTheme,
      onLogoClick,
      secretCode,
      showSecretCode,
    }
  },
}
</script>

<style>
/* ── Bar ── */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.nav-logo {
  display: inline-flex;
  align-items: center;
  /* Generous hit area without moving the logo. */
  padding: 0.6rem;
  margin: -0.6rem;
  border-radius: 0.6rem;
  outline: none;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.nav-logo:focus-visible {
  box-shadow: 0 0 0 2px var(--color-accent);
}
@media (hover: hover) and (pointer: fine) {
  .nav-logo:hover {
    transform: scale(1.04);
  }
}
.nav-logo-full {
  display: none;
  height: 1rem;
}
.nav-logo-mark {
  height: 1.05rem;
}
.nav-logo-menu {
  height: 1.3rem;
}
@media (min-width: 640px) {
  .nav-logo-full {
    display: block;
  }
  .nav-logo-mark {
    display: none;
  }
}

/* ── Desktop links ── */
.nav-desktop {
  display: none;
  align-items: center;
  gap: 0.9rem;
  margin-left: auto;
}
@media (min-width: 640px) {
  .nav-desktop {
    display: flex;
  }
}

.nav-links {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.3rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.nav-links-list {
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.nav-indicator {
  position: absolute;
  top: 0.3rem;
  bottom: 0.3rem;
  left: 0;
  border-radius: 9999px;
  background: var(--color-accent-soft);
  box-shadow: inset 0 0 0 1px var(--color-border-glow);
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.25s ease;
  pointer-events: none;
}

.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.25rem;
  padding: 0 1rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary, #475569);
  outline: none;
  transition: color 0.2s ease;
}
.nav-link:hover,
.nav-link.is-current {
  color: var(--color-accent);
}
.nav-link:focus-visible {
  box-shadow: 0 0 0 2px var(--color-accent);
}
.nav-link-prompt {
  width: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    width 0.3s ease,
    opacity 0.3s ease;
}
.nav-link.is-current .nav-link-prompt {
  width: 0.6em;
  opacity: 1;
}

.nav-divider {
  width: 1px;
  height: 1.4rem;
  background: var(--color-border-glow);
  opacity: 0.6;
}

.nav-tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Icon buttons (theme, menu, close) ── */
.nav-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-accent);
  outline: none;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}
.nav-icon-btn:hover {
  border-color: var(--color-border-glow);
  background: var(--color-surface-hover);
}
.nav-icon-btn:active {
  transform: scale(0.94);
}
.nav-icon-btn:focus-visible {
  box-shadow: 0 0 0 2px var(--color-accent);
}

.nav-menu-btn {
  margin-left: auto;
}
@media (min-width: 640px) {
  .nav-menu-btn {
    display: none;
  }
}

.burger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 1.1rem;
}
.burger span {
  height: 2px;
  border-radius: 2px;
  background: currentColor;
}
.burger span:nth-child(2) {
  width: 70%;
  margin-left: auto;
}

/* ── Mobile menu ── */
.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: #f6f6f6;
  overflow-y: auto;
}
.dark .mobile-menu {
  background: #222222;
}

.mobile-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobile-links {
  display: flex;
  flex-direction: column;
  margin: auto 0;
  padding: 2rem 0;
}

.mobile-path {
  margin-bottom: 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
}
.mobile-path span {
  color: var(--color-accent);
}

.mobile-link {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: 0.9rem 0;
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-mono);
  color: var(--color-text-primary);
  outline: none;
}
.mobile-link:first-of-type {
  border-top: 1px solid var(--color-border);
}
.mobile-link:focus-visible .mobile-label {
  text-decoration: underline;
  text-underline-offset: 6px;
}
.mobile-index {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-accent);
  opacity: 0.7;
}
.mobile-label {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}
.mobile-arrow {
  width: 1.4rem;
  height: 1.4rem;
  margin-left: auto;
  align-self: center;
  color: var(--color-accent);
  opacity: 0;
  transform: translateX(-6px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.mobile-link.is-current {
  color: var(--color-accent);
}
.mobile-link.is-current .mobile-arrow,
.mobile-link:active .mobile-arrow {
  opacity: 1;
  transform: none;
}

.mobile-bottom {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}
.mobile-contact {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.25rem;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-text-secondary, #475569);
}
.mobile-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
}

/* Menu open/close: panel fades, links and footer rise in one after another. */
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.3s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
.menu-enter-active .mobile-link,
.menu-enter-active .mobile-bottom {
  transition:
    opacity 0.45s ease,
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(var(--i, 0) * 60ms + 80ms);
}
.menu-enter-from .mobile-link,
.menu-enter-from .mobile-bottom {
  opacity: 0;
  transform: translateY(16px);
}

@media (prefers-reduced-motion: reduce) {
  .nav-indicator,
  .nav-link-prompt,
  .menu-enter-active,
  .menu-leave-active,
  .menu-enter-active .mobile-link,
  .menu-enter-active .mobile-bottom {
    transition: none;
  }
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
