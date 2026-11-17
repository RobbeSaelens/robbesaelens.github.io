<template>
  <!-- Real screenshots of the new site, which isn't live yet (rebranding) -->
  <ProjectPage :project="project" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectPage from '../../components/project/ProjectPage.vue'
import { indexItems, type ProjectData } from '../../components/project/project'

const { t } = useI18n({ useScope: 'global' })

const project = computed<ProjectData>(() => ({
  id: 'vhs',
  name: t('vhs.title'),
  file: 'vhs-project.md',
  status: { kind: 'rebranding', label: t('vhs.rebrandingBadge'), note: t('vhs.notLiveYet') },
  links: [],
  about: t('vhs.aboutText'),
  tags: ['Next.js 16', 'React 19', 'TypeScript', 'GSAP', 'Tailwind CSS', 'i18n'],
  languages: ['TypeScript', 'Next.js 16', 'React 19', 'Tailwind CSS 4', 'GSAP', 'Motion'],
  tools: ['Vercel', 'Turbopack', 'Lenis', 'Resend', 'Vercel Analytics', 'Speed Insights', 'Sentry', 'Playwright', 'ESLint'],
  url: 'VHS Service',
  desktop: {
    src: '/vhs-home.jpg',
    width: 1600,
    height: 1000,
    alt: t('vhs.alt'),
    caption: `VHS Service — ${t('projects.shotDesktop')}`,
  },
  phone: {
    src: '/vhs-mobile.jpg',
    width: 738,
    height: 1600,
    alt: t('vhs.alt'),
    caption: `VHS Service — ${t('projects.shotMobile')}`,
  },
  features: indexItems(t, 'vhs', 'feature', ['Motion', 'I18n', 'Services', 'Seo', 'Forms', 'Gallery']),
  repo: { key: 'vhs' },
}))
</script>
