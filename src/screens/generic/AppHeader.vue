<template>
  <header class="my-6">
    <nav class="mx-auto max-w-screen-2xl items-center justify-between px-6 sm:flex">
      <router-link class="focus-visible:ring-2xl rounded-md outline-none" to="/">
        <a href="/">
          <img src="/public/logo.svg" alt="Logo" class="h-5" />
        </a>
      </router-link>
      <AppNavigation />
    </nav>
  </header>
</template>

<script lang="ts">
import AppNavigation from '../generic/AppNavigation.vue'
export default {
  components: {
    AppNavigation,
  },
}
</script>
