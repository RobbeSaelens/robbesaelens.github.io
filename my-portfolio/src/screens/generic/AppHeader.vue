<template>
  <header class="px-6 py-6 sticky top-0 z-1">
    <nav class="mx-auto flex max-w-screen-2xl items-center justify-between">
      <router-link
        class="outline-none focus-visible:ring-2xl rounded-md"
        to="/"
      >
        <Logo />
      </router-link>

      <AppNavigation />

      <div class="flex space-x-3">
        <a
          class="outline-none focus-visible:ring-2xl rounded-md"
          href="https://www.facebook.com/profile.php?id=100006223099352"
        >
          <Facebook
            class="
              text-neutral-200
              hover:text-teal-600 hover:transition hover:ease-in-out
            "
          />
        </a>
        <a
          class="outline-none focus-visible:ring-2xl rounded-md"
          href="https://www.instagram.com/robbe.saelens/"
        >
          <Instagram
            class="
              text-neutral-200
              hover:text-teal-600 hover:transition hover:ease-in-out
            "
          />
        </a>
        <a
          class="outline-none focus-visible:ring-2xl rounded-md"
          href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/"
        >
          <Linkedin
            class="
              text-neutral-200
              hover:text-teal-600 hover:transition hover:ease-in-out
            "
          />
        </a>
      </div>
    </nav>
  </header>
</template>

<script lang="ts">
import Logo from '../../components/Logo.vue'
import AppNavigation from '../generic/AppNavigation.vue'
import { Facebook, Instagram, Linkedin } from 'lucide-vue-next'
export default {
  components: {
    AppNavigation,
    Logo,

    Facebook,
    Instagram,
    Linkedin,
  },
  setup() {
    return { Facebook, Instagram, Linkedin }
  },
}
</script>