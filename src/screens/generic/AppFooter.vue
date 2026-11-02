<template>
  <footer class="border-t border-teal-100 py-6 dark:border-teal-900">
    <div class="footer-inner mx-auto max-w-screen-2xl px-6">
      <div
        class="flex flex-col items-center justify-between gap-y-1 text-sm text-teal-600 dark:text-teal-400 sm:flex-row"
      >
        <span class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>&copy; {{ new Date().getFullYear() }} Robbe Saelens</span>
          <router-link to="/privacy" class="footer-link">{{ $t('footer.privacy') }}</router-link>
          <button type="button" class="footer-link" @click="openConsent">{{ $t('footer.cookies') }}</button>
        </span>
        <div class="flex flex-col items-center gap-x-6 gap-y-1 sm:flex-row">
          <a
            href="tel:0471958195"
            class="flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-teal-800 dark:hover:text-teal-200"
          >
            <Phone class="h-4 w-4" />
            0471 95 81 95
          </a>
          <a
            href="mailto:robbe.saelens@telenet.be"
            class="flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-teal-800 dark:hover:text-teal-200"
          >
            <Mail class="h-4 w-4" />
            robbe.saelens@telenet.be
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
import { Phone, Mail } from 'lucide-vue-next'
import { openConsent } from '../../analytics'

export default {
  name: 'AppFooter',
  components: {
    Phone,
    Mail,
  },
  setup() {
    return { openConsent }
  },
}
</script>

<style scoped>
.footer-link {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  transition: text-decoration-color 0.2s ease;
}
.footer-link:hover,
.footer-link:focus-visible {
  text-decoration-color: currentColor;
}

/* The chat button (fixed, bottom right, 3rem wide at 1.5rem from the edge) must
   not cover the contact links. Only needed while the container reaches that
   close to the right edge, i.e. below 1536px plus the button's width. */
@media (min-width: 640px) {
  .footer-inner {
    padding-right: max(1.5rem, calc(5.5rem - max(0px, (100vw - 96rem) / 2)));
  }
}
</style>
