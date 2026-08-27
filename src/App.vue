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
import { SITE_NAME, SITE_TAGLINE, SITE_URL, absoluteUrl } from './site'
import { routeJsonLd } from './seo/jsonld'

const DEFAULT_DESCRIPTION =
  'Portfolio of Robbe Saelens, a full-stack web developer from Geluwe, Belgium, building with Vue, TypeScript, React, Laravel and Next.js.'

export default defineComponent({
  name: 'App',
  components: {
    SplashScreen,
    CustomCursor,
    EasterEgg,
  },
  data() {
    return {
      // During prerendering there is no browser, so render the real content
      // straight away instead of the splash screen.
      isLoading: typeof window !== 'undefined',
    }
  },
  setup() {
    const route = useRoute()

    const title = () => (route.meta?.title as string) || 'Portfolio'
    const description = () => (route.meta?.description as string) || DEFAULT_DESCRIPTION
    const image = () => absoluteUrl((route.meta?.image as string) || '/pf2.jpg')
    const url = () => absoluteUrl(route.path)
    const fullTitle = () => `${title()} | ${SITE_NAME}`

    useHead({
      titleTemplate: `%s | ${SITE_NAME}`,
      title,
      meta: () => [
        { name: 'description', content: description() },
        { name: 'author', content: SITE_NAME },
        {
          name: 'robots',
          content: route.meta?.noindex
            ? 'noindex, follow'
            : 'index, follow, max-image-preview:large',
        },

        { property: 'og:type', content: route.path === '/' ? 'profile' : 'website' },
        { property: 'og:site_name', content: `${SITE_NAME} - Portfolio` },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:locale:alternate', content: 'nl_BE' },
        { property: 'og:title', content: fullTitle() },
        { property: 'og:description', content: description() },
        { property: 'og:url', content: url() },
        { property: 'og:image', content: image() },
        { property: 'og:image:alt', content: `${SITE_NAME} - ${SITE_TAGLINE}` },

        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: fullTitle() },
        { name: 'twitter:description', content: description() },
        { name: 'twitter:image', content: image() },
      ],
      // A noindex page (the catch-all 404) must not claim a canonical URL.
      //
      // No hreflang alternates: English and Dutch are served from the same URL
      // (the language is a client-side toggle), so there is no per-language URL
      // to point at. Pointing en and nl at one URL would be a conflicting
      // signal. Adding /nl/ routes later is what would make hreflang correct.
      link: () => (route.meta?.noindex ? [] : [{ rel: 'canonical', href: url() }]),
      script: () =>
        route.meta?.noindex
          ? []
          : [
              {
                type: 'application/ld+json',
                key: 'route-jsonld',
                innerHTML: JSON.stringify(
                  routeJsonLd(route.path, title(), description(), SITE_URL),
                ),
              },
            ],
    })
  },
  mounted() {
    this.isLoading = false
  },
})
</script>
