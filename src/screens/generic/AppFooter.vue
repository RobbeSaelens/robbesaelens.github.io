<template>
  <footer class="border-t border-teal-100 py-6 dark:border-teal-900">
    <div class="mx-auto max-w-screen-2xl px-6">
      <div
        class="flex flex-col items-center justify-between gap-y-1 text-sm text-teal-600 dark:text-teal-400 sm:flex-row"
      >
        <span>&copy; {{ new Date().getFullYear() }} Robbe Saelens</span>
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

export default {
  name: 'AppFooter',
  components: {
    Phone,
    Mail,
  },
}
</script>
