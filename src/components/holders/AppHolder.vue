<template>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <main id="main-content" tabindex="-1" class="flex flex-1 flex-col min-h-0">
      <router-view> </router-view>
    </main>
    <ChatBot />
    <AppFooter />
  </div>
</template>

<script lang="ts">
import AppFooter from '../../screens/generic/AppFooter.vue'
import AppHeader from '../../screens/generic/AppHeader.vue'
import ChatBot from '../ChatBot.vue'

export default {
  components: {
    AppFooter,
    AppHeader,
    ChatBot,
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
</style>
