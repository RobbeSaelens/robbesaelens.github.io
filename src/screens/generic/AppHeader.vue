<template>
  <header class="py-6">
    <nav class="mx-auto px-6 sm:flex max-w-screen-2xl justify-between">
      <router-link class="outline-none focus-visible:ring-2xl rounded-md" to="/">
        <Logo />
      </router-link>

      <AppNavigation />

      <div class="sm:flex space-x-3 items-center hidden">
        <a
          class="outline-none focus-visible:ring-2xl rounded-md"
          href="https://www.facebook.com/profile.php?id=100006223099352"
        >
          <Facebook
            class="text-neutral-200 hover:text-teal-600 hover:transition hover:ease-in-out"
          />
        </a>
        <a
          class="outline-none focus-visible:ring-2xl rounded-md"
          href="https://www.instagram.com/robbe.saelens/"
        >
          <Instagram
            class="text-neutral-200 hover:text-teal-600 hover:transition hover:ease-in-out"
          />
        </a>
        <a
          class="outline-none focus-visible:ring-2xl rounded-md"
          href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/"
        >
          <Linkedin
            class="text-neutral-200 hover:text-teal-600 hover:transition hover:ease-in-out"
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