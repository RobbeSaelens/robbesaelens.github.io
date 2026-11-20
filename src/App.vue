<template>
  <!-- The document scrolls, at every size: the router's scroll reset, keyboard
       scrolling (Space, Page Down) and the browser's own toolbar handling all
       work on the window. overflow-x-clip stops sideways overflow without turning
       this div into a scroll container, which would break the sticky header. -->
  <!-- No background of its own: <html> paints the page colour (styles.css), and the
       animated background (SiteBackground, z-index -1) sits between the two. A
       background or a stacking context here would hide it, or trap the custom
       cursor under overlays teleported to <body> (lightbox, mobile menu). -->
  <div class="overflow-x-clip">
    <SiteBackground />
    <CustomCursor />
    <router-view> </router-view>
    <EasterEgg />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import CustomCursor from './components/CustomCursor.vue'
import EasterEgg from './components/EasterEgg.vue'
import SiteBackground from './components/SiteBackground.vue'
import { SITE_NAME, SITE_URL, absoluteUrl } from './site'
import { localeOfPath, localizedPath, stripLocale } from './localePath'
import { routeJsonLd } from './seo/jsonld'
import { SHARE_IMAGE, shareImageAlt, shareImagePath } from './seo/share'

const DEFAULT_DESCRIPTION =
  'Portfolio of Robbe Saelens, a full-stack web developer from Geluwe, Belgium, building with Vue, TypeScript, React, Laravel and Next.js.'

export default defineComponent({
  name: 'App',
  components: {
    CustomCursor,
    EasterEgg,
    SiteBackground,
  },
  setup() {
    const route = useRoute()
    const { t } = useI18n({ useScope: 'global' })

    const title = () => (route.meta?.title as string) || 'Portfolio'
    const description = () => (route.meta?.description as string) || DEFAULT_DESCRIPTION
    /** The page's own picture (a project's screenshot, Robbe's photo): what its JSON-LD describes */
    const picture = () => absoluteUrl((route.meta?.image as string) || '/pf2.jpg')
    const url = () => absoluteUrl(route.path)
    const lang = () => localeOfPath(route.path)
    /** The page without /nl, for logic that doesn't depend on the language. */
    const page = () => stripLocale(route.path)
    const fullTitle = () => `${title()} | ${SITE_NAME}`
    /**
     * Its share image, what a link preview shows (src/seo/share.ts, drawn by scripts/og.mjs);
     * the not-found page, which has none, shares the home page's.
     */
    const shareImage = () =>
      absoluteUrl(shareImagePath(route.meta?.noindex ? localizedPath('/', lang()) : route.path))
    const shareAlt = () =>
      route.meta?.noindex
        ? fullTitle()
        : shareImageAlt((key, named) => t(key, named, { locale: lang() }), route.path, String(route.name ?? ''), fullTitle())

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

        { property: 'og:type', content: page() === '/' ? 'profile' : 'website' },
        { property: 'og:site_name', content: `${SITE_NAME} - Portfolio` },
        { property: 'og:locale', content: lang() === 'nl' ? 'nl_BE' : 'en_US' },
        { property: 'og:locale:alternate', content: lang() === 'nl' ? 'en_US' : 'nl_BE' },
        { property: 'og:title', content: fullTitle() },
        { property: 'og:description', content: description() },
        { property: 'og:url', content: url() },
        { property: 'og:image', content: shareImage() },
        { property: 'og:image:type', content: SHARE_IMAGE.type },
        { property: 'og:image:width', content: String(SHARE_IMAGE.width) },
        { property: 'og:image:height', content: String(SHARE_IMAGE.height) },
        { property: 'og:image:alt', content: shareAlt() },

        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: fullTitle() },
        { name: 'twitter:description', content: description() },
        { name: 'twitter:image', content: shareImage() },
        { name: 'twitter:image:alt', content: shareAlt() },
      ],
      // Each language has its own URL (/nl/... is Dutch): canonical to itself,
      // plus hreflang alternates so search engines show the right language.
      // A noindex page (the catch-all 404) claims neither.
      link: () =>
        route.meta?.noindex
          ? []
          : [
              { rel: 'canonical', href: url() },
              { rel: 'alternate', hreflang: 'en', href: absoluteUrl(localizedPath(route.path, 'en')) },
              { rel: 'alternate', hreflang: 'nl', href: absoluteUrl(localizedPath(route.path, 'nl')) },
              { rel: 'alternate', hreflang: 'x-default', href: absoluteUrl(localizedPath(route.path, 'en')) },
            ],
      script: () => {
        if (route.meta?.noindex) return []
        const graph = routeJsonLd(route.path, title(), description(), SITE_URL, lang(), picture())
        return [{ type: 'application/ld+json', key: 'route-jsonld', innerHTML: JSON.stringify(graph) }]
      },
    })
  },
})
</script>
