<template>
  <div class="flex min-h-60 flex-col items-center justify-center px-6 py-20 text-center">
    <h1 class="mb-4 text-6xl font-bold text-teal-700 dark:text-teal-300">404</h1>
    <p class="mb-2 text-lg text-teal-600 dark:text-teal-100">{{ $t('error.title') }}</p>
    <p class="mb-8 text-teal-500 dark:text-teal-200">
      {{ $t('error.description') }}
    </p>
    <router-link
      to="/"
      class="rounded-2xl bg-teal-500 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-800 dark:hover:bg-teal-600"
    >
      {{ $t('error.backHome') }}
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'ClientError',
})
</script>
