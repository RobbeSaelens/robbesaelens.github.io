<template>
  <a href="#main-content" class="skip-link">{{ $t('aria.skipToContent') }}</a>
  <div class="app-holder flex min-h-screen flex-col" :class="{ 'is-fit': $route.meta.fit }">
    <AppHeader />
    <main id="main-content" tabindex="-1" class="flex flex-1 flex-col min-h-0">
      <router-view> </router-view>
    </main>
    <ChatBot />
    <CookieConsent />
    <AppFooter />
  </div>
</template>

<script lang="ts">
import AppFooter from '../../screens/generic/AppFooter.vue'
import AppHeader from '../../screens/generic/AppHeader.vue'
import ChatBot from '../ChatBot.vue'
import CookieConsent from '../CookieConsent.vue'

export default {
  components: {
    AppFooter,
    AppHeader,
    ChatBot,
    CookieConsent,
  },
}
</script>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0.5rem;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: var(--color-teal-500, #0d9488);
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  text-decoration: none;
}
.skip-link:focus {
  top: 0.5rem;
}

/* Pages with meta.fit fill exactly one screen instead of growing; on short screens they scroll as usual. */
@media (min-height: 560px) {
  .app-holder.is-fit {
    height: 100vh;
    height: 100dvh;
    min-height: 0;
  }
}
/* The footer would eat too much of a phone screen on a fit page. */
@media (max-width: 639px) {
  .app-holder.is-fit > footer {
    display: none;
  }
}
</style>
