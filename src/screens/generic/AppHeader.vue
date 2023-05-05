<template>
  <header class="my-6">
    <nav class="mx-auto max-w-screen-2xl items-center justify-between px-6 sm:flex">
      <router-link class="focus-visible:ring-2xl rounded-md outline-none" to="/">
        <a href="/" @click="closeMenu">
          <img src="/Logo.jpg" alt="Logo" class="scale h-5" />
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

<style scoped>
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
    transform: scale(1.1);
  }
}
</style>
