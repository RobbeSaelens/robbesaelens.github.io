<template>
  <button
    @click="toggleLocale"
    class="relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider transition-all duration-300 ease-out bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20 dark:hover:bg-teal-400/20"
    :aria-label="isEn ? $t('aria.switchToDutch') : $t('aria.switchToEnglish')"
  >
    <span
      class="relative z-10 transition-all duration-300"
      :class="{ 'font-bold': isEn, 'opacity-60': !isEn }"
    >
      EN
    </span>
    <span class="relative z-10 opacity-40">/</span>
    <span
      class="relative z-10 transition-all duration-300"
      :class="{ 'font-bold': !isEn, 'opacity-60': isEn }"
    >
      NL
    </span>
  </button>
</template>

<script lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n'
import type { SupportedLocale } from '../i18n'

export default {
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n({ useScope: 'global' })
    const isEn = computed(() => locale.value === 'en')

    const toggleLocale = () => {
      setLocale(isEn.value ? 'nl' : 'en')
    }

    return {
      isEn,
      toggleLocale,
    }
  },
}
</script>
