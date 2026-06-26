<template>
  <splash-screen class="bg-light dark:bg-dark h-screen" v-if="isLoading" />
  <div v-else class="bg-light dark:bg-dark sm:h-screen overflow-x-hidden overflow-y-auto">
    <CustomCursor />
    <router-view> </router-view>
    <EasterEgg />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import SplashScreen from './components/splashScreen.vue'
import CustomCursor from './components/CustomCursor.vue'
import EasterEgg from './components/EasterEgg.vue'

export default defineComponent({
  name: 'App',
  components: {
    SplashScreen,
    CustomCursor,
    EasterEgg,
  },
  data() {
    return {
      isLoading: true,
    }
  },
  setup() {
    const route = useRoute()
    useHead({
      titleTemplate: '%s | Robbe Saelens',
      title: () => (route.meta?.title as string) || 'Portfolio',
      meta: () => [
        {
          name: 'description',
          content:
            (route.meta?.description as string) ||
            'Full-stack web developer portfolio showcasing projects in Vue, TypeScript, and modern web technologies.',
        },
        {
          property: 'og:title',
          content: `${(route.meta?.title as string) || 'Portfolio'} | Robbe Saelens`,
        },
        {
          property: 'og:description',
          content:
            (route.meta?.description as string) ||
            'Full-stack web developer portfolio showcasing projects in Vue, TypeScript, and modern web technologies.',
        },
        { property: 'og:url', content: `https://robbe-saelens.netlify.app${route.path}` },
        {
          name: 'twitter:title',
          content: `${(route.meta?.title as string) || 'Portfolio'} | Robbe Saelens`,
        },
        {
          name: 'twitter:description',
          content:
            (route.meta?.description as string) ||
            'Full-stack web developer portfolio showcasing projects in Vue, TypeScript, and modern web technologies.',
        },
      ],
      link: () => [{ rel: 'canonical', href: `https://robbe-saelens.netlify.app${route.path}` }],
    })
  },
  mounted() {
    this.isLoading = false
  },
})
</script>
