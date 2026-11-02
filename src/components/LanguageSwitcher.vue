<template>
  <!-- A link to the same page in the other language (/nl/... is Dutch) -->
  <router-link
    :to="otherPath"
    :hreflang="other"
    class="relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider transition-all duration-300 ease-out bg-teal-500/10 text-teal-800 ring-1 ring-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20 dark:hover:bg-teal-400/20"
    @click="rememberLocale(other)"
  >
    <span class="relative z-10" :class="isEn ? 'font-extrabold' : 'font-normal'">EN</span>
    <span class="relative z-10" aria-hidden="true">/</span>
    <span class="relative z-10" :class="isEn ? 'font-normal' : 'font-extrabold'">NL</span>
    <span class="sr-only">{{ isEn ? $t('aria.switchToDutch') : $t('aria.switchToEnglish') }}</span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { rememberLocale } from '../i18n'
import { localizedPath, type Locale } from '../localePath'

const { locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const isEn = computed(() => locale.value === 'en')
const other = computed<Locale>(() => (isEn.value ? 'nl' : 'en'))
const otherPath = computed(() => localizedPath(route.path, other.value))
</script>
